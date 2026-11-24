import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => sessionStorage.setItem("form-sample", "true"));
});

async function selectMonth(page: Page, value: string) {
  await page
    .getByRole("button", { name: "Month and year", exact: true })
    .click();
  const popup = page.getByRole("dialog", { name: "Choose month and year" });
  await popup.getByRole("listbox", {name:"Year", exact:true}).pressSequentially(String(Number(value.split("-")[0])));
  const month = new Date(value + "-01T12:00:00").toLocaleDateString("en-US", { month:"long" });
  await popup.getByRole("listbox", {name:"Month", exact:true}).pressSequentially(month);
  await popup.getByRole("button", {name:"Done", exact:true}).click();
}

test("trainer plan and member actual remain linked and independent through later edits", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  await page
    .getByRole("button", { name: "Edit assignment", exact: true })
    .click();
  await page
    .getByLabel("Muscle Group", { exact: true })
    .fill("Upper body — coached session");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Upper body — coached session" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Member view" }).click();
  await expect(
    page.getByRole("heading", { name: "Upper body — coached session" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View & log workout" }).click();
  await page
    .getByRole("button", { name: "Start logging", exact: true })
    .click();
  await page.getByLabel("Start", { exact: true }).fill("07:00");
  await page.getByLabel("Finish", { exact: true }).fill("08:00");
  await page.getByLabel("Total Time (minutes)", { exact: true }).fill("60");
  await page
    .getByLabel("Barbell bench press Set 1 Reps", { exact: true })
    .fill("11");
  await page
    .getByLabel("Barbell bench press Set 1 Weight", { exact: true })
    .fill("42.5");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Felt strong. Kept a controlled tempo.");
  await page
    .getByRole("button", { name: "Save workout log", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Update workout log", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  await page
    .getByRole("button", { name: "Member’s actual log", exact: false })
    .click();
  await expect(
    page.getByText("Felt strong. Kept a controlled tempo.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Assigned plan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit assignment", exact: true })
    .click();
  await page
    .getByLabel("Muscle Group", { exact: true })
    .fill("Updated plan after submission");
  await page
    .getByLabel("Barbell bench press Set 1 Reps", { exact: true })
    .fill("8");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Updated plan after submission" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Member’s actual log", exact: false })
    .click();
  await expect(
    page.getByText("Felt strong. Kept a controlled tempo.", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const persisted = JSON.parse(
          localStorage.getItem("form-journal-v1") || "{}",
        );
        return Object.values(persisted.plans || {}).map(
          (plan: unknown) => (plan as { muscle: string }).muscle,
        );
      }),
    )
    .toContain("Updated plan after submission");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("form-journal-v1") || "{}"),
  );
  const k = Object.keys(saved.logs)[0];
  expect(saved.logs[k].exercises[0].sets[0]).toEqual({
    reps: "11",
    weight: "42.5",
  });
  expect(saved.logs[k].planSnapshot.muscle).toBe(
    "Upper body — coached session",
  );
  expect(saved.plans[k].muscle).toBe("Updated plan after submission");
  await page.reload();
  await expect(page.getByRole("tab", { name: "Trainer view" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("nutrition totals derive from all meal items and survive reload", async ({
  page,
}) => {
  await page.goto("/#nutrition");
  const section = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Lunch", exact: true }) });
  await section.getByRole("button", { name: "Add food" }).click();
  await page
    .getByLabel("Product", { exact: false })
    .pressSequentially("Rice and lentils");
  await page.getByLabel("Serving Size", { exact: true }).fill("300 g");
  await page.getByLabel("Calories (kcal)", { exact: true }).fill("450");
  await page.getByLabel("Protein (g)", { exact: true }).fill("20");
  await page.getByLabel("Carbs (g)", { exact: true }).fill("70");
  await page.getByLabel("Fat (g)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Save food item" }).click();
  await expect(page.locator(".daily-totals")).toContainText("770");
  await expect(page.locator(".daily-totals")).toContainText("44");
  await expect(page.locator(".daily-totals")).toContainText("112");
  await expect(page.locator(".daily-totals")).toContainText("16");
  await expect(
    page.getByText("Saved on this browser", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Rice and lentils", { exact: true }),
  ).toBeVisible();
});

test("monthly planner uses a valid leap-year calendar", async ({ page }) => {
  await page.goto("/#planner");
  await selectMonth(page, "2028-02");
  await expect(page.locator(".full-calendar .calendar-cells button")).toHaveCount(29);
});

test("all 100 challenge days are reachable and independently persistent", async ({
  page,
}) => {
  await page.goto("/#challenge");
  await expect(page.locator(".challenge-grid button")).toHaveCount(100);
  await page
    .getByRole("button", { name: "Challenge day 100", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Challenge day 100", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Challenge day 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Challenge day 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByText("Saved on this browser", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Challenge day 100", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Challenge day 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("desktop and phone screens render without horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page
      .getByRole("heading", {
        name: /journal/i,
      })
      .first(),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByText("Saved on this browser", { exact: true }),
  ).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  for (const route of [
    "overview",
    "planner",
    "habits",
    "challenge",
    "weight",
    "results",
    "review",
    "nutrition",
    "workout",
    "onboarding",
  ]) {
    await page.goto("/#" + route);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + " overflows",
    ).toBe(true);
    if (["results", "workout", "nutrition", "onboarding"].includes(route))
      await page.screenshot({
        path: ".impeccable/review/" + route + "-mobile.png",
        fullPage: true,
      });
  }
  await page.goto("/");
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await expect(
    page.getByRole("heading", { name: "Members", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/trainer-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Members", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/trainer-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("month-specific goals preserve previous months and migrate legacy browser data", async ({
  page,
}) => {
  await page.goto("/#planner");
  await expect(
    page.getByText("Saved on this browser", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("form-journal-v1")))
    .not.toBeNull();
  await page.evaluate(() => {
    const old = JSON.parse(localStorage.getItem("form-journal-v1") || "{}");
    old.month = "2026-11";
    old.goals = ["November priority", "", "", ""];
    delete old.goalsByMonth;
    localStorage.setItem("form-journal-v1", JSON.stringify(old));
  });
  await page.reload();
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue(
    "November priority",
  );
  await selectMonth(page, "2026-12");
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue("");
  await page.getByLabel("Goal 1", { exact: true }).fill("December priority");
  await selectMonth(page, "2026-11");
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue(
    "November priority",
  );
  await expect(
    page.getByText("Saved on this browser", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue(
    "November priority",
  );
  await selectMonth(page, "2026-12");
  await expect(page.getByLabel("Goal 1", { exact: true })).toHaveValue(
    "December priority",
  );
});

test("dashboard centers today and prevents future date selection", async ({
  page,
}) => {
  await page.goto("/");
  const picker = page.getByLabel("Dashboard date", { exact: true });
  await expect(picker).toBeAttached();
  const today = (await picker.getAttribute("data-date"))!;
  const days = page.locator(".week-day");
  const track = page.locator(".date-strip-track");
  const current = page.locator('.week-day[aria-current="date"]');
  await expect(current).toHaveAttribute("aria-pressed", "true");
  const visibleCount = () => track.evaluate(el => {
    const bounds=el.getBoundingClientRect();
    return [...el.querySelectorAll('.week-day')].filter(day=>{
      const r=day.getBoundingClientRect();
      return r.left>=bounds.left-1 && r.right<=bounds.right+1;
    }).length;
  });
  await expect.poll(visibleCount).toBe(6);
  for (const day of await days.all()) {
    const isFuture = Number(await day.locator('strong').innerText()) > Number(today.slice(8));
    if (isFuture) await expect(day).toBeDisabled(); else await expect(day).toBeEnabled();
  }
  await expect(page.getByRole("button", {name:"Later dates",exact:true})).toBeDisabled();
  await picker.click();
  const calendar = page.getByRole("dialog", {
    name: "Choose date",
    exact: true,
  });
  const tomorrow = new Date(today + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowLabel = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  await expect(
    calendar.getByRole("button", { name: tomorrowLabel, exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(picker).toHaveAttribute("data-date", today);
  const earlier = page.getByRole('button', {name:'Earlier dates',exact:true});
  const later = page.getByRole('button', {name:'Later dates',exact:true});
  for (let i=0;i<12 && (await track.evaluate(el=>el.scrollLeft))>2;i++) {
    const before = await track.evaluate(el=>el.scrollLeft);
    await earlier.click();
    await expect.poll(()=>track.evaluate(el=>el.scrollLeft)).toBeLessThan(before);
  }
  await expect(earlier).toBeDisabled();
  await expect.poll(()=>track.evaluate(el=>el.scrollLeft)).toBe(0);
  await expect(picker).toHaveAttribute('data-date',today);
  await expect(days.first()).toBeInViewport();
  await expect.poll(visibleCount).toBe(6);
  await later.click();
  await expect.poll(()=>track.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await current.focus();
  await current.press('Home');
  await expect(picker).toHaveAttribute('data-date',today.slice(0,8)+'01');
  await expect(days.first()).toHaveAttribute('aria-pressed','true');
  await expect(earlier).toBeDisabled();
});

test("member set checkboxes sync live to trainer and preserve plans and logs", async ({
  page,
  context,
}) => {
  await page.goto("/#workout");
  const firstName = "Barbell bench press Set 1 complete";
  const secondName = "Barbell bench press Set 2 complete";
  const first = page.getByRole("checkbox", { name: firstName, exact: true });
  await expect(first).toBeEnabled();
  await expect(first).not.toBeChecked();
  await first.check();
  await expect(first).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("form-journal-v1") || "{}");
        return Object.values(s.setCompletions || {}).some(
          (e: unknown) => (e as Record<string, boolean[]>).e1?.[0],
        );
      }),
    )
    .toBe(true);
  const trainer = await context.newPage();
  await trainer.goto("/#trainer");
  await trainer.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  const trainerFirst = trainer.getByRole("checkbox", {
    name: firstName,
    exact: true,
  });
  await expect(trainerFirst).toBeChecked();
  await expect(trainerFirst).toBeDisabled();
  await first.uncheck();
  await expect(trainerFirst).not.toBeChecked();
  await first.check();
  await expect(trainerFirst).toBeChecked();
  // Checking sets does not fabricate actual reps or submit a workout log.
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("form-journal-v1") || "{}"),
  );
  expect(Object.keys(before.logs)).toHaveLength(0);
  expect(Object.values(before.plans)[0]).toMatchObject({
    exercises: [
      {
        id: "e1",
        name: "Barbell bench press",
        sets: [
          { reps: "10", weight: "40" },
          { reps: "10", weight: "40" },
          { reps: "10", weight: "40" },
          { reps: "", weight: "" },
          { reps: "", weight: "" },
          { reps: "", weight: "" },
        ],
      },
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ],
  });
  await page
    .getByRole("button", { name: "Start logging", exact: true })
    .click();
  await page
    .getByLabel("Barbell bench press Set 1 Reps", { exact: true })
    .fill("11");
  await page
    .getByLabel("Barbell bench press Set 1 Weight", { exact: true })
    .fill("42.5");
  await page.getByRole("checkbox", { name: secondName, exact: true }).check();
  await expect(
    page.getByLabel("Barbell bench press Set 1 Reps", { exact: true }),
  ).toHaveValue("11");
  await page
    .getByRole("button", { name: "Save workout log", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Update workout log", exact: true }),
  ).toBeVisible();
  await trainer
    .getByRole("button", { name: "Member’s actual log", exact: false })
    .click();
  await expect(
    trainer.getByRole("checkbox", { name: firstName, exact: true }),
  ).toBeChecked();
  await expect(
    trainer.getByRole("checkbox", { name: secondName, exact: true }),
  ).toBeChecked();
  await trainer
    .getByRole("button", { name: "Assigned plan", exact: true })
    .click();
  await trainer
    .getByRole("button", { name: "Edit assignment", exact: true })
    .click();
  await trainer
    .getByLabel("Barbell bench press Set 1 Reps", { exact: true })
    .fill("8");
  await trainer
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(
    trainer.getByRole("checkbox", { name: firstName, exact: true }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: firstName, exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: secondName, exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "My saved log", exact: true }).click();
  await expect(
    page.getByLabel("Barbell bench press Set 1 Reps", { exact: true }),
  ).toHaveValue("11");
  await expect(
    page.getByLabel("Barbell bench press Set 1 Weight", { exact: true }),
  ).toHaveValue("42.5");
  await page.screenshot({
    path: ".impeccable/review/set-completion-member.png",
    fullPage: true,
  });
  await trainer
    .getByRole("button", { name: "Member’s actual log", exact: false })
    .click();
  await trainer.screenshot({
    path: ".impeccable/review/set-completion-trainer.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: ".impeccable/review/set-completion-mobile.png",
    fullPage: true,
  });
});

test("wheel month selector supports scrolling, keyboard selection, cancellation and mobile layout", async ({ page }) => {
  await page.goto("/#weight");
  const trigger = page.getByRole("button", {name:"Month and year",exact:true});
  const initialLabel = await trigger.innerText();
  await trigger.click();
  const popup = page.getByRole("dialog", {name:"Choose month and year"});
  const month = popup.getByRole("listbox", {name:"Month",exact:true});
  const year = popup.getByRole("listbox", {name:"Year",exact:true});
  await expect(month).toBeFocused();
  const originalYear = await year.getByRole("option", {selected:true}).innerText();
  await year.press("ArrowDown");
  await expect(year.getByRole("option", {selected:true})).toHaveText(String(Number(originalYear)+1));
  await year.press("ArrowUp");
  await expect(year.getByRole("option", {selected:true})).toHaveText(originalYear);
  await expect(year.getByRole("option")).toHaveCount(11);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText(initialLabel);
  await selectMonth(page,"2027-02");
  await expect(trigger).toContainText("February 2027");
  await expect(page.getByText("No entries this month. Add your first check-in.",{exact:true})).toBeVisible();
  await trigger.click();
  await month.press("ArrowDown");
  await expect(month.getByRole("option", {selected:true})).toHaveText("March");
  await month.press("Enter");
  await expect(trigger).toContainText("March 2027");
  await trigger.click();
  await month.press("End");
  await popup.getByRole("button", {name:"Cancel",exact:true}).click();
  await expect(trigger).toContainText("March 2027");
  await trigger.click();
  await month.hover();
  await page.mouse.wheel(0,120);
  await expect(month.getByRole("option", {selected:true})).toHaveText("June");
  await popup.getByRole("button", {name:"Done",exact:true}).click();
  await expect(trigger).toContainText("June 2027");
  await trigger.click();
  await popup.getByRole("button", {name:"This month",exact:true}).click();
  await expect(trigger).toHaveText(initialLabel);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await trigger.click();
  await page.screenshot({path:".impeccable/review/month-picker-mobile.png",animations:"disabled"});
  const bounds = await popup.boundingBox();
  expect(bounds?.x).toBe(0);
  expect(Math.round((bounds?.y||0)+(bounds?.height||0))).toBe(844);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
});

test("custom dashboard calendar selects past dates, blocks future dates and works on mobile", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Dashboard date",
    exact: true,
  });
  const today = (await trigger.getAttribute("data-date"))!;
  const label = (key: string) =>
    new Date(key + "T12:00:00Z").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  const popup = page.getByRole("dialog", { name: "Choose date", exact: true });
  await trigger.click();
  await expect(popup).toBeVisible();
  await expect(
    popup.getByRole("button", { name: label(today), exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(popup.locator(".date-picker-days .selected")).toHaveCSS(
    "background-color",
    "rgb(183, 239, 57)",
  );
  await expect(
    popup.getByRole("button", { name: "Next month", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: ".impeccable/review/date-picker-desktop.png",
    animations: "disabled",
  });
  await popup
    .getByRole("button", {
      name: "Choose calendar month and year",
      exact: true,
    })
    .click();
  const pastYear = Number(today.slice(0, 4)) - 1;
  await popup
    .getByRole("spinbutton", { name: "Year", exact: true })
    .fill(String(pastYear));
  await popup
    .getByRole("button", { name: `January ${pastYear}`, exact: true })
    .click();
  const past = `${pastYear}-01-15`;
  await popup.getByRole("button", { name: label(past), exact: true }).click();
  await expect(popup).not.toBeVisible();
  await expect(trigger).toHaveAttribute("data-date", past);
  await expect(page.locator(".date-strip-track").getByRole("button", { name: label(past), exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await trigger.click();
  await popup.getByRole("button", { name: "Today", exact: false }).click();
  await expect(trigger).toHaveAttribute("data-date", today);
  await trigger.click();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  const yesterday = new Date(today + "T12:00:00Z");
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  await expect(trigger).toHaveAttribute(
    "data-date",
    yesterday.toISOString().slice(0, 10),
  );
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await trigger.click();
  await expect(popup).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/date-picker-mobile.png",
    animations: "disabled",
  });
  const bounds = await popup.boundingBox();
  expect(bounds?.x).toBe(0);
  expect(Math.round((bounds?.y || 0) + (bounds?.height || 0))).toBe(844);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await popup.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(popup).not.toBeVisible();
});

test("member workout library persists full templates and copies them independently into assignments", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Workout library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No saved workouts yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New workout", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save workout template", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Workout name", { exact: false }).fill("Upper A");
  await page
    .getByLabel("Muscle Group", { exact: true })
    .fill("Upper library strength");
  await page
    .getByLabel("Warm Up", { exact: true })
    .fill("Row for five minutes");
  await page
    .getByLabel("Cool Down", { exact: true })
    .fill("Shoulder stretches");
  await page.getByRole("button", { name: "Add exercise", exact: true }).click();
  await page
    .getByLabel("Exercise", { exact: true })
    .fill("Incline dumbbell press");
  await page
    .getByLabel("Incline dumbbell press Set 1 Reps", { exact: true })
    .fill("12");
  await page
    .getByLabel("Incline dumbbell press Set 1 Weight", { exact: true })
    .fill("16");
  await page
    .getByLabel("Incline dumbbell press Set 6 Reps", { exact: true })
    .fill("8");
  await page
    .getByLabel("Incline dumbbell press Set 6 Weight", { exact: true })
    .fill("18");
  await page
    .getByRole("button", { name: "Add cardio entry", exact: true })
    .click();
  await page.getByLabel("Type", { exact: true }).fill("Cycling");
  await page.getByLabel("Time (minutes)", { exact: true }).fill("20");
  await page.getByLabel("Distance (km)", { exact: true }).fill("3");
  await page.getByLabel("Calories (kcal)", { exact: true }).fill("100");
  await page.getByLabel("Notes", { exact: true }).fill("Controlled tempo");
  await page
    .getByRole("button", { name: "Save workout template", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Upper A", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("form-journal-v1") || "{}")
            .workoutLibrary?.length,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Edit Upper A", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/workout-library-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Workout library", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/workout-library-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await page.getByRole("button", { name: /MI Meera Iyer/ }).click();
  await page
    .getByRole("button", { name: "Assign workout", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose template", exact: true })
    .click();
  const chooser = page.getByRole("dialog", {
    name: "Choose a workout",
    exact: true,
  });
  await chooser
    .getByLabel("Search workout templates", { exact: true })
    .pressSequentially("Incline");
  await page.screenshot({
    path: ".impeccable/review/workout-template-picker.png",
    animations: "disabled",
  });
  await chooser
    .getByRole("button", { name: "Use Upper A", exact: true })
    .click();
  await expect(page.getByLabel("Muscle Group", { exact: true })).toHaveValue(
    "Upper library strength",
  );
  await expect(
    page.getByLabel("Incline dumbbell press Set 6 Reps", { exact: true }),
  ).toHaveValue("8");
  await expect(
    page.getByLabel("Incline dumbbell press Set 6 Weight", { exact: true }),
  ).toHaveValue("18");
  await expect(page.getByLabel("Type", { exact: true })).toHaveValue("Cycling");
  await expect(
    page.getByRole("textbox", { name: "Notes", exact: true }),
  ).toHaveValue("Controlled tempo");
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Upper library strength", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.entries(
            JSON.parse(localStorage.getItem("form-journal-v1") || "{}").plans ||
              {},
          ).filter(([k]) => k.startsWith("jamie:")).length,
      ),
    )
    .toBe(1);
  const assigned = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("form-journal-v1") || "{}");
    const key = Object.keys(s.plans).find((k) => k.startsWith("jamie:"));
    return { plan: s.plans[key!], master: s.workoutLibrary[0] };
  });
  expect(assigned.plan.exercises[0].id).not.toBe(
    assigned.master.workout.exercises[0].id,
  );
  expect(assigned.plan.exercises[0].sets).toEqual(
    assigned.master.workout.exercises[0].sets,
  );
  expect(assigned.plan.templateName).toBe("Upper A");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Workout library", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit Upper A", exact: true }).click();
  await page
    .getByLabel("Muscle Group", { exact: true })
    .fill("Updated library strength");
  await page
    .getByLabel("Incline dumbbell press Set 1 Reps", { exact: true })
    .fill("15");
  await page
    .getByRole("button", { name: "Save template changes", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("form-journal-v1") || "{}")
            .workoutLibrary?.[0].workout.muscle,
      ),
    )
    .toBe("Updated library strength");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "My members", exact: true })
    .click();
  await page.getByRole("button", { name: /MI Meera Iyer/ }).click();
  await expect(
    page.getByRole("heading", { name: "Upper library strength", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit assignment", exact: true })
    .click();
  await expect(
    page.getByLabel("Incline dumbbell press Set 1 Reps", { exact: true }),
  ).toHaveValue("12");
  await page
    .getByRole("button", { name: "Choose template", exact: true })
    .click();
  await page.getByRole("button", { name: "Use Upper A", exact: true }).click();
  await expect(page.getByLabel("Muscle Group", { exact: true })).toHaveValue(
    "Updated library strength",
  );
  await expect(
    page.getByLabel("Incline dumbbell press Set 1 Reps", { exact: true }),
  ).toHaveValue("15");
});

test("form popups keep their header visible, scroll internally and restore background position", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1200, height: 420 });
  await page.goto("/#nutrition");
  const lunch = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Lunch", exact: true }) });
  const add = lunch.getByRole("button", { name: "Add food", exact: true });
  await add.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await add.click();
  const popup = page.getByRole("dialog", { name: "Add to Lunch", exact: true });
  await expect(popup).toHaveCSS("opacity", "1");
  const close = popup.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeInViewport();
  await expect
    .poll(() =>
      popup.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        locked: document.body.style.position === "fixed",
        inert: document.querySelector<HTMLElement>(".app-shell")?.inert,
      })),
    )
    .toEqual({ locked: true, inert: true });
  const headerTop = await popup
    .locator("header")
    .evaluate((el) => el.getBoundingClientRect().top);
  await popup.locator(".sheet-body").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(close).toBeInViewport();
  expect(
    await popup
      .locator("header")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeCloseTo(headerTop, 0);
  await page.keyboard.press("Shift+Tab");
  await expect(
    popup.getByRole("button", { name: "Save food item", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.screenshot({
    path: ".impeccable/review/popup-fixed-short-desktop.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
  await expect(add).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  expect(
    await page.evaluate(
      () => document.querySelector<HTMLElement>(".app-shell")?.inert,
    ),
  ).toBe(false);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.reload();
  await add.click();
  await expect(popup).toHaveCSS("opacity", "1");
  await page.setViewportSize({ width: 390, height: 320 });
  await expect
    .poll(() =>
      popup.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
    )
    .toBe(true);
  await popup
    .getByRole("textbox", { name: "Product", exact: false })
    .pressSequentially("Paneer");
  await popup.getByLabel("Calories (kcal)", { exact: true }).fill("150");
  await popup.locator(".sheet-body").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(close).toBeInViewport();
  await expect(
    popup.getByRole("button", { name: "Save food item", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: ".impeccable/review/popup-fixed-mobile-small.png",
    animations: "disabled",
  });
  await popup
    .getByRole("button", { name: "Save food item", exact: true })
    .click();
  await expect(popup).not.toBeVisible();
  await expect(lunch.getByText("Paneer", { exact: true })).toBeVisible();
  await expect(page.locator(".daily-totals")).toContainText("470");
});

test("date and month popups remain inside short viewports after resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 450 });
  await page.goto("/#weight");
  await page
    .getByRole("button", { name: "Month and year", exact: true })
    .click();
  const month = page.getByRole("dialog", {
    name: "Choose month and year",
    exact: true,
  });
  await page.setViewportSize({ width: 1000, height: 320 });
  await expect
    .poll(() =>
      month.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
    )
    .toBe(true);
  await month.locator(".picker-body").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(
    month.getByRole("button", { name: "Close month selector", exact: true }),
  ).toBeInViewport();
  await expect(
    month.getByRole("button", { name: "This month", exact: false }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page.goto("/");
  await page
    .getByRole("button", { name: "Dashboard date", exact: true })
    .click();
  const date = page.getByRole("dialog", { name: "Choose date", exact: true });
  await expect
    .poll(() =>
      date.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
    )
    .toBe(true);
  await date.locator(".picker-body").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(
    date.getByRole("button", { name: "Close date selector", exact: true }),
  ).toBeInViewport();
  await expect(
    date.getByRole("button", { name: "Today", exact: false }),
  ).toBeInViewport();
  await date.getByRole("button", { name: "Today", exact: false }).click();
  await expect(date).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.position)).not.toBe(
    "fixed",
  );
});

test("body comparisons retain the baseline, calculate signed changes and use the previous calendar month", async ({ page }) => {
  await page.goto('/#results');
  await page.getByLabel('Waist Before', { exact: true }).fill('84');
  await page.getByLabel('Waist Now', { exact: true }).fill('79');
  await expect(page.getByLabel('Waist change since before', { exact: true })).toHaveText('-5 cm');
  await expect(page.getByLabel('Neck change since before', { exact: true })).toHaveText('—');
  await page.getByLabel('Body Fat % Before', { exact: true }).fill('20');
  await expect(page.getByLabel('Body Fat % change since before', { exact: true })).toHaveText('-2 pp');
  await selectMonth(page, '2026-12');
  await page.getByLabel('Waist Now', { exact: true }).fill('78.5');
  await expect(page.getByLabel('Waist change since last month', { exact: true })).toHaveText('-0.5 cm');
  await expect(page.getByLabel('Waist change since before', { exact: true })).toHaveText('-5.5 cm');
  await selectMonth(page, '2027-01');
  await page.getByLabel('Waist Now', { exact: true }).fill('79.5');
  await expect(page.getByLabel('Waist change since last month', { exact: true })).toHaveText('+1 cm');
  await page.getByRole('button', { name: 'Show Chest measurement', exact: true }).click();
  await expect(page.locator('.anatomy-figure figcaption strong')).toHaveText('Chest');
  await page.getByRole('slider', { name: 'Body tilt' }).fill('10');
  await page.getByRole('button', { name: 'Reset body view' }).click();
  await expect(page.getByRole('slider', { name: 'Body tilt' })).toHaveValue('0');
  await expect(page.getByText('Saved on this browser', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Waist Before', { exact: true })).toHaveValue('84');
  await expect(page.getByLabel('Waist change since last month', { exact: true })).toHaveText('+1 cm');
  await page.getByLabel('Waist Before', { exact: true }).fill('');
  await expect(page.getByLabel('Waist change since before', { exact: true })).toHaveText('—');
});

test("trainer can view and inspect member nutrition and wellness in member detail view", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Trainer view" }).click();
  await page.getByRole("button", { name: /AS Arjun Sharma/ }).click();
  await page
    .getByRole("button", { name: "Nutrition & wellness", exact: false })
    .click();
  await expect(
    page.getByText("MEMBER’S NUTRITION & WELLNESS"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Member’s daily total" }),
  ).toBeVisible();
  await expect(page.locator(".daily-totals")).toContainText("320");
  await expect(page.locator(".daily-totals")).toContainText("24");
  await expect(page.locator(".daily-totals")).toContainText("42");
  await expect(page.locator(".daily-totals")).toContainText("6");
  await expect(page.getByText("Greek yogurt with oats")).toBeVisible();
  await expect(page.getByText("2 L logged")).toBeVisible();
});

test("journal opens and creates records when secure-context randomUUID is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
  });
  await page.goto('/#library');
  await expect(page.getByRole('heading', { name: 'Workout library', exact: true })).toBeVisible();
  await expect(page.getByText('Opening your journal…', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New workout', exact: true }).click();
  await page.getByLabel('Workout name', { exact: false }).fill('Network workout');
  await page.getByRole('button', { name: 'Add exercise', exact: true }).click();
  await page.getByLabel('Exercise', { exact: true }).fill('Squat');
  await page.getByRole('button', { name: 'Save workout template', exact: true }).click();
  await expect(page.getByText('Saved on this browser', { exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('form-journal-v1')!).workoutLibrary?.length)).toBe(1);
  const ids = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('form-journal-v1')!);
    const template = data.workoutLibrary[0];
    return [template.id, template.workout.exercises[0].id];
  });
  for (const id of ids) expect(id).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
  expect(new Set(ids).size).toBe(2);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Edit Network workout', exact: true })).toBeVisible();
});

test('navigation and set feedback remain usable during repeated motion and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#workout');
  const check = page.getByRole('checkbox', { name: 'Barbell bench press Set 1 complete', exact: true }).first();
  await check.check();
  await expect(check).toBeChecked();
  await check.uncheck();
  await check.check();
  await expect(check).toBeChecked();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('button', { name: 'Starting point & results', exact: true }).click();
  await nav.getByRole('button', { name: '100-day challenge', exact: true }).click();
  await expect(page.getByRole('heading', { name: '100-day challenge', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('.screen-content').evaluate(el => ({ opacity:getComputedStyle(el).opacity, transform:getComputedStyle(el).transform }))).toEqual({ opacity:'1', transform:'none' });
  await page.evaluate(() => window.scrollTo({top: document.body.scrollHeight, behavior:'instant'}));
  await nav.getByRole('button', { name: 'My workouts', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole('checkbox', { name: 'Barbell bench press Set 1 complete', exact: true }).first()).toBeChecked();
  await page.emulateMedia({ reducedMotion:'reduce' });
  await nav.getByRole('button', { name:'Overview', exact:true }).click();
  await expect(page.locator('.screen-content')).toHaveCSS('transform','none');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior','auto');
  await expect(nav.getByRole('button', {name:'Overview',exact:true}).locator('svg')).toHaveCSS('transform','none');
});
