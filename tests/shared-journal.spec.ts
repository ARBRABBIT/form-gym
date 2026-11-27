import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { TODAY } from "../src/lib/model";
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

const origin = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const headers = { Origin: origin };
async function register(
  request: APIRequestContext,
  role = "member",
  name = "Parity Member",
) {
  const email = `parity-${crypto.randomUUID()}@example.test`;
  const r = await request.post("/api/account", {
    headers,
    data: { signup: true, email, password: "Test-password-8347", name, role },
  });
  expect(r.status(), await r.text()).toBe(200);
  const { account } = await r.json();
  const saved = await (await request.get("/api/journal")).json();
  const setup = await request.patch("/api/journal", {
    headers,
    data: {
      changes: [
        { key: "onboarded", before: saved.data.onboarded, after: true },
      ],
    },
  });
  expect(setup.ok(), await setup.text()).toBeTruthy();
  return { ...account, email, password: "Test-password-8347" };
}
async function patch(
  request: APIRequestContext,
  key: string,
  after: unknown,
  memberId?: string,
) {
  const url = memberId ? `/api/journal?memberId=${memberId}` : "/api/journal";
  const saved = await (await request.get(url)).json();
  return request.patch(url, {
    headers,
    data: { changes: [{ key, before: saved.data[key] ?? null, after }] },
  });
}
async function link(member: APIRequestContext, code: string) {
  const r = await member.post("/api/members", { headers, data: { code } });
  expect(r.ok(), await r.text()).toBeTruthy();
}

test("accounts enforce sharing, persistence, field validation and conflicting edits", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const make = async () => {
    const c = await browser.newContext({
      baseURL: origin,
      viewport: { width: 390, height: 844 },
    });
    contexts.push(c);
    return c.request;
  };
  try {
    const trainer = await make(),
      member = await make(),
      other = await make();
    const coach = await register(trainer, "trainer", "Parity Coach");
    const owner = await register(member);
    const stranger = await register(other);
    expect(
      (await trainer.get(`/api/journal?memberId=${owner.id}`)).status(),
    ).toBe(403);
    await link(member, coach.coachCode);
    expect(
      (await other.get(`/api/journal?memberId=${owner.id}`)).status(),
    ).toBe(403);
    expect(
      (await trainer.get(`/api/journal?memberId=${stranger.id}`)).status(),
    ).toBe(403);
    expect(
      (
        await trainer.get(
          `/api/whoop/metrics?date=${TODAY}&memberId=${stranger.id}`,
        )
      ).status(),
    ).toBe(403);
    expect((await patch(member, "weights", "invalid")).status()).toBe(400);
    const prior = await (await member.get("/api/journal")).json();
    expect(
      (
        await patch(
          trainer,
          "profile",
          { Name: "Shared profile", "Starting weight (kg)": "73" },
          owner.id,
        )
      ).ok(),
    ).toBeTruthy();
    // An unrelated member edit can merge, but an obsolete edit to the same field cannot.
    expect(
      (await patch(member, "planner", { [TODAY]: "Member plan" })).ok(),
    ).toBeTruthy();
    const conflict = await member.patch("/api/journal", {
      headers,
      data: {
        changes: [
          {
            key: "profile",
            before: prior.data.profile,
            after: { Name: "Obsolete" },
          },
        ],
      },
    });
    expect(conflict.status()).toBe(409);
    const next = await (await member.get("/api/journal")).json();
    expect(next.data.profile.Name).toBe("Shared profile");
    expect(next.data.planner[TODAY]).toBe("Member plan");
    const login = await make();
    expect(
      (
        await login.post("/api/account", {
          headers,
          data: {
            email: owner.email,
            password: "wrong-password",
            signup: false,
          },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await login.post("/api/account", {
          headers,
          data: { email: owner.email, password: owner.password, signup: false },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (await (await login.get("/api/journal")).json()).data.profile.Name,
    ).toBe("Shared profile");
    expect(
      (
        await member.delete("/api/members", {
          headers,
          data: { trainerId: coach.id },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (await trainer.get(`/api/journal?memberId=${owner.id}`)).status(),
    ).toBe(403);
    expect((await login.delete("/api/account", { headers })).ok()).toBeTruthy();
    expect((await login.get("/api/journal")).status()).toBe(401);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("separate trainer and member browsers share food, goals, scans, water and workouts", async ({
  browser,
}) => {
  test.setTimeout(60000);
  const trainerContext = await browser.newContext({
      baseURL: origin,
      viewport: { width: 390, height: 844 },
    }),
    memberContext = await browser.newContext({
      baseURL: origin,
      viewport: { width: 390, height: 844 },
    });
  try {
    const coach = await register(trainerContext.request, "trainer", "UI Coach");
    const member = await register(memberContext.request, "member", "UI Member");
    await link(memberContext.request, coach.coachCode);
    const seed = {
      Breakfast: [
        {
          id: "breakfast",
          product: "Oats",
          serving: "60 g",
          calories: "240",
          protein: "8",
          carbs: "40",
          fat: "4",
        },
      ],
      Lunch: [],
      Dinner: [],
      "Supplements/Snacks": [],
    };
    expect(
      (
        await patch(memberContext.request, "nutrition", {
          [TODAY]: { water: 0.25, metrics: {}, meals: seed },
        })
      ).ok(),
    ).toBeTruthy();
    const trainer = await trainerContext.newPage(),
      owner = await memberContext.newPage();
    await trainer.goto("/");
    await owner.goto("/");
    await trainer.getByRole("button", { name: /UI Member/ }).click();
    await expect(
      trainer.getByRole("heading", {
        name: "UI Member",
        exact: true,
      }),
    ).toBeVisible();
    await selectMemberSection(trainer, "Nutrition & wellness");
    await trainer.getByRole("button", { name: /^Oats/ }).click();
    await trainer.getByLabel(/^Product/).fill("Oats and yogurt");
    await trainer
      .getByRole("button", { name: "Save food item", exact: true })
      .click();
    await owner.evaluate(() => (location.hash = "nutrition"));
    await expect(
      owner.getByRole("button", { name: /^Oats and yogurt/ }),
    ).toBeVisible({ timeout: 10000 });
    await owner.getByRole("button", { name: /^Oats and yogurt/ }).click();
    await owner.getByLabel(/^Product/).fill("Oats, yogurt and berries");
    await owner
      .getByRole("button", { name: "Save food item", exact: true })
      .click();
    await expect(
      trainer.getByRole("button", { name: /^Oats, yogurt and berries/ }),
    ).toBeVisible({ timeout: 10000 });
    await selectMemberSection(trainer, "Member journal");
    await trainer
      .getByLabel("Goal 1", { exact: true })
      .fill("Build strength together");
    await owner.evaluate(() => (location.hash = "planner"));
    await expect(owner.getByLabel("Goal 1", { exact: true })).toHaveValue(
      "Build strength together",
      { timeout: 10000 },
    );
    await selectMemberSection(trainer, "Body & health");
    await trainer
      .getByRole("button", { name: "Record a scan", exact: true })
      .click();
    await trainer.getByLabel(/^Weight \(kg\)/).fill("72");
    await trainer.getByLabel(/^Body fat/).fill("20");
    await trainer
      .getByLabel("Skeletal muscle mass (kg)", { exact: true })
      .fill("32");
    await trainer
      .getByRole("button", { name: "Save scan", exact: true })
      .click();
    await owner.evaluate(() => (location.hash = "overview"));
    await expect(
      owner.getByRole("button", { name: "View body composition", exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await owner
      .getByRole("button", { name: "View body composition", exact: true })
      .click();
    await expect(
      owner
        .getByRole("dialog", { name: "Body composition", exact: true })
        .getByText("32.0", { exact: true }),
    ).toBeVisible();
    await owner.getByRole("button", { name: "Close", exact: true }).click();
    await selectMemberSection(trainer, "Workouts");
    await trainer
      .getByRole("button", { name: "Assign workout", exact: true })
      .click();
    await trainer
      .getByLabel("Muscle Group", { exact: true })
      .fill("Shared strength plan");
    await trainer
      .getByRole("button", { name: "Save assignment", exact: true })
      .click();
    await owner.evaluate(() => (location.hash = "workout"));
    await expect(
      owner.getByRole("heading", { name: "Shared strength plan", exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await owner
      .getByRole("button", { name: "Start logging", exact: true })
      .click();
    await owner
      .getByLabel("Notes", { exact: true })
      .fill("Member session notes");
    await owner
      .getByRole("button", { name: "Save workout log", exact: true })
      .click();
    await trainer
      .getByRole("button", { name: "Edit member’s actual log", exact: true })
      .click();

    await expect(trainer.getByLabel("Notes", { exact: true })).toHaveValue(
      "Member session notes",
      { timeout: 10000 },
    );
    await trainer
      .getByLabel("Notes", { exact: true })
      .fill("Coach corrected session notes");
    await trainer
      .getByRole("button", { name: "Update workout log", exact: true })
      .click();
    await expect(owner.getByLabel("Notes", { exact: true })).toHaveValue(
      "Coach corrected session notes",
      { timeout: 10000 },
    );
    await selectMemberSection(trainer, "Water");
    await trainer
      .getByRole("spinbutton", { name: "Custom water amount" })
      .fill("250");
    await trainer
      .getByRole("button", { name: "Add water", exact: true })
      .click();
    await expect
      .poll(async () => {
        const r = await memberContext.request.get("/api/journal");
        return (await r.json()).data.nutrition[TODAY].water;
      })
      .toBe(0.5);
    await selectMemberSection(trainer, "Progress");
    await expect(
      trainer.getByRole("heading", { name: "Body measurements over time" }),
    ).toBeVisible();
    for (const width of [320, 375, 390, 430]) {
      await trainer.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          trainer.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
    }
    await trainer.screenshot({
      path: ".impeccable/review/trainer-progress-mobile.png",
      fullPage: false,
    });
    await trainer.setViewportSize({ width: 390, height: 844 });
    await selectMemberSection(trainer, "Body & health");
    await trainer.screenshot({
      path: ".impeccable/review/trainer-overview-mobile.png",
      fullPage: true,
    });
    await owner.evaluate(() => (location.hash = "overview"));
    await owner.reload();
    await expect(
      owner.getByRole("heading", { name: "UI Member’s journal", exact: true }),
    ).toBeVisible();
    await owner
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await owner.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(
      owner.getByLabel("Email address", { exact: true }),
    ).toBeVisible();
    expect((await memberContext.request.get("/api/journal")).status()).toBe(
      401,
    );
    await owner.reload();
    await expect(
      owner.getByLabel("Email address", { exact: true }),
    ).toBeVisible();
  } finally {
    await trainerContext.close();
    await memberContext.close();
  }
});

test("trainer signup, logout and password login work through the account form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `ui-auth-${crypto.randomUUID()}@example.test`;
  await page.goto("/");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill("Account Coach");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Coach-password-7634");
  await page
    .getByRole("button", { name: "Create my journal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My members", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".nav-scrim")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Copy trainer code", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Choose workspace" }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Choose workspace" })
    .getByRole("button", { name: "Trainer", exact: true })
    .click();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(
    page.getByText("Email or password is incorrect.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Password", { exact: true })
    .fill("Coach-password-7634");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My members", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".nav-scrim")).toHaveCount(0);
});
