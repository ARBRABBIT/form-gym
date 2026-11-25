import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
}

async function screen(page: Page, name: string) {
  await page.evaluate(value => { location.hash = value; }, name);
  await expect(page.locator(".screen-content")).toHaveAttribute("data-screen", name);
}

test("journal screens remain readable and contained at phone and desktop sizes", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["profile", "workout", "library", "nutrition", "planner", "habits", "challenge", "weight", "results", "review", "health-body", "health-blood", "health-lung", "trainer", "trainer-library"]) {
      await screen(page, route);
      await expect(page.locator(".screen-content h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `${route} overflows at ${width}px` }).toBe(true);
    }
  }
  await screen(page, "overview");
  await expect(page.locator(".home-dashboard")).toBeVisible();
  await expect(page.getByRole("article", { name: "Lung", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("glass meal entry preserves totals and popup accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await screen(page, "nutrition");
  const total = page.locator(".daily-totals > div").first().locator("strong");
  const before = Number((await total.innerText()).replace(/[^\d.]/g, ""));
  const breakfast = page.locator(".panel").filter({ has: page.getByRole("heading", { name: "Breakfast", exact: true }) });
  await breakfast.getByRole("button", { name: "Add food", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Add to Breakfast", exact: true });
  await form.getByLabel(/^Product/).fill("Design review oats");
  await form.getByLabel("Serving Size", { exact: true }).fill("1 bowl");
  await form.getByLabel("Calories (kcal)", { exact: true }).fill("100");
  await form.getByRole("button", { name: "Save food item", exact: true }).click();
  await expect(form).toBeHidden();
  await expect(total).toContainText(String(before + 100));
  await expect(breakfast).toContainText("Design review oats");
  await breakfast.getByRole("button", { name: "Remove Design review oats", exact: true }).click();
  await expect(total).toContainText(String(before));
});

test("glass challenge tiles and workout library keep their editing behavior", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await screen(page, "challenge");
  const day = page.getByRole("button", { name: "Challenge day 100", exact: true });
  const before = await day.getAttribute("aria-pressed");
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
  await screen(page, "library");
  await page.getByRole("button", { name: "New workout", exact: true }).click();
  await page.getByLabel("Workout name", { exact: false }).fill("Glass strength session");
  await page.getByRole("button", { name: "Save workout template", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Glass strength session", exact: true })).toBeVisible();
});
