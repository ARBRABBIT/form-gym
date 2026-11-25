import { test, expect } from "@playwright/test";

async function openWater(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Open water tracker', exact: true }).click();
  await expect(page).toHaveURL(/#water$/);
}

async function openNutrition(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Back to journal', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Food', exact: true }).click();
}

test('water servings, adjustments and nutrition share the same daily total', async ({ page }) => {
  await openWater(page);
  const amount = page.getByLabel('Water consumed in ounces');
  const start = Number(await amount.innerText());
  await page.getByRole('button', { name: 'Log glass, 8 ounces', exact: true }).click();
  await expect(amount).toHaveText(String(start + 8));
  await page.getByRole('button', { name: 'Select mug, 12 ounces', exact: true }).click();
  await expect(amount).toHaveText(String(start + 8));
  await page.getByRole('button', { name: 'Add 12 ounces', exact: true }).click();
  await expect(amount).toHaveText(String(start + 20));
  await page.getByRole('button', { name: 'Remove 12 ounces', exact: true }).click();
  await expect(amount).toHaveText(String(start + 8));
  await openNutrition(page);
  await expect(page.locator('.water-entry')).toContainText('2.49 L logged');
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Open water tracker', exact: true }).click();
  await expect(amount).toHaveText(String(start + 8));
  await page.getByRole('button', { name: 'Back to journal', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Water intake', exact: true })).toContainText('2.49');
});

test('water screen remains usable at narrow phone and desktop sizes', async ({ page }) => {
  await openWater(page);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const screen = page.getByRole('region', { name: 'Water tracker', exact: true });
    await expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.water-serving-add, .water-amount-button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Water navigation' })).toHaveCount(0);
  }
});

test('water entries stay date-specific and cannot fall below zero', async ({ page }) => {
  await openWater(page);
  const initialDate = (await page.getByLabel('Water date', { exact: true }).getAttribute('data-date'))!;
  const initial = await page.getByLabel('Water consumed in ounces').innerText();
  const emptyDate = `${Number(initialDate.slice(0, 4)) - 1}-01-01`;
  await openNutrition(page);
  await page.getByLabel('Journal date', { exact: true }).fill(emptyDate);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Open water tracker', exact: true }).click();
  await expect(page.getByLabel('Water consumed in ounces')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Remove 8 ounces', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Log bottle, 16 ounces', exact: true }).click();
  await expect(page.getByLabel('Water consumed in ounces')).toHaveText('16');
  await page.getByRole('button', { name: 'Remove 16 ounces', exact: true }).click();
  await expect(page.getByLabel('Water consumed in ounces')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Remove 16 ounces', exact: true })).toBeDisabled();
  await openNutrition(page);
  await page.getByLabel('Journal date', { exact: true }).fill(initialDate);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Open water tracker', exact: true }).click();
  await expect(page.getByLabel('Water consumed in ounces')).toHaveText(initial);
});
