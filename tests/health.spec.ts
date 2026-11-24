import { test, expect } from "@playwright/test";
const metrics = {
  configured: true,
  connected: true,
  fetchedAt: "2026-11-23T02:00:00Z",
  recovery: 78,
  hrv: 62.4,
  restingHeartRate: 56,
  spo2: 97.2,
  skinTemperature: 33.4,
  respiratoryRate: 15.2,
  sleepHours: 7.6,
  sleepPerformance: 91,
  strain: 10.4,
  steps: 6543,
  energyKcal: 1874,
  workoutCount: 1,
  workoutMinutes: 42,
};
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() =>
    sessionStorage.setItem("form-sample", "true"),
  );
});

test("scale photo prefills a draft, requires confirmation, converts pounds and saves only the number", async ({
  page,
}) => {
  await page.route("**/api/health/scale", (route) =>
    route.fulfill({
      json: { weight: 158.7, unit: "lb", needsConfirmation: true },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Morning check-in", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Morning check-in",
    exact: true,
  });
  await dialog.getByLabel("Scale photo", { exact: true }).setInputFiles({
    name: "scale.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9uoAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    dialog.getByRole("button", { name: "Read weight from photo" }),
  ).toBeEnabled();
  await dialog.getByLabel(/Allow this photo to be sent/).check();
  await dialog.getByRole("button", { name: "Read weight from photo" }).click();
  await expect(dialog.getByLabel(/Scale reading/)).toHaveValue("158.7");
  await expect(dialog.getByLabel("Weight unit")).toHaveValue("lb");
  await dialog.getByRole("button", { name: "Send check-in" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("I checked the weight and unit.").check();
  await dialog.getByLabel(/After using the bathroom/).check();
  await dialog.getByLabel("Morning notes · optional").fill("A steady morning");
  await dialog.getByRole("button", { name: "Send check-in" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toContainText("72.0 kg");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("form-journal-v1") || "{}",
          ).weights?.at(-1)?.notes,
      ),
    )
    .toBe("A steady morning");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("form-journal-v1") || "{}").weights.at(-1),
  );
  expect(saved).toMatchObject({
    weight: "72.0",
    loss: "0.2",
    source: "photo",
    afterBathroom: true,
  });
  expect(JSON.stringify(saved)).not.toContain("base64");
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toContainText("72.0 kg");
});

test("missing WHOOP data stays blank and reminder copy is selectable", async ({
  page,
  request,
  baseURL,
}) => {
  await page.route("**/api/whoop/metrics?**", (route) =>
    route.fulfill({
      json: {
        date: new URL(route.request().url()).searchParams.get("date"),
        connected: false,
        configured: false,
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("article", { name: "Blood health", exact: true }),
  ).toContainText("—");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await expect(dialog).toContainText("Morning mission: step, snap, done.");
  await dialog.getByRole("radio", { name: "A little bathroom humour" }).check();
  await expect(dialog).toContainText(
    "Bathroom business done? Scale selfie next.",
  );
  await expect(dialog.getByLabel("Reminder time zone")).toHaveValue(
    "Asia/Kolkata",
  );
  await page.screenshot({
    path: ".impeccable/review/morning-reminder-settings.png",
    fullPage: true,
  });
  const scale = await request.post("/api/health/scale", {
    headers: { Origin: baseURL! },
  });
  expect(scale.status()).toBe(503);
  const push = await request.post("/api/reminders", {
    headers: { Origin: baseURL! },
    data: {
      time: "07:30",
      timezone: "Asia/Kolkata",
      tone: "friendly",
      subscription: { endpoint: "http://127.0.0.1/private" },
    },
  });
  expect(push.status()).toBe(400);
  const run = await request.post("/api/reminders/run");
  expect(run.status()).toBe(401);
});

test("on-device OCR fills a clear scale reading without uploading the photo", async ({
  page,
}) => {
  test.setTimeout(60000);
  let uploads = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/api/health/scale") &&
      request.method() === "POST"
    )
      uploads++;
  });
  await page.goto("/");
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 260;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "white";
    context.fillRect(0, 0, 700, 260);
    context.fillStyle = "black";
    context.font = "bold 130px Arial";
    context.fillText("72.5 kg", 60, 180);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByRole("button", { name: "Morning check-in", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Morning check-in",
    exact: true,
  });
  await dialog.getByLabel("Scale photo", { exact: true }).setInputFiles({
    name: "test-scale-display.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await dialog.getByRole("button", { name: "Read weight from photo" }).click();
  await expect(dialog.getByLabel(/Scale reading/)).toHaveValue("72.5", {
    timeout: 45000,
  });
  expect(uploads).toBe(0);
  await expect(
    dialog.getByLabel("I checked the weight and unit."),
  ).not.toBeChecked();
  await page.screenshot({
    path: ".impeccable/review/scale-photo-review.png",
    fullPage: true,
  });
});

test("a declined notification permission has a friendly recovery state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "requestPermission", {
      value: async () => "denied",
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await dialog.getByRole("button", { name: "Enable daily reminder" }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "Notifications are off",
  );
});

test("morning notification deep link opens the weight form", async ({
  page,
}) => {
  await page.goto("/#morning");
  await expect(
    page.getByRole("dialog", { name: "Morning check-in", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/#overview$/);
});

test("opt-in reminder saves the chosen time zone and mood without sending a test notification", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "requestPermission", {
      value: async () => "granted",
    });
    const subscription = {
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-only",
        keys: { p256dh: "test", auth: "test" },
      }),
    };
    const registration = {
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => subscription,
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    });
  });
  let captured: { time?: string; timezone?: string; tone?: string } | null =
    null;
  await page.route("**/api/reminders", (route) =>
    route.request().method() === "POST"
      ? ((captured = route.request().postDataJSON()),
        route.fulfill({ json: { enabled: true } }))
      : route.continue(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await dialog.getByLabel(/Remind me at/).fill("08:15");
  await dialog.getByRole("radio", { name: "A little bathroom humour" }).check();
  await dialog.getByRole("button", { name: "Enable daily reminder" }).click();
  await expect(
    dialog.getByRole("button", { name: "Save reminder changes" }),
  ).toBeVisible();
  expect(captured).toMatchObject({
    time: "08:15",
    timezone: "Asia/Kolkata",
    tone: "playful",
  });
});
