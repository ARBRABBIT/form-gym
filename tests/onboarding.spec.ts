import { test, expect, type Page } from "@playwright/test";

async function watchLaunchCoverage(page: Page) {
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      const cover = document.querySelector(".app-launch-cover");
      if (!cover || !document.querySelector(".app-shell")) return;
      const { x, y, width, height } = cover.getBoundingClientRect();
      (window as Window & { launchBounds?: object }).launchBounds = {
        x,
        y,
        width,
        height,
      };
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
async function launchBounds(page: Page) {
  return page.evaluate(
    () => (window as Window & { launchBounds?: object }).launchBounds,
  );
}

test("signup, optional goals, challenge, weight and habits carry into the current personal journal", async ({
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: ".impeccable/review/signup-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Your name", { exact: true }).fill("Aditi Sharma");
  await page.getByLabel("Email address").fill("aditi@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Create my journal" }).click();
  await page.getByLabel("Custom goal 1", { exact: true }).fill("Train three times per week");
  await page.screenshot({
    path: ".impeccable/review/goals-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Day 1", { exact: false })).toBeDisabled();
  await page.getByLabel("My 100-day intention").fill("Walk every day");
  await page.getByLabel("I accept the 100-day challenge").check();
  await page.getByLabel("Day 1", { exact: false }).check();
  await page.screenshot({
    path: ".impeccable/review/challenge-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Approximate weight (kg)", { exact: true })
    .fill("72.5");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page
    .getByLabel("Habit 1", { exact: true })
    .fill("Less late-night scrolling");
  await page.getByLabel("Bad habit to break").check();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByLabel("Approximate weight (kg)", { exact: true }),
  ).toHaveValue("72.5");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Height (cm)").fill("168");
  await page.getByLabel("Maintain weight", { exact: true }).check();
  await page.screenshot({
    path: ".impeccable/review/starting-point-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Make it mine" }).click();
  await expect(
    page.getByRole("heading", { name: /lovely start, Aditi/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go to app" }).click();
  await expect(
    page.getByText("Aditi Sharma’s journal", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("form-journal-v1"))).toBeNull();
  await page.reload();
  await expect(page.getByRole("button", { name: "Create my journal" })).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
});

test("mobile setup can skip goals, decline challenge and leave optional fields blank", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.screenshot({
    path: ".impeccable/review/signup-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByLabel("Email address").fill("new@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page
    .getByRole("button", { name: "Log in", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  for (let step = 1; step < 5; step++) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/setup-${step}-mobile.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByLabel("Name *", { exact: true }).fill("Riya");
  await page.screenshot({
    path: ".impeccable/review/starting-point-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Make it mine" }).click();
  await page.getByRole("button", { name: "Go to app" }).click();
  await expect(page.getByText("Riya’s journal", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("form-journal-v1"))).toBeNull();
});

test("header skip works through the last step and weight uses the app calendar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByLabel("Email address").fill("skip@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page
    .getByRole("button", { name: "Log in", exact: true })
    .last()
    .click();
  const skip = page
    .locator("header")
    .getByRole("button", { name: "Skip for now" });
  for (let step = 0; step < 6; step++) {
    await expect(skip).toBeVisible();
    await expect(
      page.getByText(`Step ${step + 1} of 6`, { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".setup-step")).toHaveCSS(
      "animation-name",
      "setup-arrive",
    );
    if (step === 2) {
      const trigger = page.getByRole("button", { name: "Weight entry date" });
      await trigger.click();
      const calendar = page.getByRole("dialog", {
        name: "Choose date",
        exact: true,
      });
      await expect(calendar).toBeVisible();
      const bounds = await calendar.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(425);
      await calendar.evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished),
        );
      });
      await page.screenshot({
        path: ".impeccable/review/onboarding-calendar-mobile.png",
        fullPage: true,
      });
      await calendar
        .getByRole("button", { name: "Previous month", exact: true })
        .click();
      await calendar
        .locator(".date-picker-days button:not(:disabled)")
        .nth(10)
        .click();
      await expect(calendar).not.toBeVisible();
      await trigger.click();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await skip.click();
  }
  await expect(page.getByRole("button", { name: "Go to app" })).toBeVisible();
  await expect(skip).toHaveCount(0);
  await watchLaunchCoverage(page);
  await page.getByRole("button", { name: "Go to app" }).click();
  const appShell = page.locator(".app-shell");
  const cover = page.locator(".app-launch-cover");
  await expect(cover).toBeVisible();
  await expect(appShell).toBeVisible();
  const fullScreenCover = await launchBounds(page);
  expect(fullScreenCover).toEqual({ x: 0, y: 0, width: 425, height: 851 });
  await expect(page.locator(".journal-heading h1")).toBeFocused();
  await expect(cover).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator(".journal-heading")
        .evaluate((el) => (el as HTMLElement).style.opacity),
    )
    .toBe("");
  await page.screenshot({
    path: ".impeccable/review/home-after-onboarding-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByText("Your journal", { exact: true }).first(),
  ).toBeVisible();
});

test("step changes stay anchored without a vertical scroll animation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  const initialTop = await page
    .locator(".setup-step h1")
    .evaluate((el) => el.getBoundingClientRect().top);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Step 2 of 6", { exact: true })).toBeVisible();
  const positions = await page.evaluate(async () => {
    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(requestAnimationFrame);
      samples.push(window.scrollY);
    }
    return samples;
  });
  expect(positions).toEqual([0, 0, 0, 0, 0]);
  expect(
    await page
      .locator(".setup-step h1")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeCloseTo(initialTop, 0);
  await expect(page.locator(".setup-step")).toHaveCSS(
    "animation-duration",
    "0.6s",
  );
  await page.locator(".setup-step").evaluate(async (el) => {
    await Promise.all(
      el.getAnimations().map((animation) => animation.finished),
    );
  });
  await page.screenshot({
    path: ".impeccable/review/onboarding-smooth-transition-mobile.png",
    fullPage: true,
  });
});

test("CTA expansion covers the entire desktop viewport before showing home", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  for (let i = 0; i < 6; i++) {
    await page
      .locator("header")
      .getByRole("button", { name: "Skip for now" })
      .click();
  }
  const cta = page.getByRole("button", { name: "Go to app" });
  await cta.scrollIntoViewIfNeeded();
  await watchLaunchCoverage(page);
  await cta.click();
  const cover = page.locator(".app-launch-cover");
  await expect(cover).toBeVisible();
  await cover.evaluate(async (element) => {
    await new Promise<void>((resolve) => {
      const check = () =>
        parseFloat(
          getComputedStyle(element).clipPath.match(/circle\(([\d.]+)px/)?.[1] ||
            "0",
        ) >=
        innerWidth * 0.35
          ? resolve()
          : requestAnimationFrame(check);
      requestAnimationFrame(check);
    });
  });
  await page.screenshot({
    path: ".impeccable/review/cta-expanding-desktop.png",
  });
  await expect(page.locator(".app-shell")).toBeVisible();
  expect(await launchBounds(page)).toEqual({
    x: 0,
    y: 0,
    width: 1440,
    height: 1000,
  });
  await expect(cover).toHaveCount(0);
  await expect(page.locator(".journal-heading h1")).toBeFocused();
});

test("each setup step has distinct compact artwork and the weight dial stays live", async ({
  page,
}) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  const variants = [
    "goals",
    "challenge",
    "weight",
    "habits",
    "wearable",
    "profile",
  ];
  for (let step = 0; step < 6; step++) {
    const art = page.locator(".setup-heading .onboarding-illustration");
    await expect(art).toHaveCount(1);
    await expect(art).toHaveAttribute("data-illustration", variants[step]);
    await expect
      .poll(() =>
        art
          .locator("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect((await art.boundingBox())!.width).toBeLessThanOrEqual(84);
    await page.locator(".setup-step").evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      );
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    if (step === 1) {
      await page.locator(".setup-step").evaluate(async (el) => {
        await Promise.all(
          el.getAnimations().map((animation) => animation.finished),
        );
      });
      await page.screenshot({
        path: ".impeccable/review/challenge-scale-mobile.png",
        fullPage: true,
      });
    }
    if (step === 2) {
      const input = page.getByLabel("Approximate weight (kg)", { exact: true });
      const wheel = page.locator(".scale-dial-wheel");
      const before = await wheel.getAttribute("transform");
      await input.fill("85.5");
      await expect(page.locator(".onboarding-scale")).toHaveAttribute(
        "data-weight",
        "85.5",
      );
      await expect(page.locator(".scale-live-reading")).toHaveText("85.5kg");
      expect(await wheel.getAttribute("transform")).not.toBe(before);
      await page.screenshot({
        path: ".impeccable/review/weight-scale-mobile.png",
        fullPage: true,
      });
    }
    await page.screenshot({
      path: `.impeccable/review/mobile-artwork-${variants[step]}.png`,
      fullPage: true,
    });
    await page
      .locator("header")
      .getByRole("button", { name: "Skip for now" })
      .click();
  }
  await expect(
    page.locator(".setup-finish .onboarding-illustration"),
  ).toHaveAttribute("data-illustration", "complete");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: ".impeccable/review/finish-scale-desktop.png",
    fullPage: true,
  });
});

test("compact illustrations stay beside headings on narrow phones", async ({
  page,
}) => {
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const heading = await page.locator(".setup-heading h1").boundingBox();
    const art = await page
      .locator(".setup-heading .onboarding-illustration")
      .boundingBox();
    expect(art!.x).toBeGreaterThan(heading!.x + heading!.width);
    await page.screenshot({
      path: `.impeccable/review/scale-onboarding-${width}.png`,
      fullPage: true,
    });
  }
});

test("signup and login use different relevant illustrations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(
    page.locator(".account-story-heading .onboarding-illustration"),
  ).toHaveAttribute("data-illustration", "signup");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(
    page.locator(".account-story-heading .onboarding-illustration"),
  ).toHaveAttribute("data-illustration", "login");
});

test("old browser journal data is removed and setup never writes browser storage", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("form-journal-v1", JSON.stringify({ account: { email: "old@example.com" } }));
    sessionStorage.setItem("form-session", "old@example.com");
    sessionStorage.setItem("form-sample", "true");
    const writes: string[] = [];
    (window as Window & { storageWrites?: string[] }).storageWrites = writes;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      writes.push(key);
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 375, height: 851 });
  await page.goto("/");
  await page.getByLabel("Your name", { exact: true }).fill("Riya");
  await page.getByLabel("Email address").fill("riya@example.com");
  await page.getByLabel("Password", { exact: true }).fill("temporary-password");
  await page.getByRole("button", { name: "Create my journal" }).click();
  await page.getByLabel("Custom goal 1", { exact: true }).fill("Go for a walk");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /A hundred days/ })).toBeVisible();
  expect(await page.evaluate(() => ({
    journal: localStorage.getItem("form-journal-v1"),
    session: sessionStorage.getItem("form-session"),
    sample: sessionStorage.getItem("form-sample"),
    writes: (window as Window & { storageWrites?: string[] }).storageWrites,
  }))).toEqual({ journal: null, session: null, sample: null, writes: [] });
});

test("mobile weight dial supports dragging, typing, keyboard and the top-right date", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 851 });
  await page.goto("/#onboarding");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const input = page.getByLabel("Approximate weight (kg)", { exact: true });
  const dial = page.getByRole("slider", { name: "Weight dial" });
  await input.fill("");
  await expect(input).toHaveValue("");
  await expect(page.getByLabel(/Gain \(kg\)|Loss \(kg\)|Notes/)).toHaveCount(0);
  const date = await page.getByRole("button", { name: "Weight entry date" }).boundingBox();
  const heading = await page.locator(".setup-heading h1").boundingBox();
  expect(date!.y + date!.height).toBeLessThan(heading!.y);
  expect(date!.x).toBeGreaterThan(375 / 2);
  const bounds = (await dial.boundingBox())!;
  const at = (x: number, y: number) => ({ x: bounds.x + x / 320 * bounds.width, y: bounds.y + y / 304 * bounds.height });
  const start = at(160, 14), end = at(299, 153);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  await expect(input).toHaveValue("170.0");
  await expect(dial).toHaveAttribute("aria-valuenow", "170");
  await dial.press("ArrowRight");
  await expect(input).toHaveValue("170.1");
  await page.getByRole("button", { name: "Decrease weight" }).click();
  await expect(input).toHaveValue("170.0");
  const touch = await page.context().newCDPSession(page);
  const touchStart = at(21, 153), touchEnd = at(160, 14);
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchStart.x, y: touchStart.y }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchEnd.x, y: touchEnd.y }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(input).toHaveValue("110.0");
  await touch.detach();
  await input.fill("72.5");
  await expect(dial).toHaveAttribute("aria-valuenow", "72.5");
  await expect(page.locator(".onboarding-scale")).toHaveAttribute("data-weight", "72.5");
  await expect(page.locator(".onboarding-scale-pose")).toHaveCSS("transform", "none");
  await input.fill("701");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Let’s find your starting weight." })).toBeVisible();
  await input.fill("72.5");
  for (const width of [320, 375, 425]) {
    await page.setViewportSize({ width, height: 851 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.impeccable/review/weight-dial-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(input).toHaveValue("72.5");
});


test("monthly goals mix suggestions and custom text with a shared four-goal limit", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 851 });
  await page.goto("/");
  await page.getByLabel("Your name", { exact: true }).fill("Riya");
  await page.getByLabel("Email address").fill("riya@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page.getByRole("button", { name: "Create my journal" }).click();
  await page.screenshot({ path: ".impeccable/review/goal-options-mobile.png", fullPage: true });
  const move = page.getByRole("checkbox", { name: "Move my body three times a week" });
  await move.check();
  await page.getByRole("checkbox", { name: "Build strength", exact: true }).check();
  await page.getByRole("checkbox", { name: "Drink more water", exact: true }).check();
  await page.getByLabel("Custom goal 4", { exact: true }).fill("Walk with my family");
  await expect(page.getByRole("status")).toContainText("4 of 4 selected");
  await expect(page.getByRole("checkbox", { name: "Make more time for sleep" })).toBeDisabled();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(move).toBeChecked();
  await expect(page.getByLabel("Custom goal 4", { exact: true })).toHaveValue("Walk with my family");
  await move.uncheck();
  await expect(page.getByRole("checkbox", { name: "Make more time for sleep" })).toBeEnabled();
  await page.getByRole("button", { name: "Remove custom goal 4" }).click();
  await expect(page.getByRole("status")).toHaveText("2 of 4 selected");
  for (const width of [320, 375, 425, 1440]) {
    await page.setViewportSize({ width, height: 851 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: ".impeccable/review/goal-options-desktop.png", fullPage: true });
});

test("challenge reflects monthly goals and lets a selected goal become the intention", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 851 });
  await page.goto("/");
  await page.getByLabel("Your name", { exact: true }).fill("Riya");
  await page.getByLabel("Email address").fill("riya@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page.getByRole("button", { name: "Create my journal" }).click();
  await page.getByRole("checkbox", { name: "Build strength", exact: true }).check();
  await page.getByLabel("Custom goal 2", { exact: true }).fill("Walk with my family");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Build strength", exact: true })).toBeVisible();
  const family = page.getByRole("radio", { name: "Walk with my family", exact: true });
  await expect(family).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await family.check();
  const intention = page.getByLabel("My 100-day intention");
  await expect(intention).toHaveValue("Walk with my family");
  await page.screenshot({ path: ".impeccable/review/challenge-monthly-goals-mobile.png", fullPage: true });
  await intention.fill("Walk together for 20 minutes daily");
  await expect(family).not.toBeChecked();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("checkbox", { name: "Build strength", exact: true }).uncheck();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(1);
  await expect(intention).toHaveValue("Walk together for 20 minutes daily");
});

test("habit suggestions support build, break and custom habits through setup", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 851 });
  await page.goto("/");
  await page.getByLabel("Your name", { exact: true }).fill("Riya");
  await page.getByLabel("Email address").fill("riya@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page.getByRole("button", { name: "Create my journal" }).click();
  for (let step = 0; step < 3; step++) {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  const walk = page.getByRole("checkbox", { name: "Take a daily walk", exact: true });
  const scrolling = page.getByRole("checkbox", { name: "Late-night scrolling", exact: true });
  await walk.check();
  await scrolling.check();
  await page.getByRole("button", { name: "Add a habit", exact: true }).click();
  await page.getByLabel("Habit 3", { exact: true }).fill("Pack my gym bag");
  await page.screenshot({ path: ".impeccable/review/habit-suggestions-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(walk).toBeChecked();
  await expect(scrolling).toBeChecked();
  await expect(page.getByLabel("Habit 3", { exact: true })).toHaveValue("Pack my gym bag");
  await walk.uncheck();
  await expect(walk).not.toBeChecked();
  await walk.check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Make it mine", exact: true }).click();
  await page.getByRole("button", { name: "Go to app", exact: true }).click();
  await page.evaluate(() => { window.location.hash = "habits"; });
  const habitNames = page.getByRole("textbox", { name: "Habit name", exact: true });
  await expect(habitNames).toHaveCount(3);
  expect(await habitNames.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))).toEqual(
    expect.arrayContaining(["Take a daily walk", "Late-night scrolling", "Pack my gym bag"]),
  );
});
