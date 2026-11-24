import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/reminders";
export async function POST(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;
  const provided = request.headers.get("authorization") || "";
  if (
    !secret ||
    Buffer.byteLength(provided) !== Buffer.byteLength(`Bearer ${secret}`) ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(`Bearer ${secret}`))
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await sendDueReminders());
}
