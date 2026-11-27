"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Dumbbell,
  FileCheck2,
  Plus,
  Trash2,
} from "./icons";
import type { ScreenProps } from "./journal-app";
import {
  emptyWorkout,
  makeExercise,
  formatDate,
  uid,
  type Workout,
  type Exercise,
  type SetCompletions,
} from "@/lib/model";
import { Button, Field, TextArea, Section, PageHeading, AddButton } from "./ui";
import WorkoutTemplatePicker from "./workout-template-picker";
import { playFeedback, cancelFeedback } from "@/lib/interaction-feedback";
import WorkoutMuscleModel from "./workout-muscle-model";
import {NutritionPlanEditor,CoachingThread,workspace} from "./member-studio";
import {useUnsavedGuard} from "./workflow-ui";
import {requestWorkflowNavigation} from "@/lib/workflow-navigation";
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
export function WorkoutScreen(p: ScreenProps & { onSaved?: () => void }) {
  const { data, date, setDate, update } = p;
  const key = `alex:${date}`,
    plan = data.plans[key],
    saved = data.logs[key];
  const [tab, setTab] = useState(p.trainerMode ? "log" : "plan"),
    [draft, setDraft] = useState<Workout>(() =>
      saved ? structuredClone(saved) : newActual(plan),
    ),
    [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const draftDate = useRef(date);
  useEffect(() => {
    if (draftDate.current !== date) {
      draftDate.current = date;
      setDirty(false);
      setRemoteChanged(false);
      setDraft(saved ? structuredClone(saved) : newActual(plan));
      return;
    }
    if (dirty) setRemoteChanged(true);
    else setDraft(saved ? structuredClone(saved) : newActual(plan));
  }, [date, JSON.stringify(saved)]);
  const unsavedWorkout = useUnsavedGuard(dirty && JSON.stringify(draft) !== JSON.stringify(saved ?? newActual(plan)));
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
    if (remoteChanged) return;
    setSaving(true);
    setDirty(false);
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
              draft.planSnapshot || (plan ? structuredClone(plan) : undefined),
          },
        },
      }),
      "Workout log saved. Your trainer can now review it.",
    );
    setSaving(false);
    p.onSaved?.();
  };
  return (
    <>
      {unsavedWorkout}
      <PageHeading
        title={p.trainerMode ? "Member’s workout log" : "Your workout"}
        description={
          p.trainerMode
            ? "Review and correct the member’s actual session. Edits are shared with the member."
            : "Review your coach’s plan and record your session."
        }
        back={() => p.navigate("overview")}
      />
      {!p.trainerMode && (
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
              {p.trainerMode
                ? "Edit actual log"
                : saved
                  ? "My saved log"
                  : "Log my workout"}
            </button>
          </div>
        </div>
      )}
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
      <WorkoutMuscleModel
        trainerMode={p.trainerMode}
        plan={plan}
        saved={saved}
        completions={data.setCompletions?.[key]}
        date={date}
      />
      {tab === "plan" ? (
        <>
          {plan ? (
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
          {remoteChanged && (
            <div className="info-note" role="alert">
              <p>
                This log changed in the other account while you were editing.
                Your draft is still here.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setDraft(saved ? structuredClone(saved) : newActual(plan));
                  setDirty(false);
                  setRemoteChanged(false);
                }}
              >
                Load saved log
              </Button>
              <Button
                variant="secondary"
                onClick={() => setRemoteChanged(false)}
              >
                Keep my draft
              </Button>
            </div>
          )}
          <WorkoutEditor
            draft={draft}
            setDraft={(next) => {
              setDirty(true);
              setDraft(next);
            }}
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
            <Button disabled={saving || remoteChanged} onClick={save}>
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
/** Assignment editor for the selected member's isolated journal. */
export function Trainer(
  p: ScreenProps & {
    embedded?: boolean;
    editingPage?: boolean;
    onEditRequested?: () => void;
    onCloseEditor?: () => void;
  },
) {
  const { data, update, date, setDate } = p;
  const key = `alex:${date}`,
    plan = data.plans[key],
    log = data.logs[key];
  const [tab, setTab] = useState<"plan" | "log">("plan");
  const [editing, setEditing] = useState(!!p.editingPage);
  const [draft, setDraft] = useState<Workout>(() =>
    plan ? structuredClone(plan) : emptyWorkout(),
  );
  useEffect(() => {
    setEditing(!!p.editingPage);
    setDraft(plan ? structuredClone(plan) : emptyWorkout());
  }, [date, p.editingPage]);
  const unsavedTrainer = useUnsavedGuard(editing && JSON.stringify(draft) !== JSON.stringify(plan ?? emptyWorkout()));
  const beginEdit = () => {
    if (p.onEditRequested) {
      p.onEditRequested();
      return;
    }
    setDraft(plan ? structuredClone(plan) : emptyWorkout());
    setEditing(true);
  };
  const save = () => {
    update(
      (store) => ({
        ...store,
        plans: {
          ...store.plans,
          [key]: {
            ...draft,
            version: (store.plans[key]?.version || 0) + 1,
            savedAt: new Date().toISOString(),
          },
        },
      }),
      "Assigned workout updated. Shared with the member.",
    );
    setEditing(false);
    if (p.editingPage) p.onCloseEditor?.();
  };
  return (
    <>
      {unsavedTrainer}
      <PageHeading
        title="Training plan & actuals"
        description="Adjust the assignment, then compare it with the member’s submitted session."
        action={
          !editing && tab === "plan" ? (
            <Button onClick={beginEdit}>
              <Plus size={16} />
              {plan ? "Edit assignment" : "Assign workout"}
            </Button>
          ) : undefined
        }
      />
      {!p.editingPage && (
        <div className="filter-bar trainer-member-filters">
          <Field
            label="Workout date"
            type="date"
            value={date}
            onChange={(value) => value && setDate(value)}
          />
          <div className="segmented">
            <button
              aria-pressed={tab === "plan"}
              className={tab === "plan" ? "selected" : ""}
              onClick={() => {
                setTab("plan");
                setEditing(false);
              }}
            >
              Assigned plan
            </button>
            <button
              aria-pressed={tab === "log"}
              className={tab === "log" ? "selected" : ""}
              onClick={() => {
                setTab("log");
                setEditing(false);
              }}
            >
              Member’s actual log
            </button>
          </div>
        </div>
      )}
      {editing ? (
        <>
          <WorkoutTemplatePicker
            templates={data.workoutLibrary || []}
            onChoose={setDraft}
            selectedName={draft.templateName}
          />
          <WorkoutEditor draft={draft} setDraft={setDraft} trainer />
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() =>
                p.editingPage ? p.onCloseEditor?.() : setEditing(false)
              }
            >
              Cancel
            </Button>
            <Button onClick={save}>
              Save assignment <Check size={16} />
            </Button>
          </div>
          {log && (
            <p className="helper">
              This updates the assignment. The submitted log keeps its original
              plan snapshot.
            </p>
          )}
        </>
      ) : tab === "plan" ? (
        plan ? (
          <>
            <div className="record-banner">
              <div>
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
          </>
        ) : (
          <Section title="No workout assigned">
            <p className="section-description">
              Create an assignment for this member and date.
            </p>
          </Section>
        )
      ) : log ? (
        <>
          <div className="record-banner">
            <div>
              <strong>MEMBER’S ACTUAL LOG</strong>
              <span>
                Submitted · plan version {log.planVersion || "unassigned"}
              </span>
            </div>
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
            The member has not submitted a session for this date.
          </p>
        </Section>
      )}
      <div className="studio-flows">
        <NutritionPlanEditor key="nutrition-alex" {...p} date={date} memberId="alex" memberName={data.profile.Name || "Member"}/>
        <CoachingThread key={`feedback-alex-${date}`} {...p} date={date} memberId="alex" memberName={data.profile.Name || "Member"} trainer/>
      </div>
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
