/**
 * E2E Test — Login & Authentication
 * Verifică: Login cu credențiale corecte, redirecționare la Dashboard
 */

const { test, expect } = require('@playwright/test');

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

test.describe('E2E — Login & Autentificare', () => {
  test('navigare la /login ar trebui să afișeze form autentificare', async ({
    page,
  }) => {
    await page.goto('/login');

    // Check login form elements
    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginButton = page.locator('button:has-text("Autentificare")');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('login cu credențiale corecte → redirecționare Dashboard', async ({
    page,
  }) => {
    await page.goto('/login');

    // Fill login form
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);

    // Click login button
    await page.locator('button:has-text("Autentificare")').click();

    // Wait for redirect to dashboard
    await page.waitForURL('/');

    // Check dashboard elements
    await expect(page.locator('text=SIMDM')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('login cu credențiale incorecte → afișare eroare', async ({ page }) => {
    await page.goto('/login');

    // Fill login form with wrong credentials
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill('WrongPassword123!');

    // Click login button
    await page.locator('button:has-text("Autentificare")').click();

    // Check error message
    await expect(page.locator('text=/Credențiale invalide|Autentificare eșuată/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('deconectare ar trebui să redirecționeze la /login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.locator('input[name="username"]').fill(TEST_USERNAME);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Autentificare")').click();

    // Wait for dashboard
    await page.waitForURL('/');

    // Click logout button
    await page.locator('button:has-text("Deconectare")').click();

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});
