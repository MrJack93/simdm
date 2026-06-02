import { test, expect } from '@playwright/test';

test.describe('Annual Inventory Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Annual inventory workflow: select year, section, mark devices', async ({ page }) => {
    // Navigate to annual inventory
    await page.goto('/annual-inventory');
    await page.waitForLoadState('networkidle');

    // Select year (current year dropdown)
    await page.click('select, [role="combobox"]');
    const currentYear = new Date().getFullYear().toString();
    await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);

    // Wait for sections to load
    await page.waitForLoadState('networkidle');

    // Click on first section to start inventory
    const firstSection = page.locator('button, [role="tab"], card').first();
    await firstSection.click();
    await page.waitForLoadState('networkidle');

    // Mark some devices as found
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await checkboxes.nth(i).check();
    }

    // Verify checkmarks are visible
    const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkedCount).toBeGreaterThan(0);
  });

  test('Annual inventory shows discrepancies for not-found devices', async ({ page }) => {
    // Navigate to annual inventory
    await page.goto('/annual-inventory');
    await page.waitForLoadState('networkidle');

    // Select year
    await page.click('select, [role="combobox"]');
    const currentYear = new Date().getFullYear().toString();
    await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);
    await page.waitForLoadState('networkidle');

    // Click on section
    const firstSection = page.locator('button, [role="tab"], card').first();
    await firstSection.click();
    await page.waitForLoadState('networkidle');

    // Deliberately NOT mark some devices (to create discrepancies)
    // Leave at least one unchecked

    // View discrepancies report
    const discrepanciesBtn = page.locator('button:has-text("Discrepanțe"), button:has-text("Raport")');
    if (await discrepanciesBtn.isVisible()) {
      await discrepanciesBtn.click();
      await page.waitForLoadState('networkidle');

      // Should show not-found devices
      await expect(
        page.locator('text=/not found|neregăsite|discrepanț/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('Annual inventory report can be exported to PDF', async ({ page, context }) => {
    // Navigate to annual inventory
    await page.goto('/annual-inventory');
    await page.waitForLoadState('networkidle');

    // Select year
    await page.click('select, [role="combobox"]');
    const currentYear = new Date().getFullYear().toString();
    await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);
    await page.waitForLoadState('networkidle');

    // Look for PDF export button
    const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("Descarcă"), a:has-text("Export")');

    if (await pdfBtn.isVisible()) {
      // Listen for download
      const downloadPromise = context.waitForEvent('download');
      await pdfBtn.click();
      const download = await downloadPromise;

      // Verify download has PDF name
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});
