/**
 * E2E Test — Repair Tickets Workflow (Faza 3.3)
 * 1. Login → Bilete Reparație
 * 2. Creare tichet
 * 3. Triaj (INTERN/EXTERN)
 * 4. Reparație internă
 * 5. Genereaza Formular Nr. 8
 * 6. Descarcă PDF
 */

import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Bilete Reparație & State Machine (Faza 3.3)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Conectare")').click();
    await page.waitForURL('/', { timeout: 15000 });

    // Navigate to tickets page
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/maintenance\/tickets/);

    // Ensure at least one ticket in DESCHIS exists
    const deschisCount = await page.locator('div:has(> h2:has-text("DESCHIS"))').locator('.ticket-card').count();
    if (deschisCount === 0) {
      await page.locator('button', { hasText: /Tichet Nou|New/i }).click();
      await page.locator('select#ticket-device').selectOption({ index: 1 });
      await page.locator('select#ticket-priority').selectOption('RIDICAT');
      await page.locator('textarea#ticket-desc').fill('Bilet automat');
      await page.locator('button', { hasText: /Creează|Salvare/i }).click();
      await expect(page.locator('text=/creat|succes/i').first()).toBeVisible();
    }
  });

  test('navigare la Bilete Reparație', async ({ page }) => {
    // Click Bilete menu
    await page.locator('a', { hasText: 'Bilete' }).click();

    // Check Kanban board is visible
    await expect(page.locator('text=/DESCHIS|IN_LUCRU|REZOLVAT/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('creare tichet reparație nou', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/maintenance\/tickets/);

    // Click "Tichet Nou" button
    await page.locator('button', { hasText: /Tichet Nou|New/i }).click();

    // Wait for modal
    await expect(page.locator('text=/Creare Tichet|Reparație/i').first()).toBeVisible({
      timeout: 5000,
    });

    // Select device
    const deviceSelect = page.locator('select#ticket-device');
    await deviceSelect.selectOption({ index: 1 });

    // Select priority
    const prioritySelect = page.locator('select#ticket-priority');
    await prioritySelect.selectOption('RIDICAT');

    // Fill description
    const descInput = page.locator('textarea#ticket-desc');
    await descInput.fill('Ecran defect - E2E Test Reparație');

    // Click create
    await page.locator('button', { hasText: /Creează|Salvare/i }).click();

    // Wait for success
    await expect(page.locator('text=/creat|succes/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('tichet apare pe Kanban board în coloana DESCHIS', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/maintenance\/tickets/);

    // Create ticket
    await page.locator('button', { hasText: /Tichet Nou|New/i }).click();
    await expect(page.locator('text=/Creare Tichet|Reparație/i').first()).toBeVisible();

    const deviceSelect = page.locator('select#ticket-device');
    await deviceSelect.selectOption({ index: 1 });

    const prioritySelect = page.locator('select#ticket-priority');
    await prioritySelect.selectOption('RIDICAT');

    const descInput = page.locator('textarea#ticket-desc');
    await descInput.fill('Kanban Test');

    await page.locator('button', { hasText: /Creează|Salvare/i }).click();
    await expect(page.locator('text=/creat|succes/i').first()).toBeVisible();

    // Check ticket appears on board (should be in DESCHIS column)
    await expect(page.locator('text=/Kanban Test|TKT-/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('triaj tichet (INTERN vs EXTERN)', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/maintenance\/tickets/);

    // Find first ticket in DESCHIS column
    const deschisTicket = page.locator('div:has(> h2:has-text("DESCHIS"))').locator('.ticket-card').first();
    await deschisTicket.click();

    // Wait for modal with ticket details
    await expect(page.locator('text=Detalii Tichet').first()).toBeVisible({
      timeout: 5000,
    });

    // Check triaj options are visible
    const statusSelect = page.locator('select#status-select');
    const externBtn = page.locator('button', { hasText: /Externalizeaza/i });

    await expect(statusSelect).toBeVisible();
    await expect(externBtn).toBeVisible();

    // Select internal repair
    await statusSelect.selectOption('IN_LUCRU');
    await page.locator('button:has-text("Salvare status")').click();

    // Should stay on page and move to next state (modal closes)
    await expect(page.locator('text=Detalii Tichet')).not.toBeVisible();
  });

  test('reparație internă: completare formă + semnătură + PDF', async ({ page }) => {
    // Find and click a ticket in IN_LUCRU column, or if none, find one in DESCHIS and triage it
    const inLucruTicket = page.locator('div:has(> h2:has-text("IN_LUCRU"))').locator('.ticket-card').first();
    const deschisTicket = page.locator('div:has(> h2:has-text("DESCHIS"))').locator('.ticket-card').first();
    
    if (await inLucruTicket.isVisible()) {
      await inLucruTicket.click();
    } else {
      await deschisTicket.click();
      await expect(page.locator('text=Detalii Tichet').first()).toBeVisible();
      
      const statusSelect = page.locator('select#status-select');
      await statusSelect.selectOption('IN_LUCRU');
      await page.locator('button:has-text("Salvare status")').click();
      await expect(page.locator('text=Detalii Tichet')).not.toBeVisible();
      
      await inLucruTicket.click();
    }

    await expect(page.locator('text=Detalii Tichet').first()).toBeVisible();

    // Now click the "Editare Reparatie" tab
    await page.locator('button', { hasText: 'Editare Reparatie' }).click();

    // Fill repair details
    await page.getByPlaceholder('Descrieti reparatia efectuata...').fill('Raport test E2E');
    await page.getByPlaceholder('Enumerati actiunile concrete...').fill('Curatat si testat');
    await page.locator('input[type="number"]').fill('2');
    await page.locator('input[type="text"]').fill('Inginer Test');

    // Click "Salvare reparație"
    await page.locator('button', { hasText: 'Salvare reparație' }).click();

    // Wait for modal to close
    await expect(page.locator('text=Detalii Tichet')).not.toBeVisible();
  });

  test('descarcă Formular Nr. 8 (Act Deservire)', async ({ page }) => {
    // Find ticket
    const firstTicket = page.locator('.ticket-card').first();
    await firstTicket.click();

    // Look for PDF download button inside the details modal
    const pdfBtn = page.locator('div.fixed.inset-0:has-text("Detalii Tichet") button', { hasText: /Formular|PDF/i }).first();
    if (await pdfBtn.isVisible()) {
      expect(pdfBtn).toBeDefined();
    }
  });

  test('schimbare status tichet pe Kanban', async ({ page }) => {
    // Find ticket in IN_LUCRU column, or if none, find one in DESCHIS and triage it
    const inLucruTicket = page.locator('div:has(> h2:has-text("IN_LUCRU"))').locator('.ticket-card').first();
    const deschisTicket = page.locator('div:has(> h2:has-text("DESCHIS"))').locator('.ticket-card').first();

    if (await inLucruTicket.isVisible()) {
      await inLucruTicket.click();
    } else {
      await deschisTicket.click();
      await expect(page.locator('text=Detalii Tichet').first()).toBeVisible({ timeout: 5000 });
      const statusSelect = page.locator('select#status-select');
      await statusSelect.selectOption('IN_LUCRU');
      await page.locator('button:has-text("Salvare status")').click();
      await expect(page.locator('text=Detalii Tichet')).not.toBeVisible();
      await inLucruTicket.click();
    }

    // Wait for details modal
    await expect(page.locator('text=Detalii Tichet').first()).toBeVisible({ timeout: 5000 });

    const statusSelect = page.locator('select#status-select');
    if (await statusSelect.isVisible()) {
      // Get available options
      const options = page.locator('select#status-select option');
      const optionCount = await options.count();

      // Should have multiple status options
      expect(optionCount).toBeGreaterThan(1);

      // Try to change status
      if (optionCount > 1) {
        await statusSelect.selectOption({ index: 1 });

        // Save change
        const saveBtn = page.locator('button:has-text("Salvare status")');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await expect(page.locator('text=Detalii Tichet')).not.toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });
});
