import { NextRequest, NextResponse } from "next/server";
import {
  API,
  config,
  SESSION,
  unseal,
  seal,
  setCookie,
  exchange,
  type WhoopSession,
} from "@/lib/whoop";
import { emptyHealth } from "@/lib/health";

import {
  currentAccount,
  canAccess,
  wearableFor,
  saveWearable,
} from "@/lib/accounts";
type RecordData = {
  id?: string | number;
  cycle_id?: number;
  sleep_id?: string;
  start?: string;
  end?: string;
  nap?: boolean;
  score_state?: string;
  score?: Record<string, unknown>;
  step_count?: number;
};
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || "";
  const zone = request.nextUrl.searchParams.get("timezone") || "Asia/Kolkata";
  const stamp = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(stamp.getTime()) ||
    stamp.toISOString().slice(0, 10) !== date
  )
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return NextResponse.json({ error: "invalid_timezone" }, { status: 400 });
  }
  const day = (value?: string) => {
    if (!value || !Number.isFinite(Date.parse(value))) return "";
    const parts = formatter.formatToParts(new Date(value));
    return ["year", "month", "day"]
      .map((type) => parts.find((part) => part.type === type)?.value)
      .join("-");
  };
  const json = (body: object, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  const actor = currentAccount(request);
  const target = request.nextUrl.searchParams.get("memberId");
  if (target && (!actor || !canAccess(actor, target)))
    return json({ error: "Journal not shared" }, 403);
  const owner = target || actor?.id;
  if (!config()) return json(emptyHealth(date));
  let session = unseal<WhoopSession>(
    owner ? wearableFor(owner) : request.cookies.get(SESSION)?.value,
  );
  if (!session) return json(emptyHealth(date, true));
  let renewed = false;
  const respond = (body: object, status = 200) => {
    const response = json(body, status);
    if (renewed && session) {
      if (owner) saveWearable(owner, seal(session));
      else setCookie(response, SESSION, seal(session), 30 * 86400);
    }
    return response;
  };
  try {
    if (session.expiresAt < Date.now() + 60000) {
      session = {
        ...session,
        ...(await exchange({
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
          scope: "offline",
        })),
      };
      renewed = true;
    }
    const token = session.accessToken;
    const collection = async (path: string) => {
      const params = new URLSearchParams({
        start: new Date(stamp.getTime() - 2 * 86400000).toISOString(),
        end: new Date(stamp.getTime() + 2 * 86400000).toISOString(),
        limit: "25",
      });
      const result: RecordData[] = [];
      for (let page = 0; page < 10; page++) {
        const response = await fetch(`${API}/developer/v2/${path}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });
        if (response.status === 401) throw new Error("unauthorized");
        if (!response.ok) throw new Error("upstream");
        const body = await response.json();
        if (!Array.isArray(body.records)) throw new Error("invalid_response");
        result.push(...body.records);
        if (!body.next_token) return result;
        params.set("nextToken", body.next_token);
      }
      throw new Error("too_many_records");
    };
    const [cycles, recoveries, sleeps, workouts] = await Promise.all([
      collection("cycle"),
      collection("recovery"),
      collection("activity/sleep"),
      collection("activity/workout"),
    ]);
    const latest = (items: RecordData[]) =>
      items.sort((a, b) =>
        String(b.start || "").localeCompare(String(a.start || "")),
      )[0];
    const cycle = latest(cycles.filter((item) => day(item.start) === date));
    const sleep = latest(
      sleeps.filter((item) => !item.nap && day(item.end) === date),
    );
    const recovery =
      recoveries.find((item) => sleep && item.sleep_id === sleep.id) ||
      recoveries.find((item) => cycle && item.cycle_id === cycle.id);
    const score = (record?: RecordData) =>
      record?.score_state === "SCORED" ? record.score || {} : {};
    const r = score(recovery),
      s = score(sleep),
      c = score(cycle);
    const stages = s.stage_summary as Record<string, unknown> | undefined;
    const sleepTimes = stages
      ? [
          "total_light_sleep_time_milli",
          "total_slow_wave_sleep_time_milli",
          "total_rem_sleep_time_milli",
        ].map((key) => number(stages[key]))
      : [];
    const activity = workouts.filter((item) => day(item.start) === date);
    const durations = activity.map((item) =>
      item.start && item.end
        ? (Date.parse(item.end) - Date.parse(item.start)) / 60000
        : NaN,
    );
    return respond({
      ...emptyHealth(date, true, true),
      fetchedAt: new Date().toISOString(),
      recovery: number(r.recovery_score),
      hrv: number(r.hrv_rmssd_milli),
      restingHeartRate: number(r.resting_heart_rate),
      spo2: number(r.spo2_percentage),
      skinTemperature: number(r.skin_temp_celsius),
      respiratoryRate: number(s.respiratory_rate),
      sleepHours:
        sleepTimes.length === 3 && sleepTimes.every((value) => value !== null)
          ? sleepTimes.reduce<number>((sum, value) => sum + (value || 0), 0) /
            3600000
          : null,
      sleepPerformance: number(s.sleep_performance_percentage),
      strain: number(c.strain),
      steps: number(cycle?.step_count),
      energyKcal:
        number(c.kilojoule) === null ? null : Number(c.kilojoule) / 4.184,
      workoutCount: activity.length,
      workoutMinutes: durations.every(
        (value) => Number.isFinite(value) && value >= 0,
      )
        ? durations.reduce((sum, value) => sum + value, 0)
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      const response = json(
        { ...emptyHealth(date, true), error: "reconnect" },
        401,
      );
      if (owner) saveWearable(owner, null);
      else setCookie(response, SESSION, "", 0);
      return response;
    }
    return respond(
      { ...emptyHealth(date, true, true), error: "sync_failed" },
      502,
    );
  }
}
