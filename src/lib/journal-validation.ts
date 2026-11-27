import type { Store } from "./model";
type Check = (value: unknown) => boolean;
const text: Check = (v) => typeof v === "string";
const number: Check = (v) => typeof v === "number" && Number.isFinite(v);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const record =
  (check: Check): Check =>
  (v) =>
    object(v) &&
    Object.entries(v).every(
      ([k, value]) =>
        !["__proto__", "constructor", "prototype"].includes(k) && check(value),
    );
const array =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.length <= 20000 && v.every(check);
const fields =
  (checks: Record<string, Check>): Check =>
  (v) =>
    object(v) && Object.entries(checks).every(([key, check]) => check(v[key]));
const strings = record(text);
const set = fields({ reps: text, weight: text });
const exercise = fields({ id: text, name: text, sets: array(set) });
const cardio = fields({
  id: text,
  type: text,
  time: text,
  distance: text,
  calories: text,
});
const workout: Check = (v) =>
  fields({
    muscle: text,
    warmup: text,
    cooldown: text,
    notes: text,
    exercises: array(exercise),
    cardio: array(cardio),
    start: text,
    finish: text,
    total: text,
    satisfaction: number,
    version: number,
  })(v) &&
  (!object(v) ||
    v.planSnapshot === undefined ||
    fields({ muscle: text, exercises: array(exercise), cardio: array(cardio) })(
      v.planSnapshot,
    ));
const food = fields({
  id: text,
  product: text,
  serving: text,
  calories: text,
  protein: text,
  carbs: text,
  fat: text,
});
const checks: Record<string, Check> = {
  onboarded: (v) => typeof v === "boolean",
  month: (v) => typeof v === "string" && /^\d{4}-\d{2}$/.test(v),
  profile: strings,
  goalsByMonth: record(array(text)),
  habits: array(fields({ id: text, name: text, marks: array(text) })),
  planner: strings,
  challenge: array(
    (v) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 100,
  ),
  challengeTarget: text,
  challengeNote: text,
  weights: array(
    fields({
      id: text,
      date: text,
      weight: text,
      gain: text,
      loss: text,
      notes: text,
    }),
  ),
  measurements: record(strings),
  resultDates: fields({ now: text, previous: text }),
  before: text,
  after: text,
  reviews: record(strings),
  nutrition: record(
    fields({
      metrics: strings,
      water: (v) => number(v) && Number(v) >= 0,
      meals: record(array(food)),
    }),
  ),
  plans: record(workout),
  logs: record(workout),
};
const optional: Record<string, Check> = {
  baselineMeasurements: strings,
  setCompletions: record(record(array((v) => typeof v === "boolean"))),
  bodyCompositionScans: array(
    fields({
      id: text,
      date: text,
      source: (v) => ["sample", "manual", "inbody"].includes(String(v)),
      weightKg: number,
      bodyFatPercent: number,
    }),
  ),
  workoutLibrary: array(
    fields({ id: text, name: text, workout, updatedAt: text }),
  ),
  wearablePreference: (v) => ["whoop", "none"].includes(String(v)),
  smartWaterBottle: fields({
    name: text,
    brand: text,
    status: (v) => v === "pending",
  }),
  reminderPreferences: fields({
    enabled: (v) => typeof v === "boolean",
    time: text,
    timezone: text,
    tone: text,
  }),
  challengeAccepted: (v) => typeof v === "boolean",
  onboardingDraft: (v) =>
    object(v) &&
    number(v.step) &&
    array(text)(v.goals) &&
    array(fields({ id: text, name: text, marks: array(text) }))(v.habits),
};
export function validJournal(data: unknown): data is Store {
  return (
    object(data) &&
    Object.entries(checks).every(([key, check]) => check(data[key])) &&
    Object.entries(optional).every(
      ([key, check]) => data[key] === undefined || check(data[key]),
    )
  );
}
