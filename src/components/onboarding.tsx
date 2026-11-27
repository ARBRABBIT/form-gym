"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Eye,
  EyeOff,
  Flag,
  Plus,
  Trash2,
} from "./icons";
import { Button, Field } from "./ui";
import DatePicker from "./date-picker";
import WeightDial from "./weight-dial";
import WearableConnect from "./wearable-connect";
import OnboardingIllustration, {
  setupArtwork,
} from "./onboarding-illustration";
import {
  dateKey,
  monthLabel,
  uid,
  type Store,
  type OnboardingDraft,
} from "@/lib/model";
import type { ScreenProps } from "./journal-app";

const suggestedGoals = [
  "Move my body three times a week",
  "Make more time for sleep",
  "Build strength",
  "Take a walk every day",
  "Drink more water",
  "Eat more balanced meals",
];

const suggestedHabits = [
  { name: "Take a daily walk", kind: "build" },
  { name: "Stretch for five minutes", kind: "build" },
  { name: "Read before bed", kind: "build" },
  { name: "Late-night scrolling", kind: "break" },
  { name: "Skipping meals", kind: "break" },
  { name: "Sitting for long stretches", kind: "break" },
] as const;

const steps = [
  "Monthly goals",
  "100-day challenge",
  "Weight tracker",
  "Habit tracker",
  "Connect a wearable",
  "Starting point",
];

export function AccountEntry({
  onEnter,
  onDemo,
}: {
  onEnter: (
    email: string,
    name: string,
    signup: boolean,
    password: string,
    role: "member" | "trainer",
  ) => Promise<void>;
  onDemo: (role: "member" | "trainer") => void;
}) {
  const [signup, setSignup] = useState(true);
  const [accountRole, setAccountRole] = useState<"member" | "trainer">(
    "member",
  );
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="welcome-shell">
      <header className="welcome-header">
        <span className="wordmark">form.</span>
        <span>Your daily practice</span>
      </header>
      <main className="account-layout">
        <section className="welcome-story">
          <div className="account-story-heading">
            <h1>
              A little effort. <br />A little progress. <br />
              All yours.
            </h1>
            <OnboardingIllustration variant={signup ? "signup" : "login"} />
          </div>
          <p>
            A place for your goals, your habits, and every small win along the
            way.
          </p>
          <div className="welcome-preview">
            <span>
              <Check size={16} /> A goal to work towards
            </span>
            <span>
              <Check size={16} /> A habit worth keeping
            </span>
            <span>
              <Check size={16} /> Your first day, celebrated
            </span>
          </div>
          <span className="welcome-signoff">
            Start where you are. Grow from here.
          </span>
        </section>
        <section className="account-form">
          <div className="account-tabs" aria-label="Account access">
            <button
              aria-pressed={signup}
              onClick={() => {
                setSignup(true);
                setError("");
              }}
            >
              Sign up
            </button>
            <button
              aria-pressed={!signup}
              onClick={() => {
                setSignup(false);
                setError("");
              }}
            >
              Log in
            </button>
          </div>
          <div
            className="account-workspace-switch"
            role="group"
            aria-label="Choose workspace"
          >
            {(["member", "trainer"] as const).map((role) => (
              <button
                type="button"
                key={role}
                aria-pressed={accountRole === role}
                onClick={() => {
                  setAccountRole(role);
                  setError("");
                }}
              >
                {role === "member" ? "Member" : "Trainer"}
              </button>
            ))}
          </div>
          <h2>
            {signup
              ? accountRole === "trainer"
                ? "Create your trainer account."
                : "Your next chapter starts here."
              : "Good to have you back."}
          </h2>
          <p>
            {signup
              ? "Let’s make a little room for you."
              : accountRole === "trainer"
                ? "Open your members and keep coaching."
                : "Open your journal and keep going."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await onEnter(
                  email.trim().toLowerCase(),
                  name.trim(),
                  signup,
                  password,
                  accountRole,
                );
                setPassword("");
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Unable to log in. Try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {signup && (
              <label className="field">
                <span>Your name</span>
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  pattern=".*\S.*"
                />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <div className="password-field">
                <input
                  required
                  minLength={8}
                  aria-label="Password"
                  type={visible ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="full-width">
              {signup ? "Create my journal" : "Log in"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="account-demo-note">
            Create an account to save your journal across devices. Sample access
            below stays separate from your saved records.
          </p>
          <button className="text-link" onClick={() => onDemo(accountRole)}>
            Explore the sample journal <ArrowRight size={15} />
          </button>
        </section>
      </main>
      <footer className="welcome-footer">
        A little more intention. A little more you.
      </footer>
    </div>
  );
}

function makeDraft(data: Store): OnboardingDraft {
  return {
    step: 0,
    goals: Array.from(
      { length: 4 },
      (_, i) => data.goalsByMonth[data.month]?.[i] || "",
    ),
    accepted: data.challenge.length > 0,
    dayOne: data.challenge.includes(1),
    target: data.challengeTarget,
    weight: {
      date: dateKey(),
      weight: data.profile["Starting weight (kg)"] || "",
      gain: "",
      loss: "",
      notes: "",
    },
    habits: data.habits.map((h) => ({ ...h, kind: h.kind || "build" })),
    name: data.profile.Name || "",
    height: data.profile["Height (cm)"] || "",
    goal: data.profile["My Goal"] || "",
  };
}

export default function Onboarding({
  data,
  update,
  navigate,
  onOpenApp,
}: ScreenProps & {
  onOpenApp?: (origin: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}) {
  const draft = data.onboardingDraft || makeDraft(data);
  const { step } = draft;
  const heading = useRef<HTMLHeadingElement>(null);
  const launchButton = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [direction, setDirection] = useState("forward");
  const patch = (values: Partial<OnboardingDraft>) => {
    if (values.step !== undefined && values.step !== step) {
      setDirection(values.step > step ? "forward" : "backward");
      setSaveError("");
    }
    update((s) => ({
      ...s,
      onboardingDraft: { ...(s.onboardingDraft || makeDraft(s)), ...values },
    }));
  };
  useLayoutEffect(() => {
    // Reset before paint so the global smooth-scroll rule cannot move the new step.
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [step, done]);
  const weight = (key: keyof OnboardingDraft["weight"], value: string) =>
    patch({ weight: { ...draft.weight, [key]: value } });
  const complete = () => {
    const next: Store = {
      ...data,
      onboarded: true,
      wearablePreference: draft.wearable || "none",
      onboardingDraft: undefined,
      goalsByMonth: {
        ...data.goalsByMonth,
        [data.month]: draft.goals.map((g) => g.trim()),
      },
      profile: {
        ...data.profile,
        Name: draft.name.trim(),
        "Starting weight (kg)": draft.weight.weight,
        "Height (cm)": draft.height,
        "My Goal": draft.goal,
      },
      habits: draft.habits
        .filter((h) => h.name.trim())
        .map((h) => ({ ...h, name: h.name.trim() })),
      challenge: draft.accepted
        ? [...new Set([...data.challenge, ...(draft.dayOne ? [1] : [])])]
        : data.challenge,
      challengeTarget: draft.target.trim(),
      challengeAccepted: draft.accepted,
      weights: draft.weight.weight
        ? [...data.weights, { ...draft.weight, id: uid() }]
        : data.weights,
      baselineMeasurements: {
        ...data.baselineMeasurements,
        Weight: draft.weight.weight,
      },
      measurements: {
        ...data.measurements,
        [data.month]: {
          ...data.measurements[data.month],
          Weight: draft.weight.weight,
        },
      },
      resultDates: { ...data.resultDates, now: draft.weight.date },
    };
    update(() => next);
    setDone(true);
  };
  return (
    <div className="welcome-shell setup-shell">
      <header className="welcome-header">
        <span className="wordmark">form.</span>
        {!done ? (
          <Button
            variant="ghost"
            onClick={() =>
              step < steps.length - 1 ? patch({ step: step + 1 }) : complete()
            }
          >
            Skip for now
          </Button>
        ) : (
          <span>Made for you</span>
        )}
        {data.onboarded && !done && (
          <Button variant="ghost" onClick={() => navigate("overview")}>
            Close setup
          </Button>
        )}
      </header>
      <div className="setup-layout">
        <aside className="setup-aside">
          <div>
            <h2>
              Small steps.
              <br />A stronger you.
            </h2>
            <p>
              No perfect starting point needed.
              <br />
              Just a little intention.
            </p>
          </div>
          <ol aria-label="Onboarding progress">
            {steps.map((label, i) => (
              <li
                key={label}
                aria-current={!done && i === step ? "step" : undefined}
                className={
                  done || i < step
                    ? "is-complete"
                    : i === step
                      ? "is-current"
                      : ""
                }
              >
                <span>{done || i < step ? <Check size={16} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <p className="setup-aside-foot">Your pace. Your practice.</p>
        </aside>
        <main className="setup-main">
          {done ? (
            <section className="setup-finish">
              <div className="setup-heading">
                <h1 ref={heading} tabIndex={-1}>
                  You’re off to a lovely start
                  {draft.name ? `, ${draft.name.split(" ")[0]}` : ""}.
                </h1>
                <OnboardingIllustration variant="complete" />
              </div>
              <p>
                Your journal is ready. Come back for the little wins. They add
                up.
              </p>
              <dl className="setup-summary">
                <div>
                  <dt>Starting weight</dt>
                  <dd>
                    {draft.weight.weight
                      ? `${draft.weight.weight} kg`
                      : "Add anytime"}
                  </dd>
                </div>
                <div>
                  <dt>Your direction</dt>
                  <dd>{draft.goal || "Find it as you go"}</dd>
                </div>
                <div>
                  <dt>100-day challenge</dt>
                  <dd>
                    {draft.accepted
                      ? draft.dayOne
                        ? "Day 1, checked!"
                        : "Challenge accepted"
                      : "Join anytime"}
                  </dd>
                </div>
                <div>
                  <dt>Habits to track</dt>
                  <dd>{draft.habits.filter((h) => h.name.trim()).length}</dd>
                </div>
              </dl>
              <div ref={launchButton} className="setup-launch">
                <Button
                  onClick={() => {
                    const rect = launchButton.current?.getBoundingClientRect();
                    if (onOpenApp && rect)
                      onOpenApp({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    else navigate("overview");
                  }}
                >
                  Go to app <ArrowRight size={18} />
                </Button>
              </div>
            </section>
          ) : (
            <>
              <div className="setup-progress">
                <span>
                  Step {step + 1} of {steps.length}
                </span>
                {step === 2 ? (
                  <span className="setup-weight-date">
                    <DatePicker
                      label="Weight entry date"
                      showValue
                      value={draft.weight.date}
                      onChange={(v) => weight("date", v)}
                    />
                  </span>
                ) : (
                  <span>
                    {step === 0
                      ? "A fresh beginning"
                      : step === 5
                        ? "One last little step"
                        : "You’re making it yours"}
                  </span>
                )}
                <div
                  role="progressbar"
                  aria-label="Setup progress"
                  aria-valuemin={0}
                  aria-valuemax={steps.length}
                  aria-valuenow={step + 1}
                >
                  <span
                    style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  >
                    <Dumbbell
                      className="setup-progress-icon"
                      size={24}
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
              <section
                key={step}
                className={`setup-step setup-step-${direction}`}
              >
                <div className="setup-heading">
                  <h1 ref={heading} tabIndex={-1}>
                    {
                      [
                        "What would make this month feel good?",
                        "A hundred days. One day at a time.",
                        "Let’s find your starting weight.",
                        "Make room for better habits.",
                        "A little more in sync.",
                        "Your starting point. Your story.",
                      ][step]
                    }
                  </h1>
                  <OnboardingIllustration
                    variant={setupArtwork[step]}
                    weight={draft.weight.weight}
                  />
                </div>
                <p className="setup-description">
                  {
                    [
                      "Pick up to four goals for " +
                        monthLabel(data.month) +
                        ". Choose a few below or write your own. This is completely optional.",
                      "Choose something you want to show up for. Every checkmark is a little promise kept.",
                      "An approximate weight is absolutely fine. This is a starting point, not a judgement.",
                      "Choose a habit to build or one to break. Pick a few below, or add your own.",
                      "Connect WHOOP for a fuller picture of your health. This is optional — your journal works beautifully on its own, too.",
                      "A few details to help you see how far you’ll go. You can update them in Starting point & results anytime.",
                    ][step]
                  }
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (step === 5) {
                      if (!draft.name.trim()) {
                        setSaveError(
                          "Please add your name to make this journal yours.",
                        );
                        return;
                      }
                      complete();
                    } else patch({ step: step + 1 });
                  }}
                >
                  {step === 0 && (
                    <div className="setup-goals">
                      <fieldset className="setup-goal-options">
                        <legend>What would you like to focus on?</legend>
                        {suggestedGoals.map((goal) => {
                          const selected = draft.goals.includes(goal);
                          const full =
                            draft.goals.filter((g) => g.trim()).length >= 4;
                          return (
                            <label
                              className={`setup-goal-option${selected ? " selected" : ""}`}
                              key={goal}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!selected && full}
                                onChange={() =>
                                  patch({
                                    goals: selected
                                      ? draft.goals.map((g) =>
                                          g === goal ? "" : g,
                                        )
                                      : draft.goals.map((g, i) =>
                                          i ===
                                          draft.goals.findIndex(
                                            (g) => !g.trim(),
                                          )
                                            ? goal
                                            : g,
                                        ),
                                  })
                                }
                              />
                              <span>{goal}</span>
                            </label>
                          );
                        })}
                      </fieldset>
                      <p className="setup-goal-count" role="status">
                        {draft.goals.filter((g) => g.trim()).length} of 4
                        selected
                        {draft.goals.every((g) => g.trim()) &&
                          " · Remove a goal to choose another."}
                      </p>
                      <div className="setup-custom-goals">
                        {draft.goals.map((goal, i) => {
                          if (
                            suggestedGoals.includes(goal) ||
                            (!goal.trim() &&
                              i !== draft.goals.findIndex((g) => !g.trim()))
                          )
                            return null;
                          return (
                            <div className="setup-custom-goal" key={i}>
                              <Field
                                label={`Custom goal ${i + 1}`}
                                value={goal}
                                placeholder="e.g. Feel stronger on the stairs"
                                onChange={(value) =>
                                  patch({
                                    goals: draft.goals.map((g, j) =>
                                      i === j ? value : g,
                                    ),
                                  })
                                }
                              />
                              {goal.trim() && (
                                <button
                                  type="button"
                                  className="setup-goal-remove"
                                  aria-label={`Remove custom goal ${i + 1}`}
                                  onClick={() =>
                                    patch({
                                      goals: draft.goals.map((g, j) =>
                                        i === j ? "" : g,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 size={17} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <>
                      {draft.goals.some((goal) => goal.trim()) && (
                        <fieldset className="setup-goal-options setup-challenge-goals">
                          <legend>
                            Your monthly goals · Pick one for your challenge
                          </legend>
                          {draft.goals
                            .filter((goal) => goal.trim())
                            .map((goal, i) => (
                              <label
                                className={`setup-goal-option${draft.target === goal.trim() ? " selected" : ""}`}
                                key={i}
                              >
                                <input
                                  type="radio"
                                  name="challenge-goal"
                                  checked={draft.target === goal.trim()}
                                  onChange={() =>
                                    patch({ target: goal.trim() })
                                  }
                                />
                                <span>{goal.trim()}</span>
                              </label>
                            ))}
                        </fieldset>
                      )}
                      <Field
                        label="My 100-day intention"
                        value={draft.target}
                        onChange={(v) => patch({ target: v })}
                        placeholder="e.g. Move for 20 minutes each day"
                      />
                      <div className="challenge-invitation">
                        <Flag size={24} />
                        <div>
                          <strong>Consistency over perfection.</strong>
                          <p>
                            One small action, repeated. Start today and see
                            where it takes you.
                          </p>
                        </div>
                      </div>
                      <label className="setup-check">
                        <input
                          type="checkbox"
                          checked={draft.accepted}
                          onChange={(e) =>
                            patch({
                              accepted: e.target.checked,
                              dayOne: e.target.checked && draft.dayOne,
                            })
                          }
                        />
                        <span>I accept the 100-day challenge</span>
                      </label>
                      <label
                        className={`setup-day-one ${draft.accepted ? "" : "is-disabled"}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!draft.accepted}
                          checked={draft.dayOne}
                          onChange={(e) => patch({ dayOne: e.target.checked })}
                        />
                        <span>
                          <strong>Day 1</strong>
                          <small>
                            {draft.dayOne
                              ? "Your first little win. Look at you go!"
                              : "Check it off when you’ve done your first day."}
                          </small>
                        </span>
                        <span className="day-one-number" aria-hidden="true">
                          01
                        </span>
                      </label>
                      <p className="helper">
                        You can join the challenge later, too.
                      </p>
                    </>
                  )}
                  {step === 2 && (
                    <WeightDial
                      value={draft.weight.weight}
                      onChange={(v) => weight("weight", v)}
                    />
                  )}
                  {step === 3 && (
                    <>
                      <div className="setup-habit-suggestions">
                        {(["build", "break"] as const).map((kind) => (
                          <fieldset className="setup-goal-options" key={kind}>
                            <legend>
                              {kind === "build"
                                ? "Habits to build"
                                : "Habits to break"}
                            </legend>
                            {suggestedHabits
                              .filter((habit) => habit.kind === kind)
                              .map((habit) => {
                                const selected = draft.habits.some(
                                  (h) =>
                                    h.name === habit.name && h.kind === kind,
                                );
                                return (
                                  <label
                                    className={`setup-goal-option${selected ? " selected" : ""}`}
                                    key={habit.name}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() =>
                                        patch({
                                          habits: selected
                                            ? draft.habits.filter(
                                                (h) =>
                                                  !(
                                                    h.name === habit.name &&
                                                    h.kind === kind
                                                  ),
                                              )
                                            : [
                                                ...draft.habits,
                                                {
                                                  id: uid(),
                                                  ...habit,
                                                  marks: [],
                                                },
                                              ],
                                        })
                                      }
                                    />
                                    <span>{habit.name}</span>
                                  </label>
                                );
                              })}
                          </fieldset>
                        ))}
                      </div>
                      <div className="setup-habits">
                        {draft.habits.map((h, i) =>
                          suggestedHabits.some(
                            (habit) =>
                              habit.name === h.name && habit.kind === h.kind,
                          ) ? null : (
                            <div className="setup-habit" key={h.id}>
                              <Field
                                label={`Habit ${i + 1}`}
                                value={h.name}
                                onChange={(v) =>
                                  patch({
                                    habits: draft.habits.map((a) =>
                                      a.id === h.id ? { ...a, name: v } : a,
                                    ),
                                  })
                                }
                                placeholder="e.g. Read before bed / less late-night scrolling"
                              />
                              <div className="habit-row-actions">
                                <fieldset className="habit-kind">
                                  <legend className="sr-only">
                                    Habit {i + 1} direction
                                  </legend>
                                  {(["build", "break"] as const).map((kind) => (
                                    <label
                                      key={kind}
                                      className={
                                        h.kind === kind ? "selected" : ""
                                      }
                                    >
                                      <input
                                        type="radio"
                                        name={`habit-${h.id}`}
                                        checked={h.kind === kind}
                                        onChange={() =>
                                          patch({
                                            habits: draft.habits.map((a) =>
                                              a.id === h.id
                                                ? { ...a, kind }
                                                : a,
                                            ),
                                          })
                                        }
                                      />
                                      {kind === "build"
                                        ? "Good habit to build"
                                        : "Bad habit to break"}
                                    </label>
                                  ))}
                                </fieldset>
                                <button
                                  type="button"
                                  className="icon-button"
                                  aria-label={`Remove habit ${i + 1}`}
                                  onClick={() =>
                                    patch({
                                      habits: draft.habits.filter(
                                        (a) => a.id !== h.id,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          patch({
                            habits: [
                              ...draft.habits,
                              { id: uid(), name: "", kind: "build", marks: [] },
                            ],
                          })
                        }
                      >
                        <Plus size={17} /> Add a habit
                      </Button>
                      <p className="helper">
                        Track a day you practised a good habit or avoided a bad
                        one.
                      </p>
                    </>
                  )}
                  {step === 4 && (
                    <WearableConnect
                      choice={draft.wearable}
                      onSelect={(wearable) => patch({ wearable })}
                      beforeConnect={() => true}
                    />
                  )}
                  {step === 5 && (
                    <>
                      <Field
                        label="Name"
                        required
                        value={draft.name}
                        onChange={(v) => patch({ name: v })}
                      />
                      <div className="form-grid">
                        <Field
                          label="Approximate starting weight (kg)"
                          type="number"
                          min="1"
                          max="700"
                          value={draft.weight.weight}
                          onChange={(v) => weight("weight", v)}
                        />
                        <Field
                          label="Height (cm)"
                          type="number"
                          min="1"
                          max="300"
                          value={draft.height}
                          onChange={(v) => patch({ height: v })}
                        />
                      </div>
                      <fieldset className="setup-weight-goals">
                        <legend>My goal</legend>
                        {["Lose weight", "Gain weight", "Maintain weight"].map(
                          (g) => (
                            <label
                              key={g}
                              className={draft.goal === g ? "selected" : ""}
                            >
                              <input
                                type="radio"
                                name="onboarding-weight-goal"
                                checked={draft.goal === g}
                                onChange={() => patch({ goal: g })}
                              />
                              {g}
                              <Check size={16} aria-hidden="true" />
                            </label>
                          ),
                        )}
                      </fieldset>
                      <p className="helper">
                        Your weight and height are optional. Progress has more
                        than one measure.
                      </p>
                    </>
                  )}
                  {saveError && (
                    <p role="alert" className="account-error">
                      {saveError}
                    </p>
                  )}
                  <div className="setup-actions">
                    <Button
                      variant="ghost"
                      disabled={step === 0}
                      onClick={() => patch({ step: step - 1 })}
                    >
                      <ArrowLeft size={16} />
                      Back
                    </Button>
                    <div>
                      <Button type="submit">
                        {step === 5 ? "Make it mine" : "Continue"}
                        {step === 5 ? (
                          <Check size={17} />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </section>
            </>
          )}
        </main>
      </div>
      <footer className="welcome-footer">
        A little progress is still progress.
      </footer>
    </div>
  );
}
