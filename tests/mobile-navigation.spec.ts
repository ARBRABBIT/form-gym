import { test, expect } from "@playwright/test";

test("charcoal glass navbar keeps white icons over dark and light cards while the selected tab stays readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  const unselected = nav.locator('.bottom-nav-tabs > button:not(.selected), .bottom-nav-add');
  const selected = nav.locator('.bottom-nav-tabs > .selected');
  const align = async (selector: string) => page.locator(selector).evaluate(element => {
    const surface = element.getBoundingClientRect();
    const icon = document.querySelector('.bottom-nav-add > svg')!.getBoundingClientRect();
    scrollTo({ top: scrollY + surface.top + surface.height / 2 - icon.top - icon.height / 2, behavior: 'instant' });
  });
  await align('.water-intake-card');
  for (const button of await unselected.all()) await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(selected).toHaveCSS('color', 'rgb(23, 23, 23)');
  await expect(selected).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.setViewportSize({ width: 425, height: 851 });
  await align('.water-intake-card');
  for (const button of await unselected.all()) await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await align('.daily-habits-section');
  for (const button of await unselected.all()) await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(selected).toHaveCSS('color', 'rgb(23, 23, 23)');
});

test("glass mobile navbar switches labeled tabs and retains the separate add action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("button")).toHaveCount(5);
  await expect(nav.locator('.bottom-nav-tabs')).toHaveCSS('backdrop-filter', /url\(.+\) saturate\(1.45\)/);
  await expect(nav.locator('.nav-glass-optics filter')).toHaveCount(2);
  await expect(nav.getByRole('button', { name: 'Workout', exact: true })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(nav.locator('.bottom-nav-add')).toHaveCSS('color', 'rgb(255, 255, 255)');
  for (const width of [320, 375, 425, 760]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [name, hash] of [["Home", "overview"], ["Workout", "workout"], ["Food", "nutrition"]]) {
      const button = nav.getByRole("button", { name, exact: true });
      await button.click();
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
      await expect(button).toHaveAttribute("aria-current", "page");
      await expect(button.locator('.bottom-nav-label')).toBeVisible();
      await expect(nav.locator('.bottom-nav-tabs > .selected')).toHaveCount(1);
      await expect(button.locator('svg')).toHaveAttribute('data-icon-variant', 'solid');
      await expect(button.locator('svg')).toHaveAttribute('fill', 'currentColor');
      await expect(nav.locator('.bottom-nav-tabs > button:not(.selected) svg[data-icon-variant="outline"]')).toHaveCount(3);
    }
    const bounds = (await nav.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    for (const button of await nav.getByRole("button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await nav.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/#profile$/);
  await expect(page.getByRole("heading", { name: "My profile", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Profile", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("button", { name: "Profile", exact: true }).locator('svg')).toHaveAttribute('data-icon-variant', 'solid');
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "Close menu", exact: true }).click();
  await nav.getByRole("button", { name: "Open water tracker", exact: true }).click();
  await expect(page).toHaveURL(/#water$/);
  await expect(page.getByRole("region", { name: "Water tracker", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to journal", exact: true }).click();
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await expect(nav.getByRole("button")).toHaveCount(3);
  await expect(nav.getByRole("button", { name: "Members", exact: true }).locator('svg')).toHaveAttribute('data-icon-variant', 'solid');
  await nav.getByRole("button", { name: "Open water tracker", exact: true }).click();
  await expect(page).toHaveURL(/#water$/);
  await page.getByRole("button", { name: "Back to journal", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(nav).toBeHidden();
});
