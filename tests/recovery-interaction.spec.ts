import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 900 }, hasTouch: true });

test('tap a bar for its value and date; dismiss outside without opening details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
  const card = page.getByRole('article', { name: 'Overall body', exact: true });
  const chart = card.getByRole('group', { name: 'Sample recovery graph' });
  await expect(chart.getByRole('tooltip')).toHaveCount(0);
  const bars = chart.getByRole('button');
  for (const index of [0, 6, 11]) {
    const bar = bars.nth(index);
    await bar.tap();
    await expect(bar).toHaveAttribute('aria-pressed', 'true');
    const popup = chart.getByRole('tooltip');
    await expect(popup).toBeVisible();
    const label = (await bar.getAttribute('aria-label'))!;
    const [date, value] = label.split(': ');
    await expect(popup).toContainText(date);
    await expect(popup).toContainText(value);
    await expect(page).not.toHaveURL(/#health-body$/);
    const popupBounds = (await popup.boundingBox())!, cardBounds = (await card.boundingBox())!;
    expect(popupBounds.x).toBeGreaterThanOrEqual(cardBounds.x);
    expect(popupBounds.x + popupBounds.width).toBeLessThanOrEqual(cardBounds.x + cardBounds.width);
  }
  await page.locator('.journal-heading').tap();
  await expect(chart.getByRole('tooltip')).toHaveCount(0);
  await card.getByRole('link', { name: 'Overall body details' }).click();
  await expect(page).toHaveURL(/#health-body$/);
});

test('keyboard can inspect every reading and close the pop-up with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
  const chart = page.getByRole('group', { name: 'Sample recovery graph' });
  const bars = chart.getByRole('button');
  await bars.last().focus();
  await page.keyboard.press('Home');
  await expect(bars.first()).toBeFocused();
  await expect(chart.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(bars.nth(1)).toBeFocused();
  await expect(bars.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('End');
  await expect(bars.last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(chart.getByRole('tooltip')).toHaveCount(0);
  await expect(bars.last()).toBeFocused();
});
