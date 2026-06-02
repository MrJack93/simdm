# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-refresh.spec.js >> Session and Token Refresh >> Access token auto-refreshes on expiry
- Location: e2e\session-refresh.spec.js:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="username"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "SIMDM" [level=1] [ref=e6]
        - paragraph [ref=e7]: Sistem Management Dispozitive Medicale
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: 📋
          - generic [ref=e11]:
            - heading "Inventar Centralizat" [level=3] [ref=e12]
            - paragraph [ref=e13]: Gestiune completă a dispozitivelor medicale cu clasificare pe secții
        - generic [ref=e14]:
          - generic [ref=e15]: 🔧
          - generic [ref=e16]:
            - heading "Planificare Mentenanță" [level=3] [ref=e17]
            - paragraph [ref=e18]: Mentenanță preventivă și corectivă cu calendar și notificări
        - generic [ref=e19]:
          - generic [ref=e20]: ⚠️
          - generic [ref=e21]:
            - heading "Vigilență și Incidente" [level=3] [ref=e22]
            - paragraph [ref=e23]: Raportare incidente și gestionare riscuri medicale
      - paragraph [ref=e24]: © 2026 SIMDM. Toate drepturile rezervate.
    - generic [ref=e26]:
      - heading "Conectare" [level=2] [ref=e27]
      - paragraph [ref=e28]: Introdu credențialele tale pentru a continua
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: Utilizator
          - textbox "Utilizator" [active] [ref=e32]:
            - /placeholder: bioinginer
        - generic [ref=e33]:
          - generic [ref=e34]: Parolă
          - textbox "Parolă" [ref=e35]:
            - /placeholder: ••••••••
        - button "Conectare" [ref=e36]
      - paragraph [ref=e38]: "Demo: bioinginer / parola"
  - region "Notifications Alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Session and Token Refresh', () => {
  4  |   test('Access token auto-refreshes on expiry', async ({ page, context }) => {
  5  |     // Login
  6  |     await page.goto('/login');
> 7  |     await page.fill('input[name="username"]', 'testuser');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[name="password"]', 'Test123!');
  9  |     await page.click('button[type="submit"]');
  10 |     await page.waitForURL('**/dashboard');
  11 | 
  12 |     // Capture initial token from sessionStorage
  13 |     const initialToken = await page.evaluate(() =>
  14 |       sessionStorage.getItem('accessToken')
  15 |     );
  16 |     expect(initialToken).toBeTruthy();
  17 | 
  18 |     // Navigate to inventory to make an API call
  19 |     await page.goto('/inventory');
  20 |     await page.waitForLoadState('networkidle');
  21 | 
  22 |     // Table should be visible (request succeeded)
  23 |     await expect(page.locator('table')).toBeVisible();
  24 | 
  25 |     // Simulate time passing (in real scenario, wait 15+ min)
  26 |     // For E2E, we verify that API calls succeed even if token would be stale
  27 |     await page.evaluate(() => {
  28 |       // Mark token as near-expiry by modifying its exp claim
  29 |       // (in production, server handles refresh automatically)
  30 |       const token = sessionStorage.getItem('accessToken');
  31 |       if (token) {
  32 |         const parts = token.split('.');
  33 |         if (parts.length === 3) {
  34 |           const payload = JSON.parse(atob(parts[1]));
  35 |           payload.exp = Math.floor(Date.now() / 1000) - 100; // Expired
  36 |           // Note: we're simulating expiry, actual refresh happens in axios interceptor
  37 |         }
  38 |       }
  39 |     });
  40 | 
  41 |     // Make another request (should auto-refresh if needed)
  42 |     await page.goto('/devices');
  43 |     await page.waitForLoadState('networkidle');
  44 | 
  45 |     // Should still be logged in and request should succeed
  46 |     await expect(page.url()).not.toContain('/login');
  47 |     await expect(page.locator('table, text=Dispozitive')).toBeVisible({ timeout: 3000 });
  48 |   });
  49 | 
  50 |   test('Logout clears session and redirects to login', async ({ page }) => {
  51 |     // Login
  52 |     await page.goto('/login');
  53 |     await page.fill('input[name="username"]', 'testuser');
  54 |     await page.fill('input[name="password"]', 'Test123!');
  55 |     await page.click('button[type="submit"]');
  56 |     await page.waitForURL('**/dashboard');
  57 | 
  58 |     // Verify logged in
  59 |     const token = await page.evaluate(() => sessionStorage.getItem('accessToken'));
  60 |     expect(token).toBeTruthy();
  61 | 
  62 |     // Find and click logout button
  63 |     await page.click('button:has-text("Deconectare"), a:has-text("Logout"), [aria-label*="logout"]');
  64 | 
  65 |     // Should be redirected to login
  66 |     await page.waitForURL('**/login', { timeout: 5000 });
  67 |     expect(page.url()).toContain('/login');
  68 | 
  69 |     // Token should be cleared
  70 |     const clearedToken = await page.evaluate(() => sessionStorage.getItem('accessToken'));
  71 |     expect(clearedToken).toBeNull();
  72 |   });
  73 | 
  74 |   test('Protected routes redirect to login if no token', async ({ page, context }) => {
  75 |     // Clear any existing session
  76 |     await context.clearCookies();
  77 |     await page.evaluate(() => sessionStorage.clear());
  78 | 
  79 |     // Try to access protected route directly
  80 |     await page.goto('/devices');
  81 | 
  82 |     // Should redirect to login
  83 |     await page.waitForURL('**/login', { timeout: 5000 });
  84 |     expect(page.url()).toContain('/login');
  85 |   });
  86 | });
  87 | 
```