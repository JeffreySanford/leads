import { test, expect } from '@playwright/test';

// Visual regression: header navigation + Pack Leads LIVE badge
test.describe('Header & Pack Leads visual', () => {
  test('toolbar shows navigation buttons and Pack Leads card shows LIVE badge', async ({ page }) => {
    await page.goto('/pack');
    await page.waitForSelector('mat-toolbar');

    const toolbar = page.locator('mat-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('a.nav-btn', { hasText: 'Leads' })).toBeVisible();
    await expect(toolbar.locator('a.nav-btn', { hasText: 'Search SAM' })).toBeVisible();

    const packCard = page.locator('app-pack-leads mat-card');
    await expect(packCard.locator('.title-text')).toBeVisible();

    // By default the app starts in LIVE mode (showSampleData = false)
    await expect(packCard.locator('.live-badge')).toBeVisible();

    // Capture visual snapshots (will be added to Playwright's snapshot store on first run)
    await expect(toolbar).toHaveScreenshot('header-toolbar-nav.png');
    await expect(packCard).toHaveScreenshot('pack-leads-card.png');
  });
});
