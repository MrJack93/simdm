import { test, expect } from '@playwright/test';

test.describe('Ciclul complet de viață al unui DM', () => {
  test('login → procurare → recepție → inventar → MPP → corectiv → verificare → casare → raport', async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    // 1. Login
    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('nav')).toBeVisible({ timeout: 15000 });

    // 2. Dashboard — verifică KPI
    await expect(page.locator('text=Total DM active')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Funcționale')).toBeVisible();

    // 3. Procurare — creează plan
    await page.goto('/procurement');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Plan Nou")');
    await page.waitForSelector('text=Plan Nou de Procurare');
    await page.selectOption('#plan-year', '2026');
    await page.fill('#plan-bio', 'E2E Test');
    await page.click('button[type="submit"]:has-text("Creează")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=2026')).toBeVisible();

    // 4. Recepție / Dare în exploatare
    await page.goto('/commissioning');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Dă în exploatare")');
    await page.waitForSelector('text=Dă în Expluatare DM');
    await page.selectOption('#comm-device', { index: 1 });
    await page.fill('#comm-install', '2026-06-29');
    await page.check('input[type="checkbox"]', { strict: false }); // Conformity
    await page.click('button[type="submit"]:has-text("Dă în exploatare")');
    await page.waitForTimeout(1000);

    // 5. Inventar — verifică apariția DM
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

    // 6. MPP — calendar vizibil
    await page.goto('/maintenance/calendar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Calendar Mentenanță Preventivă').first()).toBeVisible({ timeout: 10000 });

    // 7. Jurnal de gardă — pagină goală funcțională
    await page.goto('/duty-log');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Jurnal de Gardă')).toBeVisible();

    // 8. Tichete reparație
    await page.goto('/maintenance/tickets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Bilete Reparație').first()).toBeVisible();

    // 9. Verificări periodice
    await page.goto('/verifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Verificări Periodice').first()).toBeVisible();

    // 10. Casare
    await page.goto('/decommission');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Casare & Conservare')).toBeVisible();

    // 11. Raport de activitate
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Raport Activitate')).toBeVisible();

    // 12. Documente
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Documente & Proceduri')).toBeVisible();
  });
});
