import { test, expect, type Page } from '@playwright/test';

type FeedbackWindow = Window & { feedbackCalls: string[] };
async function openJournal(page: Page, reduced = false) {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await page.addInitScript(() => {
    const calls: string[] = [];
    (window as unknown as FeedbackWindow).feedbackCalls = calls;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function(frames, options) {
      const id = typeof options === 'object' ? (options as KeyframeAnimationOptions).id : undefined;
      if (id?.startsWith('form-')) calls.push(id);
      return animate.call(this, frames, options);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
}
const calls = (page: Page) => page.evaluate(() => (window as unknown as FeedbackWindow).feedbackCalls);

test('water feedback only runs on updates and rapid taps keep the real total', async ({ page }) => {
  await openJournal(page);
  const card = page.getByRole('region', { name: 'Water intake', exact: true });
  const reading = card.locator('.water-card-reading');
  const start = Number((await reading.innerText()).replace('L', '').trim());
  expect(await calls(page)).toEqual([]);
  for (let i = 0; i < 4; i++) await card.getByRole('button', { name: 'Add 250 ml', exact: true }).click();
  await expect(reading).toHaveText(`${start+1} L`);
  await expect.poll(async () => (await calls(page)).filter(id => id === 'form-value-feedback').length).toBe(4);
  expect(await reading.evaluate(el => el.getAnimations().filter(a => a.id === 'form-value-feedback').length)).toBeLessThanOrEqual(1);
  await expect.poll(() => reading.evaluate(el => el.getAnimations().filter(a => a.id === 'form-value-feedback').length)).toBe(0);
  await expect(reading).toHaveAttribute('aria-live', 'polite');
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('repeating a water action gives a fresh confirmation without duplicate logs', async ({ page }) => {
  await openJournal(page);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Open water tracker', exact: true }).click();
  const amount = page.getByLabel('Water consumed in ounces');
  const start = Number(await amount.innerText());
  const add = page.getByRole('button', { name: 'Log glass, 8 ounces', exact: true });
  await add.click();
  await expect(page.locator('.toast')).toContainText('8 oz added');
  await page.locator('.toast').evaluate(el => el.setAttribute('data-first-confirmation', 'true'));
  await add.click();
  await expect(amount).toHaveText(String(start+16));
  await expect(page.locator('.toast')).not.toHaveAttribute('data-first-confirmation');
  await expect(page.locator('.toast')).toHaveCount(1);
  await expect(page.locator('.toast')).toHaveAttribute('aria-atomic', 'true');
});

test('keyboard completion gets one acknowledgment and undo cancels it', async ({ page }) => {
  await openJournal(page);
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Workout', exact: true }).click();
  const checkbox = page.getByRole('checkbox', { name: /Set 1 complete$/ }).first();
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  expect((await calls(page)).filter(id => id === 'form-complete-feedback')).toHaveLength(1);
  await page.keyboard.press('Space');
  await expect(checkbox).not.toBeChecked();
  expect(await checkbox.evaluate(el => el.closest('.set-completion')!.getAnimations().filter(a => a.id === 'form-complete-feedback').length)).toBe(0);
});

test('reduced motion keeps water and navigation fully usable without added motion', async ({ page }) => {
  await openJournal(page, true);
  const card = page.getByRole('region', { name: 'Water intake', exact: true });
  await card.getByRole('button', { name: 'Set water to 3 liters', exact: true }).click();
  await expect(card.locator('.water-card-reading')).toHaveText('3 L');
  expect(await calls(page)).toEqual([]);
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await nav.getByRole('button', { name: 'Profile', exact: true }).click();
  const icon = nav.locator('button.selected > svg');
  expect(await icon.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  const name = page.getByRole('dialog').getByLabel(/^Name/);
  await name.fill('Motion preference check');
  await page.getByRole('dialog').getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('.profile-identity h2')).toHaveText('Motion preference check');
  expect(await page.locator('.toast').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});

test('changing the system motion preference stops value feedback and future animation', async ({ page }) => {
  await openJournal(page);
  const card = page.getByRole('region', { name: 'Water intake', exact: true });
  await card.getByRole('button', { name: 'Add 250 ml', exact: true }).click();
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => card.locator('.water-card-reading').evaluate(el => el.getAnimations().filter(a=>a.id.startsWith('form-')).length)).toBe(0);
  await card.getByRole('button', { name: 'Add 250 ml', exact: true }).click();
  await expect(card.locator('.water-card-reading')).toHaveText('2.75 L');
  expect(await calls(page)).toHaveLength(1);
});
