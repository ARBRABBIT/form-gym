"use client";
import { useState } from "react";
import { ArrowUpRight, LibraryBig, Search } from "./icons";
import {
  copyWorkoutPlan,
  type Workout,
  type WorkoutTemplate,
} from "@/lib/model";
import { Button, Sheet } from "./ui";
export default function WorkoutTemplatePicker({
  templates,
  onChoose,
  selectedName,
}: {
  templates: WorkoutTemplate[];
  onChoose: (workout: Workout) => void;
  selectedName?: string;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const results = templates.filter((t) =>
    `${t.name} ${t.workout.muscle} ${t.workout.exercises.map((e) => e.name).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="assignment-library">
        <span className="assignment-library-icon">
          <LibraryBig size={22} />
        </span>
        <div>
          <strong>{selectedName || "Use a saved workout"}</strong>
          <p>
            {selectedName
              ? "Copied from your library. You can edit this assignment."
              : templates.length
                ? `${templates.length} ${templates.length === 1 ? "workout" : "workouts"} in your library`
                : "Add reusable workouts in Workout library."}
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={!templates.length}
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
        >
          Choose template
          <ArrowUpRight size={16} />
        </Button>
      </div>
      {open && (
        <Sheet title="Choose a workout" onClose={() => setOpen(false)}>
          <p className="section-description">
            Choose a template to copy into this assignment. It replaces the
            current draft. Existing member logs are kept.
          </p>
          <label className="search-field template-search">
            <Search size={17} />
            <input
              aria-label="Search workout templates"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a workout or exercise…"
            />
          </label>
          <div className="template-pick-list">
            {results.map((t) => (
              <button
                key={t.id}
                className="template-pick-row"
                aria-label={`Use ${t.name}`}
                onClick={() => {
                  onChoose({
                    ...copyWorkoutPlan(t.workout),
                    templateId: t.id,
                    templateName: t.name,
                  });
                  setOpen(false);
                }}
              >
                <div>
                  <strong>{t.name}</strong>
                  <span>
                    {t.workout.muscle || "General workout"} ·{" "}
                    {t.workout.exercises.length}{" "}
                    {t.workout.exercises.length === 1
                      ? "exercise"
                      : "exercises"}
                  </span>
                  <p>
                    {t.workout.exercises
                      .map((e) => e.name)
                      .filter(Boolean)
                      .join(" · ") || "No exercises added"}
                  </p>
                </div>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
          {!results.length && (
            <p className="empty-state">
              No workouts match “{query}”. Try a different name.
            </p>
          )}
        </Sheet>
      )}
    </>
  );
}
