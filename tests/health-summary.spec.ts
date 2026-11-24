import { test, expect, type Page } from "@playwright/test";

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
}

test("recovery graph and complementary health cards fit mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await openHome(page);
  const overview = page.getByRole("region", { name: "Your health overview" });
  await expect(overview.getByRole("article")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText("78%");
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
    await expect(body).toContainText("HRV 62.4 ms");
    const card = (await body.boundingBox())!;
    const blood = (await page.getByRole("article", { name: "Blood health", exact: true }).boundingBox())!;
    expect(Math.abs(card.width - blood.width)).toBeLessThan(1);
    expect(Math.abs(card.height - card.width)).toBeLessThan(1);
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(width);
    const graph = (await chart.boundingBox())!;
    expect(graph.height).toBeGreaterThan(20);
    const bars = chart.locator('g:has(title)');
    await expect(bars).toHaveCount(28);
    for (const bar of await bars.all()) {
      expect(await bar.locator('rect').count()).toBeLessThanOrEqual(14);
    }
    expect(graph.x).toBeGreaterThan(card.x);
    expect(graph.x + graph.width).toBeLessThan(card.x + card.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.impeccable/review/compact-health-home-${width}.png` });
  }
});

test("each card opens its own detail page and browser back returns home", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openHome(page);
  for (const [name, key, label, reading] of [
    ["Overall body", "body", "Daily strain", "10.4"],
    ["Blood health", "blood", "Resting heart rate", "56"],
    ["Lung", "lung", "Sleep performance", "91"],
  ]) {
    await page.getByRole("link", { name: `${name} details` }).click();
    await expect(page).toHaveURL(new RegExp(`#health-${key}$`));
    await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeFocused();
    const detail = page.getByRole("region", { name: `${name} details` });
    await expect(detail.getByRole("article")).toHaveCount(1);
    await expect(detail.locator(".health-metric").filter({ has: page.locator("dt", { hasText: label }) }).first()).toContainText(reading);
    await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveClass(/selected/);
    await page.screenshot({ path: `.impeccable/review/health-detail-${key}.png`, fullPage: true });
    await page.goBack();
    await expect(page.getByRole("region", { name: "Your health overview" })).toBeVisible();
    await expect(page.locator(".health-summary-card")).toHaveCount(3);
  }
});

test("sample readings are labeled and weight check-in stays available", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await openHome(page, false);
  await expect(page.getByRole("region", { name: "Your health overview" }).getByText("Sample data", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText("78%");
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
