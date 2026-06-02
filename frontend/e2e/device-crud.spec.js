import { test, expect } from '@playwright/test';

test.describe('Device CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Create device and verify in inventory', async ({ page }) => {
    // Navigate to device creation
    await page.goto('/devices/new');
    await page.waitForLoadState('networkidle');

    // Fill device form (adjust selectors as needed)
    await page.fill('input[placeholder*="Inv"]', 'TEST-E2E-001');
    await page.fill('input[placeholder*="Denumire"]', 'Test Device E2E');

    // Select risk class
    await page.click('select, [role="combobox"]');
    await page.click('text=IIb, button:has-text("IIb")');

    // Select section
    await page.click('[placeholder*="Secție"]');
    await page.click('text=TEST, option:has-text("TEST")');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success toast or redirect
    await page.waitForURL('**/devices/**', { timeout: 5000 });

    // Verify device appears in inventory table
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=TEST-E2E-001')).toBeVisible({ timeout: 3000 });
  });

  test('Edit device and verify changes', async ({ page }) => {
    // Navigate to inventory
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Find and click edit on first device
    const firstDeviceRow = page.locator('table tbody tr').first();
    await firstDeviceRow.locator('button:has-text("Editează"), a:has-text("Editează")').click();

    await page.waitForLoadState('networkidle');

    // Modify device name
    const nameInput = page.locator('input[placeholder*="Denumire"]');
    await nameInput.clear();
    await nameInput.fill('Updated Device Name E2E');

    // Save
    await page.click('button[type="submit"]');
    await page.waitForURL('**/devices/**', { timeout: 5000 });

    // Verify change in inventory
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Updated Device Name E2E')).toBeVisible({ timeout: 3000 });
  });

  test('Delete device (soft delete to CASAT)', async ({ page }) => {
    // Navigate to inventory
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Find a device and click delete
    const deviceToDelete = page.locator('text=TEST-E2E').first();
    await deviceToDelete.locator('../.. button:has-text("Șterge"), ../.. button[aria-label*="delete"]').click();

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Confirmă"), button:has-text("Da")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // Verify device is hidden from active list
    await page.waitForLoadState('networkidle');
    const deletedCount = await page.locator('text=TEST-E2E').count();
    expect(deletedCount).toBeLessThan(1);
  });
});
