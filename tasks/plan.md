# 📋 Project Plan — SIMDM 8 Faze

**Versiune:** 2.2 (Faza 1-2 Complete + Faza 3 Detailed Plan)  
**Actualizat:** 2026-06-02  
**Audiență:** Product Managers, Team Leads, Developers  
**Status:** ✅ Faza 1-2 COMPLETĂ — Faza 3 Plan Detaliat 100%

---

## 🎯 Overview

**Vision:** Înlocuiți evidența pe hârtie a dispozitivelor medicale cu aplicație web securizată (Faza 1-8), conformă cu Ghidurile Bioinginerului (Ordinul MS 889/2024).

**Timeline estimate:** 18-22 săptămâni (4-5 luni dev time)

**Resurse estimate:** 1 backend dev + 1 frontend dev (full-time)

---

## ✅ STATUS FAZA 1 — COMPLETĂ

**Delivered:** 2026-05-30  
**Audit Score:** 104/104 (100%)  
**Test Coverage:** All auth tests passing

---

## ✅ STATUS FAZA 2 — COMPLETĂ

**Delivered:** 2026-06-02  
**Audit Score:** 130/130 (100%)  
**Test Coverage:** 95.36% backend + 91.99% frontend + 15 E2E tests  
**QA Status:** 🟢 All tests passing, CI/CD clean

---

## 🔧 FAZA 3: Mentenanță (Plan Detaliat 100%)

**Status:** PLANNED  
**Start Date:** 2026-06-05 (provisional)  
**Duration:** 16 days (3-4 weeks)  
**End Date:** 2026-06-26 (projected)

### Overview Pas 3

Implementează sistemul complet de mentenanță în 5 pași:

| Pas | Durată | Procedură | Formular | Descriere |
|-----|--------|-----------|----------|-----------|
| **3.1** | 4 zile | MDM Nr. 6 | Nr. 5 | Plan Mentenanță Preventivă (MPP) anual |
| **3.2** | 3 zile | MDM Nr. 7 | Nr. 6 | Execuție MPP cu checklist + semnătură |
| **3.3** | 4 zile | MDM Nr. 8 | Nr. 8 | Mentenanță Corectivă - ticketing + state machine |
| **3.4** | 3 zile | Anexa 24/25 | Registru | Verificări periodice + metrologie |
| **3.5** | 2 zile | MDM Nr. 4 | Nr. 9 | Contracte mentenanță externă + Formular Nr. 9 |
| **TOTAL** | **16 zile** | | | |

### ⚠️ CORECȚIE IMPORTANTĂ (Ghid verificat)

**Formular Nr. 8 (Fișă de deservire) = Bon reparație INTERN (pas 3.3)**  
**Formular Nr. 9 (Act predare-primire) = Externalizare la furnizor (pas 3.5)**

Planul corectează greșeli din formulări anterioare.

### Pas 3.1 — Plan Mentenanță Preventivă (4 zile)

**Deliverables:**
- Backend: Generator plan cu frecvențe (LUNAR, TRIMESTRIAL, SEMESTRIAL, ANUAL)
- Frontend: Calendar interactiv (react-big-calendar) cu status culori
- Status automat: PROGRAMAT (verde), SCADENT ≤7 zile (portocaliu), DEPASIT (roșu), EFECTUAT (albastru)
- Reprogramare cu motivare obligatorie (min 5 caractere)
- Formular Nr. 5 PDF: grilă anuală cu luni (Ian-Dec) și X-uri marcate

**Database Schema:**
- `maintenance_plans` — plan anual per DM
- `mpp_occurrences` — apariții concrete din calendar

**API Endpoints:**
- POST `/api/maintenance-plans/generate` — generează plan + apariții
- GET `/api/maintenance-plans/calendar?year=2026` — calendar cu status calculat
- PATCH `/api/maintenance-plans/occurrence/:id/reschedule` — reprogramare
- GET `/api/maintenance-plans/:year/formular5-pdf` — Formular Nr. 5

### Pas 3.2 — Implementare MPP (3 zile)

**Deliverables:**
- Backend: Endpoint execuție cu checklist dinamic + scădere consumabile
- Frontend: Formular cu checklist (checkbox + notă), semnătură digitală (react-signature-canvas)
- Upload foto înainte/după (reutilizează upload Faza 2 cu antivirus)
- Tranzacție atomică: creare execuție + actualizare DM + scădere stoc
- Formular Nr. 6 PDF: fișa de mentenanță cu tabel operațiuni

**API Endpoints:**
- POST `/api/mpp-executions` — înregistrează execuție
- GET `/api/mpp-executions/checklist-template/:deviceId` — template generic

### Pas 3.3 — Mentenanță Corectivă (4 zile)

**Deliverables:**
- Backend: Sistem ticketing cu state machine validată
- State machine: DESCHIS → IN_LUCRU → REZOLVAT → TESTAT → INCHIS
- Triaj: INTERN vs EXTERN (cu defect cause)
- Reparație internă: raport + piese folosite + cost total + test funcțional
- Reparație externă: predare furnizor cu Formular Nr. 9
- Frontend: Board vizual pe coloane de status (Kanban style)
- Formular Nr. 8 PDF: bon reparație intern

**Database Schema:**
- `repair_tickets` — bilete de reparație
- `externalProvider` — furnizori service

**API Endpoints:**
- POST `/api/repair-tickets` — raportează defecțiune (DESCHIS)
- PATCH `/api/repair-tickets/:id/status` — schimbă status (validează tranziții)
- PATCH `/api/repair-tickets/:id/triage` — triaj intern/extern
- PUT `/api/repair-tickets/:id/repair` — completează reparație internă
- GET `/api/repair-tickets` — listă cu filtre
- GET `/api/repair-tickets/:id/formular8-pdf` — Bon reparație

### Pas 3.4 — Verificări Periodice & Metrologie (3 zile)

**Deliverables:**
- Backend: Registru verificări + certificate
- Nomenclator Anexa 24: 17+ tipuri (monitoare, ventilatoare, defibrilatoare, etc.) + periodicitate 24 luni
- Alerte 60/30/7 zile înainte de expirare (cron job zilnic 08:00)
- Raport conformitate: CONFORM / EXPIRAT / NEVERIFICAT (pentru audit)
- Frontend: Pagină cu status verificări și upload certificat

**Database Schema:**
- `verifications` — înregistrări verificări + data validare
- Câmpuri pe `devices`: `requiresVerification`, `verificationFreqMonths`

**API Endpoints:**
- POST `/api/verifications` — înregistrează verificare
- GET `/api/verifications/compliance-report` — raport audit

### Pas 3.5 — Contracte Mentenanță Externă (2 zile)

**Deliverables:**
- Backend: CRUD contracte + furnizori + rating
- Contracte: dată început/final, valoare, SLA (ore răspuns), DM acoperite
- Rating furnizor: 1-5 stele după fiecare intervenție + medie automată
- Analiză cost: contracte externe vs reparații interne (grafic)
- Alerte 30 zile înainte de expirare
- Formular Nr. 9 PDF: Act predare-primire la externalizare

**Database Schema:**
- `service_providers` — furnizori
- `service_contracts` — contracte
- `provider_ratings` — evaluări

**API Endpoints:**
- POST `/api/service-contracts/providers` — crează furnizor
- POST `/api/service-contracts/contracts` — crează contract
- GET `/api/service-contracts/contracts` — listă cu zile până expirare
- POST `/api/service-contracts/providers/:id/rate` — rating post-intervenție
- GET `/api/service-contracts/cost-analysis` — analiză cost

### 🔔 Notificări Automate (cron jobs)

**node-cron job zilnic 08:00 (timezone: Europe/Chisinau)**

Verificări automate:
- MPP scadente în 7 zile
- Verificări expiră în 60/30/7 zile
- Contracte expiră în 30 zile

### Dependencies Faza 3

**Frontend:**
```
npm install react-big-calendar date-fns react-signature-canvas
```

**Backend:**
```
npm install node-cron
```

PDFKit, multer, antivirus deja există din Faza 2.

### 🧪 Testare Faza 3 (≥95% coverage)

| Modul | Cazuri cheie | Status |
|-------|-------------|--------|
| `maintenancePlans` | frecvențe, calendar status, reschedule, Formular 5 PDF | ⭕ |
| `mppExecutions` | execuție, scădere consumabile (tranzacție), checklist | ⭕ |
| `repairTickets` | creare, state machine, triaj, reparație, Formular 8 PDF | ⭕ |
| `verifications` | înregistrare, compliance-report | ⭕ |
| `serviceContracts` | CRUD, expiry, rating, cost-analysis | ⭕ |
| `jobs/notifications` | cron checks (MPP, verificări, contracte) | ⭕ |

Frontend: teste pentru `MaintenanceCalendarPage`, `MppExecutionForm`, `RepairTicketsPage`, `ServiceContractsPage`, `SignaturePad`.

### ✅ Checklist Final Faza 3

**Funcționalități:**
- [ ] 3.1 — Calendar MPP + generator + Formular Nr. 5
- [ ] 3.2 — Execuție MPP + checklist + semnătură + Formular Nr. 6
- [ ] 3.3 — Ticketing corectiv + state machine + Formular Nr. 8
- [ ] 3.4 — Verificări + metrologie + raport conformitate
- [ ] 3.5 — Contracte externe + rating + Formular Nr. 9

**Conformitate:**
- [ ] Formularele etichetate CORECT (5, 6, 8, 9)
- [ ] Procedurile MDM Nr. 4, 6, 7, 8 implementate
- [ ] Anexa 24 + 25 (nomenclator, metrologie)

**Calitate:**
- [ ] node-cron pentru notificări
- [ ] Tranzacții Prisma pentru operații atomice
- [ ] State machine validată
- [ ] Semnătură digitală
- [ ] Calendar interactiv
- [ ] Teste ≥95% coverage
- [ ] Audit log complet

---

## 🔧 FAZA 4: Documente & Proceduri

**Status:** PLANNED  
**ETA:** 2-3 săptămâni după Faza 3

### Deliverables

| Modul | Tasks |
|-------|-------|
| **DMS** | Upload, categorize, version control |
| **PDF Generation** | All forms auto-generated, document registry |
| **Procedures** | Templates, checklists, printing |

---

## 🚨 FAZA 5: Incidente & Vigilență

**Status:** PLANNED  
**ETA:** 2-3 săptămâni după Faza 4

---

## 🛒 FAZA 6: Procurement

**Status:** PLANNED  
**ETA:** 2-3 săptămâni după Faza 5

---

## 📊 FAZA 7: Dashboard & Raportare

**Status:** PLANNED  
**ETA:** 2-3 săptămâni după Faza 6

---

## 🎓 FAZA 8: QA & Go-Live

**Status:** PLANNED  
**ETA:** 1-2 săptămâni după Faza 7

---

## 📊 Resource Timeline

```
Faza 1  ✅ DONE                (2026-05-30)
Faza 2  ✅ DONE                (2026-06-02)  
Faza 3  |████████| 16 days     (2026-06-05 — 2026-06-26)
Faza 4  |██████| 2-3 week      (2026-06-26 — 2026-07-12)
Faza 5  |██████| 2-3 week      (2026-07-12 — 2026-07-28)
Faza 6  |██████| 2-3 week      (2026-07-28 — 2026-08-13)
Faza 7  |██████| 2-3 week      (2026-08-13 — 2026-08-29)
Faza 8  |████| 1-2 week        (2026-08-29 — 2026-09-12)
```

**Milestones:**
- 🎯 MVP (Faza 1-2): 2026-06-02 ✅ COMPLETED
- 🎯 Core (Faza 1-3): 2026-06-26
- 🎯 Complete: 2026-09-12

---

## ✍️ Decizii Aprobate

- ✅ Stack locked (React, Express, PostgreSQL)
- ✅ Faza 1 DONE (104/104 audit)
- ✅ Faza 2 DONE (130/130 audit + 100% test coverage)
- ✅ Faza 3 Plan APPROVED (16 days, formularele corecte)
- ⏳ Go-live target: September 2026

---

**Last Updated:** 2026-06-02  
**Plan Based On:** Ordinul MS nr. 889/2024 + Best Practices 2025-2026
