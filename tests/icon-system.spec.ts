import { test, expect } from "@playwright/test";

test("rounded interface icons render consistently across journal screens", async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
  for (const label of ['Overview', 'My workouts', 'Workout library', 'Nutrition & wellness', 'Monthly planner', 'Habit tracker', '100-day challenge', 'Weight tracker', 'Starting point & results', 'Monthly review']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.sidebar .nav-item.active')).toContainText(label);
    const icons = page.locator('.app-icon');
    expect(await icons.count()).toBeGreaterThan(5);
    const invalid = await icons.evaluateAll(nodes => nodes.filter(node => {
      const style = getComputedStyle(node);
      return node.getAttribute('data-icon-family') !== 'hugeicons-rounded'
        || node.getAttribute('aria-hidden') !== 'true'
        || !node.children.length
        || style.strokeWidth !== '1.8px';
    }).map(node => node.getAttribute('data-icon')));
    expect(invalid).toEqual([]);
    expect(await page.locator('svg.lucide').count()).toBe(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
  for (const icon of ['House', 'Dumbbell', 'Food', 'User', 'Plus']) {
    await expect(nav.locator(`[data-icon="${icon}"]`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});
