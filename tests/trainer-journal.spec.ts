import { test, expect, type Page } from "@playwright/test";
import { TODAY } from "../src/lib/model";

async function sample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
}
async function openJournal(page: Page, member = /AS Arjun Sharma/) {
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await page.getByRole("button", { name: member }).click();
  await page.getByRole("button", { name: "Member journal", exact: true }).click();
}

test("trainer sees every journal category and member edits without leaking them to another member", async ({ page }) => {
  await sample(page);
  await page.evaluate(() => { location.hash = "planner"; });
  await page.getByLabel("Goal 1", { exact: true }).fill("Member goal updated for coach");
  await page.evaluate(() => { location.hash = "review"; });
  await page.getByLabel("What were the biggest wins?", { exact: true }).fill("My updated monthly win");
  await openJournal(page);
  for (const name of ["Monthly goals", "Habits & consistency", "100-day challenge", "Starting profile", "Weight history", "Measurements & results", "Monthly planner", "Monthly review", "Health & wearable readings"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Member goal updated for coach", { exact: true })).toBeVisible();
  await expect(page.getByText("My updated monthly win", { exact: true })).toBeVisible();
  await expect(page.getByText("Illustrative readings from the sample journal.", { exact: true })).toBeVisible();
  await expect(page.locator(".trainer-member-journal input, .trainer-member-journal textarea")).toHaveCount(0);
  await page.getByLabel("Journal date", { exact: true }).fill("2020-01-10");
  await expect(page.getByText("No goals recorded for this month.", { exact: true })).toBeVisible();
  await expect(page.getByText("No weight entries for this month.", { exact: true })).toBeVisible();
  await expect(page.getByText("No review recorded for this month.", { exact: true })).toBeVisible();
  await page.getByLabel("Journal date", { exact: true }).fill(TODAY);
  await expect(page.getByText("Member goal updated for coach", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: ".impeccable/review/trainer-journal-desktop.png", fullPage: false });
  for (const width of [320, 375, 425]) {
    await page.setViewportSize({ width, height: 851 });
    await expect.poll(() => page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))).toEqual({ width, scroll: width });
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: ".impeccable/review/trainer-journal-mobile.png", fullPage: false });
  await page.getByRole("button", { name: "All members", exact: true }).click();
  await page.getByRole("button", { name: /MI Meera Iyer/ }).click();
  await page.getByRole("button", { name: "Member journal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No member journal shared", exact: true })).toBeVisible();
  await expect(page.getByText("Member goal updated for coach", { exact: true })).toHaveCount(0);
  await expect(page.getByText("My updated monthly win", { exact: true })).toHaveCount(0);
});

test("existing workout and nutrition views remain available alongside the journal", async ({ page }) => {
  await sample(page);
  await openJournal(page);
  await page.getByRole("button", { name: "Assigned plan", exact: true }).click();
  await expect(page.getByText("TRAINER’S ASSIGNED PLAN", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Member’s actual log", exact: false }).click();
  await expect(page.getByRole("heading", { name: "No log submitted", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nutrition & wellness", exact: false }).click();
  await expect(page.getByText("MEMBER’S NUTRITION & WELLNESS", { exact: true })).toBeVisible();
});
