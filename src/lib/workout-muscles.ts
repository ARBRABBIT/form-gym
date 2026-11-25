import type { SetCompletions, Workout } from "./model";

export const muscleLabels = {
  chest: "Chest", "front-shoulders": "Shoulders", "rear-shoulders": "Rear shoulders",
  biceps: "Biceps", triceps: "Triceps", forearms: "Forearms", lats: "Lats",
  traps: "Upper back", "traps-middle": "Mid back", lowerback: "Lower back",
  abdominals: "Abs", obliques: "Obliques", glutes: "Glutes", quads: "Quads",
  hamstrings: "Hamstrings", calves: "Calves", adductors: "Inner thighs", tibialis: "Shins",
} as const;
export type MuscleGroup = keyof typeof muscleLabels;
export type MuscleActivity = { id: MuscleGroup; primarySets: number; assistingSets: number };
type Rule = { match: RegExp; primary: MuscleGroup[]; assisting: MuscleGroup[] };

// Name-based exercise associations, not measurements of activation or recovery.
// Specific variations precede broader movement families. Unrecognized names stay unmapped.
const rules: Rule[] = [
  { match: /(?:reverse|rear delt).*(?:fly|raise)|face pull/, primary: ["rear-shoulders"], assisting: ["traps-middle"] },
  { match: /upright row|lateral raise|side raise/, primary: ["front-shoulders"], assisting: ["traps"] },
  { match: /front raise/, primary: ["front-shoulders"], assisting: [] },
  { match: /(?:shoulder|overhead|military|arnold).?press/, primary: ["front-shoulders"], assisting: ["triceps"] },
  { match: /pec.?deck|chest.?fl(?:y|ies)|cable crossover/, primary: ["chest"], assisting: ["front-shoulders"] },
  { match: /bench.?press|chest.?press|push.?up/, primary: ["chest"], assisting: ["triceps", "front-shoulders"] },
  { match: /pull.?up|chin.?up|pull.?down|pullover/, primary: ["lats"], assisting: ["biceps", "traps-middle"] },
  { match: /\brow\b|\brows\b/, primary: ["traps-middle", "lats"], assisting: ["biceps", "rear-shoulders"] },
  { match: /tricep|push.?down|skull.?crusher|\bdips?\b/, primary: ["triceps"], assisting: [] },
  { match: /(?:bicep|hammer|preacher|concentration).*curl|\b(?:barbell|dumbbell|cable) (?:alternating |seated |standing |incline |supinating )?curl/, primary: ["biceps"], assisting: ["forearms"] },
  { match: /wrist.?curl|reverse.?curl|farmer.?s?.?(?:walk|carry)/, primary: ["forearms"], assisting: [] },
  { match: /romanian.*deadlift|\brdl\b|stiff.?leg.*deadlift|good.?morning/, primary: ["hamstrings", "glutes"], assisting: ["lowerback"] },
  { match: /deadlift/, primary: ["glutes", "hamstrings", "lowerback"], assisting: ["quads", "forearms"] },
  { match: /squat|leg.?press|lunge|split.?squat|step.?up/, primary: ["quads", "glutes"], assisting: ["adductors"] },
  { match: /leg.?extension/, primary: ["quads"], assisting: [] },
  { match: /leg.?curl|hamstring.?curl|nordic/, primary: ["hamstrings"], assisting: [] },
  { match: /hip.?thrust|glute.?bridge|glute.?kickback/, primary: ["glutes"], assisting: ["hamstrings"] },
  { match: /calf.?raise|calves|heel.?raise/, primary: ["calves"], assisting: [] },
  { match: /tibialis|toe.?raise/, primary: ["tibialis"], assisting: [] },
  { match: /adductor|hip.?adduction/, primary: ["adductors"], assisting: [] },
  { match: /side.?plank|russian.?twist|wood.?chop|side.?bend/, primary: ["obliques"], assisting: ["abdominals"] },
  { match: /crunch|sit.?up|plank|leg.?raise|ab.?wheel|dead.?bug/, primary: ["abdominals"], assisting: ["obliques"] },
  { match: /back.?extension|hyperextension/, primary: ["lowerback"], assisting: ["glutes", "hamstrings"] },
  { match: /shrug/, primary: ["traps"], assisting: [] },
];

export function workoutMuscles(plan?: Workout, saved?: Workout, completions: SetCompletions = {}) {
  const exercises = new Map((plan?.exercises ?? saved?.planSnapshot?.exercises ?? []).map(exercise => [exercise.id, exercise]));
  saved?.exercises.forEach(exercise => exercises.set(exercise.id, exercise));
  const groups = new Map<MuscleGroup, MuscleActivity>();
  let completedSets = 0;
  let completedExercises = 0;
  const unmapped: string[] = [];
  for (const exercise of exercises.values()) {
    const actual = saved?.exercises.find(entry => entry.id === exercise.id);
    const checked = completions[exercise.id] ?? [];
    const indexes = new Set(checked.flatMap((complete, index) => complete ? [index] : []));
    actual?.sets.forEach((entry, index) => {
      if (Number.isFinite(Number(entry.reps)) && Number(entry.reps) > 0) indexes.add(index);
    });
    if (!indexes.size) continue;
    completedSets += indexes.size;
    completedExercises++;
    const rule = rules.find(rule => rule.match.test(exercise.name.toLowerCase().replace(/[-_]/g, " ")));
    if (!rule) { unmapped.push(exercise.name || "Unnamed exercise"); continue; }
    for (const [role, ids] of [["primarySets", rule.primary], ["assistingSets", rule.assisting]] as const) {
      for (const id of ids) {
        const group = groups.get(id) ?? { id, primarySets: 0, assistingSets: 0 };
        group[role] += indexes.size;
        groups.set(id, group);
      }
    }
  }
  return { muscles: [...groups.values()].sort((a, b) => b.primarySets - a.primarySets || b.assistingSets - a.assistingSets), completedSets, completedExercises, unmapped };
}
