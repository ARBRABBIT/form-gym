import { test, expect } from '@playwright/test';

test('local signup, edits, reload and password login work without server account storage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  await page.route(/\/api\/(account|journal|members)(\?|$)/, route => {
    requests.push(route.request().url());
    return route.fulfill({ status: 500, body: '' });
  });
  await page.goto('/');
  await expect(page.getByText('Your account and journal are saved only in this browser.', { exact: false })).toBeVisible();
  await page.getByLabel('Your name', { exact: true }).fill('Local Member');
  await page.getByLabel('Email address', { exact: true }).fill('local-member@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-password-9472');
  await page.getByRole('button', { name: 'Create my journal', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('form-local-accounts-v1') || '{}').accounts?.length)).toBe(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('form-local-accounts-v1')!));
  expect(JSON.stringify(saved)).not.toContain('Browser-password-9472');
  expect(saved.journals[saved.accounts[0].id].data.sampleData).toBe(false);
  expect(saved.journals[saved.accounts[0].id].data.onboarded).toBe(false);
  // Complete onboarding in the local journal to exercise the saved workspace directly.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('form-local-accounts-v1')!);
    data.journals[data.accounts[0].id].data.onboarded = true;
    localStorage.setItem('form-local-accounts-v1', JSON.stringify(data));
  });
  await page.reload();
  await page.evaluate(() => { location.hash = 'planner'; });
  const goal = page.getByLabel('Goal 1', { exact: true });
  await goal.fill('Keep local goals after refresh');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('form-local-accounts-v1'))).toContain('Keep local goals after refresh');
  await page.reload();
  await expect(goal).toHaveValue('Keep local goals after refresh');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByLabel('Email address', { exact: true }).fill('local-member@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Incorrect-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).last().click();
  await expect(page.locator('.account-error')).toContainText('Email or password is incorrect');
  await page.getByLabel('Password', { exact: true }).fill('Browser-password-9472');
  await page.getByRole('button', { name: 'Log in', exact: true }).last().click();
  await expect(page.getByLabel('Password', { exact: true })).toBeHidden();
  await page.evaluate(() => { location.hash = 'planner'; });
  await expect(goal).toHaveValue('Keep local goals after refresh');
  expect(requests).toEqual([]);
});

test('a local trainer account opens an empty roster without contacting Vercel account APIs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  await page.route(/\/api\/(account|journal|members)(\?|$)/, route => {
    requests.push(route.request().url());
    return route.fulfill({ status: 500, body: '' });
  });
  await page.goto('/');
  await page.getByRole('group', { name: 'Choose workspace' }).getByRole('button', { name: 'Trainer', exact: true }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Local Coach');
  await page.getByLabel('Email address', { exact: true }).fill('local-coach@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-password-9472');
  await page.getByRole('button', { name: 'Create my journal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My members', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy trainer code', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My members', exact: true })).toBeVisible();
  expect(requests).toEqual([]);
});
