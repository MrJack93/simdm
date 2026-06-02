# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: annual-inventory.spec.js >> Annual Inventory Workflow >> Annual inventory report can be exported to PDF
- Location: e2e\annual-inventory.spec.js:76:3

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Annual Inventory Workflow', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Login before each test
  6   |     await page.goto('/login');
> 7   |     await page.fill('input[name="username"]', 'testuser');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8   |     await page.fill('input[name="password"]', 'Test123!');
  9   |     await page.click('button[type="submit"]');
  10  |     await page.waitForURL('**/dashboard');
  11  |   });
  12  | 
  13  |   test('Annual inventory workflow: select year, section, mark devices', async ({ page }) => {
  14  |     // Navigate to annual inventory
  15  |     await page.goto('/annual-inventory');
  16  |     await page.waitForLoadState('networkidle');
  17  | 
  18  |     // Select year (current year dropdown)
  19  |     await page.click('select, [role="combobox"]');
  20  |     const currentYear = new Date().getFullYear().toString();
  21  |     await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);
  22  | 
  23  |     // Wait for sections to load
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     // Click on first section to start inventory
  27  |     const firstSection = page.locator('button, [role="tab"], card').first();
  28  |     await firstSection.click();
  29  |     await page.waitForLoadState('networkidle');
  30  | 
  31  |     // Mark some devices as found
  32  |     const checkboxes = page.locator('input[type="checkbox"]');
  33  |     const count = await checkboxes.count();
  34  | 
  35  |     for (let i = 0; i < Math.min(count, 3); i++) {
  36  |       await checkboxes.nth(i).check();
  37  |     }
  38  | 
  39  |     // Verify checkmarks are visible
  40  |     const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
  41  |     expect(checkedCount).toBeGreaterThan(0);
  42  |   });
  43  | 
  44  |   test('Annual inventory shows discrepancies for not-found devices', async ({ page }) => {
  45  |     // Navigate to annual inventory
  46  |     await page.goto('/annual-inventory');
  47  |     await page.waitForLoadState('networkidle');
  48  | 
  49  |     // Select year
  50  |     await page.click('select, [role="combobox"]');
  51  |     const currentYear = new Date().getFullYear().toString();
  52  |     await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);
  53  |     await page.waitForLoadState('networkidle');
  54  | 
  55  |     // Click on section
  56  |     const firstSection = page.locator('button, [role="tab"], card').first();
  57  |     await firstSection.click();
  58  |     await page.waitForLoadState('networkidle');
  59  | 
  60  |     // Deliberately NOT mark some devices (to create discrepancies)
  61  |     // Leave at least one unchecked
  62  | 
  63  |     // View discrepancies report
  64  |     const discrepanciesBtn = page.locator('button:has-text("Discrepanțe"), button:has-text("Raport")');
  65  |     if (await discrepanciesBtn.isVisible()) {
  66  |       await discrepanciesBtn.click();
  67  |       await page.waitForLoadState('networkidle');
  68  | 
  69  |       // Should show not-found devices
  70  |       await expect(
  71  |         page.locator('text=/not found|neregăsite|discrepanț/i')
  72  |       ).toBeVisible({ timeout: 3000 });
  73  |     }
  74  |   });
  75  | 
  76  |   test('Annual inventory report can be exported to PDF', async ({ page, context }) => {
  77  |     // Navigate to annual inventory
  78  |     await page.goto('/annual-inventory');
  79  |     await page.waitForLoadState('networkidle');
  80  | 
  81  |     // Select year
  82  |     await page.click('select, [role="combobox"]');
  83  |     const currentYear = new Date().getFullYear().toString();
  84  |     await page.click(`option:has-text("${currentYear}"), text=${currentYear}`);
  85  |     await page.waitForLoadState('networkidle');
  86  | 
  87  |     // Look for PDF export button
  88  |     const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("Descarcă"), a:has-text("Export")');
  89  | 
  90  |     if (await pdfBtn.isVisible()) {
  91  |       // Listen for download
  92  |       const downloadPromise = context.waitForEvent('download');
  93  |       await pdfBtn.click();
  94  |       const download = await downloadPromise;
  95  | 
  96  |       // Verify download has PDF name
  97  |       expect(download.suggestedFilename()).toContain('.pdf');
  98  |     }
  99  |   });
  100 | });
  101 | 
```