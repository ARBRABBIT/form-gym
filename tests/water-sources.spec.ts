import { test,expect,type Page } from "@playwright/test";

async function openWater(page: Page) {
  await page.clock.setFixedTime(new Date("2026-11-26T06:30:00Z"));
  await page.setViewportSize({width:390,height:1000});
  await page.goto("/");
  await page.getByRole("button",{name:"Explore the sample journal"}).click();
  await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("button",{name:"Open water tracker",exact:true}).click();
  return page.getByLabel("Water consumed in ounces");
}

test("custom ml and ounce amounts share the existing journal total and reject oversized entries",async({page})=>{
  await openWater(page);
  await page.getByLabel("Custom water amount",{exact:true}).fill("250");
  await page.getByRole("button",{name:"Add water",exact:true}).click();
  await expect(page.locator(".water-daily-total")).toContainText("2.5 L logged");
  await page.getByLabel("Water amount unit",{exact:true}).selectOption("oz");
  await expect(page.getByLabel("Custom water amount",{exact:true})).toHaveValue("");
  await page.getByLabel("Custom water amount",{exact:true}).fill("8");
  await page.getByRole("button",{name:"Add water",exact:true}).click();
  await expect(page.locator(".water-daily-total")).toContainText("2.74 L logged");
  await page.getByLabel("Water amount unit",{exact:true}).selectOption("ml");
  await page.getByLabel("Custom water amount",{exact:true}).fill("5001");
  await page.getByRole("button",{name:"Add water",exact:true}).click();
  await expect(page.locator(".water-custom-entry").getByRole("alert")).toContainText("5,000 ml");
  await expect(page.locator(".water-daily-total")).toContainText("2.74 L logged");
  await page.getByRole("button",{name:"Back to journal",exact:true}).click();
  await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("button",{name:"Food",exact:true}).click();
  await expect(page.locator(".water-entry")).toContainText("2.74 L logged");
});

test("bottle setup stays explicitly pending and never changes logged water",async({page})=>{
  const amount = await openWater(page);
  const before = await amount.innerText();
  await page.getByRole("tab",{name:"Manual entry",exact:true}).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab",{name:"Smart bottle",exact:true})).toHaveAttribute("aria-selected","true");
  const bottle = page.getByRole("region",{name:"Smart bottle connection",exact:true});
  await expect(bottle).toContainText("Not connected");
  await bottle.getByRole("button",{name:"Set up smart bottle",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Set up smart bottle",exact:true});
  await dialog.getByLabel("Bottle brand and model").fill("My smart bottle model");
  await dialog.getByLabel("Bottle name").fill("Training bottle");
  await dialog.getByRole("button",{name:"Save bottle details",exact:true}).click();
  await expect(dialog).toBeHidden();
  await expect(bottle).toContainText("Training bottle");
  await expect(bottle).toContainText("Connection pending");
  await expect(amount).toHaveText(before);
  await page.getByRole("button",{name:"Back to journal",exact:true}).click();
  await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("button",{name:"Open water tracker",exact:true}).click();
  await page.getByRole("tab",{name:"Smart bottle",exact:true}).click();
  await expect(bottle).toContainText("Training bottle");
  await bottle.getByRole("button",{name:"Remove bottle",exact:true}).click();
  await expect(bottle).toContainText("Not connected");
  await expect(amount).toHaveText(before);
});

test("sample bottle activity is separate from the daily total",async({page})=>{
  const amount = await openWater(page);
  const before = await amount.innerText();
  await page.getByRole("tab",{name:"Smart bottle",exact:true}).click();
  await page.getByRole("button",{name:/Preview bottle readings/}).click();
  const preview = page.getByRole("region",{name:"Sample bottle readings",exact:true});
  await expect(preview.locator("li")).toHaveCount(3);
  await expect(preview).toContainText("750");
  await expect(preview).toContainText("not added to your daily total");
  await expect(amount).toHaveText(before);
  await page.getByRole("tab",{name:"Smart bottle",exact:true}).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab",{name:"Manual entry",exact:true})).toHaveAttribute("aria-selected","true");
  await expect(page.getByLabel("Custom water amount",{exact:true})).toBeVisible();
});

test("both source panels and setup fit narrow phones and desktop",async({page})=>{
  await openWater(page);
  for(const width of [320,390,760,1440]) {
    await page.setViewportSize({width,height:1000});
    for(const name of ["Manual entry","Smart bottle"]) {
      await page.getByRole("tab",{name,exact:true}).click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({width:320,height:1000});
  await page.getByRole("button",{name:"Set up smart bottle",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Set up smart bottle",exact:true});
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("named bottle options retain their distinct connection requirements",async({page})=>{
  const amount = await openWater(page);
  const before = await amount.innerText();
  await page.getByRole("tab",{name:"Smart bottle",exact:true}).click();
  await page.getByRole("button",{name:"Set up smart bottle",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Set up smart bottle",exact:true});
  await dialog.getByText("HidrateSpark PRO 2",{exact:true}).click();
  await expect(dialog).toContainText("Vendor access required");
  await expect(dialog.getByLabel("Bottle brand and model")).toHaveCount(0);
  await dialog.getByRole("button",{name:"Save bottle details",exact:true}).click();
  const bottle = page.getByRole("region",{name:"Smart bottle connection",exact:true});
  await expect(bottle).toContainText("HidrateSpark PRO 2");
  await expect(bottle).toContainText("Connection pending");
  await expect(amount).toHaveText(before);
  await bottle.getByRole("button",{name:"Edit bottle",exact:true}).click();
  await expect(dialog.getByRole("radio",{name:/HidrateSpark PRO 2/})).toBeChecked();
  await dialog.getByText("LARQ PureVis 2",{exact:true}).click();
  await expect(dialog).toContainText("iPhone connection required");
  await expect(dialog).toContainText("not available on this web screen");
  await expect(dialog.getByRole("link",{name:/LARQ Apple Health guide/})).toHaveAttribute("href","https://support.livelarq.com/hc/en-us/articles/37061029850011-Apple-Health-compatibility");
  await dialog.getByRole("button",{name:"Save bottle details",exact:true}).click();
  await expect(bottle).toContainText("LARQ PureVis 2");
  await expect(bottle).toContainText("iPhone connection required");
  await expect(bottle).toContainText("Connection pending");
  await expect(amount).toHaveText(before);
});
