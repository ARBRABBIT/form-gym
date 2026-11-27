"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GlassWater,
  Plus,
  Trash2,
  Target,
  Flag,
  Sparkles,
  TrendingUp,
} from "./icons";
import type { ScreenProps } from "./journal-app";
import {
  TODAY,
  monthlyGoals,
  daysInMonth,
  formatDate,
  monthLabel,
  measurements,
  meals,
  uid,
  emptyNutrition,
  totalNutrition,
  type Food,
  type WeightEntry,
  type Store,
} from "@/lib/model";
import {
  Button,
  Field,
  TextArea,
  Section,
  PageHeading,
  Sheet,
  AddButton,
} from "./ui";
import { MiniCalendar } from "./overview";
import MonthPicker from "./month-picker";
import BodyComparison from "./body-comparison";
import { previousMeasurementMonth } from "@/lib/measurement-comparison";
const monthField = (p: ScreenProps) => (
  <MonthPicker
    label="Month and year"
    value={p.data.month}
    onChange={(v) => v && p.update((s) => ({ ...s, month: v }))}
  />
);
const back = (p: ScreenProps) => () => p.navigate("overview");
function SaveJournal({
  p,
  label = "Save changes",
}: {
  p: ScreenProps;
  label?: string;
}) {
  return (
    <div className="form-actions">
      <span>Your trainer can review these journal entries.</span>
      <Button
        onClick={() =>
          p.update((s) => ({ ...s }), "Journal saved on this browser")
        }
      >
        <Check size={16} />
        {label}
      </Button>
    </div>
  );
}
export function Planner(p: ScreenProps) {
  return (
    <>
      <PageHeading
        title="Monthly planner"
        description="Daily notes and four priorities for the month."
        back={back(p)}
      />
      <PlannerContent p={p} />
      <SaveJournal p={p} />
    </>
  );
}
function PlannerContent({ p }: { p: ScreenProps }) {
  const { data, update } = p;
  const [open, setOpen] = useState(""),
    [note, setNote] = useState("");
  const offset = new Date(data.month + "-01T12:00:00").getDay();
  return (
    <>
      <div className="month-control">{monthField(p)}</div>
      <Section title={monthLabel(data.month)}>
        <div className="full-calendar">
          <div className="calendar-weekdays">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((d) => (
              <span key={d}>
                <span className="desktop-only">{d}</span>
                <span className="mobile-only">{d.slice(0, 1)}</span>
              </span>
            ))}
          </div>
          <div className="calendar-cells">
            {Array.from({ length: offset }, (_, i) => (
              <span className="blank-cell" key={i} />
            ))}
            {Array.from({ length: daysInMonth(data.month) }, (_, i) => {
              const key = `${data.month}-${String(i + 1).padStart(2, "0")}`;
              return (
                <button
                  key={key}
                  className={key === TODAY ? "today" : ""}
                  onClick={() => {
                    setNote(data.planner[key] || "");
                    setOpen(key);
                  }}
                >
                  <strong>{i + 1}</strong>
                  {data.planner[key] && (
                    <>
                      <span className="calendar-note">{data.planner[key]}</span>
                      <i className="calendar-note-dot" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Section>
      <section
        className="monthly-goal-section"
        aria-label="Most Important Goals of This Month"
      >
        <h2>Most Important Goals of This Month</h2>
        <p className="section-description">
          What are your most important goals this month?
        </p>
        <div className="monthly-goal-cards">
          {monthlyGoals(data).map((g, i) => {
            const Icon = [Target, TrendingUp, Flag, Sparkles][i];
            return (
              <article
                className={`monthly-goal-card goal-tone-${i + 1}`}
                key={i}
              >
                <span className="monthly-goal-icon" aria-hidden="true">
                  <Icon size={23} />
                </span>
                <TextArea
                  label={`Goal ${i + 1}`}
                  value={g}
                  placeholder="What do you want to work toward?"
                  onChange={(v) =>
                    update((s) => ({
                      ...s,
                      goalsByMonth: {
                        ...s.goalsByMonth,
                        [s.month]: monthlyGoals(s).map((a, j) =>
                          i === j ? v : a,
                        ),
                      },
                    }))
                  }
                />
              </article>
            );
          })}
        </div>
      </section>
      {open && (
        <Sheet title={formatDate(open)} onClose={() => setOpen("")}>
          <TextArea
            label="Your plan for this date"
            value={note}
            onChange={setNote}
            placeholder="A workout, a reminder, a moment for yourself…"
          />
          <Button
            className="full-width"
            onClick={() => {
              update(
                (s) => ({ ...s, planner: { ...s.planner, [open]: note } }),
                "Planner entry saved",
              );
              setOpen("");
            }}
          >
            Save entry <Check size={16} />
          </Button>
        </Sheet>
      )}
    </>
  );
}
export function Habits(p: ScreenProps) {
  const { data, update, date, setDate } = p;
  const [monthly, setMonthly] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const toggle = (id: string, d: string) =>
    update((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id
          ? {
              ...h,
              marks: h.marks.includes(d)
                ? h.marks.filter((v) => v !== d)
                : [...h.marks, d],
            }
          : h,
      ),
    }));
  return (
    <>
      <PageHeading
        title="Habit tracker"
        description="Daily checkmarks and monthly totals."
        back={back(p)}
      />
      <div className="filter-bar">
        {monthField(p)}
        <div className="segmented">
          <button
            className={!monthly ? "selected" : ""}
            onClick={() => setMonthly(false)}
          >
            Daily checklist
          </button>
          <button
            className={monthly ? "selected" : ""}
            onClick={() => setMonthly(true)}
          >
            Monthly view
          </button>
        </div>
      </div>
      {!monthly && (
        <Field
          label="Logging date"
          type="date"
          value={date}
          onChange={(v) => v && setDate(v)}
        />
      )}
      <Section title={monthly ? monthLabel(data.month) : formatDate(date)}>
        {data.habits.length === 0 && (
          <p className="empty-state">
            Your next good habit starts here. Add one below.
          </p>
        )}
        {data.habits.map((h) => (
          <div key={h.id} className="habit-detail">
            <div className="habit-detail-heading">
              <Field
                label="Habit name"
                value={h.name}
                onChange={(v) =>
                  update((s) => ({
                    ...s,
                    habits: s.habits.map((a) =>
                      a.id === h.id ? { ...a, name: v } : a,
                    ),
                  }))
                }
              />
              <strong className="habit-total">
                {h.marks.filter((d) => d.startsWith(data.month)).length}
                <span>Total this month</span>
              </strong>
              <button
                aria-label={`Remove ${h.name}`}
                className="icon-button"
                onClick={() =>
                  update(
                    (s) => ({
                      ...s,
                      habits: s.habits.filter((a) => a.id !== h.id),
                    }),
                    "Habit removed",
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            {h.kind && (
              <p className="helper">
                {h.kind === "break"
                  ? "Habit to break · Check a day you avoided it."
                  : "Habit to build · Check a day you practised it."}
              </p>
            )}
            {monthly ? (
              <div className="habit-month-grid">
                {Array.from({ length: daysInMonth(data.month) }, (_, i) => {
                  const d = `${data.month}-${String(i + 1).padStart(2, "0")}`;
                  return (
                    <button
                      aria-label={`${h.name}, ${formatDate(d)}`}
                      aria-pressed={h.marks.includes(d)}
                      className={h.marks.includes(d) ? "marked" : ""}
                      key={d}
                      onClick={() => toggle(h.id, d)}
                    >
                      {String(i + 1).padStart(2, "0")}
                      {h.marks.includes(d) && <Check size={10} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                className={`daily-check ${h.marks.includes(date) ? "checked" : ""}`}
                onClick={() => toggle(h.id, date)}
              >
                <span className="check-box">
                  {h.marks.includes(date) && <Check size={13} />}
                </span>
                {h.marks.includes(date) ? "Completed today" : "Mark complete"}
              </button>
            )}
          </div>
        ))}
        <div className="inline-add">
          <Field
            label="New habit"
            value={newHabit}
            onChange={setNewHabit}
            placeholder="Something worth repeating"
          />
          <Button
            variant="secondary"
            disabled={!newHabit.trim()}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  habits: [
                    ...s.habits,
                    { id: uid(), name: newHabit.trim(), marks: [] },
                  ],
                }),
                "New habit added",
              );
              setNewHabit("");
            }}
          >
            <Plus size={16} />
            Add habit
          </Button>
        </div>
      </Section>
    </>
  );
}
export function Challenge(p: ScreenProps) {
  const { data, update } = p;
  return (
    <>
      <PageHeading
        title="100-day challenge"
        description="Mark each day you complete your target."
        back={back(p)}
      />
      <Section title="Your 100 Days Challenge">
        <Field
          label="Target"
          value={data.challengeTarget}
          onChange={(v) => update((s) => ({ ...s, challengeTarget: v }))}
          placeholder="What will you commit to?"
        />
        <div className="challenge-progress">
          <strong>
            {data.challenge.length}
            <span> / 100 days complete</span>
          </strong>
          <span>{data.challenge.length}%</span>
        </div>
        <div className="progress-track">
          <div style={{ width: `${data.challenge.length}%` }} />
        </div>
        <div className="challenge-grid">
          {Array.from({ length: 100 }, (_, i) => (
            <button
              key={i}
              aria-label={`Challenge day ${i + 1}`}
              aria-pressed={data.challenge.includes(i + 1)}
              className={data.challenge.includes(i + 1) ? "marked" : ""}
              onClick={() =>
                update((s) => ({
                  ...s,
                  challenge: s.challenge.includes(i + 1)
                    ? s.challenge.filter((n) => n !== i + 1)
                    : [...s.challenge, i + 1],
                }))
              }
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {data.challenge.includes(i + 1) && <Check size={12} />}
            </button>
          ))}
        </div>
        <TextArea
          label="Note"
          value={data.challengeNote}
          onChange={(v) => update((s) => ({ ...s, challengeNote: v }))}
        />
      </Section>
      <SaveJournal p={p} />
    </>
  );
}
export function WeightTracker(p: ScreenProps) {
  const { data, update } = p;
  const [entry, setEntry] = useState<WeightEntry | null>(null);
  const rows = data.weights
    .filter((w) => w.date.startsWith(data.month))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeading
        title="Weight tracker"
        description="Record your weight and keep a note of each check-in."
        back={back(p)}
        action={
          <Button
            onClick={() =>
              setEntry({
                id: uid(),
                date:
                  data.month === TODAY.slice(0, 7) ? TODAY : data.month + "-01",
                weight: "",
                gain: "",
                loss: "",
                notes: "",
              })
            }
          >
            <Plus size={16} />
            Add entry
          </Button>
        }
      />
      <div className="month-control">{monthField(p)}</div>
      <Section title="Your entries">
        {!rows.length && (
          <div className="empty-state">
            No entries this month. Add your first check-in.
          </div>
        )}
        {rows.map((w) => (
          <button
            className="weight-entry"
            key={w.id}
            onClick={() => setEntry({ ...w })}
          >
            <div>
              <strong>
                {formatDate(w.date, { day: "numeric", month: "short" })}
              </strong>
              <span>{w.notes || "No note added"}</span>
            </div>
            <div className="weight-values">
              <strong>
                {w.weight} <small>kg</small>
              </strong>
              <span>
                Gain+ {w.gain || "—"}
                <br />
                Loss+ {w.loss || "—"}
              </span>
              <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </Section>
      {entry && (
        <Sheet title="Weight check-in" onClose={() => setEntry(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update(
                (s) => ({
                  ...s,
                  weights: [
                    ...s.weights.filter((w) => w.id !== entry.id),
                    entry,
                  ],
                }),
                "Weight entry saved",
              );
              setEntry(null);
            }}
          >
            <div className="form-grid">
              <Field
                label="Date"
                type="date"
                value={entry.date}
                required
                onChange={(v) => setEntry({ ...entry, date: v })}
              />
              <Field
                label="Weight (kg)"
                type="number"
                required
                value={entry.weight}
                onChange={(v) => setEntry({ ...entry, weight: v })}
              />
              <Field
                label="Gain+ (kg)"
                type="number"
                value={entry.gain}
                onChange={(v) => setEntry({ ...entry, gain: v })}
              />
              <Field
                label="Loss+ (kg)"
                type="number"
                value={entry.loss}
                onChange={(v) => setEntry({ ...entry, loss: v })}
              />
            </div>
            <p className="helper">Gain+ and Loss+ are manual journal values.</p>
            <TextArea
              label="Notes"
              value={entry.notes}
              onChange={(v) => setEntry({ ...entry, notes: v })}
            />
            <Button type="submit" className="full-width">
              Save entry <Check size={16} />
            </Button>
          </form>
        </Sheet>
      )}
    </>
  );
}
function ProfileFields({ p }: { p: ScreenProps }) {
  return (
    <>
      <div className="form-grid">
        {["Name", "Starting weight (kg)", "Height (cm)"].map((label, i) => (
          <Field
            key={label}
            label={label}
            value={p.data.profile[label] || ""}
            type={i ? "number" : "text"}
            onChange={(v) =>
              p.update((s) => ({ ...s, profile: { ...s.profile, [label]: v } }))
            }
          />
        ))}
      </div>
      <fieldset className="goal-picker">
        <legend>My Goal</legend>
        {["Lose weight", "Maintain weight", "Gain weight"].map((g) => (
          <label
            key={g}
            className={p.data.profile["My Goal"] === g ? "selected" : ""}
          >
            <input
              type="radio"
              name="weight-goal"
              checked={p.data.profile["My Goal"] === g}
              onChange={() =>
                p.update((s) => ({
                  ...s,
                  profile: { ...s.profile, "My Goal": g },
                }))
              }
            />
            {g}
          </label>
        ))}
      </fieldset>
    </>
  );
}
function MeasurementFields({ p }: { p: ScreenProps }) {
  return (
    <>
      <div className="measurement-header">
        <span>Measurements</span>
        <span>Now</span>
        <span>Vs. Last Month</span>
      </div>
      {measurements.map((m, i) => (
        <div key={m} className="measurement-row">
          <label htmlFor={`measurement-${i}`}>
            {m}
            <small>
              {m === "Weight" ? "kg" : m === "Body Fat %" ? "" : "cm"}
            </small>
          </label>
          <input
            id={`measurement-${i}`}
            aria-label={`${m} Now`}
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={p.data.measurements[p.data.month]?.[m] || ""}
            onChange={(e) =>
              p.update((s) => ({
                ...s,
                measurements: {
                  ...s.measurements,
                  [s.month]: {
                    ...s.measurements[s.month],
                    [m]: e.target.value,
                  },
                },
              }))
            }
          />
          <span className="measurement-previous">
            {p.data.measurements[previousMeasurementMonth(p.data.month)]?.[
              m
            ]?.trim() || "Unavailable"}
          </span>
        </div>
      ))}
      <p className="helper">
        Previous values are from the calendar month before the selected month.
      </p>
    </>
  );
}
export function Results(p: ScreenProps) {
  return (
    <>
      <PageHeading
        title="My starting point & results"
        description="Baseline details, measurements and results."
        back={back(p)}
      />
      <div className="month-control">{monthField(p)}</div>
      <BodyComparison p={p} />
      <Section title="My Starting Point">
        <ProfileFields p={p} />
      </Section>
      <div className="two-col">
        <Section title="Before">
          <TextArea
            label="Before area"
            value={p.data.before}
            onChange={(v) => p.update((s) => ({ ...s, before: v }))}
            placeholder="Record your starting point…"
          />
        </Section>
        <Section title="After">
          <TextArea
            label="After area"
            value={p.data.after}
            onChange={(v) => p.update((s) => ({ ...s, after: v }))}
            placeholder="Reflect on where you are now…"
          />
        </Section>
      </div>
      <Section title="Your measurements">
        <MeasurementFields p={p} />
        <div className="form-grid result-dates">
          <Field
            label="Now — Date"
            type="date"
            value={p.data.resultDates.now}
            onChange={(v) =>
              p.update((s) => ({
                ...s,
                resultDates: { ...s.resultDates, now: v },
              }))
            }
          />
          <Field
            label="Vs. Last Month — Date"
            type="date"
            value={p.data.resultDates.previous}
            onChange={(v) =>
              p.update((s) => ({
                ...s,
                resultDates: { ...s.resultDates, previous: v },
              }))
            }
          />
        </div>
      </Section>
      <Section title="Body measurement guide">
        <div className="measurement-guide">
          {measurements.slice(0, 8).map((m) => (
            <div key={m}>
              <span className="guide-line" />
              <strong>{m}</strong>
              <span>
                {
                  (
                    {
                      Neck: "Around the base of the neck",
                      Shoulders: "Around the widest part of both shoulders",
                      Chest: "Around the fullest part of the chest",
                      Bicep: "Around the widest part of the upper arm",
                      Waist: "Around your natural waist",
                      Hip: "Around the widest part of the hips",
                      Thigh: "Around the fullest part of the thigh",
                      Calf: "Around the widest part of the calf",
                    } as Record<string, string>
                  )[m]
                }
              </span>
            </div>
          ))}
        </div>
      </Section>
      <SaveJournal p={p} />
    </>
  );
}
export function Review(p: ScreenProps) {
  const questions = [
    "What were the biggest wins?",
    "What areas were lacking and why?",
    "How will I improve next month and how?",
  ];
  return (
    <>
      <PageHeading
        title="Monthly review"
        description="Measurements and reflections for the selected month."
        back={back(p)}
      />
      <div className="month-control">{monthField(p)}</div>
      <Section title="Measurements">
        <MeasurementFields p={p} />
      </Section>
      <Section title="A moment to reflect">
        {questions.map((q) => (
          <TextArea
            key={q}
            label={q}
            value={p.data.reviews[p.data.month]?.[q] || ""}
            onChange={(v) =>
              p.update((s) => ({
                ...s,
                reviews: {
                  ...s.reviews,
                  [s.month]: { ...s.reviews[s.month], [q]: v },
                },
              }))
            }
          />
        ))}
      </Section>
      <SaveJournal p={p} label="Save monthly review" />
    </>
  );
}
export function NutritionScreen(p: ScreenProps) {
  const { data, update, date, setDate } = p;
  const n = data.nutrition[date] || emptyNutrition();
  const [food, setFood] = useState<{ meal: string; item: Food } | null>(null);
  const put = (next: typeof n) =>
    update((s) => ({ ...s, nutrition: { ...s.nutrition, [date]: next } }));
  const totals = totalNutrition(n);
  const nutrients = ["calories", "protein", "carbs", "fat"] as const;
  return (
    <>
      <PageHeading
        title="Nutrition & wellness"
        description="Meals, nutrition and daily wellness."
        back={back(p)}
      />
      <div className="month-control">
        <Field
          label="Journal date"
          type="date"
          value={date}
          onChange={(v) => v && setDate(v)}
        />
      </div>
      <Section title="Your daily total">
        <div className="daily-totals">
          {nutrients.map((k) => (
            <div key={k}>
              <span>{k[0].toUpperCase() + k.slice(1)}</span>
              <strong>
                {totals[k]} <small>{k === "calories" ? "kcal" : "g"}</small>
              </strong>
            </div>
          ))}
        </div>
        <div className="goal-comparison">
          <strong>Vs. Goal</strong>
          <span>Target unavailable</span>
        </div>
      </Section>
      <Section title="Your daily check-in">
        <div className="form-grid three-col">
          {[
            "Weight (kg)",
            "Waist (cm)",
            "Sleep (hours)",
            "Steps",
            "Body Fat (%)",
          ].map((m) => (
            <Field
              key={m}
              label={m}
              type="number"
              value={n.metrics[m] || ""}
              onChange={(v) => put({ ...n, metrics: { ...n.metrics, [m]: v } })}
            />
          ))}
        </div>
        <div className="water-entry">
          <div>
            <strong>Water</strong>
            <span>{n.water.toLocaleString("en-IN", { maximumFractionDigits: 2 })} L logged · 1 mark = 1 L</span>
            <button type="button" className="water-tracker-link" onClick={() => p.navigate("water")}>Open water tracker <ArrowRight size={14} /></button>
          </div>
          <div className="water-drops">
            {Array.from({ length: 6 }, (_, i) => (
              <button
                key={i}
                aria-label={`Water ${i + 1} L`}
                aria-pressed={n.water > i}
                onClick={() =>
                  put({ ...n, water: n.water === i + 1 ? i : i + 1 })
                }
              >
                <GlassWater size={26} />
              </button>
            ))}
          </div>
        </div>
      </Section>
      {meals.map((meal) => {
        const subtotal = totalNutrition({
          ...emptyNutrition(),
          meals: { [meal]: n.meals[meal] || [] },
        });
        return (
          <Section
            key={meal}
            title={meal}
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  setFood({
                    meal,
                    item: {
                      id: uid(),
                      product: "",
                      serving: "",
                      calories: "",
                      protein: "",
                      carbs: "",
                      fat: "",
                    },
                  })
                }
              >
                <Plus size={16} />
                Add food
              </Button>
            }
          >
            {!n.meals[meal]?.length && (
              <p className="empty-meal">No food items logged.</p>
            )}
            {n.meals[meal]?.map((f) => (
              <div className="food-row" key={f.id}>
                <button onClick={() => setFood({ meal, item: { ...f } })}>
                  <strong>{f.product}</strong>
                  <span>
                    {f.serving || "Serving not recorded"} · {f.calories || 0}{" "}
                    kcal
                  </span>
                  <small>
                    P {f.protein || 0}g · C {f.carbs || 0}g · F {f.fat || 0}g
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${f.product}`}
                  onClick={() =>
                    put({
                      ...n,
                      meals: {
                        ...n.meals,
                        [meal]: n.meals[meal].filter((a) => a.id !== f.id),
                      },
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="meal-subtotal">
              <strong>Subtotal</strong>
              <span>{subtotal.calories} kcal</span>
              <span>
                P {subtotal.protein}g · C {subtotal.carbs}g · F {subtotal.fat}g
              </span>
            </div>
          </Section>
        );
      })}
      <SaveJournal p={p} label="Save daily journal" />
      {food && (
        <Sheet title={`Add to ${food.meal}`} onClose={() => setFood(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              put({
                ...n,
                meals: {
                  ...n.meals,
                  [food.meal]: [
                    ...(n.meals[food.meal] || []).filter(
                      (f) => f.id !== food.item.id,
                    ),
                    food.item,
                  ],
                },
              });
              setFood(null);
              update((s) => ({ ...s }), "Food item saved");
            }}
          >
            <Field
              label="Product"
              required
              value={food.item.product}
              onChange={(v) =>
                setFood({ ...food, item: { ...food.item, product: v } })
              }
            />
            <Field
              label="Serving Size"
              value={food.item.serving}
              placeholder="e.g. 150 g, 1 cup"
              onChange={(v) =>
                setFood({ ...food, item: { ...food.item, serving: v } })
              }
            />
            <div className="form-grid">
              {nutrients.map((k) => (
                <Field
                  key={k}
                  label={`${k[0].toUpperCase() + k.slice(1)} (${k === "calories" ? "kcal" : "g"})`}
                  type="number"
                  value={food.item[k]}
                  onChange={(v) =>
                    setFood({ ...food, item: { ...food.item, [k]: v } })
                  }
                />
              ))}
            </div>
            <Button type="submit" className="full-width">
              Save food item <Check size={16} />
            </Button>
          </form>
        </Sheet>
      )}
    </>
  );
}
