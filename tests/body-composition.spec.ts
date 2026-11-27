import { test, expect, type Page } from "@playwright/test";
import { compositionError, latestCompositionScan, type BodyCompositionScan } from "../src/lib/body-composition";

const scan = (date: string, id = date): BodyCompositionScan => ({ id, date, source: "manual", weightKg: 80, bodyFatPercent: 25, skeletalMuscleMassKg: null });
test("scan selection preserves dates, missing measurements and newest same-day entries", () => {
  expect(latestCompositionScan([],"2026-11-26")).toBeNull();
  const scans = [scan("2026-11-24"),scan("2026-11-26","first"),scan("2026-11-26","second")];
  expect(latestCompositionScan(scans,"2026-11-23")).toBeNull();
  expect(latestCompositionScan(scans,"2026-11-25")?.date).toBe("2026-11-24");
  expect(latestCompositionScan(scans,"2026-11-26")?.id).toBe("second");
  expect(latestCompositionScan(scans,"2026-11-26")?.skeletalMuscleMassKg).toBeNull();
  expect(compositionError(80,25,null)).toBe("");
  expect(compositionError(80,25,70)).toContain("fat-free mass");
  expect(compositionError(0,25,30)).not.toBe("");
  expect(compositionError(80,101,30)).not.toBe("");
});

async function openHome(page: Page) {
  await page.clock.setFixedTime(new Date("2026-11-26T06:30:00Z"));
  await page.setViewportSize({width:390,height:1000});
  await page.goto("/");
  await page.getByRole("button",{name:"Explore the sample journal"}).click();
  return page.getByRole("article",{name:"Body composition",exact:true});
}
async function changeDate(page: Page, date: string) {
  const nav = page.getByRole("navigation",{name:"Mobile navigation"});
  await nav.getByRole("button",{name:"Workout",exact:true}).click();
  await page.getByLabel("Workout date",{exact:true}).fill(date);
  await nav.getByRole("button",{name:"Home",exact:true}).click();
}

test("composition card fits phone and desktop and opens a clearly labelled sample scan", async ({page}) => {
  const card = await openHome(page);
  await expect(card.locator(".composition-source-pill")).toHaveCount(0);
  await expect(card.locator("time")).toHaveAttribute("datetime","2026-11-24");
  for (const width of [320,390,760,1440]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const bounds = (await card.boundingBox())!;
    for (const dd of await card.locator("dd").all()) {
      const reading = (await dd.boundingBox())!;
      expect(reading.x+reading.width).toBeLessThanOrEqual(bounds.x+bounds.width);
    }
  }
  await page.setViewportSize({width:320,height:1000});
  await card.getByRole("button",{name:"View body composition",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Body composition",exact:true});
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(dialog).toContainText("InBody is not connected");
  await expect(dialog).toContainText("Total body water");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("manual scan updates composition without inventing unavailable machine readings or changing past dates", async ({page}) => {
  const card = await openHome(page);
  await card.getByRole("button",{name:"View body composition",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Record a scan",exact:true}).click();
  const form = page.getByRole("dialog",{name:"Record body composition",exact:true});
  await form.getByLabel("Weight (kg)").fill("80");
  await form.getByLabel("Body fat (%)").fill("25");
  await form.getByRole("button",{name:"Save scan",exact:true}).click();
  await expect(form).toBeHidden();
  await expect(card.locator("time")).toHaveAttribute("datetime","2026-11-26");
  await expect(card.locator(".composition-primary")).toContainText("25.0");
  await expect(card.locator(".composition-secondary > div").nth(1)).toContainText("—");
  await card.getByRole("button",{name:"View body composition",exact:true}).click();
  const details = page.getByRole("dialog",{name:"Body composition",exact:true});
  await expect(details.getByText("Total body water",{exact:true})).toHaveCount(0);
  await expect(details.getByText("Basal metabolic rate",{exact:true})).toHaveCount(0);
  await expect(details.locator("dl > div").filter({has:page.getByText("Fat mass",{exact:true})})).toContainText("20.0");
  await page.keyboard.press("Escape");
  await changeDate(page,"2026-11-25");
  await expect(card.locator(".composition-source-pill")).toHaveCount(0);
  await expect(card.locator("time")).toHaveAttribute("datetime","2026-11-24");
  await changeDate(page,"2026-10-01");
  await expect(card).toContainText("No scan recorded");
  await expect(card.locator(".composition-digits")).toHaveCount(0);
});

test("inconsistent muscle values are rejected and cancelling does not change a scan", async ({page}) => {
  const card = await openHome(page);
  await card.getByRole("button",{name:"View body composition",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Record a scan",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Record body composition",exact:true});
  await dialog.getByLabel("Weight (kg)").fill("80");
  await dialog.getByLabel("Body fat (%)").fill("25");
  await dialog.getByLabel("Skeletal muscle mass (kg)").fill("70");
  await dialog.getByRole("button",{name:"Save scan",exact:true}).click();
  await expect(dialog.getByRole("alert")).toContainText("fat-free mass");
  await dialog.getByRole("button",{name:"Cancel",exact:true}).click();
  await expect(card.locator(".composition-source-pill")).toHaveCount(0);
  await expect(card.locator(".composition-primary")).toContainText("20.6");
});

test("the whole composition card opens details by touch or keyboard", async ({page}) => {
  const card = await openHome(page);
  const trigger = card.getByRole('button',{name:'View body composition',exact:true});
  const dialog = page.getByRole('dialog',{name:'Body composition',exact:true});
  for (const position of [{x:25,y:25},{x:180,y:80},{x:80,y:130}]) {
    await trigger.click({position});
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Fat-free mass');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  for (const key of ['Enter','Space']) {
    await trigger.focus();
    await page.keyboard.press(key);
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
  }
});
