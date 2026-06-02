# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: device-crud.spec.js >> Device CRUD Operations >> Create device and verify in inventory
- Location: e2e\device-crud.spec.js:13:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  3  | test.describe('Device CRUD Operations', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login before each test
  6  |     await page.goto('/login');
> 7  |     await page.fill('input[name="username"]', 'testuser');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[name="password"]', 'Test123!');
  9  |     await page.click('button[type="submit"]');
  10 |     await page.waitForURL('**/dashboard');
  11 |   });
  12 | 
  13 |   test('Create device and verify in inventory', async ({ page }) => {
  14 |     // Navigate to device creation
  15 |     await page.goto('/devices/new');
  16 |     await page.waitForLoadState('networkidle');
  17 | 
  18 |     // Fill device form (adjust selectors as needed)
  19 |     await page.fill('input[placeholder*="Inv"]', 'TEST-E2E-001');
  20 |     await page.fill('input[placeholder*="Denumire"]', 'Test Device E2E');
  21 | 
  22 |     // Select risk class
  23 |     await page.click('select, [role="combobox"]');
  24 |     await page.click('text=IIb, button:has-text("IIb")');
  25 | 
  26 |     // Select section
  27 |     await page.click('[placeholder*="Secție"]');
  28 |     await page.click('text=TEST, option:has-text("TEST")');
  29 | 
  30 |     // Submit form
  31 |     await page.click('button[type="submit"]');
  32 | 
  33 |     // Wait for success toast or redirect
  34 |     await page.waitForURL('**/devices/**', { timeout: 5000 });
  35 | 
  36 |     // Verify device appears in inventory table
  37 |     await page.goto('/inventory');
  38 |     await page.waitForLoadState('networkidle');
  39 |     await expect(page.locator('text=TEST-E2E-001')).toBeVisible({ timeout: 3000 });
  40 |   });
  41 | 
  42 |   test('Edit device and verify changes', async ({ page }) => {
  43 |     // Navigate to inventory
  44 |     await page.goto('/inventory');
  45 |     await page.waitForLoadState('networkidle');
  46 | 
  47 |     // Find and click edit on first device
  48 |     const firstDeviceRow = page.locator('table tbody tr').first();
  49 |     await firstDeviceRow.locator('button:has-text("Editează"), a:has-text("Editează")').click();
  50 | 
  51 |     await page.waitForLoadState('networkidle');
  52 | 
  53 |     // Modify device name
  54 |     const nameInput = page.locator('input[placeholder*="Denumire"]');
  55 |     await nameInput.clear();
  56 |     await nameInput.fill('Updated Device Name E2E');
  57 | 
  58 |     // Save
  59 |     await page.click('button[type="submit"]');
  60 |     await page.waitForURL('**/devices/**', { timeout: 5000 });
  61 | 
  62 |     // Verify change in inventory
  63 |     await page.goto('/inventory');
  64 |     await page.waitForLoadState('networkidle');
  65 |     await expect(page.locator('text=Updated Device Name E2E')).toBeVisible({ timeout: 3000 });
  66 |   });
  67 | 
  68 |   test('Delete device (soft delete to CASAT)', async ({ page }) => {
  69 |     // Navigate to inventory
  70 |     await page.goto('/inventory');
  71 |     await page.waitForLoadState('networkidle');
  72 | 
  73 |     // Find a device and click delete
  74 |     const deviceToDelete = page.locator('text=TEST-E2E').first();
  75 |     await deviceToDelete.locator('../.. button:has-text("Șterge"), ../.. button[aria-label*="delete"]').click();
  76 | 
  77 |     // Confirm deletion
  78 |     const confirmBtn = page.locator('button:has-text("Confirmă"), button:has-text("Da")');
  79 |     if (await confirmBtn.isVisible()) {
  80 |       await confirmBtn.click();
  81 |     }
  82 | 
  83 |     // Verify device is hidden from active list
  84 |     await page.waitForLoadState('networkidle');
  85 |     const deletedCount = await page.locator('text=TEST-E2E').count();
  86 |     expect(deletedCount).toBeLessThan(1);
  87 |   });
  88 | });
  89 | 
```