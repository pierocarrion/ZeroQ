import { test, expect } from '@playwright/test';

test('navigating to /app/plan has no runtime chunk errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/app/plan');
  await page.waitForLoadState('networkidle');
  // click nav to dashboard and back to exercise client-side navigation
  await page.click('text=Risk Dashboard');
  await page.waitForURL('/app/dashboard');
  await page.click('text=Org Security Plan');
  await page.waitForURL('/app/plan');
  await page.waitForLoadState('networkidle');
  expect(errors.filter((e) => /is not a function|chunk|webpack/i.test(e))).toEqual([]);
});
