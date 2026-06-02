import { test, expect } from '@playwright/test';

test.describe('Login and Navigation Flow', () => {
  test('Login → Dashboard → Inventory page', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    expect(page.url()).toContain('/login');

    // Fill login form
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');

    // Verify dashboard loads
    await expect(page.locator('text=Bine ai venit')).toBeVisible({ timeout: 3000 });

    // Navigate to inventory
    await page.click('a[href="/inventory"], button:has-text("Inventar")');
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    // Verify inventory page loads with table
    await expect(page.locator('table')).toBeVisible({ timeout: 3000 });
  });

  test('Session persists after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Refresh page
    await page.reload();

    // Should still be on dashboard (session persists)
    await expect(page.url()).toContain('/dashboard');
    await expect(page.locator('text=Bine ai venit')).toBeVisible();
  });

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Should see error message
    await expect(page.locator('text=/Credențiale invalide|Eroare/i')).toBeVisible({ timeout: 3000 });
  });
});
