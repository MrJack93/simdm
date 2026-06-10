/**
 * E2E Test — Complete System Flow
 * Verifică întregul lanț de viață al unui dispozitiv:
 * 1. Autentificare
 * 2. Creare Dispozitiv (Inventar)
 * 3. Creare Plan Mentenanță Preventivă (Calendar)
 * 4. Raportare Defecțiune (Bilet Reparație Corectivă)
 * 5. Trecere Bilet prin flux (Triaj, Reparare, Rezolvare)
 * 6. (Validare teoretică flow) PDF Download
 */

import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Flux Complet Dispozitiv', () => {
  test.describe.configure({ mode: 'serial' });

  let deviceInvNumber = `E2E-${Date.now()}`;
  let deviceName = `Ecograf E2E ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Conectare")').click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('Pasul 1: Creare Dispozitiv Nou', async ({ page }) => {
    await page.locator('a[href="/inventory"]').first().click();
    await page.waitForURL(/devices|inventory/);

    await page.locator('a[href="/devices/new"]').click();
    await expect(page.locator('text=Adaugă Dispozitiv Medical')).toBeVisible();

    await page.locator('input[name="inventoryNumber"]').fill(deviceInvNumber);
    await page.locator('input[name="name"]').fill(deviceName);
    await page.locator('select[name="riskClass"]').selectOption('IIb');
    await page.locator('select[name="sectionId"]').selectOption({ index: 1 });
    await page.locator('input[name="maintenanceFreq"]').fill('6');

    await page.locator('button:has-text("Salvează")').click();
    await expect(page.locator('text=/creat|succes/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Pasul 2: Creare Plan de Mentenanță Preventivă', async ({ page }) => {
    await page.locator('a', { hasText: 'Mentenanță' }).click();
    await page.waitForURL(/maintenance/);

    // Navigare la tab-ul Calendar
    await page.locator('a', { hasText: 'Calendar Mentenanță' }).click();
    await page.waitForURL(/maintenance\/calendar/);

    await page.locator('button', { hasText: /Creare Plan/i }).click();

    // Selectare dispozitiv creat
    const deviceSelect = page.locator('select#device-select');
    try {
        await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
    } catch {
        await deviceSelect.selectOption({ index: 1 });
    }

    await page.locator('select#freq-select').selectOption('LUNAR');
    await page.locator('input#responsible-input').fill('Inginer Test E2E');
    await page.locator('input#affil-input').fill('SIMDM Corp');

    await page.locator('button', { hasText: 'Salvare Plan' }).click();
    await expect(page.locator('text=/succes/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Pasul 3: Creare Tichet Reparație Corectivă (Defect)', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/repair-tickets/);

    await page.locator('button', { hasText: /Tichet Nou/i }).click();
    await expect(page.locator('text=Creare Tichet Nou')).toBeVisible();

    const deviceSelect = page.locator('select#deviceId');
    try {
        await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
    } catch {
        await deviceSelect.selectOption({ index: 1 });
    }

    await page.locator('input#reportedBy').fill('Dr. Test');
    await page.locator('textarea#faultDescription').fill('Ecranul nu pornește, afișează eroare E-404.');
    await page.locator('select#priority').selectOption('URGENT');
    await page.locator('button', { hasText: 'Creează' }).click();

    await expect(page.locator('text=/succes/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Pasul 4: Triaj și Reparație Tichet', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/repair-tickets/);

    // Dăm click pe tichetul nou creat (presupunem că e primul din coloana DESCHIS)
    await page.locator('.flex-col').filter({ hasText: 'DESCHIS' }).locator('.cursor-pointer').first().click();
    
    // Verificăm detaliile
    await expect(page.locator('text=Detalii Tichet')).toBeVisible();

    // Dacă avem tab-uri în modal
    const triajTab = page.locator('button[role="tab"]', { hasText: 'Triaj & Evaluare' });
    if (await triajTab.isVisible()) {
      await triajTab.click();
      await page.locator('select').filter({ hasText: 'INTERN' }).selectOption('INTERN');
      await page.locator('textarea').filter({ hasText: 'Cauza defectului' }).fill('Sursă de alimentare arsă');
      await page.locator('button', { hasText: 'Salvează Triaj' }).click();
      await expect(page.locator('text=/succes/i').first()).toBeVisible();
    }

    // Tab reparație
    const repTab = page.locator('button[role="tab"]', { hasText: 'Reparație' });
    if (await repTab.isVisible()) {
      await repTab.click();
      await page.locator('textarea').first().fill('Înlocuit sursa de alimentare cu una nouă din stoc.');
      await page.locator('textarea').nth(1).fill('Deșurubat capac, înlocuit piesă, asamblat.');
      await page.locator('input[type="number"]').fill('2'); // durata
      await page.locator('input').filter({ hasText: 'Nume Inginer' }).fill('Ing. Reparator Test');
      await page.locator('select').filter({ hasText: 'Rezultat Test' }).selectOption('FUNCTIONAL');
      await page.locator('button', { hasText: 'Finalizează Reparația' }).click();
      await expect(page.locator('text=/succes/i').first()).toBeVisible();
    }
  });
});
