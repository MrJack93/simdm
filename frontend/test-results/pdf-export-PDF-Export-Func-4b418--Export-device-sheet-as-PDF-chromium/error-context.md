# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-export.spec.js >> PDF Export Functionality >> Export device sheet as PDF
- Location: e2e\pdf-export.spec.js:13:3

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
  3  | test.describe('PDF Export Functionality', () => {
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
  13 |   test('Export device sheet as PDF', async ({ page, context }) => {
  14 |     // Navigate to inventory
  15 |     await page.goto('/inventory');
  16 |     await page.waitForLoadState('networkidle');
  17 | 
  18 |     // Find first device and click it to view details
  19 |     const firstDevice = page.locator('table tbody tr').first();
  20 |     await firstDevice.click();
  21 |     await page.waitForLoadState('networkidle');
  22 | 
  23 |     // Look for PDF export button in device details
  24 |     const pdfBtn = page.locator(
  25 |       'button:has-text("Fișă PDF"), button:has-text("PDF"), button:has-text("Descarcă")'
  26 |     );
  27 | 
  28 |     if (await pdfBtn.isVisible()) {
  29 |       // Listen for download
  30 |       const downloadPromise = context.waitForEvent('download');
  31 |       await pdfBtn.click();
  32 |       const download = await downloadPromise;
  33 | 
  34 |       // Verify PDF downloaded
  35 |       expect(download.suggestedFilename()).toContain('.pdf');
  36 |       console.log(`✓ Downloaded: ${download.suggestedFilename()}`);
  37 |     }
  38 |   });
  39 | 
  40 |   test('Export devices list as PDF/Excel', async ({ page, context }) => {
  41 |     // Navigate to inventory
  42 |     await page.goto('/inventory');
  43 |     await page.waitForLoadState('networkidle');
  44 | 
  45 |     // Look for export buttons (PDF, Excel, CSV)
  46 |     const exportBtns = page.locator('button:has-text("Export"), button:has-text("Descarcă")');
  47 |     const btnCount = await exportBtns.count();
  48 | 
  49 |     expect(btnCount).toBeGreaterThan(0);
  50 | 
  51 |     // Try to download first export
  52 |     const downloadPromise = context.waitForEvent('download');
  53 |     await exportBtns.first().click();
  54 | 
  55 |     try {
  56 |       const download = await downloadPromise;
  57 |       const filename = download.suggestedFilename();
  58 |       expect(filename).toMatch(/\.(pdf|xlsx|csv)$/i);
  59 |       console.log(`✓ Downloaded: ${filename}`);
  60 |     } catch (e) {
  61 |       // Download might not happen in some environments
  62 |       console.log('Note: Download event not captured, but button click succeeded');
  63 |     }
  64 |   });
  65 | 
  66 |   test('PDF includes device data (metadata test)', async ({ page }) => {
  67 |     // Navigate to inventory
  68 |     await page.goto('/inventory');
  69 |     await page.waitForLoadState('networkidle');
  70 | 
  71 |     // Get first device inventory number from table
  72 |     const firstDeviceCell = page.locator('table tbody td').first();
  73 |     const deviceName = await firstDeviceCell.textContent();
  74 | 
  75 |     // Click to open device details
  76 |     await page.locator('table tbody tr').first().click();
  77 |     await page.waitForLoadState('networkidle');
  78 | 
  79 |     // Verify device name is displayed on detail page
  80 |     await expect(page.locator(`text=${deviceName}`)).toBeVisible({ timeout: 3000 });
  81 | 
  82 |     // Look for download button
  83 |     const downloadBtn = page.locator('button:has-text("Descarcă"), button:has-text("PDF")');
  84 |     if (await downloadBtn.isVisible()) {
  85 |       // Verify button is clickable (metadata present)
  86 |       await expect(downloadBtn).toBeEnabled();
  87 |     }
  88 |   });
  89 | });
  90 | 
```