import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { newMemberStore, type Store } from "./model";

export type Account = {
  id: string;
  email: string;
  name: string;
  role: "member" | "trainer";
  coachCode: string | null;
};
let database: DatabaseSync;
export function accountDb() {
  if (database) return database;
  const dir = process.env.FORM_DATA_DIR || join(process.cwd(), ".form-data");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  database = new DatabaseSync(join(dir, "accounts.sqlite"));
  chmodSync(join(dir, "accounts.sqlite"), 0o600);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,password TEXT NOT NULL,coachCode TEXT UNIQUE,whoop TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,accountId TEXT NOT NULL REFERENCES accounts(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS journals(accountId TEXT PRIMARY KEY REFERENCES accounts(id),data TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,updatedBy TEXT,updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS links(trainerId TEXT NOT NULL REFERENCES accounts(id),memberId TEXT NOT NULL REFERENCES accounts(id),PRIMARY KEY(trainerId,memberId));
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS changes(id INTEGER PRIMARY KEY,accountId TEXT NOT NULL,actorId TEXT NOT NULL,fields TEXT NOT NULL,at TEXT NOT NULL);
  `);
  return database;
}
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const key = await derive(password, salt);
  const expected = Buffer.from(hex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function throttle(key: string, limit = 20) {
  const db = accountDb(),
    now = Date.now(),
    id = hash(key);
  db.prepare("DELETE FROM attempts WHERE until < ?").run(now);
  db.prepare(
    "INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(id, now + 15 * 60000);
  return (
    (
      db.prepare("SELECT count FROM attempts WHERE key=?").get(id) as {
        count: number;
      }
    ).count <= limit
  );
}
export const AUTH_COOKIE = "form-account";
export function currentAccount(request: NextRequest): Account | null {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return (
    (accountDb()
      .prepare(
        "SELECT a.id,a.email,a.name,a.role,a.coachCode FROM accounts a JOIN sessions s ON s.accountId=a.id WHERE s.token=? AND s.expires>?",
      )
      .get(hash(token), Date.now()) as Account | undefined) || null
  );
}
export function createSession(accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = accountDb();
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    hash(token),
    accountId,
    Date.now() + 30 * 86400000,
  );
  return token;
}
export function deleteSession(request: NextRequest) {
  accountDb()
    .prepare("DELETE FROM sessions WHERE token=?")
    .run(hash(request.cookies.get(AUTH_COOKIE)?.value || ""));
}
export function canAccess(actor: Account, id: string) {
  return (
    actor.id === id ||
    (actor.role === "trainer" &&
      !!accountDb()
        .prepare("SELECT 1 FROM links WHERE trainerId=? AND memberId=?")
        .get(actor.id, id))
  );
}
export function readJournal(id: string) {
  const row = accountDb()
    .prepare(
      "SELECT data,revision,updatedBy,updatedAt FROM journals WHERE accountId=?",
    )
    .get(id) as
    | {
        data: string;
        revision: number;
        updatedBy: string | null;
        updatedAt: string | null;
      }
    | undefined;
  return row ? { ...row, data: JSON.parse(row.data) as Store } : null;
}
export function createJournal(id: string, email: string, name: string) {
  const data = newMemberStore(email, name);
  data.onboarded = false;
  accountDb()
    .prepare("INSERT INTO journals(accountId,data) VALUES(?,?)")
    .run(id, JSON.stringify(data));
}
export function wearableFor(id: string): string | undefined {
  return (
    (
      accountDb().prepare("SELECT whoop FROM accounts WHERE id=?").get(id) as
        | { whoop: string | null }
        | undefined
    )?.whoop || undefined
  );
}
export function saveWearable(id: string, value: string | null) {
  accountDb().prepare("UPDATE accounts SET whoop=? WHERE id=?").run(value, id);
}

export function saveReminderPreferences(
  id: string,
  preferences: Store["reminderPreferences"],
) {
  const db = accountDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const saved = readJournal(id);
    if (saved) {
      saved.data.reminderPreferences = preferences;
      db.prepare(
        "UPDATE journals SET data=?,revision=revision+1,updatedBy=?,updatedAt=? WHERE accountId=?",
      ).run(JSON.stringify(saved.data), id, new Date().toISOString(), id);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
