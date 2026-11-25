import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/reminders", route => route.fulfill({ json: {
    enabled: false, time: "07:30", timezone: "Asia/Kolkata", tone: "friendly", publicKey: "test-only", workerActive: true,
  } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
});

test("morning reminder glass sheet supports mood, schedule, resizing, and both entry points", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Morning reminders", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge", exact: true });
  for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }, { width: 1000, height: 320 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => dialog.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight + 1;
    })).toBe(true);
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeInViewport();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByLabel(/Remind me at/).fill("08:15");
  await dialog.getByLabel("Reminder time zone", { exact: true }).selectOption("UTC");
  await dialog.getByRole("radio", { name: "A little bathroom humour", exact: true }).check();
  await expect(dialog.locator(".reminder-preview")).toContainText("Bathroom business done? Scale selfie next.");
  await expect(dialog.getByLabel(/Remind me at/)).toHaveValue("08:15");
  await expect(dialog.getByLabel("Reminder time zone", { exact: true })).toHaveValue("UTC");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: /Morning reminders/ }).click();
  await expect(dialog).toHaveClass(/reminder-sheet/);
  await expect(dialog.locator(".reminder-preview")).toContainText("Morning mission: step, snap, done.");
});

test("redesigned reminder keeps the permission-denied recovery flow", async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(Notification, "requestPermission", { value: async () => "denied" });
  });
  await page.getByRole("button", { name: "Morning reminders", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge", exact: true });
  await dialog.getByRole("button", { name: "Enable daily reminder", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Notifications are off");
  await expect(dialog.getByRole("button", { name: "Enable daily reminder", exact: true })).toBeEnabled();
});
