import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sameOrigin } from "@/lib/whoop";
import {
  reminderDb,
  reminderFor,
  pushKeys,
  validSubscription,
  localClock,
} from "@/lib/reminders";
import { currentAccount, saveReminderPreferences } from "@/lib/accounts";
const deviceId = (request: NextRequest) => {
  const raw = request.cookies.get(COOKIE)?.value || "";
  const owner = currentAccount(request);
  return owner ? `${owner.id}:${raw}` : raw;
};
export const runtime = "nodejs";
const COOKIE = "form-reminder-device";
const json = (value: object, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
export async function GET(request: NextRequest) {
  const row = reminderFor(deviceId(request));
  const heartbeat = reminderDb()
    .prepare("SELECT value FROM settings WHERE name='worker_heartbeat'")
    .get() as { value: string } | undefined;
  return json({
    workerActive: heartbeat
      ? Date.now() - Number(heartbeat.value) < 90000
      : false,
    publicKey: pushKeys().publicKey,
    enabled: !!row?.enabled,
    time: row?.time || "07:30",
    timezone: row?.timezone || "Asia/Kolkata",
    tone: row?.tone || "friendly",
  });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  try {
    const body = await request.json();
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time) ||
      !["friendly", "playful"].includes(body.tone) ||
      !validSubscription(body.subscription)
    )
      return json({ error: "invalid_settings" }, 400);
    new Intl.DateTimeFormat("en", { timeZone: body.timezone }).format();
    const id =
      request.cookies.get(COOKIE)?.value ||
      randomBytes(24).toString("base64url");
    const actor = currentAccount(request);
    const scopedId = actor ? `${actor.id}:${id}` : id;
    reminderDb()
      .prepare(
        "INSERT INTO reminders(id,subscription,time,timezone,tone) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,time=excluded.time,timezone=excluded.timezone,tone=excluded.tone,enabled=1",
      )
      .run(
        scopedId,
        JSON.stringify(body.subscription),
        body.time,
        body.timezone,
        body.tone,
      );
    if (body.checkedInToday === true)
      reminderDb()
        .prepare("UPDATE reminders SET skipped_date=?, snooze_at=0 WHERE id=?")
        .run(localClock(body.timezone).day, scopedId);
    if (actor)
      saveReminderPreferences(actor.id, {
        enabled: true,
        time: body.time,
        timezone: body.timezone,
        tone: body.tone,
      });
    const response = json({ enabled: true });
    response.cookies.set(COOKIE, id, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.headers.get("origin")?.startsWith("https:"),
      maxAge: 365 * 86400,
      path: "/api/reminders",
    });
    return response;
  } catch {
    return json({ error: "invalid_settings" }, 400);
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  reminderDb()
    .prepare("DELETE FROM reminders WHERE id=?")
    .run(deviceId(request));
  const actor = currentAccount(request);
  if (actor)
    saveReminderPreferences(actor.id, {
      enabled: false,
      time: "07:30",
      timezone: "Asia/Kolkata",
      tone: "friendly",
    });
  const response = json({ enabled: false });
  response.cookies.set(COOKIE, "", { maxAge: 0, path: "/api/reminders" });
  return response;
}
