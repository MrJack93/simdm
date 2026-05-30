# 📋 Project Plan — SIMDM 8 Faze

**Versiune:** 2.0 (Faza 1 Complete + Full Roadmap)  
**Actualizat:** 2026-05-30  
**Audiență:** Product Managers, Team Leads  
**Status:** ✅ Faza 1 COMPLETĂ — Roadmap 8 faze definit

---

## 🎯 Overview

**Vision:** Înlocuiți evidența pe hârtie a dispozitivelor medicale cu aplicație web securizată (Faza 1-8), conformă cu Ghidurile Bioinginerului (Ordinul MS 889/2024).

**Timeline estimate:** 18-22 săptămâni (4-5 luni dev time)

**Resurse estimate:** 1 backend dev + 1 frontend dev (full-time)

---

## ✅ STATUS FAZA 1 — COMPLETĂ

**Delivered:** 2026-05-30

**Checklist:**
- ✅ Docker stack (PostgreSQL, backend, frontend)
- ✅ Authentication (JWT, bcrypt, refresh tokens)
- ✅ Login page (dark/light, responsive, WCAG 2.1 AA)
- ✅ Database (10+ tabele, 6 migrații, seed data)
- ✅ Documentație (8 fișiere profesioniste)
- ✅ Audit score: **104/104 (100%)**

**Next:** Faza 2 (Inventar DM) — kickoff

---

## 🗂️ FAZA 2: Inventar DM

**Status:** PLANNING  
**ETA:** 3-4 săptămâni  
**Priority:** 🔴 CRITICAL (MVP core)

### Deliverables

| Modul | Tasks | Complexity |
|-------|-------|-----------|
| **CRUD Devices** | GET list + filters, POST create, PUT edit, DELETE soft-delete | Medium |
| **Inventory Page** | DataGrid, sorting, filtering, pagination | Medium |
| **DeviceForm** | 6-step wizard, validation (Zod), file upload | High |
| **Components** | StatusBadge, DeviceCard, SearchBar | Low |
| **Export** | CSV export with all columns | Low |
| **Backend API** | 5-6 endpoints, validation, error handling | Medium |

### Acceptance Criteria
- [ ] CRUD tested (Postman)
- [ ] Inventory table displays 8 seed devices
- [ ] Filters work (status, name, section, risk class)
- [ ] Export to CSV
- [ ] Mobile responsive
- [ ] Lighthouse ≥ 95
- [ ] Zero console errors
- [ ] Documentation updated

---

## 🔧 FAZA 3: Mentenanță

**Status:** PLANNED  
**ETA:** 3-4 săptămâni după Faza 2

### Deliverables

| Modul | Tasks |
|-------|-------|
| **Maintenance CRUD** | Create MP/MC, schedule, track completion |
| **Plan Preventiv** | Auto-calculate next due dates |
| **Cost Tracking** | Per-device cost breakdown |
| **Service Providers** | Internal/external vendor tracking |
| **Reports** | Schedule, cost, MP vs MC ratio |

---

## 📄 FAZA 4: Documente & Proceduri

**Status:** PLANNED  
**ETA:** 2-3 săptămâni

### Deliverables

| Modul | Tasks |
|-------|-------|
| **DMS** | Upload, categorize, version control |
| **PDF Generation** | Device sheet, maintenance reports |
| **Procedures** | Templates, checklists, printing |

---

## 🚨 FAZA 5: Incidente & Vigilență

**Status:** PLANNED  
**ETA:** 2-3 săptămâni

### Deliverables

| Modul | Tasks |
|-------|-------|
| **Incident Reporting** | Severity, impact, root cause, actions |
| **Alerts** | Email, dashboard, escalation |
| **AMDM Reporting** | Compliance reporting to national system |

---

## 🛒 FAZA 6: Procurement

**Status:** PLANNED  
**ETA:** 2-3 săptămâni

### Deliverables

| Modul | Tasks |
|-------|-------|
| **Supplier Management** | Vendor contacts, contracts |
| **Device Lifecycle** | PIF workflow, decommissioning |

---

## 📊 FAZA 7: Dashboard & Raportare

**Status:** PLANNED  
**ETA:** 2-3 săptămâni

### Deliverables

| Modul | Tasks |
|-------|-------|
| **Dashboard KPI** | Device status pie chart, alerts, upcoming maintenance |
| **Monthly Reports** | PDF export with KPI |
| **Data Export** | CSV, Excel, PDF formats |

---

## 🎓 FAZA 8: QA & Go-Live

**Status:** PLANNED  
**ETA:** 1-2 săptămâni

### Deliverables

| Modul | Tasks |
|-------|-------|
| **Testing** | Functional, security, performance, accessibility |
| **Deployment** | Docker optimization, server setup, backup strategy |
| **Training** | User documentation, IT staff training |

---

## 📊 Resource Timeline

```
Faza 1  ✅ DONE                (2026-05-30)
Faza 2  |████████| 3-4 week    (2026-06-15 — 2026-06-26)
Faza 3  |████████| 3-4 week    (2026-06-26 — 2026-07-17)
Faza 4  |██████| 2-3 week      (2026-07-17 — 2026-08-01)
Faza 5  |██████| 2-3 week      (2026-08-01 — 2026-08-17)
Faza 6  |██████| 2-3 week      (2026-08-17 — 2026-09-01)
Faza 7  |██████| 2-3 week      (2026-09-01 — 2026-09-17)
Faza 8  |████| 1-2 week        (2026-09-17 — 2026-10-01)
```

**Milestones:**
- 🎯 MVP (Faza 1-2): 2026-06-26
- 🎯 Core (Faza 1-3): 2026-07-17
- 🎯 Complete: 2026-10-01

---

## 📈 Estimate Daysworktrack

| Fază | Backend | Frontend | QA | Total |
|------|---------|----------|-----|-------|
| 1    | ✅ Done | ✅ Done | ✅ 2 | ✅ Done |
| 2    | 12-15  | 12-15  | 2-3 | 26-33 |
| 3    | 14-18  | 8-10   | 2-3 | 24-31 |
| 4    | 8-10   | 10-12  | 2   | 20-24 |
| 5    | 10-12  | 8-10   | 2   | 20-24 |
| 6    | 8-10   | 6-8    | 1   | 15-19 |
| 7    | 10-12  | 10-12  | 2   | 22-26 |
| 8    | 5-8    | 5-8    | 3-5 | 13-21 |
| **TOTAL** | **67-85** | **59-75** | **16-22** | **142-182 days** |

**At 5 days/week:** 6-7 months total

---

## ⚠️ Riscuri & Mitigation

| Risc | Impact | Plan |
|------|--------|------|
| Scope creep | High | Strict phase gates |
| Data migration | High | Test + validate + dry-run |
| Performance | Medium | Monitoring + indexing |
| Training delays | Medium | Early materials |
| Security issues | High | Audits + penetration test |

---

## ✍️ Decizii Aprobate

- ✅ Stack locked (React, Express, PostgreSQL)
- ✅ Faza 1 DONE (104/104 audit)
- ⏳ Faza 2 kickoff date: TBD
- ⏳ Go-live target: October 2026

---

**Următor:** Faza 2 planning — citire [SPEC.md](../SPEC.md)
| **2.1** | CRUD Device — formular add/edit + backend routes | 5 zile |
| **2.2** | Tabel Inventar + Filtre avansate + Export | 3 zile |
| **2.3** | Inventariere Anuală (workflow calendar + checklist) | 3 zile |
| **2.4** | Consumabile & Piese Schimb | 3 zile |

**MVP obligatoriu:** Pas 2.1 + Pas 2.2. Pașii 2.3–2.4 sunt sprint următor.

---

## Dependency Graph

```
[A1] Install deps frontend + backend
[A2] BrowserRouter + Routes + ProtectedRoute în App.jsx / main.jsx
[A3] GET /api/sections — endpoint public secții (dropdown)
  ↓
[B1] deviceSchema.js — Zod schema (JavaScript pur, fără TypeScript)
[B2] DeviceForm.jsx — formular React Hook Form + Zod (create + edit mode)
[B3] routes/devices.js — CRUD + statice ÎNAINTE de /:id
[B4] Multer upload + mkdir autocreate la startup
[B5] GET /:id/fisa-pdf — PDF Fișă DM cu PDFKit
  ↓
[C1] InventoryPage.jsx — tabel + filtre + paginare
[C2] Export Excel (ExcelJS) + Export CSV
[C3] Soft delete cu confirmare (CASAT)
  ↓
[D1] Wire routes în App.jsx: /inventory, /devices/new, /devices/:id/edit
[D2] ToastContainer global în main.jsx
[D3] Verificare end-to-end
```

---

## Architecture Decisions

### 1. Routing în App.jsx
App.jsx nu are încă `BrowserRouter`. Faza 2 adaugă:
- `BrowserRouter` în `main.jsx`
- `Routes` în `App.jsx`: `/`, `/inventory`, `/devices/new`, `/devices/:id/edit`
- `ProtectedRoute`: dacă `!user && !loading` → `<Navigate to="/" />`
- `react-router-dom` deja instalat (v7).

### 2. Route ordering în devices.js — CRITIC
Express evaluează rutele în ordinea înregistrării. Rutele statice TREBUIE înregistrate **înainte** de `/:id`, altfel Express interpretează "sections", "export" etc. drept ID-uri:

```javascript
// ✅ CORECT — static routes first
router.get('/dropdown/sections', ...)   // 1
router.get('/export/xlsx', ...)          // 2
router.get('/export/csv', ...)           // 3
router.get('/', ...)                     // 4
router.get('/:id', ...)                  // 5 — ultimul
router.get('/:id/fisa-pdf', ...)         // 6 — tot /:id pattern, ok
```

### 3. PrismaClient — instanța unică din db.js
Ambele documente Faza2 creează `new PrismaClient()` în routes — greșit. Regula CLAUDE.md:
```javascript
const prisma = require('../db');  // NU new PrismaClient()
```

### 4. JavaScript pur — fără TypeScript
`deviceSchema.js` nu este `.ts`. Linia `export type DeviceFormData = z.infer<typeof deviceSchema>` e sintaxă TypeScript — va crăpa. Se elimină.

### 5. Enum-uri reale din schema
| Schema (real) | Docs Faza2 (unele greșit) |
|--------------|--------------------------|
| `PREVENTIVA / CORECTIVA / VERIFICARE / CALIBRARE` | `MP / MC` — NU există în schema |
| `NEAR_MISS / MINOR / MODERAT / GRAV / CRITIC` | `MINOR / MODERAT / GRAV / CRITIC` — lipsea NEAR_MISS |
| `FUNCTIONAL / IN_REPARATIE / DEFECT / CASAT / IMPRUMUTAT / REZERVA` | Corect în Faza2-Complet |

### 6. AuditLog
Prisma generează `prisma.auditLog` (camelCase) pentru modelul `AuditLog`. Câmpul timestamp din model se numește `timestamp` (nu `createdAt`). La fiecare mutație Device se loghează action + entity + entityId + changes.

### 7. req.user.sub
JWT payload: `{ sub: user.id, username, role }`. Deci `req.user.sub` = ID-ul userului (Int). Corect pentru `createdById: req.user.sub`.

### 8. Upload directory
Multer scrie în `backend/uploads/devices/`. Directorul nu există în repo. Creare automată la pornirea serverului cu `fs.mkdirSync(path, { recursive: true })`.

### 9. Token storage
Frontend: `sessionStorage['accessToken']` — NU `localStorage['simdm_token']` (SPEC.md Faza1 e outdated pe asta). Interceptorul axios.js citește din sessionStorage. Nu se schimbă.

### 10. DeviceConsumable
Schema are tabel de joncțiune `DeviceConsumable` (many-to-many Device ↔ Consumable). Faza 2 nu implementează UI consumabile — gestionăm `Consumable` separat în Pas 2.4. La query device, `include: { consumables: { include: { consumable: true } } }` dacă e nevoie.

---

## Task List

| # | Task | Scope | Depinde |
|---|------|-------|---------|
| A1 | npm install deps frontend (7 pachete) + backend (3 pachete) | XS | — |
| A2 | BrowserRouter în main.jsx + Routes + ProtectedRoute în App.jsx | S | — |
| A3 | `GET /api/sections` în backend (fișier separat routes/sections.js) | XS | — |
| **⛳** | **Checkpoint A** | — | A1–A3 |
| B1 | `frontend/src/schemas/deviceSchema.js` — Zod schema, JS pur | S | A1 |
| B2 | `frontend/src/pages/DeviceForm.jsx` — RHF + Zod, mode add/edit | M | A1, B1, A3 |
| B3 | `backend/src/routes/devices.js` — CRUD (statice before /:id) | M | A3 |
| B4 | Multer + `uploads/devices/` autocreate + mount static în index.js | S | B3 |
| B5 | `GET /:id/fisa-pdf` — PDF Fișă DM (PDFKit, Formular Nr.8) | M | B3 |
| B6 | Wire routes: `app.use('/api/devices', deviceRoutes)` în index.js | XS | B3 |
| **⛳** | **Checkpoint B** | — | B1–B6 |
| C1 | `frontend/src/pages/InventoryPage.jsx` — tabel + filtre + paginare | M | B3 |
| C2 | `GET /export/xlsx` + `GET /export/csv` în devices.js | S | B3 |
| C3 | Soft delete (CASAT) cu `window.confirm` + useMutation | XS | B3, C1 |
| **⛳** | **Checkpoint C** | — | C1–C3 |
| D1 | Wire routes în App.jsx: /inventory, /devices/new, /devices/:id/edit | S | B2, C1 |
| D2 | `<ToastContainer>` în main.jsx | XS | A1 |
| D3 | Verificare end-to-end (adaugă → editează → filtrează → export → PDF) | S | D1, D2 |
| **⛳** | **Checkpoint Final** | — | D3 |

---

## Verificare End-to-End (Faza 2)

1. `npm install` — zero erori, toate pachetele prezente
2. `POST /api/devices` cu Bearer token → 201, DM în DB cu auditLog
3. `GET /api/devices?search=test&status=FUNCTIONAL&page=1&limit=20` → paginare corectă
4. `GET /api/devices/:id` → include section + maintenanceRecords + incidents
5. `PUT /api/devices/:id` → DM actualizat, AuditLog UPDATE creat
6. `DELETE /api/devices/:id` → status=CASAT, decommissionDate setat
7. `POST /api/devices/:id/upload` → fișier în uploads/devices/
8. `GET /api/devices/:id/fisa-pdf` → PDF descărcat, conține datele DM
9. `GET /api/devices/export/xlsx` → fișier .xlsx valid, antet bold, date corecte
10. `GET /api/devices/export/csv` → fișier .csv cu BOM UTF-8, diacritice ok
11. Browser `/inventory` → tabel cu DM, filtre funcționale, paginare
12. Browser `/devices/new` → formular gol; submit → redirect /inventory, toast succes
13. Browser `/devices/:id/edit` → formular prefilled; save → actualizat
14. Reload pagină → sesiune păstrată (refresh token cookie)

---

## Riscuri & Mitigări

| Risc | Impact | Mitigare |
|------|--------|----------|
| Route conflict static/dynamic | Ridicat | Înregistrare forțată în ordine: statice > /:id |
| `export type` în JS | Ridicat | Nu scrie linia, e JS pur |
| Multer fără director | Mediu | `fs.mkdirSync` la startup, înainte de `app.listen` |
| PDFKit diacritice ro-RO | Mic | Helvetica suportă latin; test cu "Frecvență", "Secție" |
| react-select styling vs Tailwind v4 | Mic | `unstyled` prop + clase Tailwind custom sau `classNamePrefix` |
| react-datepicker CSS import | Mic | `import 'react-datepicker/dist/react-datepicker.css'` în DeviceForm |
| Sections endpoint 404 dacă nu e wired | Mediu | Wire `/api/sections` în index.js înainte de test formular |
