"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { formatDate, TODAY, type SetCompletions, type Workout } from "@/lib/model";
import { muscleLabels, workoutMuscles, type MuscleActivity, type MuscleGroup } from "@/lib/workout-muscles";

// Display-only focus; these preview weights never enter the workout log.
const chestAndThighs: MuscleActivity[] = [
  { id: "chest", primarySets: 1, assistingSets: 0 },
  { id: "quads", primarySets: 1, assistingSets: 0 },
];

const MuscleViewer = dynamic(() => import("./muscle-viewer"), {
  ssr: false,
  loading: () => <div className="muscle-viewer-loading" role="status">Preparing your 3D muscle model…</div>,
});

export default function WorkoutMuscleModel({ plan, saved, completions, date }: { plan?: Workout; saved?: Workout; completions?: SetCompletions; date: string }) {
  const activity = useMemo(() => workoutMuscles(plan, saved, completions), [plan, saved, completions]);
  // Planned focus is a visual preview only; it never updates recorded sets.
  const planned = useMemo(() => workoutMuscles(plan, undefined, Object.fromEntries(
    (plan?.exercises ?? []).map(exercise => [exercise.id, exercise.sets.map(() => true)]),
  )).muscles, [plan]);
  const preview = activity.completedSets === 0 && planned.length > 0;
  const [focusPreview,setFocusPreview] = useState(true);
  const visibleMuscles = focusPreview ? chestAndThighs : preview ? planned : activity.muscles;
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const selectedLoad = visibleMuscles.find(group => group.id === selected);
  return <section className="workout-muscle-card" aria-label="Workout muscle map" data-highlight-mode={focusPreview ? "preview" : preview ? "planned" : "completed"}>
    <header className="muscle-map-heading">
      <div><span className="muscle-map-eyebrow">{date === TODAY ? "Today’s workout" : formatDate(date, { month: "short", day: "numeric" })}</span><h2>Your muscles, in motion.</h2></div>
      <button type="button" className="muscle-map-badge" aria-label={focusPreview ? "Show workout muscles" : "Preview chest and thighs"} onClick={() => {setFocusPreview(!focusPreview);setSelected(null);}}>{focusPreview ? "Workout focus" : "Chest & thighs"}</button>
    </header>
    <div className="muscle-map-layout">
      <MuscleViewer muscles={visibleMuscles} selected={selectedLoad ? selected : null} onSelect={setSelected} />
      <div className="muscle-map-inspector">
        <div className="muscle-map-total"><strong>{activity.completedSets}</strong><span>completed {activity.completedSets === 1 ? "set" : "sets"}<br />{activity.completedExercises} {activity.completedExercises === 1 ? "exercise" : "exercises"} logged or checked</span></div>
        <p className="muscle-map-description">{focusPreview ? "Previewing chest and front thigh muscles in green. Switch to workout focus to see muscles from your session." : preview ? "Showing your planned muscle focus. Complete a set or save reps to update the highlights with the muscles you trained." : activity.muscles.length ? "The muscles behind your completed sets. Tap a group to take a closer look." : "Complete a set or save reps in your workout log to light up the muscles you trained."}</p>
        <div className="muscle-map-key"><span><i />Primary</span><span><i />Assisting</span><span><i />Other muscles</span></div>
        <div className="muscle-group-list" aria-label="Muscle groups" aria-live="polite">
          {visibleMuscles.map(group => <button key={group.id} type="button" aria-pressed={selected === group.id} data-muscle={group.id} data-role={group.primarySets ? "primary" : "assisting"} onClick={() => setSelected(selected === group.id ? null : group.id)}>
            <span>{muscleLabels[group.id]}</span><small>{focusPreview ? "Preview" : preview ? "Planned" : `${group.primarySets || group.assistingSets} ${(group.primarySets || group.assistingSets) === 1 ? "set" : "sets"}`} · {group.primarySets ? "primary" : "assisting"}</small>
          </button>)}
        </div>
        {selectedLoad && <p className="muscle-selected-note">{muscleLabels[selectedLoad.id]} · {focusPreview ? "Visual preview" : preview ? "Planned focus" : `${selectedLoad.primarySets} primary sets${selectedLoad.assistingSets > 0 ? ` · ${selectedLoad.assistingSets} assisting sets` : ""}`}</p>}
        {activity.unmapped.length > 0 && <p className="muscle-map-unmapped">No muscle mapping yet for: {activity.unmapped.join(", ")}.</p>}
        <p className="muscle-map-footnote">Named anatomical muscle parts; highlights show exercise associations, not measured activation or recovery. Green previews planned focus until you record completed sets.</p>
      </div>
    </div>
    <details className="muscle-model-credits"><summary>3D model credits</summary><p><a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a> by Gauthier Kervyn, based on BodyParts3D by Kousaku Okubo / The Database Center for Life Science. Authored muscle parts retain their names and boundaries; tendons stay neutral. Athletic proportions, materials and geometry adapted for Form. Model assets: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> · <a href="/anatomy/NOTICE.txt" target="_blank" rel="noreferrer">Full attribution and modifications</a>.</p></details>
  </section>;
}
