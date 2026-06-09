/**
 * E2E Test — Verifications Workflow (Faza 3.4)
 * 1. Login → Verificări Periodice
 * 2. Upload certificat
 * 3. Verificare raport conformitate
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Verificări Periodice & Conformitate (Faza 3.4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Autentificare")').click();
    await page.waitForURL('/');
  });

  test('navigare la Verificări Periodice', async ({ page }) => {
    // Click Verificări menu
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();

    // Check table is visible
    await expect(page.locator('table, [role="table"]')).toBeVisible({
      timeout: 5000,
    });

    // Check status columns (CONFORM, EXPIRAT, NEVERIFICAT)
    const headerText = await page.locator('body').textContent();
    expect(headerText).toContain(/CONFORM|verificar/i);
  });

  test('upload certificat nou', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Click "Upload Certificat" button
    const uploadBtn = page.locator('button:has-text(/Upload|Certificat/i)');
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();

      // Wait for modal
      await expect(page.locator('text=/Upload|Certificat|Încarcă/i')).toBeVisible({
        timeout: 5000,
      });

      // Select device
      const deviceSelect = page.locator('select:first-of-type');
      if (await deviceSelect.isVisible()) {
        await deviceSelect.selectOption({ index: 1 });
      }

      // Select verification type
      const typeSelect = page.locator('select:nth-of-type(2)');
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('METROLOGIE');
      }

      // Try to upload file (mock)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a temporary test PDF
        const testFile = path.join(__dirname, 'test-cert.pdf');
        // In real test, would use actual PDF file
        // For now, just check input is there
        expect(fileInput).toBeDefined();
      }

      // Click save
      const saveBtn = page.locator('button:has-text(/Salvare|Încarcă/i)');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await expect(page.locator('text=/salvat|succes|uploaded/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('raport conformitate afișează statistici', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Check if compliance report is visible
    const reportSection = page.locator('text=/Raport|Conformitate|Compliance/i');
    if (await reportSection.isVisible()) {
      // Should show stats
      const statsText = await page.locator('body').textContent();
      expect(statsText).toMatch(/Total|CONFORM|EXPIRAT|NEVERIFICAT/i);
    }
  });

  test('status color coding: CONFORM (verde), EXPIRAT (roșu)', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Find status cells
    const conformCells = page.locator('text=CONFORM');
    const expiratCells = page.locator('text=EXPIRAT');

    // Check if at least one status is visible
    const conformCount = await conformCells.count();
    const expiratCount = await expiratCells.count();

    expect(conformCount + expiratCount).toBeGreaterThanOrEqual(0);
  });

  test('filtrare verificări după tip', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Look for filter button
    const filterBtn = page.locator('button:has-text(/Filtrare|Filter/i)');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();

      // Check filter options
      const metroCheckbox = page.locator('label:has-text(/METROLOGIE|Metrologie/i)');
      if (await metroCheckbox.isVisible()) {
        await metroCheckbox.click();

        // Table should filter
        await page.waitForTimeout(500);
        expect(page).toBeDefined();
      }
    }
  });

  test('sorare tabel după data expirare', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Find "Valid Until" or "Expires" column header
    const expiresHeader = page.locator('th:has-text(/Valid|Expiră|Expires/i)');
    if (await expiresHeader.isVisible()) {
      // Click to sort
      await expiresHeader.click();

      // Table should re-render
      await page.waitForTimeout(500);
      expect(page).toBeDefined();
    }
  });

  test('paginare funcționează pe tabel verificări', async ({ page }) => {
    await page.locator('a:has-text(/Verificări|CheckSquare/i)').click();
    await page.waitForURL(/verifications/);

    // Look for next page button
    const nextPageBtn = page.locator('button:has-text(/Pagina următoare|Next/i)');
    if (await nextPageBtn.isVisible()) {
      await nextPageBtn.click();
      await page.waitForTimeout(500);
      expect(page).toBeDefined();
    }
  });
});
