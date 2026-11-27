"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  GlassWater,
  Dumbbell,
  FileCheck2,
  Leaf,
  Plus,
  Search,
  Trash2,
  Users,
} from "./icons";
import type { ScreenProps } from "./journal-app";
import {
  TODAY,
  members,
  emptyWorkout,
  emptyNutrition,
  totalNutrition,
  meals,
  makeExercise,
  formatDate,
  uid,
  type Workout,
  type Exercise,
  type SetCompletions,
  type Nutrition,
  type Food,
  type Store,
} from "@/lib/model";
import {
  Button,
  Field,
  TextArea,
  Section,
  PageHeading,
  AddButton,
  Sheet,
} from "./ui";
import WorkoutTemplatePicker from "./workout-template-picker";
import { playFeedback, cancelFeedback } from "@/lib/interaction-feedback";
import WorkoutMuscleModel from "./workout-muscle-model";
function newActual(plan?: Workout): Workout {
  return {
    ...emptyWorkout(),
    muscle: plan?.muscle || "",
    exercises:
      plan?.exercises.map((e) => ({
        ...e,
        sets: e.sets.map(() => ({ reps: "", weight: "" })),
      })) || [],
    cardio:
      plan?.cardio.map((c) => ({
        ...c,
        time: "",
        distance: "",
        calories: "",
      })) || [],
    planVersion: plan?.version,
    planSnapshot: plan ? structuredClone(plan) : undefined,
  };
}
export function WorkoutScreen(p: ScreenProps) {
  const { data, date, setDate, update } = p;
  const key = `alex:${date}`,
    plan = data.plans[key],
    saved = data.logs[key];
  const [tab, setTab] = useState("plan"),
    [draft, setDraft] = useState<Workout>(() =>
      saved ? structuredClone(saved) : newActual(plan),
    ),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    setDraft(saved ? structuredClone(saved) : newActual(plan));
  }, [date, saved]);
  const toggleSet = (
    exerciseId: string,
    setIndex: number,
    complete: boolean,
  ) => {
    update((s) => ({
      ...s,
      setCompletions: {
        ...s.setCompletions,
        [key]: {
          ...s.setCompletions?.[key],
          [exerciseId]: Array.from({ length: 6 }, (_, i) =>
            i === setIndex
              ? complete
              : !!s.setCompletions?.[key]?.[exerciseId]?.[i],
          ),
        },
      },
    }));
  };
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      update(
        (s) => ({
          ...s,
          logs: {
            ...s.logs,
            [key]: {
              ...draft,
              version: (saved?.version || 0) + 1,
              savedAt: new Date().toISOString(),
              planVersion: draft.planVersion ?? plan?.version,
              planSnapshot:
                draft.planSnapshot ||
                (plan ? structuredClone(plan) : undefined),
            },
          },
        }),
        "Workout log saved. Your trainer can now review it.",
      );
      setSaving(false);
    }, 400);
  };
  return (
    <>
      <PageHeading
        title="Your workout"
        description="Review your coach’s plan and record your session."
        back={() => p.navigate("overview")}
      />
      <div className="filter-bar">
        <Field
          label="Workout date"
          type="date"
          value={date}
          onChange={(v) => v && setDate(v)}
        />
        <div className="segmented">
          <button
            className={tab === "plan" ? "selected" : ""}
            onClick={() => setTab("plan")}
          >
            Assigned plan
          </button>
          <button
            className={tab === "log" ? "selected" : ""}
            onClick={() => setTab("log")}
          >
            {saved ? "My saved log" : "Log my workout"}
          </button>
        </div>
      </div>
      <div className="weekday-indicator">
        {[
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((d, i) => (
          <span
            className={
              new Date(date + "T12:00:00").getDay() === i ? "selected" : ""
            }
            key={d}
          >
            {d.slice(0, 3)}
          </span>
        ))}
      </div>
      <WorkoutMuscleModel plan={plan} saved={saved} completions={data.setCompletions?.[key]} date={date} />
      {tab === "plan" ? (
        <>
          {plan ? (
            <>
              <div className="record-banner">
                <div>
                  <span className="record-dot" />
                  <strong>TRAINER’S ASSIGNED PLAN</strong>
                  <span>
                    Version {plan.version} · Kabir Mehta
                    {plan.templateName ? ` · ${plan.templateName}` : ""}
                  </span>
                </div>
                <span className="pill">
                  {saved ? "Log submitted" : "Ready when you are"}
                </span>
              </div>
              <WorkoutRead
                workout={plan}
                completions={data.setCompletions?.[key] || {}}
                onToggleSet={toggleSet}
              />
              <div className="form-actions">
                <span>
                  {saved
                    ? "Your submitted entries are kept separately."
                    : "Record how your session actually went."}
                </span>
                <Button onClick={() => setTab("log")}>
                  {saved ? "View my log" : "Start logging"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </>
          ) : (
            <Section title="No workout assigned">
              <p className="section-description">
                There’s no assigned workout for{" "}
                {formatDate(date, { month: "short", day: "numeric" })}. You can
                still record your own session.
              </p>
              <Button onClick={() => setTab("log")}>
                Log my workout <Plus size={16} />
              </Button>
            </Section>
          )}
        </>
      ) : (
        <>
          <div className="record-banner">
            <div>
              <FileCheck2 size={18} />
              <strong>MEMBER’S ACTUAL LOG</strong>
              <span>
                {saved
                  ? "Saved separately from your plan"
                  : "Record your actual performance"}
              </span>
            </div>
            {saved && <span className="pill">Submitted</span>}
          </div>
          {saved && plan && saved.planVersion !== plan.version && (
            <div className="info-note">
              Your trainer has updated the plan to version {plan.version}. Your
              log and its version {saved.planVersion} plan snapshot are
              preserved.
            </div>
          )}
          <WorkoutEditor
            draft={draft}
            setDraft={setDraft}
            plan={draft.planSnapshot || plan}
            completions={data.setCompletions?.[key] || {}}
            onToggleSet={toggleSet}
          />
          <div className="form-actions">
            <span>
              {saved
                ? "Updating your log keeps the original plan snapshot."
                : "Your trainer will see the saved log."}
            </span>
            <Button disabled={saving} onClick={save}>
              {saving
                ? "Saving workout…"
                : saved
                  ? "Update workout log"
                  : "Save workout log"}
              <Check size={16} />
            </Button>
          </div>
        </>
      )}
    </>
  );
}
export function Trainer(p: ScreenProps) {
  const { data, update } = p;
  const [selected, setSelected] = useState(""),
    [date, setDate] = useState(TODAY),
    [editing, setEditing] = useState(false),
    [draft, setDraft] = useState<Workout>(emptyWorkout),
    [query, setQuery] = useState(""),
    [saving, setSaving] = useState(false),
    [tab, setTab] = useState<"plan" | "log" | "nutrition">("plan");
  const member = members.find((m) => m.id === selected),
    key = `${selected}:${date}`,
    plan = data.plans[key],
    log = data.logs[key];
  const memberNutritionKey =
    selected === "alex" ? date : `${selected}:${date}`;
  const memberNutrition =
    data.nutrition[memberNutritionKey] ||
    (selected === "alex" ? data.nutrition[date] : undefined);
  const hasNutrition = Boolean(
    memberNutrition &&
      (memberNutrition.water > 0 ||
        Object.values(memberNutrition.metrics || {}).some(
          (v) => v && v.trim() !== "",
        ) ||
        Object.values(memberNutrition.meals || {}).some(
          (items) => items && items.length > 0,
        )),
  );
  const memberPlanLogDates = Object.keys({ ...data.plans, ...data.logs })
    .filter((k) => k.startsWith(selected + ":"))
    .map((k) => k.split(":")[1]);
  const memberNutritionDates =
    selected === "alex"
      ? Object.keys(data.nutrition)
      : Object.keys(data.nutrition)
          .filter((k) => k.startsWith(selected + ":"))
          .map((k) => k.split(":")[1]);
  const memberDates = Array.from(
    new Set([...memberPlanLogDates, ...memberNutritionDates, TODAY]),
  ).sort();
  const beginEdit = () => {
    setDraft(plan ? structuredClone(plan) : emptyWorkout());
    setEditing(true);
  };
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      update(
        (s) => ({
          ...s,
          plans: {
            ...s.plans,
            [key]: {
              ...draft,
              version: (plan?.version || 0) + 1,
              savedAt: new Date().toISOString(),
            },
          },
        }),
        `Workout ${plan ? "updated" : "assigned"} for ${member?.name}.`,
      );
      setSaving(false);
      setEditing(false);
    }, 400);
  };
  if (!selected)
    return (
      <>
        <PageHeading
          title="Members"
          description="Manage workout assignments and review submitted sessions."
        />
        <div className="trainer-stats">
          <div>
            <Users size={20} />
            <strong>{members.length}</strong>
            <span>Linked members</span>
          </div>
          <div>
            <Dumbbell size={20} />
            <strong>{Object.keys(data.plans).length}</strong>
            <span>Assigned workouts</span>
          </div>
          <div>
            <FileCheck2 size={20} />
            <strong>{Object.keys(data.logs).length}</strong>
            <span>Submitted logs</span>
          </div>
        </div>
        <Section
          title="Your members"
          action={<span className="muted">Workouts & nutrition access</span>}
        >
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search members"
              placeholder="Find a member…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="member-list">
            {members
              .filter((m) =>
                (m.id === "alex" ? data.profile.Name : m.name)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((m) => {
                const count = Object.keys(data.plans).filter((k) =>
                  k.startsWith(m.id + ":"),
                ).length;
                const logs = Object.keys(data.logs).filter((k) =>
                  k.startsWith(m.id + ":"),
                ).length;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelected(m.id);
                      setEditing(false);
                      setDate(TODAY);
                      setTab("plan");
                    }}
                  >
                    <span className="member-avatar">{m.initials}</span>
                    <div>
                      <strong>
                        {m.id === "alex" ? data.profile.Name : m.name}
                      </strong>
                      <span>{m.description}</span>
                    </div>
                    <div className="member-meta">
                      <span>
                        {count} {count === 1 ? "plan" : "plans"} · {logs}{" "}
                        {logs === 1 ? "log" : "logs"}
                      </span>
                      <span className="pill">View workouts</span>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                );
              })}
          </div>
          {!members.some((m) =>
            (m.id === "alex" ? data.profile.Name : m.name)
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && (
            <p className="empty-state">
              No members match “{query}”. Try a different name.
            </p>
          )}
        </Section>
        <div className="trainer-scope">
          <Check size={16} />
          <p>
            Your space connects workout plans, member logs, and daily nutrition & wellness. Other journal
            entries stay in the member’s space.
          </p>
        </div>
      </>
    );
  return (
    <>
      <button
        className="back-link"
        onClick={() => {
          setSelected("");
          setEditing(false);
        }}
      >
        <ArrowLeft size={16} />
        All members
      </button>
      <PageHeading
        title={`${selected === "alex" ? data.profile.Name : member?.name}’s ${tab === "nutrition" ? "nutrition & wellness" : "workouts"}`}
        description={
          tab === "nutrition"
            ? "Meals, daily nutrition totals, and wellness check-in for this member."
            : "Assigned workouts and member logs, organized by date."
        }
        action={
          !editing && tab === "plan" ? (
            <Button onClick={beginEdit}>
              <Plus size={16} />
              {plan ? "Edit assignment" : "Assign workout"}
            </Button>
          ) : undefined
        }
      />
      <div className="filter-bar">
        <Field
          label={tab === "nutrition" ? "Journal date" : "Workout date"}
          type="date"
          value={date}
          onChange={(v) => {
            if (v) {
              setDate(v);
              setEditing(false);
            }
          }}
        />
        <div className="segmented">
          <button
            className={tab === "plan" ? "selected" : ""}
            onClick={() => {
              setTab("plan");
              setEditing(false);
            }}
          >
            Assigned plan
          </button>
          <button
            className={tab === "log" ? "selected" : ""}
            onClick={() => {
              setTab("log");
              setEditing(false);
            }}
          >
            Member’s actual log {log && <Check size={13} />}
          </button>
          <button
            className={tab === "nutrition" ? "selected" : ""}
            onClick={() => {
              setTab("nutrition");
              setEditing(false);
            }}
          >
            Nutrition & wellness {hasNutrition && <Check size={13} />}
          </button>
        </div>
      </div>
      <div className="assignment-dates">
        {memberDates.map((d) => {
          const hasCheck =
            tab === "nutrition"
              ? Boolean(
                  selected === "alex"
                    ? data.nutrition[d]
                    : data.nutrition[`${selected}:${d}`],
                )
              : tab === "log"
                ? Boolean(data.logs[`${selected}:${d}`])
                : Boolean(data.plans[`${selected}:${d}`]);
          return (
            <button
              className={d === date ? "selected" : ""}
              key={d}
              onClick={() => {
                setDate(d);
                setEditing(false);
              }}
            >
              {formatDate(d, { month: "short", day: "numeric" })}
              {hasCheck && <Check size={12} />}
            </button>
          );
        })}
      </div>
      {editing ? (
        <>
          <div className="record-banner">
            <div>
              <Dumbbell size={18} />
              <strong>{plan ? "EDIT ASSIGNMENT" : "NEW ASSIGNMENT"}</strong>
              <span>{formatDate(date)}</span>
            </div>
          </div>
          <WorkoutTemplatePicker
            templates={data.workoutLibrary || []}
            onChoose={setDraft}
            selectedName={draft.templateName}
          />
          <WorkoutEditor draft={draft} setDraft={setDraft} trainer />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving assignment…" : "Save assignment"}
              <Check size={16} />
            </Button>
          </div>
          {log && (
            <p className="helper">
              This update preserves the submitted member log and its original
              plan snapshot.
            </p>
          )}
        </>
      ) : tab === "plan" ? (
        plan ? (
          <>
            <div className="record-banner">
              <div>
                <span className="record-dot" />
                <strong>TRAINER’S ASSIGNED PLAN</strong>
                <span>
                  Version {plan.version}
                  {plan.templateName ? ` · ${plan.templateName}` : ""}
                </span>
              </div>
              <Button variant="ghost" onClick={beginEdit}>
                Edit plan <ArrowUpRight size={16} />
              </Button>
            </div>
            <WorkoutRead
              workout={plan}
              completions={data.setCompletions?.[key] || {}}
            />
            {log && (
              <div className="info-note">
                A member log is linked to this assignment. Open “Member’s actual
                log” to review it.
              </div>
            )}
          </>
        ) : (
          <Section title="No workout assigned">
            <p className="section-description">
              No workout assigned for this date.
            </p>
            <Button onClick={beginEdit}>
              Create assignment <Plus size={16} />
            </Button>
          </Section>
        )
      ) : tab === "log" ? (
        log ? (
          <>
            <div className="record-banner">
              <div>
                <FileCheck2 size={18} />
                <strong>MEMBER’S ACTUAL LOG</strong>
                <span>
                  Submitted · plan version {log.planVersion || "unassigned"}
                </span>
              </div>
              <span className="pill">Saved</span>
            </div>
            <WorkoutRead
              workout={log}
              actual
              completions={data.setCompletions?.[key] || {}}
            />
            {log.planSnapshot && (
              <details className="snapshot">
                <summary>
                  Assigned plan at submission · version {log.planVersion}
                  <ChevronDown size={17} />
                </summary>
                <WorkoutRead workout={log.planSnapshot} />
              </details>
            )}
          </>
        ) : (
          <Section title="No log submitted">
            <p className="section-description">
              No member log has been submitted for this date. Once saved in the
              member view, it appears here.
            </p>
          </Section>
        )
      ) : (
        <TrainerNutritionView
          memberId={selected}
          memberName={
            selected === "alex" ? data.profile.Name : member?.name || "Member"
          }
          date={date}
          data={data}
          update={update}
        />
      )}
    </>
  );
}

function TrainerNutritionView({
  memberId,
  memberName,
  date,
  data,
  update,
}: {
  memberId: string;
  memberName: string;
  date: string;
  data: Store;
  update: (fn: (s: Store) => Store, message?: string) => void;
}) {
  const nutritionKey = memberId === "alex" ? date : `${memberId}:${date}`;
  const n =
    data.nutrition[nutritionKey] ||
    (memberId === "alex" ? data.nutrition[date] : undefined) ||
    emptyNutrition();
  const totals = totalNutrition(n);
  const nutrients = ["calories", "protein", "carbs", "fat"] as const;
  const hasItems = Object.values(n.meals || {}).some(
    (items) => items && items.length > 0,
  );
  const hasMetrics = Object.values(n.metrics || {}).some(
    (v) => v && v.trim() !== "",
  );
  const hasNutrition = Boolean(
    hasItems || hasMetrics || (n.water && n.water > 0),
  );

  const [foodSheet, setFoodSheet] = useState<{
    meal: string;
    item: Food;
  } | null>(null);

  const put = (next: typeof n) => {
    update(
      (s) => ({
        ...s,
        nutrition: {
          ...s.nutrition,
          [nutritionKey]: next,
          ...(memberId === "alex" ? { [date]: next } : {}),
        },
      }),
      "Nutrition updated.",
    );
  };

  return (
    <>
      <div className="record-banner">
        <div>
          <Leaf size={18} />
          <strong>MEMBER’S NUTRITION & WELLNESS</strong>
          <span>
            {formatDate(date, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {hasNutrition ? " · Recorded by member" : " · No entries recorded"}
          </span>
        </div>
        <span className={`pill ${hasNutrition ? "" : "muted"}`}>
          {hasNutrition ? "Logged" : "Not recorded"}
        </span>
      </div>

      {!hasNutrition && (
        <Section title="No nutrition logged">
          <p className="section-description">
            {memberName} has not recorded any meals, water, or wellness metrics
            for this date. Once logged in their journal, it will appear here.
          </p>
        </Section>
      )}

      <Section title="Member’s daily total">
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

      <Section title="Daily check-in">
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
              type="text"
              value={n.metrics[m] || ""}
              onChange={(v) =>
                put({ ...n, metrics: { ...n.metrics, [m]: v } })
              }
            />
          ))}
        </div>
        <div className="water-entry">
          <div>
            <strong>Water</strong>
            <span>{n.water || 0} L logged · 1 mark = 1 L</span>
          </div>
          <div className="water-drops">
            {Array.from({ length: 6 }, (_, i) => (
              <button
                key={i}
                type="button"
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
        const mealItems = n.meals?.[meal] || [];
        const subtotal = totalNutrition({
          ...emptyNutrition(),
          meals: { [meal]: mealItems },
        });
        return (
          <Section
            key={meal}
            title={meal}
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  setFoodSheet({
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
                <Plus size={16} /> Add food
              </Button>
            }
          >
            {mealItems.length === 0 ? (
              <p className="empty-meal">No food items logged.</p>
            ) : (
              mealItems.map((f) => (
                <div className="food-row" key={f.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setFoodSheet({ meal, item: { ...f } })
                    }
                  >
                    <strong>{f.product}</strong>
                    <span>
                      {f.serving || "Serving not recorded"} ·{" "}
                      {f.calories || 0} kcal
                    </span>
                    <small>
                      P {f.protein || 0}g · C {f.carbs || 0}g · F{" "}
                      {f.fat || 0}g
                    </small>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${f.product}`}
                    onClick={() =>
                      put({
                        ...n,
                        meals: {
                          ...n.meals,
                          [meal]: mealItems.filter((a) => a.id !== f.id),
                        },
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            <div className="meal-subtotal">
              <strong>Subtotal</strong>
              <span>{subtotal.calories} kcal</span>
              <span>
                P {subtotal.protein}g · C {subtotal.carbs}g · F{" "}
                {subtotal.fat}g
              </span>
            </div>
          </Section>
        );
      })}

      {foodSheet && (
        <Sheet
          title={`Add to ${foodSheet.meal}`}
          onClose={() => setFoodSheet(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              put({
                ...n,
                meals: {
                  ...n.meals,
                  [foodSheet.meal]: [
                    ...(n.meals[foodSheet.meal] || []).filter(
                      (f) => f.id !== foodSheet.item.id,
                    ),
                    foodSheet.item,
                  ],
                },
              });
              setFoodSheet(null);
            }}
          >
            <Field
              label="Product"
              value={foodSheet.item.product}
              onChange={(v) =>
                setFoodSheet({
                  ...foodSheet,
                  item: { ...foodSheet.item, product: v },
                })
              }
              placeholder="e.g. Scrambled eggs"
              required
            />
            <Field
              label="Serving Size"
              value={foodSheet.item.serving}
              onChange={(v) =>
                setFoodSheet({
                  ...foodSheet,
                  item: { ...foodSheet.item, serving: v },
                })
              }
              placeholder="e.g. 2 eggs or 150 g"
            />
            <div className="form-grid two-col">
              <Field
                label="Calories (kcal)"
                type="number"
                value={foodSheet.item.calories}
                onChange={(v) =>
                  setFoodSheet({
                    ...foodSheet,
                    item: { ...foodSheet.item, calories: v },
                  })
                }
              />
              <Field
                label="Protein (g)"
                type="number"
                value={foodSheet.item.protein}
                onChange={(v) =>
                  setFoodSheet({
                    ...foodSheet,
                    item: { ...foodSheet.item, protein: v },
                  })
                }
              />
              <Field
                label="Carbs (g)"
                type="number"
                value={foodSheet.item.carbs}
                onChange={(v) =>
                  setFoodSheet({
                    ...foodSheet,
                    item: { ...foodSheet.item, carbs: v },
                  })
                }
              />
              <Field
                label="Fat (g)"
                type="number"
                value={foodSheet.item.fat}
                onChange={(v) =>
                  setFoodSheet({
                    ...foodSheet,
                    item: { ...foodSheet.item, fat: v },
                  })
                }
              />
            </div>
            <div className="form-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setFoodSheet(null)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save food item <Check size={16} />
              </Button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
export function WorkoutEditor({
  draft,
  setDraft,
  trainer = false,
  plan,
  completions,
  onToggleSet,
}: {
  draft: Workout;
  setDraft: (w: Workout) => void;
  trainer?: boolean;
  plan?: Workout;
  completions?: SetCompletions;
  onToggleSet?: (
    exerciseId: string,
    setIndex: number,
    complete: boolean,
  ) => void;
}) {
  const patch = (k: keyof Workout, v: string | number) =>
    setDraft({ ...draft, [k]: v });
  const exercisePatch = (id: string, fn: (e: Exercise) => Exercise) =>
    setDraft({
      ...draft,
      exercises: draft.exercises.map((e) => (e.id === id ? fn(e) : e)),
    });
  return (
    <>
      <Section title={trainer ? "Prescribe the session" : "Your session"}>
        {!trainer && (
          <div className="form-grid three-col">
            <Field
              label="Start"
              type="time"
              value={draft.start}
              onChange={(v) => patch("start", v)}
            />
            <Field
              label="Finish"
              type="time"
              value={draft.finish}
              onChange={(v) => patch("finish", v)}
            />
            <Field
              label="Total Time (minutes)"
              type="number"
              value={draft.total}
              onChange={(v) => patch("total", v)}
            />
          </div>
        )}
        <Field
          label="Muscle Group"
          value={draft.muscle}
          onChange={(v) => patch("muscle", v)}
          placeholder="e.g. Upper body strength"
        />
        <div className="form-grid">
          <TextArea
            label="Warm Up"
            value={draft.warmup}
            onChange={(v) => patch("warmup", v)}
            placeholder="How will you ease into this session?"
          />
          <TextArea
            label="Cool Down"
            value={draft.cooldown}
            onChange={(v) => patch("cooldown", v)}
            placeholder="Leave a little room for recovery."
          />
        </div>
      </Section>
      <Section
        title={trainer ? "Planned exercises" : "Exercises & actual sets"}
      >
        {draft.exercises.length === 0 && (
          <p className="empty-state">
            Add the first exercise to build this session.
          </p>
        )}
        {draft.exercises.map((e, i) => (
          <details
            className="exercise-editor"
            key={e.id}
            open={i === 0 ? true : undefined}
          >
            <summary>
              <span className="exercise-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{e.name || "New exercise"}</strong>
                <span>
                  {e.sets.filter((s) => s.reps || s.weight).length} of 6 sets
                  recorded
                </span>
              </div>
              <ChevronDown size={18} />
            </summary>
            <div
              className={`exercise-editor-body ${!trainer ? "has-set-completion" : ""}`}
            >
              <div className="inline-add">
                <Field
                  label="Exercise"
                  value={e.name}
                  onChange={(v) =>
                    exercisePatch(e.id, (a) => ({ ...a, name: v }))
                  }
                  placeholder="Exercise name"
                />
                <button
                  className="icon-button"
                  aria-label={`Remove ${e.name || "exercise"}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      exercises: draft.exercises.filter((a) => a.id !== e.id),
                    })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="sets-heading">
                <span>Set</span>
                <span>{trainer ? "Planned reps" : "Actual reps"}</span>
                <span>
                  {trainer ? "Planned weight (kg)" : "Actual weight (kg)"}
                </span>
              </div>
              {e.sets.map((s, j) => {
                const prescribed = plan?.exercises.find((a) => a.id === e.id)
                  ?.sets[j];
                return (
                  <div className="set-row" key={j}>
                    {!trainer ? (
                      <SetCheckbox
                        exercise={e.name}
                        index={j}
                        checked={!!completions?.[e.id]?.[j]}
                        onChange={(complete) =>
                          onToggleSet?.(e.id, j, complete)
                        }
                      />
                    ) : (
                      <span>Set {j + 1}</span>
                    )}
                    <label>
                      <span className="sr-only">
                        {e.name} Set {j + 1} Reps
                      </span>
                      <input
                        aria-label={`${e.name} Set ${j + 1} Reps`}
                        type="number"
                        min="0"
                        value={s.reps}
                        placeholder={
                          !trainer && prescribed?.reps
                            ? `Plan: ${prescribed.reps}`
                            : "—"
                        }
                        onChange={(event) =>
                          exercisePatch(e.id, (a) => ({
                            ...a,
                            sets: a.sets.map((b, k) =>
                              j === k ? { ...b, reps: event.target.value } : b,
                            ),
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="sr-only">
                        {e.name} Set {j + 1} Weight
                      </span>
                      <input
                        aria-label={`${e.name} Set ${j + 1} Weight`}
                        type="number"
                        min="0"
                        step="any"
                        value={s.weight}
                        placeholder={
                          !trainer && prescribed?.weight
                            ? `Plan: ${prescribed.weight}`
                            : "—"
                        }
                        onChange={(event) =>
                          exercisePatch(e.id, (a) => ({
                            ...a,
                            sets: a.sets.map((b, k) =>
                              j === k
                                ? { ...b, weight: event.target.value }
                                : b,
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
        <AddButton
          onClick={() =>
            setDraft({
              ...draft,
              exercises: [...draft.exercises, makeExercise()],
            })
          }
        >
          Add exercise
        </AddButton>
      </Section>
      <Section title={trainer ? "Planned cardio" : "Actual cardio"}>
        {draft.cardio.map((c, i) => (
          <div className="cardio-entry" key={c.id}>
            <div className="section-heading">
              <h3>Cardio {i + 1}</h3>
              <button
                className="icon-button"
                aria-label={`Remove cardio ${i + 1}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    cardio: draft.cardio.filter((a) => a.id !== c.id),
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="form-grid">
              {(["type", "time", "distance", "calories"] as const).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      type: "Type",
                      time: "Time (minutes)",
                      distance: "Distance (km)",
                      calories: "Calories (kcal)",
                    }[k]
                  }
                  type={k === "type" ? "text" : "number"}
                  value={c[k]}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      cardio: draft.cardio.map((a) =>
                        a.id === c.id ? { ...a, [k]: v } : a,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </div>
        ))}
        <AddButton
          onClick={() =>
            setDraft({
              ...draft,
              cardio: [
                ...draft.cardio,
                { id: uid(), type: "", time: "", distance: "", calories: "" },
              ],
            })
          }
        >
          Add cardio entry
        </AddButton>
      </Section>
      <Section title={trainer ? "Instructions & notes" : "A note on today"}>
        <TextArea
          label="Notes"
          value={draft.notes}
          onChange={(v) => patch("notes", v)}
          placeholder={
            trainer
              ? "A cue, a reminder, a little encouragement…"
              : "How did it feel? What would you do differently?"
          }
        />
        {!trainer && (
          <div className="satisfaction">
            <label htmlFor="satisfaction">
              Workout Satisfaction Rate{" "}
              <strong>
                {draft.satisfaction}
                <span> / 100</span>
              </strong>
            </label>
            <input
              id="satisfaction"
              type="range"
              min="0"
              max="100"
              step="1"
              value={draft.satisfaction}
              onChange={(e) => patch("satisfaction", Number(e.target.value))}
            />
            <div className="range-marks">
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i}>{i * 10}</span>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
function WorkoutRead({
  workout: w,
  actual = false,
  completions,
  onToggleSet,
}: {
  workout: Workout;
  actual?: boolean;
  completions?: SetCompletions;
  onToggleSet?: (
    exerciseId: string,
    setIndex: number,
    complete: boolean,
  ) => void;
}) {
  return (
    <>
      <Section title={w.muscle || "Workout session"}>
        {actual && (
          <div className="session-stats">
            {[
              ["Start", w.start],
              ["Finish", w.finish],
              ["Total Time", w.total ? `${w.total} min` : ""],
            ].map(([label, v]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{v || "Not recorded"}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="read-warmups">
          <div>
            <span>Warm Up</span>
            <p>{w.warmup || "Not recorded"}</p>
          </div>
          <div>
            <span>Cool Down</span>
            <p>{w.cooldown || "Not recorded"}</p>
          </div>
        </div>
      </Section>
      <Section
        title={actual ? "Actual exercises & sets" : "Planned exercises & sets"}
      >
        {completions && (
          <p className="set-completion-hint">
            {onToggleSet
              ? "Check off sets as you finish. Completion updates automatically in your trainer’s view."
              : "Member set completion · updates automatically"}
          </p>
        )}
        {w.exercises.length === 0 && (
          <p className="empty-state">No exercises recorded.</p>
        )}
        {w.exercises.map((e, i) => (
          <details
            key={e.id}
            className="exercise-read"
            open={i === 0 ? true : undefined}
          >
            <summary>
              <span className="exercise-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{e.name || "Unnamed exercise"}</strong>
                <span>
                  {e.sets.filter((s) => s.reps || s.weight).length} sets
                  recorded
                  {completions &&
                    ` · ${e.sets.filter((_, index) => completions[e.id]?.[index]).length} completed`}
                </span>
              </div>
              <ChevronDown size={17} />
            </summary>
            <div
              className={`read-sets ${completions ? "has-set-completion" : ""}`}
            >
              <div className="sets-heading">
                <span>Set</span>
                <span>{actual ? "Actual reps" : "Planned reps"}</span>
                <span>{actual ? "Actual kg" : "Planned kg"}</span>
              </div>
              {e.sets.map((s, j) => (
                <div key={j} className="set-row">
                  {completions ? (
                    <SetCheckbox
                      exercise={e.name}
                      index={j}
                      checked={!!completions[e.id]?.[j]}
                      onChange={
                        onToggleSet
                          ? (complete) => onToggleSet(e.id, j, complete)
                          : undefined
                      }
                    />
                  ) : (
                    <span>Set {j + 1}</span>
                  )}
                  <strong>{s.reps || "—"}</strong>
                  <strong>{s.weight || "—"}</strong>
                </div>
              ))}
            </div>
          </details>
        ))}
      </Section>
      <Section title={actual ? "Actual cardio" : "Planned cardio"}>
        {w.cardio.length ? (
          w.cardio.map((c) => (
            <div className="read-cardio" key={c.id}>
              <strong>{c.type || "Cardio"}</strong>
              <span>
                {c.time || "—"} min · {c.distance || "—"} km ·{" "}
                {c.calories || "—"} kcal
              </span>
            </div>
          ))
        ) : (
          <p className="muted">No cardio recorded.</p>
        )}
      </Section>
      <Section title="Notes">
        <p className="read-notes">{w.notes || "No notes recorded."}</p>
        {actual && (
          <div className="read-satisfaction">
            <span>Workout Satisfaction Rate</span>
            <strong>
              {w.satisfaction}
              <small> / 100</small>
            </strong>
            <div className="progress-track">
              <div style={{ width: `${w.satisfaction}%` }} />
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

function SetCheckbox({
  exercise,
  index,
  checked,
  onChange,
}: {
  exercise: string;
  index: number;
  checked: boolean;
  onChange?: (complete: boolean) => void;
}) {
  return (
    <label className={`set-completion ${checked ? "completed" : ""}`}>
      <span className="set-checkbox-box">
        <input
          type="checkbox"
          aria-label={`${exercise || "Exercise"} Set ${index + 1} complete`}
          checked={checked}
          disabled={!onChange}
          onChange={(event) => {
            const completed = event.target.checked;
            onChange?.(completed);
            const control = event.currentTarget.closest(".set-completion");
            if (completed) playFeedback(control, "complete");
            else cancelFeedback(control);
          }}
        />
        <Check size={14} aria-hidden="true" />
      </span>
      <span>Set {index + 1}</span>
    </label>
  );
}
