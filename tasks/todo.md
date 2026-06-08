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

## 🔧 FAZA 3: Mentenanță — ÎN LUCRU

**Status:** ÎN LUCRU · **Start:** 2026-06-05 · **Durată:** 16 zile

> **Planul pas-cu-pas, complet și verificat față de Ghid, este în [PLAN-FAZA3-DETALIAT.md](PLAN-FAZA3-DETALIAT.md).**
> Acolo găsești: schema DB per modul, endpoint-uri, frontend, formularele PDF (Nr. 5/6/7/8/9), cron jobs,
> teste, secvențierea pe 16 zile și „Definiția lui 100%". Checklist-ul de mai jos e rezumatul de progres.

**Rezumat progres (bifează pe măsură ce avansezi):**

- [ ] Pre-requisite: dependințe + câmpuri verificare pe `devices` + migrare
- [ ] Modul 1 — Plan MPP + calendar + Formular Nr. 5
- [ ] Modul 2 — Execuție MPP + semnătură + Formular Nr. 6
- [ ] Modul 3 — Corectiv + state machine + Formular Nr. 7 + Nr. 8
- [ ] Modul 4 — Verificări periodice + metrologie + raport conformitate
- [ ] Modul 5 — Contracte externe + rating + Formular Nr. 9
- [ ] Cron jobs (MPP/verificări/contracte) + integrare finală
- [ ] Teste ≥95% + 1 scenariu E2E + `npm test` verde

<details><summary>Arhivă: breakdown detaliat vechi (superseded de PLAN-FAZA3-DETALIAT.md)</summary>

**Status:** READY TO START  
**Start Date:** 2026-06-05 (provisional)  
**Duration:** 16 days (4 weeks)

### PAS 3.1 — Plan Mentenanță Preventivă (4 zile)

**Etapa 3.1.1 — Database Schema (0.5 zile)**
- [ ] Creează `backend/prisma/schema/maintenance.prisma`
- [ ] Adaugă modele: `maintenance_plans`, `mpp_occurrences`
- [ ] Adaugă relații inverse în `devices` (maintenance_plans[], mpp_occurrences[])
- [ ] Adaugă câmpuri pe devices: `lastMaintenanceAt`, `requiresVerification`, `verificationFreqMonths`
- [ ] Rulează: `npx prisma migrate dev --name add_maintenance_module`
- [ ] Rulează: `npx prisma generate`

**Etapa 3.1.2 — Backend Generator Plan (1.5 zile)**
- [ ] Creează `backend/src/routes/maintenancePlans.js`
- [ ] Implementează POST `/api/maintenance-plans/generate`
  - [ ] Mapare frecvență → luni (LUNAR=12, TRIMESTRIAL=4, SEMESTRIAL=2, ANUAL=1)
  - [ ] Creare/update plan cu upsert
  - [ ] Ștergere apariții vechi neefectuate
  - [ ] Creare apariții noi din luni calculate
- [ ] Implementează GET `/api/maintenance-plans/calendar?year=YYYY`
  - [ ] Filtrare după an
  - [ ] Calcul automat status pe baza datei (PROGRAMAT/SCADENT/DEPASIT/EFECTUAT)
- [ ] Implementează PATCH `/api/maintenance-plans/occurrence/:id/reschedule`
  - [ ] Validare motivare min 5 caractere (obligatorie)
  - [ ] Salvare dată reprogramării + motiv
- [ ] Adaugă audit log pentru toate operațiile
- [ ] Test caz critic: reschedule fără motivare → 400

**Etapa 3.1.3 — Frontend Calendar (1.5 zile)**
- [ ] Instalează: `npm install react-big-calendar date-fns`
- [ ] Creează `frontend/src/pages/MaintenanceCalendarPage.jsx`
  - [ ] Calendar interactiv cu react-big-calendar
  - [ ] Localizare română (ro locale din date-fns)
  - [ ] Dropdown pentru schimbare an
  - [ ] Legendă culori: PROGRAMAT (verde), SCADENT (portocaliu), DEPASIT (roșu), EFECTUAT (albastru)
  - [ ] Query backend `/api/maintenance-plans/calendar?year=...`
  - [ ] Click event: deschide detalii/reschedule modal
- [ ] Crează modal reschedule cu validare text min 5 caractere

**Etapa 3.1.4 — Formular Nr. 5 PDF (1 zi)**
- [ ] Implementează GET `/api/maintenance-plans/:year/formular5-pdf`
- [ ] PDF structure (landscape A4):
  - [ ] Titlu: "PLAN DE MENTENANȚĂ PREVENTIVĂ ... ANUL [year]"
  - [ ] Referință: "Formular Nr. 5 – Anexa 16, Procedura MDM Nr. 6"
  - [ ] Antet tabel: Nr | Denumire | Serie | Secție | Responsabil | Ian | Feb | ... | Dec
  - [ ] Rânduri cu X pentru lunile planificate
  - [ ] Footer cu dată generare
- [ ] Test: Generate PDF cu 3-5 DM, verifică diacritice și format

**Checklist Pas 3.1:**
- [ ] Database schema migrate + generate
- [ ] Generator frecvențe corect (LUNAR=12, TRIMESTRIAL=4, etc.)
- [ ] Calendar status automat PROGRAMAT/SCADENT/DEPASIT (după dată)
- [ ] Reprogramare cu motivare obligatorie (5+ caractere)
- [ ] Formular Nr. 5 PDF cu grilă luni (Jan-Dec)
- [ ] Audit log complet
- [ ] Tests: ≥8 teste unitare

---

### PAS 3.2 — Implementare MPP (3 zile)

**Etapa 3.2.1 — Database Schema (0.5 zile)**
- [ ] Adaugă modele: `mpp_executions`
- [ ] Migrate: `npx prisma migrate dev --name add_mpp_executions`

**Etapa 3.2.2 — Backend Execuție (1 zi)**
- [ ] Creează `backend/src/routes/mppExecutions.js`
- [ ] Implementează POST `/api/mpp-executions`
  - [ ] Validare date obligatorii (deviceId, executedDate, performedBy, checklist)
  - [ ] Tranzacție Prisma:
    - [ ] Crează execuție (mpp_executions)
    - [ ] Update apariție: status = EFECTUAT, link executionId
    - [ ] Update device: lastMaintenanceAt
    - [ ] Scade consumabile din stoc (pentru fiecare din consumablesUsed)
  - [ ] Audit log CREATE
- [ ] Implementează GET `/api/mpp-executions/checklist-template/:deviceId`
  - [ ] Return template generic (6 operațiuni standard)
  - [ ] Opțional: lookup pe model DM pentru template specific

**Etapa 3.2.3 — Frontend Formular Execuție (1 dia)**
- [ ] Instalează: `npm install react-signature-canvas`
- [ ] Creează `frontend/src/pages/MppExecutionForm.jsx`
  - [ ] Select DM + occurrence din calendar
  - [ ] Data execuție, durată (minute)
  - [ ] Checklist dinamic: map-eaza template
    - [ ] Checkbox per operațiune
    - [ ] Text field pentru notă per operațiune
  - [ ] Selector consumabile cu cantitate (useQuery `/consumables/dropdown`)
  - [ ] Upload foto înainte (+ antivirus din Faza 2)
  - [ ] Upload foto după
  - [ ] SignaturePad component (bioinginer + responsabil secție)
  - [ ] Buton Submit → POST `/mpp-executions` → redirect calendar
- [ ] Criptează/encode semnături în base64 înainte de submit

**Etapa 3.2.4 — Formular Nr. 6 PDF (0.5 zile)**
- [ ] Implementează GET `/api/mpp-executions/:id/formular6-pdf`
- [ ] PDF structure (Anexa 2):
  - [ ] Antet identificare DM (denumire, serie, inventar, secție, clasă electrică, producător)
  - [ ] Antet mentenanță (frecvență MPP: DA/NU, verificare periodică: DA/NU)
  - [ ] Tabel operațiuni (descriere | data/ora început | data/ora final | responsabil | semnătură)
  - [ ] Observații
  - [ ] Semnături digitale (bioinginer, responsabil secție)

**Checklist Pas 3.2:**
- [ ] Checklist dinamic cu operațiuni + note per operațiune
- [ ] Semnătură digitală (canvas) bioinginer + responsabil secție
- [ ] Upload foto înainte/după
- [ ] Tranzacție atomică: creare + scădere stoc + update calendar
- [ ] Apariția din calendar → status EFECTUAT
- [ ] Formular Nr. 6 PDF
- [ ] Tests: ≥6 teste

---

### PAS 3.3 — Mentenanță Corectivă (4 zile)

**Etapa 3.3.1 — Database Schema (0.5 zile)**
- [ ] Adaugă modele: `repair_tickets`, `service_providers` (partial)
- [ ] Migrate

**Etapa 3.3.2 — Backend Ticketing (2 zile)**
- [ ] Creează `backend/src/routes/repairTickets.js`
- [ ] Implementează POST `/api/repair-tickets` (raportare defecțiune)
  - [ ] Generate ticketNumber (TKT-YYYY-NNNN)
  - [ ] Creare ticket: status = DESCHIS, priority = NORMAL/URGENT/PROGRAMAT
  - [ ] Tranzacție: update device.status = DEFECT
- [ ] Implementează PATCH `/api/repair-tickets/:id/status`
  - [ ] State machine validare: STATUS_FLOW = { DESCHIS: [IN_LUCRU], IN_LUCRU: [REZOLVAT, DESCHIS], ...}
  - [ ] Tranziție invalidă → 400
  - [ ] REZOLVAT → setează resolvedAt
  - [ ] INCHIS → setează closedAt + update device.status = FUNCTIONAL
- [ ] Implementează PATCH `/api/repair-tickets/:id/triage`
  - [ ] Acceptă: repairType (INTERN/EXTERN), defectCause, externalProviderId
  - [ ] Status → IN_LUCRU
- [ ] Implementează PUT `/api/repair-tickets/:id/repair` (reparație internă - Formular Nr. 8)
  - [ ] Acceptă: repairReport, actionsTaken, durationHours, partsUsed[], functionalTest
  - [ ] Tranzacție:
    - [ ] Calculează totalCost din partsUsed
    - [ ] Scade piese din stoc (consumables)
    - [ ] Update ticket + status → REZOLVAT dacă functionalTest = FUNCTIONAL
  - [ ] Audit log UPDATE
- [ ] Implementează GET `/api/repair-tickets` cu filtre (status, priority, deviceId)
- [ ] Implementează GET `/api/repair-tickets/:id/formular8-pdf`

**Etapa 3.3.3 — Frontend Board Kanban (1.5 zile)**
- [ ] Creează `frontend/src/pages/RepairTicketsPage.jsx`
  - [ ] Board cu 5 coloane: DESCHIS | IN_LUCRU | REZOLVAT | TESTAT | INCHIS
  - [ ] Card per ticket: nr, DM, prioritate (badge culoare roșu=Urgent), descriere
  - [ ] Click card: deschide modal detalii
  - [ ] Modal triage (intern/extern, cauză)
  - [ ] Modal reparație internă (Formular Nr. 8):
    - [ ] Descriere defecțiune
    - [ ] Cauză (din triage)
    - [ ] Raport reparație
    - [ ] Acțiuni întreprinse (text)
    - [ ] Durata (ore, decimal)
    - [ ] Piese folosite (selector + cantitate + cost unitar)
    - [ ] Test funcțional: select (FUNCTIONAL / NEFUNCTIONAL)
    - [ ] Semnări digitale (useRef + canvas)
    - [ ] Buton "Generează Bon Reparație (Formular Nr. 8)" → download PDF
  - [ ] Filtrare prioritate/status
  - [ ] Drag-and-drop pe coloane (opțional, pentru Faza 3.5)

**Etapa 3.3.4 — Formular Nr. 8 PDF (0.5 zile)**
- [ ] Implementează GET `/api/repair-tickets/:id/formular8-pdf`
- [ ] PDF structure (Anexa 3):
  - [ ] Antet: nr fișă, instituție, secție, DM, cod, serie, inventar
  - [ ] Descriere defecțiune
  - [ ] Cauza (din triage)
  - [ ] Raport reparație (actionsTaken)
  - [ ] Materiale utilizate (tabel: descriere | cantitate | cost unitate | total)
  - [ ] Cost total
  - [ ] Testare după reparație (FUNCTIONAL/NEFUNCTIONAL)
  - [ ] Comentarii (observații)
  - [ ] Semnături: utilizator + inginer

**Checklist Pas 3.3:**
- [ ] Creare ticket: photo, descriere, prioritate
- [ ] State machine: DESCHIS → IN_LUCRU → REZOLVAT → TESTAT → INCHIS (tranziții valide)
- [ ] Prioritate: URGENT (roșu), NORMAL, PROGRAMAT (badge culore)
- [ ] Triaj: intern vs extern (+ cauză defecțiune)
- [ ] Piese folosite → scădere automată din stoc (tranzacție)
- [ ] Cost total calculat automat
- [ ] DM marcat DEFECT la creare, FUNCTIONAL la INCHIS
- [ ] Formular Nr. 8 (Bon reparație intern) — NU Formular Nr. 9!
- [ ] Tests: ≥10 teste (cu state machine edge cases)

---

### PAS 3.4 — Verificări Periodice & Metrologie (3 zile)

**Etapa 3.4.1 — Database Schema + Seed (0.5 zile)**
- [ ] Adaugă model: `verifications`
- [ ] Seed Anexa 24 nomenclator (17+ tipuri, periodicitate 24 luni):
  - [ ] Monitoare de pacient, Ventilatoare, Defibrilatoare, Pompe infuzie, etc.
- [ ] Migrate

**Etapa 3.4.2 — Backend Registru Verificări (1.5 zile)**
- [ ] Creează `backend/src/routes/verifications.js`
- [ ] Implementează POST `/api/verifications`
  - [ ] Crează înregistrare: deviceId, type, performedDate, validUntil, certificateUrl, provider, result
- [ ] Implementează GET `/api/verifications/compliance-report`
  - [ ] Filtrează: devices cu requiresVerification = true, status != CASAT
  - [ ] Include: ultima verificare per device
  - [ ] Calculează status:
    - [ ] NEVERIFICAT — nu are înregistrare
    - [ ] CONFORM — validUntil >= azi
    - [ ] EXPIRAT — validUntil < azi
  - [ ] Calculează daysLeft
  - [ ] Return: { total, conform, expirat, neverificat, devices[] }
- [ ] Audit log

**Etapa 3.4.3 — Cron Job Alerte (1 dia)**
- [ ] Instalează: `npm install node-cron`
- [ ] Creează `backend/src/jobs/notifications.js`
- [ ] Implementează cron job zilnic 08:00 (timezone: Europe/Chisinau):
  - [ ] checkVerificationExpiry(): 60/30/7 zile înainte de expirare
  - [ ] Crează notificări in-app sau trimite email
  - [ ] Log pe console: [Cron] X verificări expiră în Y zile
- [ ] În `backend/src/index.js` (după app.listen):
  - [ ] Import + start: `const { startCronJobs } = require('./jobs/notifications'); startCronJobs();`

**Etapa 3.4.4 — Frontend Registru Verificări (0.5 zile)**
- [ ] Creează `frontend/src/pages/VerificationsPage.jsx`
  - [ ] Tabel: DM | Tip | Data | Valabil până | Status (badge) | Zile Rămase
  - [ ] Filtrare: CONFORM, EXPIRAT, NEVERIFICAT
  - [ ] Buton "Upload Certificat": modal cu upload + date
  - [ ] Raport conformitate: summary card (total / conform / expirat / neverificat)

**Checklist Pas 3.4:**
- [ ] Nomenclator Anexa 24 (17+ tipuri, periodicitate 24 luni)
- [ ] Câmp requiresVerification pe devices
- [ ] Înregistrare verificare + upload certificat + date validare
- [ ] Status automat: CONFORM / EXPIRAT / NEVERIFICAT
- [ ] Alerte cron 60/30/7 zile înainte de expirare
- [ ] Raport conformitate pentru audit
- [ ] Tests: ≥5 teste

---

### PAS 3.5 — Contracte Mentenanță Externă (2 zile)

**Etapa 3.5.1 — Database Schema (0.5 zile)**
- [ ] Finalizează modele: `service_providers`, `service_contracts`, `provider_ratings`
- [ ] Migrate

**Etapa 3.5.2 — Backend CRUD Contracte (1 dia)**
- [ ] Creează `backend/src/routes/serviceContracts.js`
- [ ] Implementează POST `/api/service-contracts/providers`
- [ ] Implementează POST `/api/service-contracts/contracts`
  - [ ] Acceptă: providerId, contractNumber, startDate, endDate, value, slaHours, coveredDeviceIds[]
- [ ] Implementează GET `/api/service-contracts/contracts`
  - [ ] Include provider
  - [ ] Calculează daysUntilExpiry = (endDate - azi) / 86400000
  - [ ] Return cu daysUntilExpiry
- [ ] Implementează POST `/api/service-contracts/providers/:id/rate`
  - [ ] Crează rating (1-5) + comment
  - [ ] Recalculează medie: provider.rating = avg
- [ ] Implementează GET `/api/service-contracts/cost-analysis`
  - [ ] Sumează: repair_tickets cu repairType = INTERN (totalCost)
  - [ ] Sumează: service_contracts (value)
  - [ ] Return: { internal: {totalCost, count}, externalContracts: {totalValue} }

**Etapa 3.5.3 — Frontend Pagină Contracte (0.5 zile)**
- [ ] Creează `frontend/src/pages/ServiceContractsPage.jsx`
  - [ ] Tabel contracte: Furnizor | DM Acoperite | Perioada | Valoare | Zile Expirare (badge roșu <30)
  - [ ] Rating stele (1-5) per furnizor
  - [ ] Grafic cost: intern vs extern (bar/pie chart)
  - [ ] Buton "Crează Contract"
  - [ ] Modal: Formular Nr. 9 (Act predare-primire) — deschide quando externaalizezi ticket

**Etapa 3.5.4 — Formular Nr. 9 PDF (0.5 zile)**
- [ ] Implementează în `backend/src/routes/repairTickets.js` (pe ticket cu repairType = EXTERN)
- [ ] GET `/api/repair-tickets/:id/handover-pdf` (Act predare-primire Formular Nr. 9)
- [ ] PDF structure (Anexa 21):
  - [ ] Antet: aprobat, nr act, dată
  - [ ] Beneficiar (spital) | Furnizor (service)
  - [ ] Referință contract
  - [ ] Tabel DM: denumire | producător | serie | cod | inventar | localizare
  - [ ] Stare fizică la predare (text)
  - [ ] Consumabile incluse (text)
  - [ ] Semnături: predat (bioinginer) | primit (furnizor)

**Checklist Pas 3.5:**
- [ ] CRUD contract: furnizor, DM acoperite, perioadă, valoare, SLA
- [ ] Alertă expirare cu 30 zile înainte
- [ ] Evaluare furnizor: rating 1-5 + medie automată
- [ ] Analiză cost intern vs extern
- [ ] Formular Nr. 9 PDF (Act predare-primire extern)
- [ ] Tests: ≥6 teste

</details>

---

## 🔔 NOTIFICĂRI AUTOMATE (Backend)

- [ ] Instalează node-cron
- [ ] Creează jobs/notifications.js
- [ ] Cron job zilnic 08:00: checkMppDue + checkVerificationExpiry + checkContractExpiry
- [ ] Integrare în index.js (startCronJobs)
- [ ] Tests: mock cron, verifică logică alerte

---

## 🧪 TESTARE FAZA 3 (Target: ≥95% coverage)

**Backend Test Files:**
- [ ] `maintenancePlans.test.js` — 8+ tests
- [ ] `mppExecutions.test.js` — 6+ tests
- [ ] `repairTickets.test.js` — 12+ tests (cu state machine edge cases)
- [ ] `verifications.test.js` — 5+ tests
- [ ] `serviceContracts.test.js` — 6+ tests
- [ ] `notifications.test.js` — 4+ tests (mock cron)

**Frontend Test Files:**
- [ ] `MaintenanceCalendarPage.test.jsx`
- [ ] `MppExecutionForm.test.jsx` (cu SignaturePad)
- [ ] `RepairTicketsPage.test.jsx`
- [ ] `VerificationsPage.test.jsx`
- [ ] `ServiceContractsPage.test.jsx`

**E2E Tests (Playwright):**
- [ ] Login → Calendar MPP → Create Plan → Verify apariții
- [ ] Login → Select apariție → Execute MPP → Upload foto → Sign → Redirect
- [ ] Login → Create Ticket → Triage → Reparație internă → Formular 8 → Download PDF
- [ ] Login → Upload verificare → Raport conformitate
- [ ] Login → Create contract → Rate furnizor → Cost analysis

---

## 📊 Progress Summary

| Fază | Status | Completion | Tests |
|------|--------|-----------|-------|
| **1** | ✅ DONE + auditată | 100% | rulează `npm test` local |
| **2** | ✅ DONE + auditată | 100% | rulează `npm test` local |
| **3** | 🔧 ÎN LUCRU | 0% | Target: ≥95% |
| **4-8** | ⬜ PLANNED | 0% | — |

---

**Actualizat:** 2026-06-08  
**Faza 3:** plan detaliat pas-cu-pas în [PLAN-FAZA3-DETALIAT.md](PLAN-FAZA3-DETALIAT.md)  
**Bază normativă:** Ordinul MS nr. 889/2024 (Ghidul Bioinginerului)
