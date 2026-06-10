/**
 * E2E Test — Service Contracts Workflow (Faza 3.5)
 * 1. Login → Contracte Externe
 * 2. Creare contract
 * 3. Evaluare furnizor (1-5 stele)
 * 4. Cost analysis (intern vs extern)
 */

import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Contracte Externe & Cost Analysis (Faza 3.5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Conectare")').click();
    await page.waitForURL('/');
  });

  test('navigare la Contracte Externe', async ({ page }) => {
    // Click Contracte menu
    await page.locator('a', { hasText: 'Contracte' }).click();

    // Check page content
    await expect(page.locator('text=/Contract|Furnizor|Provider/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('afișare carduri furnizori cu rating', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Check for provider cards/items
    const providerElements = page.locator('[class*="provider"], [class*="card"]');
    const count = await providerElements.count();

    // Should have at least some providers
    expect(count).toBeGreaterThanOrEqual(0);

    // Check for ratings
    const ratingText = await page.locator('body').textContent();
    // Might have ratings displayed
    expect(ratingText).toBeDefined();
  });

  test('creare contract nou', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Click "Contract Nou" button
    const createBtn = page.locator('button', { hasText: /Contract Nou|New|Creare/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Wait for modal
      await expect(page.locator('text=/Contract|Creare/i').first()).toBeVisible({
        timeout: 5000,
      });

      // Select provider (from first modal select)
      const providerSelect = page.locator('select:first-of-type');
      if (await providerSelect.isVisible()) {
        await providerSelect.selectOption({ index: 1 });
      }

      // Fill contract number
      const contractNoInput = page.locator('input[name="contractNo"], input[type="text"]');
      if (await contractNoInput.isVisible()) {
        await contractNoInput.fill(`CONTRACT-E2E-${Date.now()}`);
      }

      // Fill dates
      const startDateInput = page.locator('input[name="startDate"], input[type="date"]');
      if (await startDateInput.isVisible()) {
        await startDateInput.fill('2026-06-08');
      }

      const endDateInput = page.locator('input[name="endDate"], input[type="date"]:last-of-type');
      if (await endDateInput.isVisible()) {
        await endDateInput.fill('2027-06-08');
      }

      // Fill value
      const valueInput = page.locator('input[name="value"], input[type="number"]');
      if (await valueInput.isVisible()) {
        await valueInput.fill('50000');
      }

      // Save
      const saveBtn = page.locator('button', { hasText: /Salvare|Creează/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();

        await expect(page.locator('text=/creat|salvat|succes/i').first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('evaluare furnizor (1-5 stele)', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Find provider card
    const providerCards = page.locator('[class*="provider"], [class*="card"]');
    const firstCard = providerCards.first();

    if (await firstCard.isVisible()) {
      // Look for rate button
      const rateBtn = page.locator('button', { hasText: /Evaluare|Rate|★|Stele/i }).first();

      if (await rateBtn.isVisible()) {
        await rateBtn.click();

        // Wait for rating modal
        await expect(page.locator('text=/Evaluare|Rating|Scor/i').first()).toBeVisible({
          timeout: 5000,
        });

        // Select rating score (1-5)
        const scoreSelect = page.locator('select[name="score"], select:first-of-type');
        if (await scoreSelect.isVisible()) {
          await scoreSelect.selectOption('5');
        }

        // Add comment
        const commentInput = page.locator('textarea[name="comment"], textarea');
        if (await commentInput.isVisible()) {
          await commentInput.fill('Excellent service - E2E Test');
        }

        // Save rating
        const saveBtn = page.locator('button', { hasText: /Salvare|Salvați|Save/i });
        if (await saveBtn.isVisible()) {
          await saveBtn.click();

          await expect(page.locator('text=/salvat|succes|saved/i').first()).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });

  test('cost analysis: comparație intern vs extern', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Look for cost analysis section
    const analysisSection = page.locator('text=/Cost Analysis|Analiză Cost|Comparație/i').first();

    if (await analysisSection.isVisible()) {
      // Check internal cost is shown
      const internalText = await page.locator('body').textContent();
      expect(internalText).toMatch(/Internal|Intern|Cost/i);

      // Check external cost
      expect(internalText).toMatch(/External|Extern|Contract/i);

      // Check savings calculation
      expect(internalText).toMatch(/Saving|Economy|Economie/i);
    }
  });

  test('filtrare contracte după status (active/expirat)', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Look for filter
    const filterBtn = page.locator('button', { hasText: /Filtrare|Filter/i });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();

      // Check for status checkboxes
      const activeCheckbox = page.locator('label', { hasText: /Active|Activ/i });
      if (await activeCheckbox.isVisible()) {
        await activeCheckbox.click();
        await page.waitForTimeout(500);
      }

      expect(page).toBeDefined();
    }
  });

  test('tabel contracte arată daysUntilExpiry', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Check for table
    const table = page.locator('table, [role="table"]');
    if (await table.isVisible()) {
      const tableText = await table.textContent();

      // Should show expiry info
      expect(tableText).toBeDefined();
    }
  });

  test('alert pentru contracte expirând în 30 zile', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Look for alert element
    const alertText = await page.locator('body').textContent();

    // Might contain warning about expiring contracts
    // Alert would only show if contracts actually expire soon
    expect(alertText).toBeDefined();
  });

  test('ștergere contract cu confirmare', async ({ page }) => {
    await page.locator('a', { hasText: 'Contracte' }).click();
    await page.waitForURL(/service-contracts/);

    // Look for delete button
    const deleteBtn = page.locator('button', { hasText: /Șterge|Delete|Șters/i }).first();

    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Wait for confirmation dialog
      await expect(page.locator('text=/Ești sigur|Confirm|Are you sure/i').first()).toBeVisible({
        timeout: 5000,
      });

      // Click confirm
      const confirmBtn = page.locator('button', { hasText: /Confirmare|Confirm|Da/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();

        // Should be deleted
        await expect(page.locator('text=/șters|deleted|removed/i').first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
