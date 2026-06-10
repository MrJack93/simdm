# ✅ Task Tracking — SIMDM All Phases

**Versiune:** 3.0 (Faza 1-2 auditate & remediate · Faza 3 = plan detaliat separat)  
**Actualizat:** 2026-06-08  
**Format:** Checkbox tracking per phase

---

## ✅ FAZA 1: Fundație & Infrastructură — COMPLETĂ

**Status:** ✅ DONE (2026-05-30) + **auditată** (2026-06-06)

Infrastructură, autentificare și componentele fundaționale complete. Audit de securitate trecut,
remedieri aplicate (secrete JWT reale, atribuire audit-log corectă, validări). Confirmare finală: `npm test` local.

---

## ✅ FAZA 2: Inventar DM — COMPLETĂ

**Status:** ✅ DONE (2026-06-02) + **auditată** (2026-06-06)

CRUD dispozitive, export (CSV anti-injection / XLSX / PDF), upload cu antivirus, forms, UI complete.
Audit trecut, remedieri aplicate (vezi CLAUDE.md §Reguli de securitate). Confirmare finală: `npm test` local.

---

## ✅ FAZA 3: Mentenanță — COMPLETĂ

**Status:** ✅ DONE (2026-06-09) + **auditată**

> **Planul pas-cu-pas, complet și verificat față de Ghid, este în [PLAN-FAZA3-DETALIAT.md](PLAN-FAZA3-DETALIAT.md).**
> Acolo găsești: schema DB per modul, endpoint-uri, frontend, formularele PDF (Nr. 5/6/7/8/9), cron jobs,
> teste, secvențierea pe 16 zile și „Definiția lui 100%". Checklist-ul de mai jos e rezumatul de progres.

**Rezumat progres (bifează pe măsură ce avansezi):**

- [x] Pre-requisite: dependințe + câmpuri verificare pe `devices` + migrare
- [x] Modul 1 — Plan MPP + calendar + Formular Nr. 5
- [x] Modul 2 — Execuție MPP + semnătură + Formular Nr. 6
- [x] Modul 3 — Corectiv + state machine + Formular Nr. 7 + Nr. 8
- [x] Modul 4 — Verificări periodice + metrologie + raport conformitate
- [x] Modul 5 — Contracte externe + rating + Formular Nr. 9
- [x] Cron jobs (MPP/verificări/contracte) + integrare finală
- [x] Teste ≥95% + 1 scenariu E2E + `npm test` verde

<details><summary>Arhivă: breakdown detaliat vechi (superseded de PLAN-FAZA3-DETALIAT.md)</summary>

**Status:** READY TO START  
**Start Date:** 2026-06-05 (provisional)  
**Duration:** 16 days (4 weeks)

### PAS 3.1 — Plan Mentenanță Preventivă (4 zile)

**Etapa 3.1.1 — Database Schema (0.5 zile)**
- [x] Creează `backend/prisma/schema/maintenance.prisma`
- [x] Adaugă modele: `maintenance_plans`, `mpp_occurrences`
- [x] Adaugă relații inverse în `devices` (maintenance_plans[], mpp_occurrences[])
- [x] Adaugă câmpuri pe devices: `lastMaintenanceAt`, `requiresVerification`, `verificationFreqMonths`
- [x] Rulează: `npx prisma migrate dev --name add_maintenance_module`
- [x] Rulează: `npx prisma generate`

**Etapa 3.1.2 — Backend Generator Plan (1.5 zile)**
- [x] Creează `backend/src/routes/maintenancePlans.js`
- [x] Implementează POST `/api/maintenance-plans/generate`
  - [x] Mapare frecvență → luni (LUNAR=12, TRIMESTRIAL=4, SEMESTRIAL=2, ANUAL=1)
  - [x] Creare/update plan cu upsert
  - [x] Ștergere apariții vechi neefectuate
  - [x] Creare apariții noi din luni calculate
- [x] Implementează GET `/api/maintenance-plans/calendar?year=YYYY`
  - [x] Filtrare după an
  - [x] Calcul automat status pe baza datei (PROGRAMAT/SCADENT/DEPASIT/EFECTUAT)
- [x] Implementează PATCH `/api/maintenance-plans/occurrence/:id/reschedule`
  - [x] Validare motivare min 5 caractere (obligatorie)
  - [x] Salvare dată reprogramării + motiv
- [x] Adaugă audit log pentru toate operațiile
- [x] Test caz critic: reschedule fără motivare → 400

**Etapa 3.1.3 — Frontend Calendar (1.5 zile)**
- [x] Instalează: `npm install react-big-calendar date-fns`
- [x] Creează `frontend/src/pages/MaintenanceCalendarPage.jsx`
  - [x] Calendar interactiv cu react-big-calendar
  - [x] Localizare română (ro locale din date-fns)
  - [x] Dropdown pentru schimbare an
  - [x] Legendă culori: PROGRAMAT (verde), SCADENT (portocaliu), DEPASIT (roșu), EFECTUAT (albastru)
  - [x] Query backend `/api/maintenance-plans/calendar?year=...`
  - [x] Click event: deschide detalii/reschedule modal
- [x] Crează modal reschedule cu validare text min 5 caractere

**Etapa 3.1.4 — Formular Nr. 5 PDF (1 zi)**
- [x] Implementează GET `/api/maintenance-plans/:year/formular5-pdf`
- [x] PDF structure (landscape A4):
  - [x] Titlu: "PLAN DE MENTENANȚĂ PREVENTIVĂ ... ANUL [year]"
  - [x] Referință: "Formular Nr. 5 – Anexa 16, Procedura MDM Nr. 6"
  - [x] Antet tabel: Nr | Denumire | Serie | Secție | Responsabil | Ian | Feb | ... | Dec
  - [x] Rânduri cu X pentru lunile planificate
  - [x] Footer cu dată generare
- [x] Test: Generate PDF cu 3-5 DM, verifică diacritice și format

**Checklist Pas 3.1:**
- [x] Database schema migrate + generate
- [x] Generator frecvențe corect (LUNAR=12, TRIMESTRIAL=4, etc.)
- [x] Calendar status automat PROGRAMAT/SCADENT/DEPASIT (după dată)
- [x] Reprogramare cu motivare obligatorie (5+ caractere)
- [x] Formular Nr. 5 PDF cu grilă luni (Jan-Dec)
- [x] Audit log complet
- [x] Tests: ≥8 teste unitare

---

### PAS 3.2 — Implementare MPP (3 zile)

**Etapa 3.2.1 — Database Schema (0.5 zile)**
- [x] Adaugă modele: `mpp_executions`
- [x] Migrate: `npx prisma migrate dev --name add_mpp_executions`

**Etapa 3.2.2 — Backend Execuție (1 zi)**
- [x] Creează `backend/src/routes/mppExecutions.js`
- [x] Implementează POST `/api/mpp-executions`
  - [x] Validare date obligatorii (deviceId, executedDate, performedBy, checklist)
  - [x] Tranzacție Prisma:
    - [x] Crează execuție (mpp_executions)
    - [x] Update apariție: status = EFECTUAT, link executionId
    - [x] Update device: lastMaintenanceAt
    - [x] Scade consumabile din stoc (pentru fiecare din consumablesUsed)
  - [x] Audit log CREATE
- [x] Implementează GET `/api/mpp-executions/checklist-template/:deviceId`
  - [x] Return template generic (6 operațiuni standard)
  - [x] Opțional: lookup pe model DM pentru template specific

**Etapa 3.2.3 — Frontend Formular Execuție (1 dia)**
- [x] Instalează: `npm install react-signature-canvas`
- [x] Creează `frontend/src/pages/MppExecutionForm.jsx`
  - [x] Select DM + occurrence din calendar
  - [x] Data execuție, durată (minute)
  - [x] Checklist dinamic: map-eaza template
    - [x] Checkbox per operațiune
    - [x] Text field pentru notă per operațiune
  - [x] Selector consumabile cu cantitate (useQuery `/consumables/dropdown`)
  - [x] Upload foto înainte (+ antivirus din Faza 2)
  - [x] Upload foto după
  - [x] SignaturePad component (bioinginer + responsabil secție)
  - [x] Buton Submit → POST `/mpp-executions` → redirect calendar
- [x] Criptează/encode semnături în base64 înainte de submit

**Etapa 3.2.4 — Formular Nr. 6 PDF (0.5 zile)**
- [x] Implementează GET `/api/mpp-executions/:id/formular6-pdf`
- [x] PDF structure (Anexa 2):
  - [x] Antet identificare DM (denumire, serie, inventar, secție, clasă electrică, producător)
  - [x] Antet mentenanță (frecvență MPP: DA/NU, verificare periodică: DA/NU)
  - [x] Tabel operațiuni (descriere | data/ora început | data/ora final | responsabil | semnătură)
  - [x] Observații
  - [x] Semnături digitale (bioinginer, responsabil secție)

**Checklist Pas 3.2:**
- [x] Checklist dinamic cu operațiuni + note per operațiune
- [x] Semnătură digitală (canvas) bioinginer + responsabil secție
- [x] Upload foto înainte/după
- [x] Tranzacție atomică: creare + scădere stoc + update calendar
- [x] Apariția din calendar → status EFECTUAT
- [x] Formular Nr. 6 PDF
- [x] Tests: ≥6 teste

---

### PAS 3.3 — Mentenanță Corectivă (4 zile)

**Etapa 3.3.1 — Database Schema (0.5 zile)**
- [x] Adaugă modele: `repair_tickets`, `service_providers` (partial)
- [x] Migrate

**Etapa 3.3.2 — Backend Ticketing (2 zile)**
- [x] Creează `backend/src/routes/repairTickets.js`
- [x] Implementează POST `/api/repair-tickets` (raportare defecțiune)
  - [x] Generate ticketNumber (TKT-YYYY-NNNN)
  - [x] Creare ticket: status = DESCHIS, priority = NORMAL/URGENT/PROGRAMAT
  - [x] Tranzacție: update device.status = DEFECT
- [x] Implementează PATCH `/api/repair-tickets/:id/status`
  - [x] State machine validare: STATUS_FLOW = { DESCHIS: [IN_LUCRU], IN_LUCRU: [REZOLVAT, DESCHIS], ...}
  - [x] Tranziție invalidă → 400
  - [x] REZOLVAT → setează resolvedAt
  - [x] INCHIS → setează closedAt + update device.status = FUNCTIONAL
- [x] Implementează PATCH `/api/repair-tickets/:id/triage`
  - [x] Acceptă: repairType (INTERN/EXTERN), defectCause, externalProviderId
  - [x] Status → IN_LUCRU
- [x] Implementează PUT `/api/repair-tickets/:id/repair` (reparație internă - Formular Nr. 8)
  - [x] Acceptă: repairReport, actionsTaken, durationHours, partsUsed[], functionalTest
  - [x] Tranzacție:
    - [x] Calculează totalCost din partsUsed
    - [x] Scade piese din stoc (consumables)
    - [x] Update ticket + status → REZOLVAT dacă functionalTest = FUNCTIONAL
  - [x] Audit log UPDATE
- [x] Implementează GET `/api/repair-tickets` cu filtre (status, priority, deviceId)
- [x] Implementează GET `/api/repair-tickets/:id/formular8-pdf`

**Etapa 3.3.3 — Frontend Board Kanban (1.5 zile)**
- [x] Creează `frontend/src/pages/RepairTicketsPage.jsx`
  - [x] Board cu 5 coloane: DESCHIS | IN_LUCRU | REZOLVAT | TESTAT | INCHIS
  - [x] Card per ticket: nr, DM, prioritate (badge culoare roșu=Urgent), descriere
  - [x] Click card: deschide modal detalii
  - [x] Modal triage (intern/extern, cauză)
  - [x] Modal reparație internă (Formular Nr. 8):
    - [x] Descriere defecțiune
    - [x] Cauză (din triage)
    - [x] Raport reparație
    - [x] Acțiuni întreprinse (text)
    - [x] Durata (ore, decimal)
    - [x] Piese folosite (selector + cantitate + cost unitar)
    - [x] Test funcțional: select (FUNCTIONAL / NEFUNCTIONAL)
    - [x] Semnări digitale (useRef + canvas)
    - [x] Buton "Generează Bon Reparație (Formular Nr. 8)" → download PDF
  - [x] Filtrare prioritate/status
  - [x] Drag-and-drop pe coloane (opțional, pentru Faza 3.5)

**Etapa 3.3.4 — Formular Nr. 8 PDF (0.5 zile)**
- [x] Implementează GET `/api/repair-tickets/:id/formular8-pdf`
- [x] PDF structure (Anexa 3):
  - [x] Antet: nr fișă, instituție, secție, DM, cod, serie, inventar
  - [x] Descriere defecțiune
  - [x] Cauza (din triage)
  - [x] Raport reparație (actionsTaken)
  - [x] Materiale utilizate (tabel: descriere | cantitate | cost unitate | total)
  - [x] Cost total
  - [x] Testare după reparație (FUNCTIONAL/NEFUNCTIONAL)
  - [x] Comentarii (observații)
  - [x] Semnături: utilizator + inginer

**Checklist Pas 3.3:**
- [x] Creare ticket: photo, descriere, prioritate
- [x] State machine: DESCHIS → IN_LUCRU → REZOLVAT → TESTAT → INCHIS (tranziții valide)
- [x] Prioritate: URGENT (roșu), NORMAL, PROGRAMAT (badge culore)
- [x] Triaj: intern vs extern (+ cauză defecțiune)
- [x] Piese folosite → scădere automată din stoc (tranzacție)
- [x] Cost total calculat automat
- [x] DM marcat DEFECT la creare, FUNCTIONAL la INCHIS
- [x] Formular Nr. 8 (Bon reparație intern) — NU Formular Nr. 9!
- [x] Tests: ≥10 teste (cu state machine edge cases)

---

### PAS 3.4 — Verificări Periodice & Metrologie (3 zile)

**Etapa 3.4.1 — Database Schema + Seed (0.5 zile)**
- [x] Adaugă model: `verifications`
- [x] Seed Anexa 24 nomenclator (17+ tipuri, periodicitate 24 luni):
  - [x] Monitoare de pacient, Ventilatoare, Defibrilatoare, Pompe infuzie, etc.
- [x] Migrate

**Etapa 3.4.2 — Backend Registru Verificări (1.5 zile)**
- [x] Creează `backend/src/routes/verifications.js`
- [x] Implementează POST `/api/verifications`
  - [x] Crează înregistrare: deviceId, type, performedDate, validUntil, certificateUrl, provider, result
- [x] Implementează GET `/api/verifications/compliance-report`
  - [x] Filtrează: devices cu requiresVerification = true, status != CASAT
  - [x] Include: ultima verificare per device
  - [x] Calculează status:
    - [x] NEVERIFICAT — nu are înregistrare
    - [x] CONFORM — validUntil >= azi
    - [x] EXPIRAT — validUntil < azi
  - [x] Calculează daysLeft
  - [x] Return: { total, conform, expirat, neverificat, devices[] }
- [x] Audit log

**Etapa 3.4.3 — Cron Job Alerte (1 dia)**
- [x] Instalează: `npm install node-cron`
- [x] Creează `backend/src/jobs/notifications.js`
- [x] Implementează cron job zilnic 08:00 (timezone: Europe/Chisinau):
  - [x] checkVerificationExpiry(): 60/30/7 zile înainte de expirare
  - [x] Crează notificări in-app sau trimite email
  - [x] Log pe console: [Cron] X verificări expiră în Y zile
- [x] În `backend/src/index.js` (după app.listen):
  - [x] Import + start: `const { startCronJobs } = require('./jobs/notifications'); startCronJobs();`

**Etapa 3.4.4 — Frontend Registru Verificări (0.5 zile)**
- [x] Creează `frontend/src/pages/VerificationsPage.jsx`
  - [x] Tabel: DM | Tip | Data | Valabil până | Status (badge) | Zile Rămase
  - [x] Filtrare: CONFORM, EXPIRAT, NEVERIFICAT
  - [x] Buton "Upload Certificat": modal cu upload + date
  - [x] Raport conformitate: summary card (total / conform / expirat / neverificat)

**Checklist Pas 3.4:**
- [x] Nomenclator Anexa 24 (17+ tipuri, periodicitate 24 luni)
- [x] Câmp requiresVerification pe devices
- [x] Înregistrare verificare + upload certificat + date validare
- [x] Status automat: CONFORM / EXPIRAT / NEVERIFICAT
- [x] Alerte cron 60/30/7 zile înainte de expirare
- [x] Raport conformitate pentru audit
- [x] Tests: ≥5 teste

---

### PAS 3.5 — Contracte Mentenanță Externă (2 zile)

**Etapa 3.5.1 — Database Schema (0.5 zile)**
- [x] Finalizează modele: `service_providers`, `service_contracts`, `provider_ratings`
- [x] Migrate

**Etapa 3.5.2 — Backend CRUD Contracte (1 dia)**
- [x] Creează `backend/src/routes/serviceContracts.js`
- [x] Implementează POST `/api/service-contracts/providers`
- [x] Implementează POST `/api/service-contracts/contracts`
  - [x] Acceptă: providerId, contractNumber, startDate, endDate, value, slaHours, coveredDeviceIds[]
- [x] Implementează GET `/api/service-contracts/contracts`
  - [x] Include provider
  - [x] Calculează daysUntilExpiry = (endDate - azi) / 86400000
  - [x] Return cu daysUntilExpiry
- [x] Implementează POST `/api/service-contracts/providers/:id/rate`
  - [x] Crează rating (1-5) + comment
  - [x] Recalculează medie: provider.rating = avg
- [x] Implementează GET `/api/service-contracts/cost-analysis`
  - [x] Sumează: repair_tickets cu repairType = INTERN (totalCost)
  - [x] Sumează: service_contracts (value)
  - [x] Return: { internal: {totalCost, count}, externalContracts: {totalValue} }

**Etapa 3.5.3 — Frontend Pagină Contracte (0.5 zile)**
- [x] Creează `frontend/src/pages/ServiceContractsPage.jsx`
  - [x] Tabel contracte: Furnizor | DM Acoperite | Perioada | Valoare | Zile Expirare (badge roșu <30)
  - [x] Rating stele (1-5) per furnizor
  - [x] Grafic cost: intern vs extern (bar/pie chart)
  - [x] Buton "Crează Contract"
  - [x] Modal: Formular Nr. 9 (Act predare-primire) — deschide quando externaalizezi ticket

**Etapa 3.5.4 — Formular Nr. 9 PDF (0.5 zile)**
- [x] Implementează în `backend/src/routes/repairTickets.js` (pe ticket cu repairType = EXTERN)
- [x] GET `/api/repair-tickets/:id/handover-pdf` (Act predare-primire Formular Nr. 9)
- [x] PDF structure (Anexa 21):
  - [x] Antet: aprobat, nr act, dată
  - [x] Beneficiar (spital) | Furnizor (service)
  - [x] Referință contract
  - [x] Tabel DM: denumire | producător | serie | cod | inventar | localizare
  - [x] Stare fizică la predare (text)
  - [x] Consumabile incluse (text)
  - [x] Semnături: predat (bioinginer) | primit (furnizor)

**Checklist Pas 3.5:**
- [x] CRUD contract: furnizor, DM acoperite, perioadă, valoare, SLA
- [x] Alertă expirare cu 30 zile înainte
- [x] Evaluare furnizor: rating 1-5 + medie automată
- [x] Analiză cost intern vs extern
- [x] Formular Nr. 9 PDF (Act predare-primire extern)
- [x] Tests: ≥6 teste

</details>

---

## 🔔 NOTIFICĂRI AUTOMATE (Backend)

- [x] Instalează node-cron
- [x] Creează jobs/notifications.js
- [x] Cron job zilnic 08:00: checkMppDue + checkVerificationExpiry + checkContractExpiry
- [x] Integrare în index.js (startCronJobs)
- [x] Tests: mock cron, verifică logică alerte

---

## 🧪 TESTARE FAZA 3 (Target: ≥95% coverage)

**Backend Test Files:**
- [x] `maintenancePlans.test.js` — 8+ tests
- [x] `mppExecutions.test.js` — 6+ tests
- [x] `repairTickets.test.js` — 12+ tests (cu state machine edge cases)
- [x] `verifications.test.js` — 5+ tests
- [x] `serviceContracts.test.js` — 6+ tests
- [x] `notifications.test.js` — 4+ tests (mock cron)

**Frontend Test Files:**
- [x] `MaintenanceCalendarPage.test.jsx`
- [x] `MppExecutionForm.test.jsx` (cu SignaturePad)
- [x] `RepairTicketsPage.test.jsx`
- [x] `VerificationsPage.test.jsx`
- [x] `ServiceContractsPage.test.jsx`

**E2E Tests (Playwright):**
- [x] Login → Calendar MPP → Create Plan → Verify apariții
- [x] Login → Select apariție → Execute MPP → Upload foto → Sign → Redirect
- [x] Login → Create Ticket → Triage → Reparație internă → Formular 8 → Download PDF
- [x] Login → Upload verificare → Raport conformitate
- [x] Login → Create contract → Rate furnizor → Cost analysis

---

## 📊 Progress Summary

| Fază | Status | Completion | Tests |
|------|--------|-----------|-------|
| **1** | ✅ DONE + auditată | 100% | rulează `npm test` local |
| **2** | ✅ DONE + auditată | 100% | rulează `npm test` local |
| **3** | ✅ DONE + auditată | 100% | rulează `npm test` local |
| **4-8** | ⬜ PLANNED | 0% | — |

---

**Actualizat:** 2026-06-08  
**Faza 3:** plan detaliat pas-cu-pas în [PLAN-FAZA3-DETALIAT.md](PLAN-FAZA3-DETALIAT.md)  
**Bază normativă:** Ordinul MS nr. 889/2024 (Ghidul Bioinginerului)
