import { test, expect, type Page } from "@playwright/test";

async function openConnection(page: Page) {
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  for (let i = 0; i < 4; i++)
    await page.locator("header").getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("radio", { name: /WHOOP/ }).check();
  await page.getByRole("button", { name: "Connect WHOOP", exact: true }).click();
  return page.getByRole("dialog", { name: "Your WHOOP. Your daily picture." });
}

test("Connect WHOOP opens the product screen before authorization and handles unavailable access", async ({ page, request, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 851 });
  let attempts = 0;
  page.on("request", (r) => { if (r.url().endsWith("/api/whoop/connect")) attempts++; });
  const screen = await openConnection(page);
  await expect(screen).toBeVisible();
  expect(attempts).toBe(0);
  await expect(screen.locator("img")).toHaveJSProperty("complete", true);
  await screen.getByRole("button", { name: "Continue to WHOOP" }).click();
  await expect(screen.getByRole("status")).toContainText("isn’t available in this app yet");
  expect(attempts).toBe(1);
  await expect(screen).not.toContainText("Account connected");
  await page.screenshot({ path: ".impeccable/review/whoop-screen-unavailable.png" });
  await screen.getByRole("button", { name: "Back", exact: true }).click();
  await expect(screen).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /WHOOP/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "Connect WHOOP", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your starting point. Your story." })).toBeVisible();
  expect((await request.post("/api/whoop/connect", { headers: { Origin: "https://untrusted.example" } })).status()).toBe(403);
  expect((await request.post("/api/whoop/connect", { headers: { Origin: baseURL! } })).status()).toBe(503);
});

test("authorization opens WHOOP separately and connected state requires verified status", async ({ page, context }) => {
  let connected = false;
  await page.route("**/api/whoop/status", r => r.fulfill({ json: { configured: true, connected } }));
  await page.route("**/api/whoop/connect", r => r.fulfill({ json: { url: "https://api.prod.whoop.com/oauth/oauth2/auth?client_id=test" } }));
  await context.route("https://api.prod.whoop.com/oauth/oauth2/auth?**", r => r.fulfill({ body: "Test consent page", contentType: "text/html" }));
  const screen = await openConnection(page);
  const popupEvent = page.waitForEvent("popup");
  await screen.getByRole("button", { name: "Continue to WHOOP" }).click();
  const popup = await popupEvent;
  await expect(popup).toHaveURL(/api\.prod\.whoop\.com\/oauth\/oauth2\/auth/);
  await expect(screen.getByRole("status")).toContainText("Finish connecting");
  await expect(screen).not.toContainText("Account connected");
  connected = true;
  await popup.close();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("heading", { name: "You’re connected. A little more in sync." })).toBeVisible();
  const verifiedScreen = page.getByRole("dialog", { name: "You’re connected. A little more in sync." });
  await expect(verifiedScreen).toContainText("Account connected");
  await page.screenshot({ path: ".impeccable/review/whoop-screen-connected.png" });
  await verifiedScreen.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Disconnect WHOOP", exact: true })).toBeVisible();
});

test("white connection screen fits phone and desktop, supports Escape and respects reduced motion", async ({ page }) => {
  await page.route("**/api/whoop/status", r => r.fulfill({ json: { configured: false, connected: false } }));
  const screen = await openConnection(page);
  await screen.locator("img").evaluate((img: HTMLImageElement) => img.decode());
  for (const [width, height] of [[320, 851], [375, 851], [425, 851], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await expect(screen).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(await screen.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect.poll(async () => {
      const button = (await screen.getByRole("button", { name: "Continue to WHOOP" }).boundingBox())!;
      return button.y + button.height;
    }).toBeLessThan(height);
    await page.screenshot({ path: `.impeccable/review/whoop-screen-${width}.png` });
  }
  await expect(screen.locator(".whoop-signal-field > span").first()).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(screen.locator(".whoop-signal-field > span").first()).toHaveCSS("animation-name", "whoop-signal");
  await page.keyboard.press("Escape");
  await expect(screen).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Connect WHOOP", exact: true })).toBeFocused();
});
