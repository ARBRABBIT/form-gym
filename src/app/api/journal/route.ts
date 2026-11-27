import { NextRequest, NextResponse } from "next/server";
import {
  accountDb,
  currentAccount,
  canAccess,
  readJournal,
} from "@/lib/accounts";
import { sameOrigin } from "@/lib/whoop";
import { validJournal } from "@/lib/journal-validation";
import type { Store } from "@/lib/model";
export const runtime = "nodejs";
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  const actor = currentAccount(request);
  if (!actor) return json({ error: "Please log in again." }, 401);
  const id = request.nextUrl.searchParams.get("memberId") || actor.id;
  if (!canAccess(actor, id))
    return json({ error: "This journal has not been shared with you." }, 403);
  return json(readJournal(id) || { error: "Journal not found." });
}
const allowed = new Set([
  "onboarded",
  "onboardingDraft",
  "challengeAccepted",
  "wearablePreference",
  "smartWaterBottle",
  "month",
  "goalsByMonth",
  "profile",
  "habits",
  "planner",
  "challenge",
  "challengeTarget",
  "challengeNote",
  "weights",
  "bodyCompositionScans",
  "measurements",
  "baselineMeasurements",
  "resultDates",
  "before",
  "after",
  "reviews",
  "nutrition",
  "plans",
  "logs",
  "setCompletions",
  "workoutLibrary",
  "reminderPreferences",
]);
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  const actor = currentAccount(request);
  if (!actor) return json({ error: "Please log in again." }, 401);
  const id = request.nextUrl.searchParams.get("memberId") || actor.id;
  if (!canAccess(actor, id))
    return json({ error: "This journal has not been shared with you." }, 403);
  const text = await request.text();
  if (text.length > 1000000)
    return json({ error: "Journal update is too large." }, 413);
  try {
    const { changes } = JSON.parse(text);
    if (
      !Array.isArray(changes) ||
      changes.length > 50 ||
      !changes.length ||
      changes.some(
        (c) =>
          !allowed.has(c.key) ||
          !Object.hasOwn(c, "before") ||
          !Object.hasOwn(c, "after"),
      )
    )
      return json({ error: "Invalid journal update." }, 400);
    const db = accountDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const saved = readJournal(id);
      if (!saved) {
        db.exec("ROLLBACK");
        return json({ error: "Journal not found." }, 404);
      }
      const data = saved.data as unknown as Record<string, unknown>;
      if (
        changes.some(
          (c) =>
            JSON.stringify(data[c.key] ?? null) !== JSON.stringify(c.before),
        )
      ) {
        db.exec("ROLLBACK");
        return json(
          {
            error:
              "Another person changed the same section. Your changes are still on screen. Review the saved version before replacing it.",
            ...saved,
          },
          409,
        );
      }
      for (const change of changes) {
        if (change.after === null) delete data[change.key];
        else data[change.key] = change.after;
      }
      if (!validJournal(data)) {
        db.exec("ROLLBACK");
        return json(
          { error: "Invalid journal values. Check the changed fields." },
          400,
        );
      }
      // Account identity and sample mode cannot be replaced through journal edits.
      data.sampleData = false;
      const at = new Date().toISOString();
      db.prepare(
        "UPDATE journals SET data=?,revision=revision+1,updatedBy=?,updatedAt=? WHERE accountId=?",
      ).run(JSON.stringify(data), actor.id, at, id);
      db.prepare(
        "INSERT INTO changes(accountId,actorId,fields,at) VALUES(?,?,?,?)",
      ).run(id, actor.id, JSON.stringify(changes.map((c) => c.key)), at);
      db.exec("COMMIT");
      return json({
        data: data as Store,
        revision: saved.revision + 1,
        updatedBy: actor.id,
        updatedAt: at,
      });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } catch {
    return json({ error: "Unable to save this update." }, 400);
  }
}
