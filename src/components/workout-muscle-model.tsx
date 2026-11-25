"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { formatDate, TODAY, type SetCompletions, type Workout } from "@/lib/model";
import { muscleLabels, workoutMuscles, type MuscleGroup } from "@/lib/workout-muscles";

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
  const visibleMuscles = preview ? planned : activity.muscles;
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const selectedLoad = visibleMuscles.find(group => group.id === selected);
  return <section className="workout-muscle-card" aria-label="Workout muscle map" data-highlight-mode={preview ? "planned" : "completed"}>
    <header className="muscle-map-heading">
      <div><span className="muscle-map-eyebrow">{date === TODAY ? "Today’s workout" : formatDate(date, { month: "short", day: "numeric" })}</span><h2>Your muscles, in motion.</h2></div>
      <span className="muscle-map-badge">{preview ? "Planned focus" : "Interactive 3D"}</span>
    </header>
    <div className="muscle-map-layout">
      <MuscleViewer muscles={visibleMuscles} selected={selectedLoad ? selected : null} onSelect={setSelected} />
      <div className="muscle-map-inspector">
        <div className="muscle-map-total"><strong>{activity.completedSets}</strong><span>completed {activity.completedSets === 1 ? "set" : "sets"}<br />{activity.completedExercises} {activity.completedExercises === 1 ? "exercise" : "exercises"} logged or checked</span></div>
        <p className="muscle-map-description">{preview ? "Showing your planned muscle focus. Complete a set or save reps to update the highlights with the muscles you trained." : activity.muscles.length ? "The muscles behind your completed sets. Tap a group to take a closer look." : "Complete a set or save reps in your workout log to light up the muscles you trained."}</p>
        <div className="muscle-map-key"><span><i />Primary</span><span><i />Assisting</span><span><i />Other muscles</span></div>
        <div className="muscle-group-list" aria-label="Muscle groups" aria-live="polite">
          {visibleMuscles.map(group => <button key={group.id} type="button" aria-pressed={selected === group.id} data-muscle={group.id} data-role={group.primarySets ? "primary" : "assisting"} onClick={() => setSelected(selected === group.id ? null : group.id)}>
            <span>{muscleLabels[group.id]}</span><small>{preview ? "Planned" : `${group.primarySets || group.assistingSets} ${(group.primarySets || group.assistingSets) === 1 ? "set" : "sets"}`} · {group.primarySets ? "primary" : "assisting"}</small>
          </button>)}
        </div>
        {selectedLoad && <p className="muscle-selected-note">{muscleLabels[selectedLoad.id]} · {preview ? "Planned focus" : `${selectedLoad.primarySets} primary sets${selectedLoad.assistingSets > 0 ? ` · ${selectedLoad.assistingSets} assisting sets` : ""}`}</p>}
        {activity.unmapped.length > 0 && <p className="muscle-map-unmapped">No muscle mapping yet for: {activity.unmapped.join(", ")}.</p>}
        <p className="muscle-map-footnote">Approximate anatomical regions, not measured activation or recovery. Green previews planned focus until you record completed sets.</p>
      </div>
    </div>
    <details className="muscle-model-credits"><summary>3D model credits</summary><p>“Male Muscular Anatomy – 3D Model” by <a href="https://sketchfab.com/dakarmirajendra" target="_blank" rel="noreferrer">dakarmirajendra</a>, supplied for this project. <a href="https://sketchfab.com/3d-models/male-muscular-anatomy-3d-model-627f19e053d44e60ad5e4274235b63cb" target="_blank" rel="noreferrer">Original model</a> · <a href="/anatomy/NOTICE.txt" target="_blank" rel="noreferrer">Attribution and processing details</a>. Highlights use approximate anatomical regions because the supplied surface has no individually named muscles.</p></details>
  </section>;
}
