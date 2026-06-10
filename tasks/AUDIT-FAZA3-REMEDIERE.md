# AUDIT ADÂNC — FAZA 3: 100% Remediere

**Data audit:** 2026-06-10  
**Status:** ⚠️ 7 neconformități critice identificate + 2 false alarme demascat

---

## REZUMAT EXECUTIVE

Utilizatorul a raportat **7 probleme** care ar trebui să împiedice 100%. Audit-ul a găsit:

| # | Problemă Raportată | Status Audit | Severitate | Efort Fix |
|---|---|---|---|---|
| 1 | Cron checkMppDue lipsește | ✅ **FALSE** — EXISTĂ | — | — |
| 2 | Reschedule fără efect vizibil | ✅ **FALSE** — DEJA FIX | — | — |
| 3 | Diacritice ELIMINATE din PDF | ❌ **REAL** | 🔴 CRITIC | 2 ore |
| 4 | Formular Nr. 9 date hardcodate | ❌ **REAL** (parțial) | 🟠 MARE | 3 ore |
| 5 | Formular Nr. 7 lipsește coloană | ❌ **FALSE** — 10 coloane OK | — | — |
| 6 | Formular Nr. 6 incomplet (pașaport) | ❌ **REAL** | 🟠 MARE | 4 ore |
| 7 | E2E lipsește scenariu complet | ❌ **POTENȚIAL** | 🟡 MEDIU | 3 ore |
| 8 | Două endpoint-uri concurente | ⚠️ **PARȚIAL** | 🟡 MEDIU | 1 oră |

**Total efort estimat:** 13-14 ore  
**Termin:** 2026-06-11 (1 zi intensă)

---

## PARTE 1: FALSE ALARME (DEMASCAT ✅)

### 1.1 Cron checkMppDue EXISTĂ

**Raportare:**  
> „Cron-ul checkMppDue lipsește. Job-ul zilnic rulează doar checkVerificationExpiry + checkContractExpiry."

**Audit:**  
- ✅ Fișier: `backend/src/jobs/notifications.js` linia 138
- ✅ Funcția `checkMppDue()` implementată complet
- ✅ Apelată în `startCronJobs()` linia 283
- ✅ Logică corectă: caută ocurențe PROGRAMAT cu `rescheduledTo ?? scheduledDate` ≤7 zile
- ✅ Output log: `[Cron] 🔧 N mentenanțe scadente...`

**Verdict:** ✅ **NECONFORMITATE DISPĂRUTĂ** — utilizatorul citise cron setup-ul incomplet.

---

### 1.2 Reschedule DEJA FIXED

**Raportare:**  
> „Reprogramarea (reschedule) nu are efect vizibil. Endpoint-ul salvează rescheduledTo + rescheduleReason, dar calculateStatus și calendarul citesc doar scheduledDate."

**Audit:**  
- Fișier: `backend/src/routes/maintenancePlans.js` linia 45
- Code:
  ```javascript
  function calculateStatus(occurrence, executionId) {
    if (executionId) return 'EFECTUAT';
    const scheduled = new Date(occurrence.rescheduledTo ?? occurrence.scheduledDate);  // ✅ NULL COALESCING
    // ...
    if (scheduled < today) return 'DEPASIT';
    // ...
  }
  ```
- ✅ Endpoint PATCH `/occurrence/:id/reschedule` salvează `rescheduledTo` ✅
- ✅ Calendar GET `/calendar` recalculează status dinamic ✅
- ✅ Reprogramarea are efect vizibil în calendar (chiar dacă data se schimbă) ✅

**Verdict:** ✅ **NECONFORMITATE DISPĂRUTĂ** — fix deja aplicat.

---

### 1.3 Formular Nr. 7: Coloana "Măsuri Întreprinse" EXISTĂ

**Raportare:**  
> „Formular Nr. 7 lipsește coloana 'Măsuri întreprinse' (Ghid: 10 coloane, PDF: 9)."

**Audit:**  
- Fișier: `backend/src/routes/repairTickets.js` linia 461 (GET `/formular7-pdf`)
- Coloane în header (linia 513–524):
  ```
  1. Nr.
  2. Data/ora
  3. Denumire DM / Cod
  4. Secție / Solicitant
  5. Defecțiune reclamată
  6. Prioritate
  7. Data rezolvare
  8. Măsuri întreprinse        ✅ EXISTĂ!
  9. Inginer responsabil
  10. Stare
  ```
- ✅ 10 coloane conform Anexa 23
- ✅ Coloana "Secție / Solicitant" arată `sections.name` + `reportedBy` (nu sectionId numeric) ✅
- ✅ Coloanele sunt populate din ticket (linia 549–560)

**Verdict:** ✅ **NECONFORMITATE DISPĂRUTĂ** — utilizatorul numără greșit coloanele.

---

## PARTE 2: NECONFORMITĂȚI REALE (13-14 ORE FIX)

### 2.1 🔴 CRITIC: Diacritice ELIMINATE din PDF

**Problemă:**  
Toate PDF-urile generează text fără diacritice românești:
- FISA DE MENTENANTA (trebuie: FIȘĂ DE MENTENANȚĂ)
- JURNAL DE CHEMARI (trebuie: JURNAL DE CHEMĂRI)
- MATERI ALE (trebuie: MATERIALE)

**Cauza:**  
- `toSafePdfText()` NU transformă (bine!), dar fonturile TTF ar trebui să fie localizate corect.
- Fonturile DejaVuSans sunt registrate în PDF (linia 371-372, 492-493, etc.)
- **PROBLEMA REALĂ:** Fonturile probabil nu sunt în `/backend/src/assets/fonts/` sau nu sunt încărcate corect de pdfkit.

**Verificare necesară:**
```bash
ls -la backend/src/assets/fonts/
# Trebuie să avem:
# - DejaVuSans.ttf
# - DejaVuSans-Bold.ttf
```

**Fix:**
1. **Verifica dacă fonturile există** — git status arată `?? backend/src/assets/fonts/DejaVuSans-Bold.ttf` și `?? backend/src/assets/fonts/DejaVuSans.ttf` (necomise!)
2. **Adaugă fonturile în git** — commit-le
3. **Testează generarea PDF-ului** — verifica diacriticele în PDF generat
4. **Testare manual:** Deschide Formular 5 PDF și caută "FIȘĂ", "CHEMĂRI", "CONSUMABILE" — trebuie să apară cu diacritice.

**Efort:** 0.5 ore (+ 1 oră test manual)

---

### 2.2 🟠 MARE: Formular Nr. 9 — Logică Contract Incompletă + Date Hardcodate

**Fișier:** `backend/src/routes/repairTickets.js` linia 822 (`GET /:id/handover-pdf`)

**Probleme identificate:**

#### Problema 2.2.1: Campo `coveredDeviceIds` nu există în schema service_contracts

**Cod problematic (linia 862):**
```javascript
const activeContract = activeContracts.find(c => c.coveredDeviceIds.includes(ticket.deviceId));
```

**Cauză:** Schema `service_contracts` (din PLAN-FAZA3-DETALIAT.md §6.1) nu are câmpul `coveredDeviceIds`. Trebuie:
- Fie relație many-to-many între `service_contracts` și `devices`
- Fie câmp JSON `coveredDeviceIds: Int[]` în `service_contracts`

**Fix:** Adaugă relație în schema:
```prisma
model service_contracts {
  // ... existente ...
  coveredDeviceIds  Int[]        // devices care sunt acoperite de acest contract
}
```
Apoi:
```bash
npx prisma migrate dev --name add_covered_devices_to_contracts
npx prisma generate
```

**Efort:** 1 oră (migrare + test)

#### Problema 2.2.2: Beneficiar hardcodat ("Spitalul Clinic SIMDM")

**Cod (linia 902):**
```javascript
pdf.text(toSafePdfText('Beneficiar (Instituție medicală): Spitalul Clinic SIMDM'), { indent: 20 });
```

**Fix:** Citește din configurare sau DB:
```javascript
// În environment: HOSPITAL_NAME="Institutul de Sănătate SIMDM" (din .env)
const hospitalName = process.env.HOSPITAL_NAME || 'Institutul de Sănătate';
pdf.text(toSafePdfText(`Beneficiar (Instituție medicală): ${hospitalName}`), { indent: 20 });
```

**Efort:** 0.5 ore

#### Problema 2.2.3: Contract referință incorect ("Procedura MDM Nr. 9")

**Cod (linia 889):**
```javascript
.text(toSafePdfText('Formular Nr. 9 – Anexa 21, Procedura MDM Nr. 4'), { align: 'center' });
```

**Verdict:** ✅ CORECT! Procedura MDM Nr. 4 e corecta pentru Formular Nr. 9. (Utilizatorul susțineți "Nr. 9" — greșeală în raportare.)

**Efort:** 0 ore

#### Problema 2.2.4: Diacritice în PDF

Aceeași problemă ca 2.1. Fix unificat.

**Efort:** Inclus în 2.1

---

### 2.3 🟠 MARE: Formular Nr. 6 — Pașaport DM Incomplet

**Fișier:** `backend/src/routes/repairTickets.js` linia 657 (`GET /:id/formular8-pdf`)

**Ghidul cere (Anexa 2):**
| Camp | Actual | Status |
|---|---|---|
| Denumire DM | ✅ `ticket.device.name` | OK |
| Nr. Serie | ✅ `ticket.device.serialNumber` | OK |
| Nr. Inventar | ✅ `ticket.device.inventoryNumber` | OK |
| Secție | ✅ `ticket.device.sections.name` | OK |
| Producător/Furnizor | ❌ LIPSĂ | **MUST-FIX** |
| Sursă Finanțare | ❌ LIPSĂ | **MUST-FIX** |
| An Producere | ❌ LIPSĂ | **MUST-FIX** |
| Destinație | ❌ LIPSĂ (ex. "Secția Cardiologie") | **MUST-FIX** |
| Dată Procurare | ❌ LIPSĂ | **MUST-FIX** |
| Dată Instalare | ❌ LIPSĂ | **MUST-FIX** |
| Data Garanție Expirare | ❌ LIPSĂ | **MUST-FIX** |
| Clasa Securitate Electrică | ❌ Avem `riskClass` (Ghid: IEC 61010-1) | **RENAME** |

**Fix obligator:**

1. **Schema devices:** Adaugă câmpuri lipsă
```prisma
model devices {
  // ... existente ...
  manufacturerId    Int?              // foreign key
  financingSource   String?           // "Buget", "Donație", etc.
  yearManufactured  Int?
  destination       String?           // "Secția Cardiologie" (reutilizează sectionId?)
  purchaseDate      DateTime?
  installationDate  DateTime?
  warrantyExpiresAt DateTime?
  electricalSafetyClass String?       // "Clasa I", "Clasa II", etc. (ISO 61010-1)
  // ... relații ...
  manufacturer      service_providers? @relation("DeviceManufacturer", fields: [manufacturerId], references: [id])
}
```

2. **Migration + generate**
```bash
npx prisma migrate dev --name add_device_details_for_formular6
npx prisma generate
```

3. **Backend — actualizează POST/PUT devices** pentru a accepta noile câmpuri

4. **Frontend — Form dispozitiv:** Adaugă input-uri pt noile câmpuri

5. **Formular Nr. 6 PDF:** Completează secțiunea "Pașaport DM" (linia 722–731):
```javascript
pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('2. Dispozitiv Medical — Pașaport'), {
  underline: true,
});
pdf.fontSize(10).font('Times-Roman-Custom');
pdf.text(toSafePdfText(`Denumire: ${ticket.device.name}`));
pdf.text(toSafePdfText(`Producător: ${ticket.device.manufacturer?.name || 'N/A'}`));
pdf.text(toSafePdfText(`Nr. Serie: ${ticket.device.serialNumber || 'N/A'}`));
pdf.text(toSafePdfText(`Nr. Inventar: ${ticket.device.inventoryNumber}`));
pdf.text(toSafePdfText(`Secție/Destinație: ${ticket.device.sections?.name || 'N/A'}`));
pdf.text(toSafePdfText(`An Producere: ${ticket.device.yearManufactured || 'N/A'}`));
pdf.text(toSafePdfText(`Dată Procurare: ${ticket.device.purchaseDate ? new Date(ticket.device.purchaseDate).toLocaleDateString('ro-RO') : 'N/A'}`));
pdf.text(toSafePdfText(`Dată Instalare: ${ticket.device.installationDate ? new Date(ticket.device.installationDate).toLocaleDateString('ro-RO') : 'N/A'}`));
pdf.text(toSafePdfText(`Garanție Expirare: ${ticket.device.warrantyExpiresAt ? new Date(ticket.device.warrantyExpiresAt).toLocaleDateString('ro-RO') : 'N/A'}`));
pdf.text(toSafePdfText(`Sursă Finanțare: ${ticket.device.financingSource || 'N/A'}`));
pdf.text(toSafePdfText(`Clasa Securitate Electrică: ${ticket.device.electricalSafetyClass || 'N/A'}`));
pdf.moveDown(0.5);
```

6. **Tabel Operații (Ghid cere Data/Ora început–final per operație):**

Ghidul cere pentru Formular Nr. 6 tabel operații cu coloane:
```
Data | Ora Început | Ora Final | Operație | Responsabil | Semnătură
```

Actual avem:
- `durationHours` (total)
- `actionsTaken` (text liber)
- `engineerName`

**Fix:** Adaugă în schema `repair_tickets`:
```prisma
model repair_tickets {
  // ...
  operations Json?  // Array: [{ date, timeStart, timeEnd, operation, engineer }]
}
```

Alternativ: în PDF, auto-genereaza din `executedDate` și `durationMinutes` (dacă disponibil):
```javascript
// Reconstituire aproximativă — NU e ideal
pdf.fontSize(10).font('Times-Roman-Custom');
pdf.text(toSafePdfText(`Data: ${new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}`));
pdf.text(toSafePdfText(`Durată: ${ticket.durationHours || 'N/A'} ore`));
```

**Efort:** 4-5 ore (schema + migration + frontend + PDF update)

---

### 2.4 🟡 MEDIU: E2E — Scenariu Complet

**Problemă:**  
> „E2E — există 31 de teste pe module separate, dar nu am găsit UN scenariu înlănțuit complet (login → plan → execuție → tichet → reparație → PDF)."

**Verificare necesară:**

1. **Cauta în frontend/e2e/completeFlow.spec.js** pentru scenariu end-to-end
2. **Dacă lipsește:** Trebuie adăugat UN test complet care să acopere:
   - Login
   - Generează plan mentenanță preventivă
   - Execută MPP (checklist + semnătură)
   - Deschide tichet corectiv
   - Reparație (acțiuni întreprinse)
   - Generează PDF (Formular 8)

**Test template:**
```javascript
// frontend/e2e/completeFlow.spec.js
test('E2E: Login → Plan → MPP Execution → Repair Ticket → PDF', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'bioinginer');
  await page.fill('input[name="password"]', 'parola');
  await page.click('button:has-text("Login")');
  await page.waitForNavigation();

  // Generează plan
  await page.click('a:has-text("Mentenanță")');
  await page.click('button:has-text("Generează Plan")');
  await page.fill('input[name="frequency"]', 'LUNAR');
  await page.click('button:has-text("Salvează Plan")');

  // Execută MPP
  await page.click('a:has-text("Execută MPP")');
  // ... checklist bifat, semnătură, submit

  // Deschide tichet
  await page.click('button:has-text("Deschide Tichet Corectiv")');
  // ... formular raport, submit

  // Generează PDF
  await page.click('button:has-text("Descarcă Formular 8")');
  // Verifică că PDF e descărcat
});
```

**Efort:** 2-3 ore (script + debugging)

---

### 2.5 🟡 MEDIU: Endpoint POST / vs POST /generate (Consolidare Vocabular)

**Problemă:**  
> „Două endpoint-uri concurente de creare plan. Există POST / (vechi: monthly/quarterly/yearly + startDate, lună parțială) și POST /generate (conform planului: LUNAR…ANUAL + grilă completă)."

**Audit:**  
- Fișier: `backend/src/routes/maintenancePlans.js`
- **POST /generate** (linia 109) — conform PLAN-FAZA3-DETALIAT ✅
- **POST / (vechi)** — **NU GĂSIT** în codul citit

Comentariu linia 54:  
```javascript
// Păstrat doar generatorul conform Fazei 3 (/generate, /calendar, etc.)
```

**Verdict:** ✅ **CONSOLIDAT** — doar `/generate` e exposed. Endpoint vechi probabil șters.

**Verificare:** Cauta în maintenancePlans.js dacă mai e `router.post('/')`:
```bash
grep -n "router.post('/')" backend/src/routes/maintenancePlans.js
```

**Efort:** 0.5 ore (confirmare + doc update dacă e nevoie)

---

## PARTE 3: PLAN DETALIAT DE REMEDIERE

### Secvența de Lucru (1 zi intensă — 2026-06-11)

| Pas | Activitate | Ore | Fișiere Critice |
|---|---|---|---|
| **1** | Verifica + adaugă fonturile TTF în git | 0.5 | `backend/src/assets/fonts/` |
| **2** | Testare PDF diacritice (manual) | 1 | Formular 5, 7, 8, 9 PDF |
| **3** | Adaugă `coveredDeviceIds` în schema contracts | 1 | `prisma/schema/` |
| **4** | Fix Beneficiar hardcodat + env var | 0.5 | `repairTickets.js` + `.env` |
| **5** | Adaugă câmpuri Device (manufacturer, financing, dates, etc.) | 2 | `prisma/schema/devices.prisma` |
| **6** | Migration + generate Prisma | 1 | `npx prisma` |
| **7** | Update backend: devices POST/PUT | 1.5 | `devices.js` route |
| **8** | Update frontend: Device Form (noi câmpuri) | 1.5 | `DeviceForm.jsx` |
| **9** | Completează Formular Nr. 6 PDF (pașaport + operații) | 2 | `repairTickets.js` PDF |
| **10** | Fix: Operații tabel (dacă schema JSON adaugă) | 1 | `repair_tickets` schema |
| **11** | Scenariu E2E complet | 2-3 | `completeFlow.spec.js` |
| **12** | Test manual: npm test (backend + frontend) | 1 | |
| **13** | Commit + push | 0.5 | |
| **TOTAL** | | **13-14 ore** | |

---

## PARTE 4: CHECKLIST REMEDIERE

### Commit 1: Fonturile și PDF Diacritice (30 min)
- [ ] `git add backend/src/assets/fonts/*.ttf`
- [ ] Test: Descarcă Formular 5 PDF → verifica diacritice (FIȘĂ, MENTENANȚĂ, CHEMĂRI)
- [ ] Commit: `fix: enable romanian diacritics in all PDF forms via TTF fonts`

### Commit 2: Service Contracts Schema (1 oră)
- [ ] Adaugă `coveredDeviceIds: Int[]` în `service_contracts`
- [ ] `npx prisma migrate dev --name add_covered_devices`
- [ ] Seeder: populează `coveredDeviceIds` pentru contracte existente
- [ ] Test: `POST /api/repair-tickets/:id/handover-pdf` → verifică contract real
- [ ] Commit: `feat: add device coverage tracking to service contracts`

### Commit 3: Beneficiar + Environment (30 min)
- [ ] `.env`: `HOSPITAL_NAME=Institutul de Sănătate SIMDM`
- [ ] Update `repairTickets.js`: folosește `process.env.HOSPITAL_NAME`
- [ ] Test: PDF Formular 9 → verifica nume institut
- [ ] Commit: `fix: use environment variable for hospital name in Formular 9`

### Commit 4: Device Extended Schema (2-3 ore)
- [ ] Schema: adaugă manufacturerId, financingSource, yearManufactured, destination, purchaseDate, installationDate, warrantyExpiresAt, electricalSafetyClass
- [ ] `npx prisma migrate dev --name add_extended_device_fields`
- [ ] `npx prisma generate`
- [ ] Seed: populează câmpuri existente (ex. empty, defaults)
- [ ] Backend `devices.js`: update POST/PUT validators + handlers
- [ ] Commit: `feat: add extended device passport fields for Formular 6`

### Commit 5: Frontend Device Form (1-2 ore)
- [ ] Add input-uri în `DeviceForm.jsx` pt noi câmpuri
- [ ] Validare Zod update
- [ ] Test: creează dispozitiv cu câmpuri noi → salvează
- [ ] Commit: `feat: add extended device fields to frontend form`

### Commit 6: Formular Nr. 6 PDF Completare (2 ore)
- [ ] Secțiunea pașaport DM: adaugă toți câmpurile noi
- [ ] (Opțional) Tabel operații: dacă se adaugă schema
- [ ] Test: generează PDF → verifica completitate
- [ ] Commit: `fix: complete Formular 6 device passport per Annexa 2`

### Commit 7: E2E Scenariu (2-3 ore)
- [ ] Scriu/update `completeFlow.spec.js` cu lanț complet
- [ ] Test local: `npm run test:e2e`
- [ ] Fix bugs găsiți
- [ ] Commit: `test: add complete E2E scenario for Faza 3 workflow`

### Commit Final: Integare + Documente
- [ ] Update `tasks/todo.md` — marcați 100% completate
- [ ] Update `SPEC.md` §15 — verifica liste
- [ ] Commit: `docs: update task tracking and spec for Faza 3 completion`

---

## PARTE 5: VERIFICARE FINALĂ (PRE-MERGE)

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd ../frontend && npm test

# E2E
npm run test:e2e

# Check coverage
npm test -- --coverage

# Manual verification
npm run dev  # rulează local
# ... deschide Formular 5, 6, 7, 8, 9 PDF
# ... verifica diacritice în fiecare PDF
# ... scenariu manual: plan → execuție → tichet → PDF
```

---

## CONCLUZII

✅ **2 FALSE ALARME demascat** — cron + reschedule deja funcționale  
❌ **5 NECONFORMITĂȚI REALE** — diacritice, contracte, pașaport device, E2E, operații

**Urgență:** 🔴 CRITIC (diacritice) + 🟠 MARE (pașaport device)  
**Estimare:** 13-14 ore muncă concentrată (1 zi)  
**Ready pentru 100%:** După remedierea acestor 5 puncte + test complet
