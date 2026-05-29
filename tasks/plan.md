# Implementation Plan: SIMDM — Faza 2: Modul Inventar DM

> Actualizat 2026-05-29 · Faza 1 completă 100%. Începem Faza 2.

---

## Baseline Faza 1 (ce există deja)

| Componentă | Stare | Detalii |
|------------|-------|---------|
| Backend Express 5 | ✅ | src/index.js — port 3001, helmet, CORS, cookie-parser |
| Auth DB-backed | ✅ | login / refresh / logout / me, refresh httpOnly cookie, rate limiting |
| authMiddleware | ✅ | Bearer token → `req.user = { sub, username, role }` |
| authService + tokens | ✅ | src/services/authService.js + src/lib/tokens.js |
| PrismaClient unic | ✅ | src/db.js cu PrismaPg adapter |
| Schema multi-fișier | ✅ | 10 modele + enums în prisma/schema/ |
| 4 migrații aplicate | ✅ | tabele create în DB |
| Seed | ✅ | Admin user + 8 secții + DM test |
| Frontend React 19 | ✅ | Vite 8 + Tailwind v4 |
| Login.jsx | ✅ | cu useAuth hook, accesibil, dark theme |
| App.jsx | ✅ | shell simplu (fără router), arată Dashboard placeholder |
| axios.js | ✅ | withCredentials, auto-refresh-on-401, sessionStorage['accessToken'] |
| useAuth hook | ✅ | login / logout / user / loading |
| TanStack Query | ✅ | instalat în frontend |

**Dependențe lipsă pentru Faza 2:**

| Pachet | Loc | Scop |
|--------|-----|------|
| `react-hook-form` | frontend | forme |
| `@hookform/resolvers` | frontend | integrare Zod |
| `zod` | frontend | validare schema |
| `react-select` | frontend | dropdown-uri custom |
| `react-datepicker` | frontend | selectori dată |
| `react-toastify` | frontend | notificări |
| `lucide-react` | frontend | icoane SVG |
| `multer` | backend | upload fișiere |
| `pdfkit` | backend | generare PDF |
| `exceljs` | backend | export Excel |

---

## Scope Faza 2

| Pas | Conținut | Durata |
|-----|---------|--------|
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
