import { test, expect, type Page } from "@playwright/test";
import { sampleHealth } from "../src/lib/health";

const signals = {
  connected: true, configured: true, recovery: 78, spo2: 97.2,
  respiratoryRate: 15.2, restingHeartRate: 56, hrv: 62.4,
  sleepHours: 7.6, sleepPerformance: 91, strain: 10.4,
  steps: 6543, skinTemperature: 33.4, workoutCount: 1, energyKcal: 1874,
};
async function openHome(page: Page, connected = true) {
  await page.route("**/api/whoop/metrics?**", (route) => route.fulfill({ json: {
    ...(connected ? signals : { connected: false, configured: false }),
    date: new URL(route.request().url()).searchParams.get("date"),
  } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  const date = await page.getByLabel("Dashboard date", { exact: true }).getAttribute("data-date");
  return sampleHealth(date!);
}

test("recovery graph and complementary health cards fit mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  const current = await openHome(page);
  const overview = page.getByRole("region", { name: "Your health overview" });
  await expect(overview.getByRole("article")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText(`${current.recovery}%`);
  await expect(page.getByRole("link", { name: "Blood health details" })).toContainText("97.2%");
  await expect(page.getByRole("link", { name: "Lung details" })).toContainText("15.2/min");
  await expect(overview.locator(".health-summary-value")).toHaveCount(3);
  await expect(overview.getByText("Resting heart rate", { exact: true })).toHaveCount(0);
  for (const [width, height] of [[320, 851], [375, 812], [425, 851]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const body = page.getByRole("article", { name: "Overall body", exact: true });
    const chart = body.getByRole("img", { name: /Sample recovery graph/ });
    await expect(chart).toBeVisible();
    await expect(body).toContainText(`HRV ${current.hrv} ms`);
    const card = (await body.boundingBox())!;
    const blood = (await page.getByRole("article", { name: "Blood health", exact: true }).boundingBox())!;
    expect(Math.abs(card.width - blood.width)).toBeLessThan(1);
    expect(Math.abs(card.height - card.width)).toBeLessThan(1);
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(width);
    const graph = (await chart.boundingBox())!;
    expect(graph.height).toBeGreaterThan(20);
    const bars = chart.locator('.recovery-chart-bar');
    await expect(bars).toHaveCount(24);
    await expect(chart.locator('.recovery-chart-bar.is-active')).toHaveCount(1);
    await bars.first().hover();
    await expect(chart.locator('.recovery-chart-tooltip')).toBeVisible();
    await expect(chart.locator('.recovery-chart-tooltip')).toContainText('Recovery', { ignoreCase: true });
    const tooltip = (await chart.locator('.recovery-chart-tooltip').boundingBox())!;
    const hoveredGraph = (await chart.boundingBox())!;
    const hoveredCard = (await body.boundingBox())!;
    expect(tooltip.y).toBeGreaterThanOrEqual(hoveredGraph.y);
    expect(tooltip.y + tooltip.height).toBeLessThan(hoveredCard.y + hoveredCard.height);
    expect(graph.x).toBeGreaterThan(card.x);
    expect(graph.x + graph.width).toBeLessThan(card.x + card.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.impeccable/review/compact-health-home-${width}.png` });
  }
});

test("each card opens its own detail page and browser back returns home", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const current = await openHome(page);
  for (const [name, key, label, reading] of [
    ["Overall body", "body", "Daily strain", "10.4"],
    ["Blood health", "blood", "Resting heart rate", `${current.restingHeartRate}`],
    ["Lung", "lung", "Sleep performance", "91"],
  ]) {
    await page.getByRole("link", { name: `${name} details` }).click();
    await expect(page).toHaveURL(new RegExp(`#health-${key}$`));
    await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeFocused();
    const detail = page.getByRole("region", { name: `${name} details` });
    await expect(detail.getByRole("article")).toHaveCount(1);
    await expect(detail.locator(".health-metric").filter({ has: page.locator("dt", { hasText: label }) }).first()).toContainText(reading);
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Home", exact: true })).toHaveClass(/selected/);
    await page.screenshot({ path: `.impeccable/review/health-detail-${key}.png`, fullPage: true });
    await page.goBack();
    await expect(page.getByRole("region", { name: "Your health overview" })).toBeVisible();
    await expect(page.locator(".health-summary-card")).toHaveCount(3);
  }
});

test("glass blood health card selects readings and browses available weeks", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await openHome(page);
  const card = page.getByRole("article", { name: "Blood health", exact: true });
  const days = card.getByRole("group", { name: "Blood oxygen readings" }).getByRole("button");
  await expect(days).toHaveCount(7);
  await expect(card.getByRole("img", { name: /^Sample blood oxygen profile/ })).toBeVisible();
  await days.first().click();
  await expect(days.first()).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator('.blood-card-days [aria-pressed="true"]')).toHaveCount(1);
  const previous = card.getByRole("button", { name: "Previous blood health week" });
  const next = card.getByRole("button", { name: "Next blood health week" });
  const range = card.locator('.blood-card-week > span');
  const initial = await range.innerText();
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(range).not.toHaveText(initial);
  await expect(next).toBeEnabled();
  await previous.click();
  await expect(previous).toBeDisabled();
  await next.click();
  await next.click();
  await expect(range).toHaveText(initial);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const box = (await card.boundingBox())!;
    expect(Math.abs(box.width - box.height)).toBeLessThan(1);
    const plot = (await card.locator('.blood-card-plot').boundingBox())!;
    expect(plot.height).toBeGreaterThan(12);
    const footer = (await card.locator('.blood-card-week').boundingBox())!;
    expect(footer.y + footer.height).toBeLessThan(box.y + box.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("warm glass lung card preserves its dimensions and respiratory reading", async ({ page }) => {
  await openHome(page);
  const card = page.getByRole("article", { name: "Lung", exact: true });
  await expect(card.getByRole("link", { name: "Lung details" })).toContainText("15.2/min");
  await expect(card.getByRole("img", { name: "0% change from respiratory rate baseline" })).toHaveText("0%");
  await expect(card).not.toContainText(/sleep/i);
  await expect(card.locator('.lung-card-baseline')).toHaveText('Baseline15.2 /min');
  await expect(card.getByRole('img', { name: /^Respiratory rate trend in breaths per minute:/ })).toBeVisible();
  await expect(card.locator('.lung-chart-segment')).toHaveCount(14);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const box = (await card.boundingBox())!;
    expect(box.height).toBe(width <= 760 ? 122 : 146);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    if (width <= 760) {
      const grid = (await page.locator('.health-summary-cards').boundingBox())!;
      expect(Math.abs(box.width - grid.width)).toBeLessThan(1);
    }
    const reading = (await card.locator('.lung-card-reading').boundingBox())!;
    const badge = (await card.locator('.lung-card-comparison').boundingBox())!;
    const baseline = (await card.locator('.lung-card-baseline').boundingBox())!;
    const chart = (await card.locator('.lung-rate-chart').boundingBox())!;
    expect(chart.width).toBeGreaterThan(60);
    expect(chart.y + chart.height).toBeLessThanOrEqual(baseline.y);
    expect(reading.x + reading.width).toBeLessThan(baseline.x);
    expect(baseline.x + baseline.width).toBeLessThan(badge.x);
    expect(reading.x + reading.width).toBeLessThan(badge.x);
    expect(badge.x + badge.width).toBeLessThan(box.x + box.width);
  }
});

test("all three health cards share the same title, reading, and unit typography", async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const groups = await page.locator('.health-summary-cards').evaluate(el => {
      const styles = (selectors: string[]) => selectors.map(selector => {
        const node = el.querySelector(selector)!;
        const style = getComputedStyle(node);
        return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight };
      });
      return {
        titles: styles(['.recovery-card-heading > span:first-child', '.blood-card-heading', '.lung-card-heading']),
        readings: styles(['.recovery-card-score > span', '.blood-card-digits', '.lung-card-digits']),
        units: styles(['.recovery-card-score > small', '.blood-card-value > small', '.lung-card-reading > small']),
      };
    });
    for (const group of Object.values(groups)) {
      expect(group[1]).toEqual(group[0]);
      expect(group[2]).toEqual(group[0]);
    }
    expect(groups.readings[0].family.toLowerCase()).toContain('matricha');
    expect(groups.titles[0].family.toLowerCase()).toContain('urbanist');
    const blood = page.getByRole('article', { name: 'Blood health', exact: true });
    const box = (await blood.boundingBox())!;
    const reading = (await blood.locator('.blood-card-value').boundingBox())!;
    expect(reading.x + reading.width).toBeLessThan(box.x + box.width);
  }
});

test("sample readings are labeled and weight check-in stays available", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  const current = await openHome(page, false);
  await expect(page.getByRole("region", { name: "Your health overview" }).getByText("Sample data", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText(`${current.recovery}%`);
  await expect(page.getByRole("link", { name: "Blood health details" })).toContainText("97.2%");
  await expect(page.getByRole("link", { name: "Lung details" })).toContainText("15.2/min");
  await expect(page.getByRole("link", { name: "Gut details" })).toHaveCount(0);
  await page.getByRole("link", { name: "Overall body details" }).click();
  await page.getByRole("button", { name: "Morning check-in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Morning check-in", exact: true })).toBeVisible();
});

// Retired bookmarks must not expose the archived feature.
test("retired gut URL returns home and stool API is removed", async ({ page, request }) => {
  await openHome(page, false);
  await page.evaluate(() => { location.hash = "health-gut"; });
  await expect(page).toHaveURL(/#overview$/);
  await expect(page.getByRole("region", { name: "Your health overview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Gut details" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log a gut check-in" })).toHaveCount(0);
  expect((await request.get("/api/health/stool")).status()).toBe(404);
});
