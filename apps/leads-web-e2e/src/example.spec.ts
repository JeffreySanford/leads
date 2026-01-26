import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect the toolbar title to contain the app title.
  expect(await page.locator('mat-toolbar span').first().innerText()).toContain('SAM Leads Manager');
});
