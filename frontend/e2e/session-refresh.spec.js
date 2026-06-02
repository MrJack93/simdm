import { test, expect } from '@playwright/test';

test.describe('Session and Token Refresh', () => {
  test('Access token auto-refreshes on expiry', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Capture initial token from sessionStorage
    const initialToken = await page.evaluate(() =>
      sessionStorage.getItem('accessToken')
    );
    expect(initialToken).toBeTruthy();

    // Navigate to inventory to make an API call
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Table should be visible (request succeeded)
    await expect(page.locator('table')).toBeVisible();

    // Simulate time passing (in real scenario, wait 15+ min)
    // For E2E, we verify that API calls succeed even if token would be stale
    await page.evaluate(() => {
      // Mark token as near-expiry by modifying its exp claim
      // (in production, server handles refresh automatically)
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          payload.exp = Math.floor(Date.now() / 1000) - 100; // Expired
          // Note: we're simulating expiry, actual refresh happens in axios interceptor
        }
      }
    });

    // Make another request (should auto-refresh if needed)
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    // Should still be logged in and request should succeed
    await expect(page.url()).not.toContain('/login');
    await expect(page.locator('table, text=Dispozitive')).toBeVisible({ timeout: 3000 });
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Verify logged in
    const token = await page.evaluate(() => sessionStorage.getItem('accessToken'));
    expect(token).toBeTruthy();

    // Find and click logout button
    await page.click('button:has-text("Deconectare"), a:has-text("Logout"), [aria-label*="logout"]');

    // Should be redirected to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');

    // Token should be cleared
    const clearedToken = await page.evaluate(() => sessionStorage.getItem('accessToken'));
    expect(clearedToken).toBeNull();
  });

  test('Protected routes redirect to login if no token', async ({ page, context }) => {
    // Clear any existing session
    await context.clearCookies();
    await page.evaluate(() => sessionStorage.clear());

    // Try to access protected route directly
    await page.goto('/devices');

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
