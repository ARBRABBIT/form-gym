import { test, expect, type Page } from "@playwright/test";

async function openProfile(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/#profile$/);
}

test("profile edits sync with the journal and cancel preserves the saved profile", async ({ page }) => {
  await openProfile(page);
  const hero = page.getByRole("region", { name: "Your profile", exact: true });
  const originalName = await hero.getByRole("heading", { level: 2 }).innerText();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit profile", exact: true });
  await dialog.getByLabel(/^Name/).fill("Discard this edit");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(hero.getByRole("heading", { level: 2 })).toHaveText(originalName);
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await dialog.getByLabel(/^Name/).fill("Riya Kapoor");
  await dialog.getByLabel("Height (cm)", { exact: true }).fill("172");
  await dialog.getByLabel("Starting weight (kg)", { exact: true }).fill("65");
  await dialog.getByRole("radio", { name: "Maintain weight", exact: true }).check();
  await dialog.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(hero.getByRole("heading", { level: 2 })).toHaveText("Riya Kapoor");
  await expect(hero).toContainText("172cm");
  await expect(hero).toContainText("Maintain weight");
  await page.getByRole("button", { name: /Starting point & results/ }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Riya Kapoor");
  await expect(page.getByLabel("Height (cm)", { exact: true })).toHaveValue("172");
  await expect(page.getByLabel("Starting weight (kg)", { exact: true })).toHaveValue("65");
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.locator(".journal-heading h1")).toContainText("Riya Kapoor");
});

test("profile fits mobile and desktop, opens existing settings, and signs out", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openProfile(page);
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "My profile", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: /Connected devices/ }).click();
  await expect(page.getByRole("dialog", { name: "Connected devices", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Morning reminders/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("region", { name: "Journal session", exact: true }).getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Explore the sample journal" })).toBeVisible();
  expect(errors).toEqual([]);
});
