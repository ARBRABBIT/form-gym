"use client";

import { useEffect, useState } from "react";
import { emptyHealth, sampleHealth, type HealthMetrics } from "@/lib/health";
import { formatDate, measurements, monthLabel, type Store } from "@/lib/model";
import { Section } from "./ui";

function Records({ values }: { values: Record<string, string | number | undefined> }) {
  return (
    <dl className="trainer-journal-records">
      {Object.entries(values).map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value?.toString().trim() || "Not recorded"}</dd></div>
      ))}
    </dl>
  );
}

function MemberHealth({ data, date }: { data: Store; date: string }) {
  const [result, setResult] = useState<{ date: string; health: HealthMetrics; message: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    if (data.sampleData) return;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    fetch(`/api/whoop/metrics?${new URLSearchParams({ date, timezone })}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || body.date !== date) throw new Error();
        setResult({ date, health: body, message: body.connected ? "WHOOP readings for the selected date." : "WHOOP is not connected. No wearable readings available." });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ date, health: emptyHealth(date), message: "WHOOP readings are unavailable. Member journal entries are still shown." });
      });
    return () => controller.abort();
  }, [date, data.sampleData]);
  const health = data.sampleData ? sampleHealth(date) : result?.date === date ? result.health : emptyHealth(date);
  const reading = (value: number | null, unit = "") => value == null ? undefined : `${value}${unit}`;
  return (
    <Section title="Health & wearable readings">
      <p className="section-description" role="status">{data.sampleData ? "Illustrative readings from the sample journal." : result?.date === date ? result.message : "Checking WHOOP readings…"}</p>
      <Records values={{
        Recovery: reading(health.recovery, "%"),
        HRV: reading(health.hrv, " ms"),
        "Resting heart rate": reading(health.restingHeartRate, " bpm"),
        "Blood oxygen": reading(health.spo2, "%"),
        "Skin temperature": reading(health.skinTemperature, " °C"),
        "Respiratory rate": reading(health.respiratoryRate, " /min"),
        Sleep: reading(health.sleepHours, " hours"),
        "Sleep performance": reading(health.sleepPerformance, "%"),
        Strain: reading(health.strain),
        Steps: reading(health.steps),
        Energy: reading(health.energyKcal, " kcal"),
        Workouts: reading(health.workoutCount),
        "Workout duration": reading(health.workoutMinutes, " minutes"),
      }} />
    </Section>
  );
}

export default function TrainerMemberJournal({ data, date, memberId }: { data: Store; date: string; memberId: string }) {
  if (memberId !== "alex") return (
    <Section title="No member journal shared">
      <p className="section-description">This member has no goals, habits, health readings or other journal records linked yet. Their available workout and nutrition records are in the other tabs.</p>
    </Section>
  );
  const month = date.slice(0, 7);
  const goals = (data.goalsByMonth[month] || []).filter((goal) => goal.trim());
  const weights = data.weights.filter((entry) => entry.date.startsWith(month)).slice().sort((a, b) => b.date.localeCompare(a.date));
  const planner = Object.entries(data.planner).filter(([day, note]) => day.startsWith(month) && note.trim()).sort(([a], [b]) => a.localeCompare(b));
  const review = data.reviews[month] || {};
  const prior = new Date(`${month}-15T12:00:00`);
  prior.setMonth(prior.getMonth() - 1);
  const previousMonth = `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, "0")}`;
  return (
    <div className="trainer-member-journal">
      <p className="info-note">Member journal · {monthLabel(month)}. These entries reflect the member view. Workouts and nutrition are in the adjacent tabs.</p>
      <nav className="trainer-journal-links" aria-label="Member journal sections">
        {[["goals", "Goals & habits"], ["progress", "Weight & results"], ["notes", "Planner & review"], ["health", "Health"]].map(([id, label]) => (
          <button type="button" key={id} onClick={() => document.getElementById(`trainer-journal-${id}`)?.scrollIntoView({ behavior: "instant", block: "start" })}>{label}</button>
        ))}
      </nav>
      <div id="trainer-journal-goals">
        <Section title="Monthly goals">
          {goals.length ? <ul className="trainer-journal-list">{goals.map((goal, i) => <li key={i}>{goal}</li>)}</ul> : <p className="empty-state">No goals recorded for this month.</p>}
        </Section>
        <Section title="Habits & consistency">
          {data.habits.length ? data.habits.map((habit) => (
            <div className="trainer-journal-habit" key={habit.id}>
              <h3>{habit.name}</h3>
              <p>{habit.kind === "break" ? "Habit to break" : "Habit to build"} · {habit.marks.includes(date) ? "Completed on selected date" : "Not marked on selected date"}</p>
              <p>{habit.marks.filter((day) => day.startsWith(month)).length} days marked this month</p>
              <p className="muted">Marked dates: {habit.marks.filter((day) => day.startsWith(month)).sort().map((day) => formatDate(day, { month: "short", day: "numeric" })).join(", ") || "None yet"}</p>
            </div>
          )) : <p className="empty-state">No habits recorded.</p>}
        </Section>
        <Section title="100-day challenge">
          <Records values={{ Intention: data.challengeTarget, Status: data.challengeAccepted || data.challenge.length ? "Joined" : "Not joined", "Days completed": `${new Set(data.challenge).size} of 100`, "Completed days": [...new Set(data.challenge)].sort((a, b) => a - b).join(", "), Notes: data.challengeNote }} />
        </Section>
      </div>
      <div id="trainer-journal-progress">
        <Section title="Starting profile"><Records values={data.profile} /></Section>
        <Section title="Weight history">
          {weights.length ? weights.map((entry) => <details className="trainer-journal-entry" key={entry.id}>
            <summary><span>{formatDate(entry.date)}</span><strong>{entry.weight} kg</strong></summary>
            <Records values={{ Weight: `${entry.weight} kg`, "Gain (kg)": entry.gain, "Loss (kg)": entry.loss, Notes: entry.notes, Source: entry.source, "After bathroom": entry.afterBathroom === undefined ? undefined : entry.afterBathroom ? "Yes" : "No" }} />
          </details>) : <p className="empty-state">No weight entries for this month.</p>}
        </Section>
        <Section title="Measurements & results">
          <p className="section-description">Current: {monthLabel(month)} · Previous: {monthLabel(previousMonth)}. Values are shown as recorded.</p>
          <div className="trainer-measurements-scroll"><table className="trainer-measurements">
            <thead><tr><th scope="col">Measurement</th><th scope="col">Starting point</th><th scope="col">Current</th><th scope="col">Previous</th></tr></thead>
            <tbody>{measurements.map((label) => <tr key={label}><th scope="row">{label}{label === "Weight" ? " (kg)" : label === "Body Fat %" ? "" : " (cm)"}</th><td>{data.baselineMeasurements?.[label] || "—"}</td><td>{data.measurements[month]?.[label] || "—"}</td><td>{data.measurements[previousMonth]?.[label] || "—"}</td></tr>)}</tbody>
          </table></div>
          <Records values={{ "Current result date": data.resultDates.now, "Previous result date": data.resultDates.previous, "Before notes": data.before, "After notes": data.after }} />
        </Section>
      </div>
      <div id="trainer-journal-notes">
        <Section title="Monthly planner">
          {planner.length ? <Records values={Object.fromEntries(planner.map(([day, note]) => [formatDate(day), note]))} /> : <p className="empty-state">No planner notes for this month.</p>}
        </Section>
        <Section title="Monthly review">
          {Object.values(review).some((value) => value.trim()) ? <Records values={review} /> : <p className="empty-state">No review recorded for this month.</p>}
        </Section>
      </div>
      <div id="trainer-journal-health"><MemberHealth data={data} date={date} /></div>
    </div>
  );
}
