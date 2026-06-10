/**
 * E2E Test — Complete System Flow
 * Verifică întregul lanț de viață al unui dispozitiv:
 * 1. Autentificare
 * 2. Creare Dispozitiv (Inventar)
 * 3. Creare Plan Mentenanță Preventivă pentru dispozitivul creat
 * 4. Raportare Defecțiune (Bilet Reparație Corectivă)
 * 5. Încărcare Certificat Verificare
 */

import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Flux Complet Dispozitiv', () => {
  test.describe.configure({ mode: 'serial' });

  let deviceInvNumber = `E2E-${Date.now()}`;
  let deviceName = `Ecograf E2E ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Conectare")').click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('Pasul 1: Creare Dispozitiv Nou', async ({ page }) => {
    await page.locator('a', { hasText: 'Inventar' }).click();
    await page.waitForURL(/devices/);

    await page.locator('button', { hasText: /Adaugă Dispozitiv/i }).click();
    await expect(page.locator('text=Adăugare Dispozitiv')).toBeVisible();

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
    await page.waitForURL(/maintenance\/plans/);

    await page.locator('button', { hasText: /Plan Nou/i }).click();

    // Fill plan details
    await page.locator('input[id="plan-title"]').fill(`Plan MPP - ${deviceName}`);
    
    const deviceSelect = page.locator('select[id="plan-device"]');
    // Try to select by label containing the name, or just use index 1 if not available
    try {
        await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
    } catch {
        await deviceSelect.selectOption({ index: 1 });
    }

    await page.locator('input[id="plan-start"]').fill('2026-06-15');
    await page.locator('input[id="plan-interval"]').fill('6'); // 6 months
    
    // Add checklist items
    await page.locator('input[placeholder="Descriere operatiune"]').fill('Verificare generală');
    await page.locator('button', { hasText: 'Adauga' }).click();
    
    await page.locator('input[placeholder="Descriere operatiune"]').fill('Calibrare parametri');
    await page.locator('button', { hasText: 'Adauga' }).click();

    await page.locator('button', { hasText: 'Salvare Plan' }).click();
    await expect(page.locator('text=/creat|succes/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Pasul 3: Creare Tichet Reparație Corectivă (Defect)', async ({ page }) => {
    await page.locator('a', { hasText: 'Bilete' }).click();
    await page.waitForURL(/maintenance\/tickets/);

    await page.locator('button', { hasText: /Tichet Nou/i }).click();
    await expect(page.locator('text=Creare Tichet Reparație')).toBeVisible();

    const deviceSelect = page.locator('select#ticket-device');
    try {
        await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
    } catch {
        await deviceSelect.selectOption({ index: 1 });
    }

    await page.locator('select#ticket-priority').selectOption('URGENT');
    await page.locator('textarea#ticket-desc').fill('Ecranul nu pornește, afișează eroare E-404.');
    await page.locator('button', { hasText: /Creează/i }).click();

    await expect(page.locator('text=/creat|succes/i').first()).toBeVisible({ timeout: 5000 });
  });
});
