# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-and-navigate.spec.js >> Login and Navigation Flow >> Invalid login shows error message
- Location: e2e\login-and-navigate.spec.js:47:3

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
  3  | test.describe('Login and Navigation Flow', () => {
  4  |   test('Login → Dashboard → Inventory page', async ({ page }) => {
  5  |     // Navigate to login
  6  |     await page.goto('/login');
  7  |     expect(page.url()).toContain('/login');
  8  | 
  9  |     // Fill login form
  10 |     await page.fill('input[name="username"]', 'testuser');
  11 |     await page.fill('input[name="password"]', 'Test123!');
  12 | 
  13 |     // Submit
  14 |     await page.click('button[type="submit"]');
  15 | 
  16 |     // Wait for redirect to dashboard
  17 |     await page.waitForURL('**/dashboard', { timeout: 5000 });
  18 |     expect(page.url()).toContain('/dashboard');
  19 | 
  20 |     // Verify dashboard loads
  21 |     await expect(page.locator('text=Bine ai venit')).toBeVisible({ timeout: 3000 });
  22 | 
  23 |     // Navigate to inventory
  24 |     await page.click('a[href="/inventory"], button:has-text("Inventar")');
  25 |     await page.waitForLoadState('networkidle', { timeout: 5000 });
  26 | 
  27 |     // Verify inventory page loads with table
  28 |     await expect(page.locator('table')).toBeVisible({ timeout: 3000 });
  29 |   });
  30 | 
  31 |   test('Session persists after page refresh', async ({ page }) => {
  32 |     // Login first
  33 |     await page.goto('/login');
  34 |     await page.fill('input[name="username"]', 'testuser');
  35 |     await page.fill('input[name="password"]', 'Test123!');
  36 |     await page.click('button[type="submit"]');
  37 |     await page.waitForURL('**/dashboard');
  38 | 
  39 |     // Refresh page
  40 |     await page.reload();
  41 | 
  42 |     // Should still be on dashboard (session persists)
  43 |     await expect(page.url()).toContain('/dashboard');
  44 |     await expect(page.locator('text=Bine ai venit')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('Invalid login shows error message', async ({ page }) => {
  48 |     await page.goto('/login');
> 49 |     await page.fill('input[name="username"]', 'wronguser');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  50 |     await page.fill('input[name="password"]', 'wrongpass');
  51 |     await page.click('button[type="submit"]');
  52 | 
  53 |     // Should see error message
  54 |     await expect(page.locator('text=/Credențiale invalide|Eroare/i')).toBeVisible({ timeout: 3000 });
  55 |   });
  56 | });
  57 | 
```