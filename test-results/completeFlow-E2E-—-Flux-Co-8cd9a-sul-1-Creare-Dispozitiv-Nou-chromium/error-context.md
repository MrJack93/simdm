# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: completeFlow.spec.js >> E2E — Flux Complet Dispozitiv >> Pasul 1: Creare Dispozitiv Nou
- Location: frontend\src\__tests__\e2e\completeFlow.spec.js:32:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select[name="riskClass"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "flare SIMDM" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e7]: flare
          - generic [ref=e8]: SIMDM
        - navigation [ref=e9]:
          - link "Inventar" [ref=e10] [cursor=pointer]:
            - /url: /inventory
            - img [ref=e11]
            - text: Inventar
          - link "Inventariere" [ref=e14] [cursor=pointer]:
            - /url: /inventory/annual
            - img [ref=e15]
            - text: Inventariere
          - link "Consumabile" [ref=e17] [cursor=pointer]:
            - /url: /consumables
            - img [ref=e18]
            - text: Consumabile
          - link "Mentenanță" [ref=e22] [cursor=pointer]:
            - /url: /maintenance
            - img [ref=e23]
            - text: Mentenanță
          - link "Bilete" [ref=e25] [cursor=pointer]:
            - /url: /maintenance/tickets
            - img [ref=e26]
            - text: Bilete
          - link "Verificări" [ref=e29] [cursor=pointer]:
            - /url: /verifications
            - img [ref=e30]
            - text: Verificări
          - link "Contracte" [ref=e33] [cursor=pointer]:
            - /url: /service-contracts
            - img [ref=e34]
            - text: Contracte
          - link "Incidente" [ref=e37] [cursor=pointer]:
            - /url: /incidents
            - img [ref=e38]
            - text: Incidente
          - link "Jurnal" [ref=e40] [cursor=pointer]:
            - /url: /audit-logs
            - img [ref=e41]
            - text: Jurnal
      - generic [ref=e44]:
        - button "Comută la modul închis" [ref=e45]: 🌙
        - link "Setări" [ref=e46] [cursor=pointer]:
          - /url: /settings
          - img [ref=e47]
        - button "Deconectare din sistem" [ref=e58]:
          - img [ref=e59]
          - generic [ref=e62]: Deconectare
    - main [ref=e63]:
      - generic [ref=e65]:
        - heading "Adaugă Dispozitiv Medical" [level=1] [ref=e66]
        - paragraph [ref=e67]: Completează formularul pas cu pas
        - generic [ref=e68]:
          - generic [ref=e69]:
            - 'generic "Pasul 1: Identificare" [ref=e71]': "1"
            - 'generic "Pasul 2: Clasificare" [ref=e74]': "2"
            - 'generic "Pasul 3: Confirmă" [ref=e77]': "3"
          - generic [ref=e78]: "Pasul 1 din 3: Identificare"
        - status [ref=e79]
        - generic [ref=e80]:
          - generic [ref=e81]:
            - heading "Identificare Dispozitiv" [level=2] [ref=e82]
            - generic [ref=e83]:
              - generic [ref=e84]: Numărul inventarului *
              - textbox "Numărul inventarului *" [ref=e85]:
                - /placeholder: "EX: DM-2024-001"
                - text: E2E-1781082836974
            - generic [ref=e86]:
              - generic [ref=e87]: Denumire *
              - textbox "Denumire *" [active] [ref=e88]:
                - /placeholder: Nume dispozitiv
                - text: Ecograf E2E 1781082836974
            - generic [ref=e89]:
              - generic [ref=e90]:
                - generic [ref=e91]: Model
                - textbox "Model" [ref=e92]
              - generic [ref=e93]:
                - generic [ref=e94]: Seria
                - textbox "Seria" [ref=e95]
            - generic [ref=e96]:
              - generic [ref=e97]:
                - generic [ref=e98]: Producător
                - textbox "Producător" [ref=e99]
              - generic [ref=e100]:
                - generic [ref=e101]: Anul fabricării
                - spinbutton "Anul fabricării" [ref=e102]
          - generic [ref=e103]:
            - button "← Înapoi" [disabled] [ref=e104]
            - button "Înainte →" [ref=e105]
          - button "Anulare" [ref=e106]
  - region "Notifications Alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * E2E Test — Complete System Flow
  3   |  * Verifică întregul lanț de viață al unui dispozitiv:
  4   |  * 1. Autentificare
  5   |  * 2. Creare Dispozitiv (Inventar)
  6   |  * 3. Creare Plan Mentenanță Preventivă (Calendar)
  7   |  * 4. Raportare Defecțiune (Bilet Reparație Corectivă)
  8   |  * 5. Trecere Bilet prin flux (Triaj, Reparare, Rezolvare)
  9   |  * 6. (Validare teoretică flow) PDF Download
  10  |  */
  11  | 
  12  | import { test, expect } from '@playwright/test';
  13  | 
  14  | const TEST_USERNAME = 'testuser';
  15  | const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
  16  | 
  17  | test.describe('E2E — Flux Complet Dispozitiv', () => {
  18  |   test.describe.configure({ mode: 'serial' });
  19  | 
  20  |   let deviceInvNumber = `E2E-${Date.now()}`;
  21  |   let deviceName = `Ecograf E2E ${Date.now()}`;
  22  | 
  23  |   test.beforeEach(async ({ page }) => {
  24  |     await page.goto('/login');
  25  |     await page.waitForTimeout(1000);
  26  |     await page.locator('input[name="username"]').fill(TEST_USERNAME);
  27  |     await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  28  |     await page.locator('button:has-text("Conectare")').click();
  29  |     await page.waitForURL('/', { timeout: 15000 });
  30  |   });
  31  | 
  32  |   test('Pasul 1: Creare Dispozitiv Nou', async ({ page }) => {
  33  |     await page.locator('a[href="/inventory"]').first().click();
  34  |     await page.waitForURL(/devices|inventory/);
  35  | 
  36  |     await page.locator('a[href="/devices/new"]').click();
  37  |     await expect(page.locator('text=Adaugă Dispozitiv Medical')).toBeVisible();
  38  | 
  39  |     await page.locator('input[name="inventoryNumber"]').fill(deviceInvNumber);
  40  |     await page.locator('input[name="name"]').fill(deviceName);
> 41  |     await page.locator('select[name="riskClass"]').selectOption('IIb');
      |                                                    ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  42  |     await page.locator('select[name="sectionId"]').selectOption({ index: 1 });
  43  |     await page.locator('input[name="maintenanceFreq"]').fill('6');
  44  | 
  45  |     await page.locator('button:has-text("Salvează")').click();
  46  |     await expect(page.locator('text=/creat|succes/i').first()).toBeVisible({ timeout: 5000 });
  47  |   });
  48  | 
  49  |   test('Pasul 2: Creare Plan de Mentenanță Preventivă', async ({ page }) => {
  50  |     await page.locator('a', { hasText: 'Mentenanță' }).click();
  51  |     await page.waitForURL(/maintenance/);
  52  | 
  53  |     // Navigare la tab-ul Calendar
  54  |     await page.locator('a', { hasText: 'Calendar Mentenanță' }).click();
  55  |     await page.waitForURL(/maintenance\/calendar/);
  56  | 
  57  |     await page.locator('button', { hasText: /Creare Plan/i }).click();
  58  | 
  59  |     // Selectare dispozitiv creat
  60  |     const deviceSelect = page.locator('select#device-select');
  61  |     try {
  62  |         await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
  63  |     } catch {
  64  |         await deviceSelect.selectOption({ index: 1 });
  65  |     }
  66  | 
  67  |     await page.locator('select#freq-select').selectOption('LUNAR');
  68  |     await page.locator('input#responsible-input').fill('Inginer Test E2E');
  69  |     await page.locator('input#affil-input').fill('SIMDM Corp');
  70  | 
  71  |     await page.locator('button', { hasText: 'Salvare Plan' }).click();
  72  |     await expect(page.locator('text=/succes/i').first()).toBeVisible({ timeout: 5000 });
  73  |   });
  74  | 
  75  |   test('Pasul 3: Creare Tichet Reparație Corectivă (Defect)', async ({ page }) => {
  76  |     await page.locator('a', { hasText: 'Bilete' }).click();
  77  |     await page.waitForURL(/repair-tickets/);
  78  | 
  79  |     await page.locator('button', { hasText: /Tichet Nou/i }).click();
  80  |     await expect(page.locator('text=Creare Tichet Nou')).toBeVisible();
  81  | 
  82  |     const deviceSelect = page.locator('select#deviceId');
  83  |     try {
  84  |         await deviceSelect.selectOption({ label: new RegExp(deviceName, 'i') });
  85  |     } catch {
  86  |         await deviceSelect.selectOption({ index: 1 });
  87  |     }
  88  | 
  89  |     await page.locator('input#reportedBy').fill('Dr. Test');
  90  |     await page.locator('textarea#faultDescription').fill('Ecranul nu pornește, afișează eroare E-404.');
  91  |     await page.locator('select#priority').selectOption('URGENT');
  92  |     await page.locator('button', { hasText: 'Creează' }).click();
  93  | 
  94  |     await expect(page.locator('text=/succes/i').first()).toBeVisible({ timeout: 5000 });
  95  |   });
  96  | 
  97  |   test('Pasul 4: Triaj și Reparație Tichet', async ({ page }) => {
  98  |     await page.locator('a', { hasText: 'Bilete' }).click();
  99  |     await page.waitForURL(/repair-tickets/);
  100 | 
  101 |     // Dăm click pe tichetul nou creat (presupunem că e primul din coloana DESCHIS)
  102 |     await page.locator('.flex-col').filter({ hasText: 'DESCHIS' }).locator('.cursor-pointer').first().click();
  103 |     
  104 |     // Verificăm detaliile
  105 |     await expect(page.locator('text=Detalii Tichet')).toBeVisible();
  106 | 
  107 |     // Dacă avem tab-uri în modal
  108 |     const triajTab = page.locator('button[role="tab"]', { hasText: 'Triaj & Evaluare' });
  109 |     if (await triajTab.isVisible()) {
  110 |       await triajTab.click();
  111 |       await page.locator('select').filter({ hasText: 'INTERN' }).selectOption('INTERN');
  112 |       await page.locator('textarea').filter({ hasText: 'Cauza defectului' }).fill('Sursă de alimentare arsă');
  113 |       await page.locator('button', { hasText: 'Salvează Triaj' }).click();
  114 |       await expect(page.locator('text=/succes/i').first()).toBeVisible();
  115 |     }
  116 | 
  117 |     // Tab reparație
  118 |     const repTab = page.locator('button[role="tab"]', { hasText: 'Reparație' });
  119 |     if (await repTab.isVisible()) {
  120 |       await repTab.click();
  121 |       await page.locator('textarea').first().fill('Înlocuit sursa de alimentare cu una nouă din stoc.');
  122 |       await page.locator('textarea').nth(1).fill('Deșurubat capac, înlocuit piesă, asamblat.');
  123 |       await page.locator('input[type="number"]').fill('2'); // durata
  124 |       await page.locator('input').filter({ hasText: 'Nume Inginer' }).fill('Ing. Reparator Test');
  125 |       await page.locator('select').filter({ hasText: 'Rezultat Test' }).selectOption('FUNCTIONAL');
  126 |       await page.locator('button', { hasText: 'Finalizează Reparația' }).click();
  127 |       await expect(page.locator('text=/succes/i').first()).toBeVisible();
  128 |     }
  129 |   });
  130 | });
  131 | 
```