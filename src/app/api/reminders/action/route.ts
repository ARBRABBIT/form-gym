import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/whoop";
import { reminderDb, reminderFor, localClock } from "@/lib/reminders";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const id = request.cookies.get("form-reminder-device")?.value || "",
    row = reminderFor(id);
  if (!row) return NextResponse.json({ saved: false });
  try {
    const { action } = await request.json();
    if (
      action === "snooze" &&
      row.skipped_date === localClock(row.timezone).day
    )
      return NextResponse.json({
        saved: false,
        message:
          "You’ve already finished or skipped today. We’ll be back tomorrow.",
      });
    if (action === "snooze")
      reminderDb()
        .prepare("UPDATE reminders SET snooze_at=? WHERE id=?")
        .run(Date.now() + 30 * 60000, id);
    else if (["skip", "check-in"].includes(action))
      reminderDb()
        .prepare("UPDATE reminders SET skipped_date=?, snooze_at=0 WHERE id=?")
        .run(localClock(row.timezone).day, id);
    else return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
}
