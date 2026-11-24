"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Dumbbell,
  LibraryBig,
  Plus,
  Search,
} from "lucide-react";
import type { ScreenProps } from "./journal-app";
import {
  copyWorkoutPlan,
  emptyWorkout,
  uid,
  type Workout,
  type WorkoutTemplate,
} from "@/lib/model";
import { WorkoutEditor } from "./workouts";
import { Button, Field, PageHeading, Section } from "./ui";
export default function WorkoutLibrary({ data, update }: ScreenProps) {
  const templates = data.workoutLibrary || [];
  const [editing, setEditing] = useState(false),
    [id, setId] = useState<string | null>(null),
    [name, setName] = useState(""),
    [draft, setDraft] = useState<Workout>(emptyWorkout),
    [query, setQuery] = useState("");
  const edit = (template?: WorkoutTemplate) => {
    setId(template?.id || null);
    setName(template?.name || "");
    setDraft(template ? structuredClone(template.workout) : emptyWorkout());
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const save = () => {
    if (!name.trim()) return;
    const template: WorkoutTemplate = {
      id: id || uid(),
      name: name.trim(),
      workout: copyWorkoutPlan(draft),
      updatedAt: new Date().toISOString(),
    };
    update(
      (s) => ({
        ...s,
        workoutLibrary: id
          ? (s.workoutLibrary || []).map((t) => (t.id === id ? template : t))
          : [...(s.workoutLibrary || []), template],
      }),
      id
        ? "Workout template updated. Existing assignments are unchanged."
        : "Workout saved to your library.",
    );
    setEditing(false);
  };
  if (editing)
    return (
      <>
        <button className="back-link" onClick={() => setEditing(false)}>
          <ArrowLeft size={16} />
          Back to workout library
        </button>
        <PageHeading
          title={id ? "Edit workout" : "New workout"}
          description="Save a reusable workout for future assignments."
        />
        <Section title="Workout details">
          <Field
            label="Workout name"
            required
            value={name}
            onChange={setName}
            placeholder="e.g. Upper body A"
          />
        </Section>
        <WorkoutEditor draft={draft} setDraft={setDraft} trainer />
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={save}>
            <Check size={16} />
            {id ? "Save template changes" : "Save workout template"}
          </Button>
        </div>
      </>
    );
  const results = templates.filter((t) =>
    `${t.name} ${t.workout.muscle} ${t.workout.exercises.map((e) => e.name).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Workout library"
        description="Your master workouts, ready to use when assigning a session."
        action={
          <Button onClick={() => edit()}>
            <Plus size={17} />
            New workout
          </Button>
        }
      />
      <div className="library-note">
        <span className="assignment-library-icon">
          <LibraryBig size={23} />
        </span>
        <div>
          <strong>
            {templates.length} saved{" "}
            {templates.length === 1 ? "workout" : "workouts"}
          </strong>
          <p>
            Build once, reuse in assignments. Each assigned workout is saved as
            an independent copy.
          </p>
        </div>
      </div>
      <Section
        title="Saved workouts"
        action={<span className="muted">Master data</span>}
      >
        <label className="search-field library-search">
          <Search size={17} />
          <input
            aria-label="Search saved workouts"
            placeholder="Search workouts or exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {!templates.length ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Dumbbell size={30} />
            </span>
            <h3>No saved workouts yet</h3>
            <p>
              Add a workout with its exercises, sets and instructions. Your
              trainer can select it when creating an assignment.
            </p>
            <Button onClick={() => edit()}>
              <Plus size={16} />
              Create your first workout
            </Button>
          </div>
        ) : !results.length ? (
          <p className="empty-state">
            No workouts match “{query}”. Try a different name.
          </p>
        ) : (
          <div className="workout-library-list">
            {results.map((t) => (
              <button
                className="workout-library-row"
                aria-label={`Edit ${t.name}`}
                key={t.id}
                onClick={() => edit(t)}
              >
                <span className="library-workout-icon">
                  <Dumbbell size={22} />
                </span>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.workout.muscle || "General workout"}</span>
                  <p>
                    {t.workout.exercises
                      .map((e) => e.name)
                      .filter(Boolean)
                      .join(" · ") || "No exercises added"}
                  </p>
                </div>
                <span className="library-workout-count">
                  {t.workout.exercises.length}{" "}
                  {t.workout.exercises.length === 1 ? "exercise" : "exercises"}
                </span>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
