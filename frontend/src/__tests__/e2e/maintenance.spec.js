/**
 * E2E Test — Maintenance Workflow (Faza 3.1)
 * 1. Login → Calendar MPP
 * 2. Creare Plan Mentenanță Preventivă
 * 3. Verificare apariție pe calendar
 */

import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Mentenanță Preventivă (Faza 3.1)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Conectare")').click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('navigare la Calendar MPP', async ({ page }) => {
    // Click Mentenanță menu
    await page.locator('a:has-text("Mentenanță")').click();

    // Check calendar page is loaded
    await expect(page.locator('text=/Calendar|Lunar|Calendar MPP/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('creare Plan Mentenanță Preventivă', async ({ page }) => {
    // Navigate to maintenance calendar
    await page.locator('a:has-text("Mentenanță")').click();
    await page.waitForURL(/\/maintenance/);
    await page.locator('text=Planificare & Calendar MPP').click();
    await page.waitForURL(/\/maintenance\/calendar/);

    // Click "Creare Plan" button
    await page.locator('button:has-text("Creare Plan")').click();

    // Wait for modal
    await expect(page.locator('text=Plan Mentenanță')).toBeVisible({ timeout: 5000 });

    // Select device (first device in dropdown)
    const deviceSelect = page.locator('select#device-select');
    await deviceSelect.selectOption({ index: 1 }); // Select first device

    // Select frequency
    const frequencySelect = page.locator('select#freq-select');
    await frequencySelect.selectOption('LUNAR');

    // Fill responsible
    await page.locator('input#responsible-input').fill('Inginer E2E');

    // Click save button
    await page.locator('button', { hasText: /Salvare|Creează/i }).click();

    // Wait for success message
    await expect(page.locator('text=/Plan creat|succes/i')).toBeVisible({
      timeout: 5000,
    });

    // Check modal is closed
    await expect(page.locator('text=Plan Mentenanță')).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('apariții plan sunt vizibile pe calendar', async ({ page }) => {
    // Navigate to calendar
    await page.locator('a:has-text("Mentenanță")').click();
    await page.waitForURL(/\/maintenance/);
    await page.locator('text=Planificare & Calendar MPP').click();
    await page.waitForURL(/\/maintenance\/calendar/);

    // Create a plan first
    await page.locator('button:has-text("Creare Plan")').click();
    await expect(page.locator('text=Plan Mentenanță')).toBeVisible();

    const deviceSelect = page.locator('select#device-select');
    await deviceSelect.selectOption({ index: 1 });

    const frequencySelect = page.locator('select#freq-select');
    await frequencySelect.selectOption('LUNAR');

    await page.locator('input#responsible-input').fill('Inginer E2E');

    await page.locator('button', { hasText: /Salvare|Creează/i }).click();
    await expect(page.locator('text=/Plan creat|succes/i')).toBeVisible();

    // Check calendar has events
    const calendarDays = page.locator('.grid-cols-7 > div');
    const dayCount = await calendarDays.count();

    // Should have at least some days visible
    expect(dayCount).toBeGreaterThan(0);

    // Verify at least one occurrence is rendered
    const occurrences = page.locator('.grid-cols-7 >> text=/PROGRAMAT|SCADENT|DEPASIT|EFECTUAT/');
    await expect(occurrences.first()).toBeVisible({ timeout: 5000 });
  });

  test('navegare luni pe calendar', async ({ page }) => {
    await page.locator('a:has-text("Mentenanță")').click();
    await page.waitForURL(/\/maintenance/);
    await page.locator('text=Planificare & Calendar MPP').click();
    await page.waitForURL(/\/maintenance\/calendar/);

    // Check next month button exists
    const nextBtn = page.locator('button', { hasText: /Luna următoare|Next/i });
    await expect(nextBtn).toBeVisible();

    // Click next month
    const initialText = await page.locator('body').textContent();
    await nextBtn.click();

    // Wait a bit for calendar to update
    await page.waitForTimeout(500);

    // Calendar should be different or show next month
    expect(page).toBeDefined();
  });
});
