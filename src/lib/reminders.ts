import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import * as webpush from "web-push";

type ReminderRow = {
  id: string;
  subscription: string;
  time: string;
  timezone: string;
  tone: string;
  last_sent: string;
  skipped_date: string;
  lease_until: number;
  snooze_at: number;
  enabled: number;
};
const globalStore = globalThis as typeof globalThis & {
  formReminderDb?: DatabaseSync;
};
export function reminderDb() {
  if (globalStore.formReminderDb) return globalStore.formReminderDb;
  const directory =
    process.env.FORM_DATA_DIR || join(process.cwd(), ".form-data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "reminders.sqlite");
  const db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, subscription TEXT NOT NULL, time TEXT NOT NULL, timezone TEXT NOT NULL, tone TEXT NOT NULL, last_sent TEXT NOT NULL DEFAULT '', skipped_date TEXT NOT NULL DEFAULT '', lease_until INTEGER NOT NULL DEFAULT 0, snooze_at INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1);`);
  globalStore.formReminderDb = db;
  return db;
}
export function pushKeys() {
  const db = reminderDb();
  const saved = db
    .prepare("SELECT value FROM settings WHERE name = 'vapid'")
    .get() as { value: string } | undefined;
  if (saved)
    return JSON.parse(saved.value) as { publicKey: string; privateKey: string };
  const keys = webpush.generateVAPIDKeys();
  db.prepare(
    "INSERT OR IGNORE INTO settings(name,value) VALUES ('vapid',?)",
  ).run(JSON.stringify(keys));
  return JSON.parse(
    (
      db.prepare("SELECT value FROM settings WHERE name='vapid'").get() as {
        value: string;
      }
    ).value,
  ) as typeof keys;
}
export function reminderFor(id: string) {
  return reminderDb().prepare("SELECT * FROM reminders WHERE id=?").get(id) as
    ReminderRow | undefined;
}
export function localClock(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (key: string) => parts.find((p) => p.type === key)!.value;
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}
export function reminderMessage(tone: string, day: string) {
  const neutral = [
    "Morning mission: step, snap, done.",
    "Your scale has a tiny update. Ready to check in?",
    "One number, zero judgement. Good morning!",
    "A quick check-in, then back to your morning.",
  ];
  const playful = [
    "Bathroom business done? Scale selfie next.",
    "Your morning pit stop has a sequel: step, snap, done.",
    "Loo done? Your scale is ready for its close-up.",
  ];
  const pool = tone === "playful" ? playful : neutral;
  return {
    title: "Your morning check-in",
    body: pool[Number(day.replaceAll("-", "")) % pool.length],
    url: "/#morning",
    tag: "form-morning-weight",
  };
}
export function validSubscription(
  value: unknown,
): value is webpush.PushSubscription {
  if (!value || typeof value !== "object") return false;
  const data = value as webpush.PushSubscription;
  try {
    const url = new URL(data.endpoint);
    const knownHost =
      url.hostname === "fcm.googleapis.com" ||
      url.hostname.endsWith(".push.services.mozilla.com") ||
      url.hostname === "updates.push.services.mozilla.com" ||
      url.hostname.endsWith(".push.apple.com") ||
      url.hostname.endsWith(".notify.windows.com");
    return (
      knownHost &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      typeof data.keys?.p256dh === "string" &&
      /^[A-Za-z0-9_-]+$/.test(data.keys.p256dh) &&
      Buffer.from(data.keys.p256dh, "base64url").length === 65 &&
      typeof data.keys.auth === "string" &&
      /^[A-Za-z0-9_-]+$/.test(data.keys.auth) &&
      Buffer.from(data.keys.auth, "base64url").length === 16
    );
  } catch {
    return false;
  }
}
export async function sendDueReminders(now = new Date()) {
  const db = reminderDb(),
    keys = pushKeys();
  db.prepare(
    "INSERT INTO settings(name,value) VALUES ('worker_heartbeat',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value",
  ).run(String(now.getTime()));
  const rows = db
    .prepare("SELECT * FROM reminders WHERE enabled=1 AND lease_until < ?")
    .all(now.getTime()) as ReminderRow[];
  let sent = 0;
  for (const row of rows) {
    const clock = localClock(row.timezone, now);
    if (row.skipped_date === clock.day) continue;
    const [h, m] = row.time.split(":").map(Number),
      elapsed = clock.minutes - (h * 60 + m);
    const due =
      row.snooze_at > 0
        ? row.snooze_at <= now.getTime()
        : row.last_sent !== clock.day && elapsed >= 0 && elapsed < 60;
    if (!due) continue;
    const lease = db
      .prepare(
        "UPDATE reminders SET lease_until=? WHERE id=? AND lease_until < ? AND last_sent=? AND snooze_at=? AND skipped_date=? AND enabled=1",
      )
      .run(
        now.getTime() + 60000,
        row.id,
        now.getTime(),
        row.last_sent,
        row.snooze_at,
        row.skipped_date,
      );
    if (!lease.changes) continue;
    try {
      await webpush.sendNotification(
        JSON.parse(row.subscription),
        JSON.stringify(reminderMessage(row.tone, clock.day)),
        {
          TTL: 3600,
          timeout: 10000,
          vapidDetails: {
            subject: process.env.VAPID_SUBJECT || "https://form.local",
            ...keys,
          },
        },
      );
      db.prepare(
        "UPDATE reminders SET last_sent=?, snooze_at=0, lease_until=0 WHERE id=?",
      ).run(clock.day, row.id);
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        db.prepare("DELETE FROM reminders WHERE id=?").run(row.id);
      // Otherwise the lease allows a later retry without duplicating a successful send.
    }
  }
  return { sent };
}
