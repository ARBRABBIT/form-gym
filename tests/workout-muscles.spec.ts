import { test, expect } from "@playwright/test";
import { emptyWorkout, type Workout } from "../src/lib/model";
import { workoutMuscles } from "../src/lib/workout-muscles";

// Keep the demo's upper-body plan stable when the real calendar date changes.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T06:30:00Z'));
});

function workout(name = "Barbell bench press", reps = "10"): Workout {
  return { ...emptyWorkout(), exercises: [{ id: "exercise-1", name, sets: [{ reps, weight: "0" }, { reps, weight: "20" }] }] };
}

test("assigned values alone never count as completed training", () => {
  expect(workoutMuscles(workout()).completedSets).toBe(0);
  expect(workoutMuscles(workout()).muscles).toEqual([]);
});

test("checked sets highlight prime movers and assistants without double counting saved sets", () => {
  const plan = workout();
  const checked = { "exercise-1": [true, false] };
  expect(workoutMuscles(plan, undefined, checked).muscles).toEqual([
    { id: "chest", primarySets: 1, assistingSets: 0 },
    { id: "triceps", primarySets: 0, assistingSets: 1 },
    { id: "front-shoulders", primarySets: 0, assistingSets: 1 },
  ]);
  expect(workoutMuscles(plan, workout(), checked).completedSets).toBe(2);
});

test("zero reps stay neutral, bodyweight reps count, and unknown movements are disclosed", () => {
  expect(workoutMuscles(undefined, workout("Push-up", "0")).completedSets).toBe(0);
  expect(workoutMuscles(undefined, workout("Push-up", "12")).muscles[0].id).toBe("chest");
  const unknown = workoutMuscles(undefined, workout("My custom movement"));
  expect(unknown.muscles).toEqual([]);
  expect(unknown.unmapped).toEqual(["My custom movement"]);
  expect(unknown.completedSets).toBe(2);
});

test("lower-body and isolation variations map to their own muscle families", () => {
  expect(workoutMuscles(undefined, workout("Dumbbell leg curl")).muscles).toEqual([{ id: "hamstrings", primarySets: 2, assistingSets: 0 }]);
  expect(workoutMuscles(undefined, workout("Chest fly")).muscles.some(group => group.id === "triceps")).toBe(false);
  expect(workoutMuscles(undefined, workout("Romanian deadlift")).muscles.filter(group => group.primarySets).map(group => group.id)).toEqual(["hamstrings", "glutes"]);
});

async function openWorkout(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Workout", exact: true }).click();
  await page.getByRole("button", { name: "Show workout muscles", exact: true }).click();
}

test("real 3D model highlights completed training, rotates, and resets when the date changes", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openWorkout(page);
  const card = page.getByRole("region", { name: "Workout muscle map", exact: true });
  const stage = card.locator(".muscle-stage");
  await expect(stage).toHaveAttribute("data-model-state", "ready", { timeout: 45000 });
  await expect(stage).toHaveAttribute("data-surface-detail", "muscle-fibers");
  const manifest = await (await page.request.get('/anatomy/manifest.json')).json();
  expect(manifest.model.author).toContain('Z-Anatomy');
  expect(manifest.model.license).toBe('CC BY-SA 4.0');
  expect(manifest.form.mappedMuscleParts).toBeGreaterThan(100);
  expect(manifest.form.triangles).toBeLessThan(manifest.form.sourceTriangles);
  expect(Number(await stage.getAttribute("data-mesh-count"))).toBe(manifest.form.renderMeshes);
  await expect(card).toHaveAttribute("data-highlight-mode", "planned");
  await expect(card.locator('.muscle-map-total > strong')).toHaveText('0');
  await expect(card.locator('[data-muscle="chest"]')).toContainText('Planned · primary');
  await expect.poll(async () => Number(await stage.getAttribute("data-highlighted-count"))).toBeGreaterThan(0);
  await page.getByRole("checkbox", { name: "Barbell bench press Set 1 complete", exact: true }).check();
  await expect(card).toHaveAttribute("data-highlight-mode", "completed");
  await expect(card.locator('[data-muscle="chest"]')).toContainText("1 set · primary");
  await expect.poll(async () => Number(await stage.getAttribute("data-highlighted-count"))).toBeGreaterThan(0);
  await card.getByRole("button", { name: "Upper body", exact: true }).click();
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-framing', 'upper');
  const muscleParts = manifest.regions.filter((region: { muscle: string }) => ['chest','triceps','front-shoulders'].includes(region.muscle));
  const expectedHighlighted = muscleParts.reduce((count: number, region: { meshNames: string[] }) => count+region.meshNames.length, 0);
  await expect(stage).toHaveAttribute('data-highlighted-count', String(expectedHighlighted));
  const canvas = stage.locator('canvas');
  const canvasBounds = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: canvasBounds.width*.6, y: canvasBounds.height*.42 } });
  await expect(card.locator('[data-muscle="chest"]')).toHaveAttribute('aria-pressed', 'true');
  const beforeZoom = await canvas.screenshot();
  await canvas.hover();
  await page.mouse.wheel(0, -300);
  await page.waitForFunction(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))));
  expect((await canvas.screenshot()).equals(beforeZoom)).toBe(false);
  await card.getByRole("button", { name: "Back", exact: true }).click();
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-view', 'back');
  await card.getByRole("button", { name: "Reset model view", exact: true }).click();
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-view', 'front');
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-framing', 'full');
  await stage.locator('canvas').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-view', 'free');
  await page.keyboard.press('Home');
  await expect(card.locator('.muscle-viewer')).toHaveAttribute('data-view', 'front');
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await card.locator('.muscle-view-controls > button, .muscle-framing-controls > button').all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
  }
  const today = await page.getByLabel('Workout date', { exact: true }).inputValue();
  await page.getByLabel('Workout date', { exact: true }).fill(`${Number(today.slice(0, 4)) - 1}-01-01`);
  await expect(stage).toHaveAttribute("data-highlighted-count", "0");
  await expect(card.locator('.muscle-group-list > button')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("saving actual reps updates the map without requiring completion checkboxes", async ({ page }) => {
  test.setTimeout(60000);
  await openWorkout(page);
  await page.getByRole('button', { name: 'Log my workout', exact: true }).click();
  await page.getByLabel('Barbell bench press Set 1 Reps', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Save workout log', exact: true }).click();
  await expect(page.locator('.muscle-group-list [data-muscle="chest"]')).toContainText('1 set · primary');
  await page.getByLabel('Barbell bench press Set 1 Reps', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Update workout log', exact: true }).click();
  await expect(page.locator('.workout-muscle-card')).toHaveAttribute('data-highlight-mode', 'planned');
  await expect(page.locator('.muscle-map-total > strong')).toHaveText('0');
  await expect(page.locator('.muscle-group-list [data-muscle="chest"]')).toContainText('Planned · primary');
});

test("unavailable WebGL assets leave a usable textual muscle summary", async ({ page }) => {
  await page.route('**/anatomy/male.glb', route => route.abort());
  await openWorkout(page);
  await expect(page.locator('.muscle-stage')).toHaveAttribute('data-model-state', 'unavailable');
  await expect(page.locator('.muscle-viewer-fallback')).toContainText('3D is unavailable');
  await page.getByRole("checkbox", { name: "Barbell bench press Set 1 complete", exact: true }).check();
  await expect(page.locator('.muscle-group-list [data-muscle="chest"]')).toBeVisible();
});

 test("chest and thigh preview highlights the named meshes without recording sets", async ({page}) => {
  test.setTimeout(60000);
  await openWorkout(page);
  await page.getByRole('button',{name:'Preview chest and thighs',exact:true}).click();
  const card=page.getByRole('region',{name:'Workout muscle map',exact:true});
  const stage=card.locator('.muscle-stage');
  await expect(stage).toHaveAttribute('data-model-state','ready',{timeout:45000});
  await expect(card).toHaveAttribute('data-highlight-mode','preview');
  await expect(card.locator('.muscle-map-total > strong')).toHaveText('0');
  await expect(card.locator('.muscle-group-list > button')).toHaveCount(2);
  await expect(card.locator('[data-muscle="chest"]')).toContainText('Preview · primary');
  await expect(card.locator('[data-muscle="quads"]')).toContainText('Preview · primary');
  const manifest=await (await page.request.get('/anatomy/manifest.json')).json();
  const count=manifest.regions.filter((region:{muscle:string})=>['chest','quads'].includes(region.muscle)).reduce((total:number,region:{meshNames:string[]})=>total+region.meshNames.length,0);
  await expect(stage).toHaveAttribute('data-highlighted-count',String(count));
  await page.getByRole('button',{name:'Show workout muscles',exact:true}).click();
  await expect(card).toHaveAttribute('data-highlight-mode','planned');
 });
