import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 900 }, hasTouch: true });
async function home(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample journal' }).click();
}

test('blood and lung graph taps show the selected reading without navigating', async ({ page }) => {
  await home(page);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [cardName, graphName, unit] of [['Blood health','Blood oxygen','% SpO₂'],['Lung','Respiratory rate',' /min']]) {
      const card = page.getByRole('article', { name: cardName, exact: true });
      const targets = card.getByRole('group', { name: `${graphName} graph readings`, exact: true }).getByRole('button');
      for (const button of [targets.first(), targets.last()]) {
        await button.tap();
        const popup = page.getByRole('tooltip');
        const label = (await button.getAttribute('aria-label'))!.replace(`${graphName}, `, '');
        const [date, value] = label.split(': ');
        await expect(popup).toHaveText(`${value}${unit}${date}`);
        await expect(button).toHaveAttribute('aria-describedby', (await popup.getAttribute('id'))!);
        await expect(page).not.toHaveURL(/#health-/);
        const box = (await popup.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(8);
        expect(box.x+box.width).toBeLessThanOrEqual(width-8);
        expect(box.y).toBeGreaterThanOrEqual(8);
        expect(box.y+box.height).toBeLessThanOrEqual(1000);
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('tooltip')).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('blood day buttons open a popup and changing week closes stale readings', async ({ page }) => {
  await home(page);
  const card = page.getByRole('article', { name: 'Blood health', exact: true });
  const days = card.getByRole('group', { name: 'Blood oxygen readings', exact: true }).getByRole('button');
  await days.first().tap();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(days.first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tooltip').tap();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page).not.toHaveURL(/#health-/);
  await card.getByRole('button', { name: 'Previous blood health week' }).tap();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await days.last().tap();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.locator('.journal-heading').tap();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('keyboard navigation selects readings and preserves separate detail links', async ({ page }) => {
  await home(page);
  for (const [cardName, graphName] of [['Blood health','Blood oxygen'],['Lung','Respiratory rate']]) {
    const card = page.getByRole('article', { name: cardName, exact: true });
    const targets = card.getByRole('group', { name: `${graphName} graph readings`, exact: true }).getByRole('button');
    await targets.last().focus();
    await page.keyboard.press('Home');
    await expect(targets.first()).toBeFocused();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(targets.nth(1)).toBeFocused();
    await expect(targets.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(targets.nth(1)).toBeFocused();
    await card.getByRole('link', { name: `${cardName} details` }).click();
    await expect(page).toHaveURL(new RegExp(`#health-${cardName === 'Lung' ? 'lung' : 'blood'}$`));
    await page.goBack();
  }
});
