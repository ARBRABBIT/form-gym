"use client";
import { useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CalendarDays,
  Plus,
  Scale,
  Moon,
  Footprints,
} from "./icons";
import type { ScreenProps } from "./journal-app";
import {
  TODAY,
  monthlyGoals,
  formatDate,
  monthLabel,
  daysInMonth,
  emptyNutrition,
  totalNutrition,
} from "@/lib/model";
import { TextLink, Button } from "./ui";
import DatePicker from "./date-picker";
import DateStrip from "./date-strip";
import HealthOverview from "./health-overview";
import BodyCompositionCard from "./body-composition-card";
import WaterCard from "./water-card";
export default function Dashboard({
  data,
  update,
  navigate,
  date,
  setDate,
  healthMemberId, trainerMode, persistent,
}: ScreenProps) {
  const plan = data.plans[`alex:${date}`],
    log = data.logs[`alex:${date}`];
  const n = data.nutrition[date] || emptyNutrition(),
    totals = totalNutrition(n),
    done = data.habits.filter((h) => h.marks.includes(date)).length;
  useEffect(() => {
    if (date > TODAY) setDate(TODAY);
  }, [date, setDate]);
  const range = (values: string[]) => {
    const n = values
      .filter((v) => v !== "")
      .map(Number)
      .filter(Number.isFinite);
    if (!n.length) return "—";
    return Math.min(...n) === Math.max(...n)
      ? String(n[0])
      : `${Math.min(...n)}–${Math.max(...n)}`;
  };
  const weight =
    [...data.weights]
      .reverse()
      .filter((w) => w.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight ||
    data.profile["Starting weight (kg)"];
  return (
    <div className="home-dashboard">
      <div className="journal-heading">
        <div>
          <h1>
            {data.profile.Name
              ? `${data.profile.Name}’s journal`
              : "Your journal"}
          </h1>
        </div>
        <div className="journal-heading-actions">
          <DatePicker value={date} onChange={setDate} max={TODAY} />
          <span className="journal-year">
            {formatDate(date, { year: "numeric" })}
          </span>
        </div>
      </div>
      <DateStrip
        value={date}
        onChange={setDate}
        hasPlan={(key) => !!data.plans[`alex:${key}`]}
      />
      <HealthOverview
        healthMemberId={healthMemberId}
        trainerMode={trainerMode}
        data={data}
        update={update}
        navigate={navigate}
        date={date}
        setDate={setDate}
      />
      <BodyCompositionCard data={data} update={update} date={date} persistent={persistent} />
      <div className="journal-columns">
        <div className="journal-main">
          <section className="training-section">
            <div className="training-summary">
              <header className="journal-section-header">
                <h2>Training</h2>
                <span className="entry-status">
                  <span />
                  {log
                    ? "Log submitted"
                    : plan
                      ? "Assigned workout"
                      : "No assignment"}
                </span>
              </header>
              <div className="training-title">
                <h3>{plan?.muscle || "Your own session"}</h3>
                <button
                  className="round-action"
                  aria-label={
                    log ? "View workout log" : "Open assigned workout"
                  }
                  onClick={() => navigate("workout")}
                >
                  <ArrowUpRight size={24} />
                </button>
              </div>
              <div className="training-byline">
                <span>
                  {plan ? "Coach Kabir Mehta" : "Train on your own terms"}
                </span>
                <span>
                  {plan
                    ? `${plan.exercises.length} exercises · Plan ${plan.version}`
                    : "Record a workout for this date"}
                </span>
              </div>
              <div className="training-start">
                <Button onClick={() => navigate("workout")}>
                  {log
                    ? "View workout log"
                    : plan
                      ? "View & log workout"
                      : "Log a workout"}
                  <ArrowUpRight size={17} />
                </Button>
              </div>
            </div>
            <div className="training-details">
              {plan ? (
                <div className="prescribed-table">
                  <div className="prescribed-head">
                    <span>Exercise</span>
                    <span>Sets</span>
                    <span>Reps</span>
                    <span>kg</span>
                  </div>
                  {plan.exercises.map((e, i) => (
                    <button
                      key={e.id}
                      className="prescribed-row"
                      onClick={() => navigate("workout")}
                    >
                      <span className="exercise-title">
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <strong>{e.name || "Untitled exercise"}</strong>
                      </span>
                      <span>
                        {e.sets.filter((s) => s.reps || s.weight).length || "—"}
                      </span>
                      <span>{range(e.sets.map((s) => s.reps))}</span>
                      <span>{range(e.sets.map((s) => s.weight))}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="training-empty">
                  No plan for this date. You can still keep a record of your
                  training.
                </p>
              )}
              <div className="training-bottom">
                <p>
                  {plan?.notes ||
                    "Add your exercises, sets and a note on the session."}
                </p>
              </div>
            </div>
          </section>
          <section className="daily-habits-section">
            <header className="journal-section-header">
              <h2>
                Daily habits{" "}
                <span>
                  {done}/{data.habits.length}
                </span>
              </h2>
              <TextLink onClick={() => navigate("habits")}>
                Monthly tracker
              </TextLink>
            </header>
            <div className="habits-list">
              {data.habits.map((h) => (
                <button
                  key={h.id}
                  className={`habit-row ${h.marks.includes(date) ? "checked" : ""}`}
                  aria-pressed={h.marks.includes(date)}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      habits: s.habits.map((item) =>
                        item.id === h.id
                          ? {
                              ...item,
                              marks: item.marks.includes(date)
                                ? item.marks.filter((d) => d !== date)
                                : [...item.marks, date],
                            }
                          : item,
                      ),
                    }))
                  }
                >
                  <span className="check-box">
                    {h.marks.includes(date) && <Check size={14} />}
                  </span>
                  <span>{h.name || "Unnamed habit"}</span>
                  <span className="habit-status">
                    {h.marks.includes(date) ? "Complete" : "To do"}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="daily-nutrition-section">
            <header className="journal-section-header">
              <h2>Nutrition</h2>
              <TextLink onClick={() => navigate("nutrition")}>
                Add a meal
              </TextLink>
            </header>
            <div className="nutrition-ledger">
              <div>
                <span>Energy</span>
                <strong>
                  {totals.calories.toLocaleString()}
                  <small>kcal</small>
                </strong>
              </div>
              {(["protein", "carbs", "fat"] as const).map((m) => (
                <div key={m}>
                  <span>{m[0].toUpperCase() + m.slice(1)}</span>
                  <strong>
                    {totals[m]}
                    <small>g</small>
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <WaterCard liters={n.water} onOpen={() => navigate("water")} onChange={water => update(store => ({ ...store, nutrition: { ...store.nutrition, [date]: { ...(store.nutrition[date] ?? emptyNutrition()), water } } }))} />
          <section className="wellness-section">
            <header className="journal-section-header">
              <h2>Daily check-in</h2>
              <TextLink onClick={() => navigate("nutrition")}>
                Edit entry
              </TextLink>
            </header>
            <div className="wellness-ledger">
              {[
                {
                  icon: Scale,
                  label: "Weight",
                  value: weight || "—",
                  unit: "kg",
                  screen: "weight",
                },
                {
                  icon: Moon,
                  label: "Sleep",
                  value: n.metrics["Sleep (hours)"] || "—",
                  unit: "hrs",
                  screen: "nutrition",
                },
                {
                  icon: Footprints,
                  label: "Steps",
                  value: n.metrics.Steps
                    ? Number(n.metrics.Steps).toLocaleString()
                    : "—",
                  unit: "steps",
                  screen: "nutrition",
                },
              ].map((item) => (
                <button key={item.label} onClick={() => navigate(item.screen)}>
                  <div>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    <ArrowUpRight size={14} />
                  </div>
                  <strong>
                    {item.value}
                    <small>{item.unit}</small>
                  </strong>
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="journal-aside">
          <section className="month-section">
            <header className="journal-section-header">
              <h2>{monthLabel(data.month)}</h2>
              <button
                className="icon-button"
                aria-label="Open monthly planner"
                onClick={() => navigate("planner")}
              >
                <ArrowUpRight size={20} />
              </button>
            </header>
            <MiniCalendar
              month={data.month}
              selected={date}
              onDate={(d) => {
                setDate(d);
                navigate("planner");
              }}
            />
            <button
              className="planner-note"
              onClick={() => navigate("planner")}
            >
              <span className="planner-note-date">
                {new Date(date + "T12:00:00").getDate()}
              </span>
              <span>{data.planner[date] || "Add a note for this day"}</span>
              <Plus size={15} />
            </button>
          </section>
          <section className="goals-section">
            <header className="journal-section-header">
              <h2>Monthly goals</h2>
              <button
                className="icon-button"
                aria-label="Edit monthly goals"
                onClick={() => navigate("planner")}
              >
                <ArrowUpRight size={20} />
              </button>
            </header>
            <div className="goal-list">
              {monthlyGoals(data).map((g, i) => (
                <button key={i} onClick={() => navigate("planner")}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{g || `Add goal ${i + 1}`}</p>
                </button>
              ))}
            </div>
          </section>
          <section className="challenge-section">
            <header className="journal-section-header">
              <h2>100-day challenge</h2>
              <button
                className="icon-button"
                aria-label="Open 100-day challenge"
                onClick={() => navigate("challenge")}
              >
                <ArrowUpRight size={20} />
              </button>
            </header>
            <div className="challenge-count">
              <strong>{String(data.challenge.length).padStart(2, "0")}</strong>
              <span>
                of 100 days
                <br />
                completed
              </span>
            </div>
            <div className="challenge-mini" aria-hidden="true">
              {Array.from({ length: 100 }, (_, i) => (
                <span
                  key={i}
                  className={data.challenge.includes(i + 1) ? "marked" : ""}
                />
              ))}
            </div>
            <p className="challenge-description">
              {data.challengeTarget || "Set your target"}
            </p>
            <TextLink onClick={() => navigate("challenge")}>
              Track your challenge
            </TextLink>
          </section>
          <div className="journal-index">
            <h2>In your journal</h2>
            {[
              { label: "Starting point & results", id: "results" },
              { label: "Weight tracker", id: "weight" },
              { label: "Monthly review", id: "review" },
            ].map((l) => (
              <button key={l.id} onClick={() => navigate(l.id)}>
                {l.label}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
export function MiniCalendar({
  month,
  selected,
  onDate,
}: {
  month: string;
  selected?: string;
  onDate: (v: string) => void;
}) {
  const offset = new Date(month + "-01T12:00:00").getDay(),
    count = daysInMonth(month);
  return (
    <div className="mini-calendar">
      <div className="calendar-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </div>
      <div className="calendar-cells">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, "0")}`;
          return (
            <button
              key={d}
              onClick={() => onDate(d)}
              className={`${d === selected ? "selected" : ""} ${d === TODAY ? "today" : ""}`}
              aria-label={formatDate(d)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
