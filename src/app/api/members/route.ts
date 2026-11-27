import { NextRequest, NextResponse } from "next/server";
import { accountDb, currentAccount } from "@/lib/accounts";
import { sameOrigin } from "@/lib/whoop";
export const runtime = "nodejs";
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  const actor = currentAccount(request);
  if (!actor) return json({ error: "Please log in again." }, 401);
  const db = accountDb();
  if (actor.role === "trainer")
    return json({
      members: db
        .prepare(
          "SELECT a.id,a.email,COALESCE(json_extract(j.data,'$.profile.Name'),a.name) AS name FROM accounts a JOIN links l ON l.memberId=a.id JOIN journals j ON j.accountId=a.id WHERE l.trainerId=?",
        )
        .all(actor.id),
      coachCode: actor.coachCode,
    });
  return json({
    trainers: db
      .prepare(
        "SELECT a.id,a.name FROM accounts a JOIN links l ON l.trainerId=a.id WHERE l.memberId=?",
      )
      .all(actor.id),
  });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  const actor = currentAccount(request);
  if (!actor || actor.role !== "member")
    return json({ error: "Log in as a member to share your journal." }, 403);
  const { code } = await request.json();
  const db = accountDb();
  const trainer =
    typeof code === "string" &&
    (db
      .prepare(
        "SELECT id,name FROM accounts WHERE coachCode=? AND role='trainer'",
      )
      .get(code.trim()) as { id: string; name: string } | undefined);
  if (!trainer)
    return json(
      { error: "Trainer code not found. Check the code and try again." },
      400,
    );
  db.prepare("INSERT OR IGNORE INTO links VALUES(?,?)").run(
    trainer.id,
    actor.id,
  );
  return json({ trainer });
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  const actor = currentAccount(request);
  if (!actor) return json({ error: "Please log in again." }, 401);
  const { trainerId } = await request.json();
  accountDb()
    .prepare("DELETE FROM links WHERE trainerId=? AND memberId=?")
    .run(String(trainerId), actor.id);
  return json({ ok: true });
}
