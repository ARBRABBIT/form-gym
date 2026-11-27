import { test, expect, type Page } from "@playwright/test";
async function selectMemberSection(page: Page, label: string) {
  const aliases: Record<string, string> = {
    "Body & health": "Overview",
    "Nutrition & wellness": "Food",
    "Member journal": "Journal",
    Connections: "Devices",
  };
  const name = aliases[label] || label;
  const nav = page.getByRole("navigation", {
    name: "Member sections",
    exact: true,
  });
  if (["Water", "Journal", "Devices"].includes(name)) {
    await nav.getByRole("button", { name: "More", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Additional member sections" })
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
  } else await nav.getByRole("button", { name, exact: true }).click();
}
async function returnToMembers(page: Page) {
  for (
    let step = 0;
    step < 6 && (await page.locator(".member-detail-back").count());
    step++
  ) {
    const previous = await page
      .locator(".member-detail-back")
      .getAttribute("aria-label");
    await page.locator(".member-detail-back").click();
    await expect
      .poll(async () =>
        (await page.locator(".member-detail-back").count())
          ? await page.locator(".member-detail-back").getAttribute("aria-label")
          : "roster",
      )
      .not.toBe(previous);
  }
  await expect(
    page.getByRole("heading", { name: "My members", exact: true }),
  ).toBeVisible();
}

test.use({ viewport: { width: 390, height: 844 } });

test("trainer reuses member screens and edits stay separate between sample members", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore the sample journal" })
    .click();
  await expect(
    page.getByRole("heading", { name: "My members", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your members", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("searchbox", { name: "Search members", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search members", exact: true })
    .fill("Meera");
  await expect(
    page.getByRole("button", { name: /AS Arjun Sharma/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /MI Meera Iyer/ }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search members", exact: true })
    .fill("");

  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  const nav = page.getByRole("navigation", { name: "Member sections" });
  await expect(
    page.getByRole("heading", { name: "Arjun Sharma", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(
    page.getByRole("tablist", { name: "Dashboard role" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toHaveCount(0);

  await expect(page.locator(".trainer-summary-card")).toHaveCount(3);
  await expect
    .poll(() =>
      page
        .locator(".trainer-summary-card img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBeTruthy();
  const date = page.getByRole("button", {
    name: "Member journal date",
    exact: true,
  });
  await expect(date.locator("span:not(.sr-only)")).toHaveCount(0);
  const box = await date.boundingBox();
  expect(box!.x).toBeGreaterThan(250);
  await date.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Close date selector", exact: true })
    .click();

  const targets = await nav.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  expect(
    targets.every((target) => target.width >= 44 && target.height >= 44),
  ).toBeTruthy();

  await expect(
    page.getByRole("button", { name: "View body composition", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toBeVisible();
  await selectMemberSection(page, "Member journal");
  await page.getByLabel("Goal 1", { exact: true }).fill("Shared coach goal");
  await returnToMembers(page);
  await page.getByRole("button", { name: /MI Meera Iyer/ }).click();
  await selectMemberSection(page, "Member journal");
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue("");
  await page.getByLabel("Goal 1", { exact: true }).fill("Meera only");
  await returnToMembers(page);
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  await selectMemberSection(page, "Member journal");
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue(
    "Shared coach goal",
  );
});

test("trainer has complete health, journal, food, water and progress navigation on phones", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore the sample journal" })
    .click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  const nav = page.getByRole("navigation", { name: "Member sections" });
  await expect(
    page.getByRole("heading", { name: "Arjun Sharma", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(
    page.getByRole("tablist", { name: "Dashboard role" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toHaveCount(0);

  await expect(page.locator(".trainer-summary-card")).toHaveCount(3);
  await expect
    .poll(() =>
      page
        .locator(".trainer-summary-card img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBeTruthy();
  const date = page.getByRole("button", {
    name: "Member journal date",
    exact: true,
  });
  await expect(date.locator("span:not(.sr-only)")).toHaveCount(0);
  const box = await date.boundingBox();
  expect(box!.x).toBeGreaterThan(250);
  await date.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Close date selector", exact: true })
    .click();

  const targets = await nav.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  expect(
    targets.every((target) => target.width >= 44 && target.height >= 44),
  ).toBeTruthy();

  for (const [label, heading] of [
    ["Nutrition & wellness", "Daily nutrition totals"],
    ["Progress", "Body measurements over time"],
    ["Connections", "Member connections"],
  ]) {
    await selectMemberSection(page, label);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await selectMemberSection(page, "Workouts");
  await expect(
    page.getByRole("region", { name: "Workout muscle map" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Member’s actual log", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No log submitted", exact: true }),
  ).toBeVisible();
  for (const view of [
    "Body & health",
    "Progress",
    "Member journal",
    "Connections",
    "Nutrition & wellness",
    "Water",
    "Workouts",
  ]) {
    await selectMemberSection(page, view);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
    }
  }
});

test("five tabs, Overview-only date strip and detail Back preserve member context", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore the sample journal" })
    .click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  const nav = page.getByRole("navigation", {
    name: "Member sections",
    exact: true,
  });
  await expect(nav.getByRole("button")).toHaveCount(5);
  const dates = page.getByRole("region", {
    name: "Member date navigation",
    exact: true,
  });
  const calendar = page.getByRole("button", {
    name: "Member journal date",
    exact: true,
  });
  const originalDate = await calendar.getAttribute("data-date");
  await expect(
    dates.getByRole("button", { name: "Previous day", exact: true }),
  ).toHaveCount(0);
  await expect(
    dates.getByText("Recorded entries", { exact: true }),
  ).toHaveCount(0);
  await dates.locator('[aria-pressed="true"]').press("ArrowLeft");
  await expect(calendar).not.toHaveAttribute("data-date", originalDate!);
  const previousDate = await calendar.getAttribute("data-date");
  await nav.getByRole("button", { name: "Food", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Food", exact: true }),
  ).toBeVisible();
  await expect(calendar).toHaveAttribute("data-date", previousDate!);
  await nav.getByRole("button", { name: "More", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Additional member sections" })
    .getByRole("button", { name: /^Water/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Water", exact: true }),
  ).toBeVisible();
  await expect(calendar).toHaveAttribute("data-date", previousDate!);
  await page.getByRole("button", { name: "Back to Food", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Food", exact: true }),
  ).toBeVisible();
  await expect(dates).toHaveCount(0);
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await dates.locator(`button[data-date="${originalDate}"]`).click();
  await expect(calendar).toHaveAttribute("data-date", originalDate!);
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 280));
  const overviewScroll = await page.evaluate(() => window.scrollY);
  await nav.getByRole("button", { name: "Food", exact: true }).click();
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(overviewScroll);
  await nav.getByRole("button", { name: "Food", exact: true }).click();
  const food = page.locator(".food-row>button").first();
  const originalFood = (await food.textContent())!;
  await food.scrollIntoViewIfNeeded();
  const foodScroll = await page.evaluate(() => window.scrollY);
  await food.click();
  await expect(
    page.getByRole("heading", { name: "Edit food", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel(/^Product/).fill("Unsaved draft");
  await page.getByRole("button", { name: "Back to Food", exact: true }).click();
  await expect(food).toHaveText(originalFood);
  await expect
    .poll(() =>
      page.evaluate(
        (previous) => Math.abs(window.scrollY - previous),
        foodScroll,
      ),
    )
    .toBeLessThan(6);
  await nav.getByRole("button", { name: "Workouts", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit assignment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Edit workout", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Member journal date", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Back to Workouts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Workouts", exact: true }),
  ).toBeVisible();
});

test("More opens an icon-only menu with motion, focus handling and preserved page context", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const state = window as typeof window & { moreMotion: string[] };
    state.moreMotion = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (typeof options === "object" && options.id?.startsWith("trainer-more"))
        state.moreMotion.push(options.id);
      return original.call(this, frames, options);
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore the sample journal" })
    .click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  await page.evaluate(() => scrollTo(0, 240));
  const previousScroll = await page.evaluate(() => scrollY);
  const nav = page.getByRole("navigation", {
    name: "Member sections",
    exact: true,
  });
  const more = nav.getByRole("button", { name: "More", exact: true });
  await expect
    .poll(() =>
      nav
        .locator(".bottom-nav-label")
        .evaluateAll((labels) =>
          labels.every((label) => getComputedStyle(label).display === "none"),
        ),
    )
    .toBeTruthy();
  await more.click();
  const popup = page.getByRole("dialog", {
    name: "More member tools",
    exact: true,
  });
  await expect(popup).toBeVisible();
  await expect(popup.getByRole("navigation").getByRole("button")).toHaveCount(
    3,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { moreMotion: string[] }).moreMotion,
      ),
    )
    .toContain("trainer-more-panel");
  await expect
    .poll(() =>
      popup
        .locator(".trainer-more-tile")
        .evaluateAll((tiles) =>
          tiles.every((tile) => tile.textContent?.trim() === ""),
        ),
    )
    .toBeTruthy();
  await expect(
    popup.getByRole("button", { name: "Water", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    popup.getByRole("button", { name: "Close More menu", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    popup.getByRole("button", { name: "Water", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(more).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Arjun Sharma", exact: true }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(previousScroll);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    (window as typeof window & { moreMotion: string[] }).moreMotion = [];
  });
  await more.click();
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Water", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Water", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { moreMotion: string[] }).moreMotion
            .length,
      ),
    )
    .toBe(0);
  await page
    .getByRole("button", { name: "Back to Overview", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(previousScroll);
  for (const width of [320, 375, 430]) {
    await page.setViewportSize({ width, height: 851 });
    await more.click();
    await expect(popup).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
    await expect
      .poll(() =>
        popup
          .locator(".trainer-more-tile")
          .evaluateAll((tiles) =>
            tiles.every(
              (tile) =>
                tile.getBoundingClientRect().width >= 44 &&
                tile.getBoundingClientRect().height >= 44,
            ),
          ),
      )
      .toBeTruthy();
    await page.mouse.click(5, 5);
    await expect(popup).toHaveCount(0);
  }
});

test.describe("trainer month scrolling", () => {
  test.use({ hasTouch: true });
  test("touch scrolling reaches day one and selection stays smooth without delaying the date", async ({
    page,
    context,
  }) => {
    test.setTimeout(45000);
    await page.clock.install({ time: new Date("2026-11-27T06:30:00Z") });
    await page.clock.resume();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const state = window as typeof window & {
        dateFeedback: string[];
        dateOutcomes: string[];
      };
      state.dateFeedback = [];
      state.dateOutcomes = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (
          typeof options === "object" &&
          options.id === "trainer-date-selection"
        )
          state.dateFeedback.push(options.id);
        const animation = original.call(this, frames, options);
        if (
          typeof options === "object" &&
          options.id === "trainer-date-selection"
        )
          void animation.finished
            .then(() => state.dateOutcomes.push("finished"))
            .catch(() => state.dateOutcomes.push("cancelled"));
        return animation;
      };
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page
      .getByRole("group", { name: "Choose workspace" })
      .getByRole("button", { name: "Trainer", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Explore the sample journal" })
      .click();
    await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
    const strip = page.getByRole("group", { name: "Month dates", exact: true });
    const calendar = page.getByRole("button", {
      name: "Member journal date",
      exact: true,
    });
    await expect(strip.getByRole("button")).toHaveCount(30);
    await expect(calendar).toHaveAttribute("data-date", "2026-11-27");
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(500);
    const bounds = (await strip.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    for (
      let swipe = 0;
      swipe < 8 && (await strip.evaluate((el) => el.scrollLeft)) > 3;
      swipe++
    ) {
      const start = bounds.x + 32,
        end = bounds.x + bounds.width - 32,
        y = bounds.y + bounds.height / 2;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: start, y }],
      });
      for (let step = 1; step <= 12; step++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: start + ((end - start) * step) / 12, y }],
        });
        await page.waitForTimeout(12);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.waitForTimeout(100);
    }
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeLessThan(3);
    await expect(calendar).toHaveAttribute("data-date", "2026-11-27");
    const first = strip.locator('button[data-date="2026-11-01"]');
    await first.tap();
    await expect(calendar).toHaveAttribute("data-date", "2026-11-01");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { dateFeedback: string[] }).dateFeedback
              .length,
        ),
      )
      .toBe(1);
    await first.press("End");
    await expect(calendar).toHaveAttribute("data-date", "2026-11-30");
    const movement = await strip.evaluate((el) => ({
      position: el.scrollLeft,
      end: el.scrollWidth - el.clientWidth,
    }));
    expect(movement.position).toBeLessThan(movement.end - 2);
    await expect
      .poll(() =>
        strip.evaluate((el) =>
          Math.abs(el.scrollLeft - (el.scrollWidth - el.clientWidth)),
        ),
      )
      .toBeLessThan(3);
    await strip.hover();
    await page.mouse.wheel(0, -450);
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeLessThan(movement.end - 300);
    await expect(calendar).toHaveAttribute("data-date", "2026-11-30");
    await strip.locator('[aria-pressed="true"]').press("Home");
    await expect(calendar).toHaveAttribute("data-date", "2026-11-01");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeLessThan(3);
    await page.evaluate(() => {
      (window as typeof window & { dateFeedback: string[] }).dateFeedback = [];
    });
    await strip.locator('[aria-pressed="true"]').press("ArrowRight");
    await expect(calendar).toHaveAttribute("data-date", "2026-11-02");
    expect(
      await page.evaluate(
        () =>
          (window as typeof window & { dateFeedback: string[] }).dateFeedback,
      ),
    ).toEqual([]);
    await strip.hover();
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(300);
    const mouseBounds = (await strip.boundingBox())!;
    await page.mouse.move(mouseBounds.x + 60, mouseBounds.y + 34);
    await page.mouse.down();
    await page.mouse.move(
      mouseBounds.x + mouseBounds.width - 25,
      mouseBounds.y + 34,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect(calendar).toHaveAttribute("data-date", "2026-11-02");
    await expect(strip).not.toHaveAttribute("data-dragging", "true");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => {
      (window as typeof window & { dateOutcomes: string[] }).dateOutcomes = [];
    });
    await strip.locator('[aria-pressed="true"]').press("Home");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { dateOutcomes: string[] })
              .dateOutcomes[0],
        ),
      )
      .toBe("finished");
    await strip.locator('[aria-pressed="true"]').press("ArrowLeft");
    await expect(calendar).toHaveAttribute("data-date", "2026-10-31");
    await expect(strip.getByRole("button")).toHaveCount(31);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { dateOutcomes: string[] })
              .dateOutcomes[1],
        ),
      )
      .toBe("finished");
    await cdp.detach();
  });
});
