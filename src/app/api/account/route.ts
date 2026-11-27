import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import {
  accountDb,
  AUTH_COOKIE,
  currentAccount,
  createSession,
  deleteSession,
  createJournal,
  passwordHash,
  passwordMatches,
  throttle,
  type Account,
} from "@/lib/accounts";
import { sameOrigin } from "@/lib/whoop";
export const runtime = "nodejs";
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  return json({ account: currentAccount(request) });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  try {
    if (
      !throttle(
        `auth:${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`,
        50,
      )
    )
      return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    const {
      email: rawEmail,
      password,
      name,
      signup,
      role,
    } = await request.json();
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 256
    )
      return json(
        { error: "Use a valid email and a password of 8–256 characters." },
        400,
      );
    if (!throttle(`email:${email}`, 15))
      return json(
        { error: "Too many attempts. Try again in 15 minutes." },
        429,
      );
    const db = accountDb();
    let account: Account;
    if (signup) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 100 ||
        !["member", "trainer"].includes(role)
      )
        return json({ error: "Enter your name and account type." }, 400);
      if (db.prepare("SELECT 1 FROM accounts WHERE email=?").get(email))
        return json(
          { error: "Unable to create this account. Try logging in." },
          409,
        );
      account = {
        id: randomUUID(),
        email,
        name: name.trim(),
        role,
        coachCode: role === "trainer" ? randomBytes(12).toString("hex") : null,
      };
      const secret = await passwordHash(password);
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(
          "INSERT INTO accounts(id,email,name,role,password,coachCode) VALUES(?,?,?,?,?,?)",
        ).run(account.id, email, account.name, role, secret, account.coachCode);
        createJournal(account.id, email, account.name);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    } else {
      const row = db
        .prepare("SELECT * FROM accounts WHERE email=?")
        .get(email) as (Account & { password: string }) | undefined;
      const valid = await passwordMatches(
        password,
        row?.password || "00000000000000000000000000000000:" + "00".repeat(64),
      );
      if (!row || !valid)
        return json({ error: "Email or password is incorrect." }, 401);
      if (role !== undefined && role !== row.role)
        return json(
          {
            error: `This is a ${row.role} account. Select ${row.role === "trainer" ? "Trainer" : "Member"} to log in.`,
          },
          403,
        );
      account = {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        coachCode: row.coachCode,
      };
    }
    deleteSession(request);
    const response = json({ account });
    response.cookies.set(AUTH_COOKIE, createSession(account.id), {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
    return response;
  } catch {
    return json(
      { error: "Unable to open your account. Please try again." },
      500,
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  deleteSession(request);
  const response = json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
