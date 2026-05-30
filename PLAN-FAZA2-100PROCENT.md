# PLAN IMPLEMENTARE — SIMDM FAZA 2 la 100% (130/130 puncte)

**Status curent:** 85/130 (65%)  
**Țintă:** 130/130 (100%) — joi seara  
**Timp disponibil:** ~6-8 ore  
**Stack:** React + Vite + Express + Prisma 7 + PostgreSQL

---

## DEPENDENCY GRAPH

```
┌─ Consumables (2.4) ──────────────────────┐
│  Schema ✅ (exista)                       │
│  ├─ API endpoints (POST/GET/PUT/DELETE)  │
│  ├─ Frontend ConsumablesPage             │
│  └─ Alerte (widget alert)                │
│                                           │
└─ Annual Inventory (2.3) ─────────────────┤
   ├─ AnnualInventoryPage                  │
   ├─ Calendar cu 9 secții                 │
   ├─ Checklist modal                      │
   └─ Import Excel backend                 │
                                           │
└─ TESTING E2E (Scenarios 1-4) ────────────┘
```

**Ordine implementare (vertical slices):**
1. **FAZE 2.4 (Consumables)** — 15 min setup + 1h30 dev
2. **FAZE 2.3 (Annual)** — 30 min setup + 2h dev  
3. **TESTING E2E** — 45 min

---

## FAZA 2.4 — CONSUMABILE & ALERTE (10 puncte) — ~2 ore

### Task 2.4.1: Backend API Consumables (CRUD)
**Timp:** 45 min  
**Status:** 0%

**Fișier:** `backend/src/routes/consumables.js` (creare nouă)

**Ce trebuie:**
```javascript
// GET /api/consumables — lista cu paginare + filtre
// POST /api/consumables — creare consumabil
// PUT /api/consumables/:id — update
// DELETE /api/consumables/:id — soft delete (isDeleted flag)
// GET /api/consumables/dropdown — pentru form selectors
```

**Acceptance criteria:**
- [ ] Ruta GET `/api/consumables` returnează JSON: `{ consumables: [], pagination: { page, limit, total } }`
- [ ] Paginare default: page=1, limit=50
- [ ] Filtre: `?search=NAME&minQuantity=10` funcționează
- [ ] POST crează înregistrare, returnează 201
- [ ] PUT/DELETE marchează cu `isDeleted = true`
- [ ] Validare: name (required), unitOfMeasure, quantity (>=0)
- [ ] Audit log pentru CREATE/UPDATE/DELETE

**Verificare:**
```bash
curl http://localhost:3001/api/consumables
curl -X POST http://localhost:3001/api/consumables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Seringa 50ml","quantity":100,"minQuantity":20}'
```

**Fișiere ce trebuie editate:**
- `backend/src/index.js` — importă ruta + `app.use('/api/consumables', consumableRoutes)`
- `backend/src/routes/consumables.js` — creare nouă

---

### Task 2.4.2: Frontend ConsumablesPage
**Timp:** 1 oră  
**Status:** 0%

**Fișier:** `frontend/src/pages/ConsumablesPage.jsx` (creare nouă)

**Ce trebuie:**
- Heading "📦 Consumabile & Piese Schimb"
- Tabel cu coloane:
  - Denumire
  - Model (optional)
  - Cantitate curenta
  - Cantitate minima
  - Stoc OK? (verde ✅ dacă >= min, roșu ❌ dacă < min)
  - Data expirare (badge galben dacă <30 zile, roșu dacă <7)
  - Acțiuni (edit, delete)
- Search input (nume consumabil)
- Filter: Min quantity, Expiry status
- Buttons: "Adaugă consumabil", "Export CSV"
- Pagination: 50 per page

**Acceptance criteria:**
- [ ] Pagina se deschide fără erori
- [ ] Tabelul se populate din API `/api/consumables`
- [ ] Search filtrează în timp real (< 500ms)
- [ ] Status stoc: verde dacă quantity >= minQuantity
- [ ] Status stoc: roșu dacă quantity < minQuantity
- [ ] Expiry badge: galben dacă data expirării in <30 zile
- [ ] Expiry badge: roșu dacă data expirării in <7 zile
- [ ] Edit button deschide form modal
- [ ] Delete button soft-deletes
- [ ] Pagination works (previous/next)

**Verificare:**
```bash
# Deschide browser: http://localhost:5173/consumables
# Tabel cu 5+ consumabile se afișează
# Search "Seringa" filtrează imediat
# Coloanele sunt formatate correct
```

**Fișiere ce trebuie editate:**
- `frontend/src/pages/ConsumablesPage.jsx` — creare nouă
- `frontend/src/App.jsx` — adaugă ruta: `<Route path="/consumables" element={<ConsumablesPage />} />`
- `frontend/src/api/axios.js` — (NU, apelurile sunt deja configurate)

---

### Task 2.4.3: Widget Alerte Stoc
**Timp:** 30 min  
**Status:** 0%

**Fișier:** `frontend/src/components/AlertsWidget.jsx` (creare nouă)

**Ce trebuie:**
- Widget în dashboard (InventoryPage sau Dashboard nou)
- Afișează:
  - "⚠️ 3 consumabile sub stoc minim"
  - "🚨 2 consumabile expirând în <7 zile"
  - "⏰ 5 consumabile expirând în 30 zile"
- Click pe alert → navigează la `/consumables` cu filtre aplicate
- Toast notifications pe load (optional)

**Acceptance criteria:**
- [ ] Widget se renderează fără erori
- [ ] Numărează consumabile cu quantity < minQuantity (roșu)
- [ ] Numărează consumabile cu expiryDate in <7 zile (roșu)
- [ ] Numărează consumabile cu expiryDate in <30 zile (galben)
- [ ] Click alert → navigează la `/consumables?filter=LOW_STOCK`
- [ ] Datele se actualizează la reload pagină

**Verificare:**
```bash
# Mergi la /inventory
# Widget să apară în sidebar/top
# Numere să fie corecte vs BD
```

**Fișiere ce trebuie editate:**
- `frontend/src/components/AlertsWidget.jsx` — creare nouă
- `frontend/src/pages/InventoryPage.jsx` — importă + renderează AlertsWidget în header

---

## FAZA 2.3 — INVENTARIERE ANUALĂ (15 puncte) — ~2.5 ore

### Task 2.3.1: Backend Routes Annual Inventory
**Timp:** 1 oră  
**Status:** 0%

**Fișier:** `backend/src/routes/annualInventory.js` (criere nouă)

**Ce trebuie:**
```javascript
// GET /api/annual-inventory/years — lista ani disponibili
// GET /api/annual-inventory/:year/status — status per secție
// POST /api/annual-inventory/:year/section/:sectionId — update checklist
// GET /api/annual-inventory/:year/discrepancies — lista discrepanțe
// POST /api/annual-inventory/:year/discrepancies/:id/verify — marchez pentru verificare
// POST /api/annual-inventory/:year/report — generează PDF raport
```

**Schema Prisma (dacă nu existe):**
Trebuie tabel `annualInventories`:
```prisma
model AnnualInventory {
  id Int @id @default(autoincrement())
  year Int
  sectionId Int
  section Sections @relation(fields: [sectionId], references: [id])
  status String // "NOT_STARTED", "IN_PROGRESS", "COMPLETED"
  completedAt DateTime?
  devices [InventoryCheckItem]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model InventoryCheckItem {
  id Int @id @default(autoincrement())
  inventoryId Int
  inventory AnnualInventory @relation(fields: [inventoryId], references: [id])
  deviceId Int
  device Devices @relation(fields: [deviceId], references: [id])
  found Boolean // false = discrepancy
  locationFound String?
  status String // "PENDING_VERIFICATION", "VERIFIED"
  createdAt DateTime @default(now())
}
```

**Acceptance criteria:**
- [ ] Ruta GET `/api/annual-inventory/years` returnează ultimi 5 ani + curent
- [ ] Ruta GET `/api/annual-inventory/2026/status` returnează per secție: {sectionId, sectionName, status, foundCount, totalCount, percentage}
- [ ] POST `/api/annual-inventory/:year/section/:sectionId` updates items
- [ ] Discrepancies tracked: `found=false` → apare în discrepancies
- [ ] Audit log pentru toate operațiile

**Verificare:**
```bash
curl http://localhost:3001/api/annual-inventory/years
curl http://localhost:3001/api/annual-inventory/2026/status
```

**Fișiere ce trebuie editate:**
- `backend/prisma/schema.prisma` — adaugă tabele AnnualInventory + InventoryCheckItem
- `backend/src/routes/annualInventory.js` — creare nouă
- `backend/src/index.js` — importă ruta

---

### Task 2.3.2: Migrations Prisma
**Timp:** 10 min  
**Status:** 0%

**Ce trebuie:**
```bash
cd backend
npx prisma migrate dev --name "add_annual_inventory_tables"
npx prisma generate
```

**Acceptance criteria:**
- [ ] Migrație creată în `backend/prisma/migrations/`
- [ ] Tabelele noi apar în Prisma Studio
- [ ] Build-ul backend nu are erori

---

### Task 2.3.3: AnnualInventoryPage Frontend
**Timp:** 1.5 ore  
**Status:** 0%

**Fișier:** `frontend/src/pages/AnnualInventoryPage.jsx` (creare nouă)

**Ce trebuie:**
- Heading "📅 Inventariere Anuală"
- Dropdown selectare an (2022-2026 + current)
- Calendar-like grid cu 9 secții (în 3x3 layout)
- Fiecare secție card cu:
  - Nume secție (ex: "Bloc Operator")
  - Status badge (roșu "Nu începută", galben "În curs", verde "Completată")
  - Progres bar: "45% completată" (10/22 dispozitive)
  - Click → deschide Checklist Modal
- Buton "Genereaza Raport PDF" (după completare 100%)

**Checklist Modal:**
- Heading: "Inventariere: {sectionName} ({year})"
- Tabel cu coloane:
  - Nr. Inventar (monospace, cyan)
  - Denumire
  - Nr. Serie
  - Status (actual din BD)
  - Localizare
  - Gasit? (checkbox + input "Localizare actuala")
- Counter: "5 / 22 dispozitive"
- Buttons: "Salveaza", "Anuleaza"

**Discrepancies Modal (după salvare):**
- Afișează dispozitivele: found=false
- Tabel: Nr. Inv., Denumire, Localizare asteptata, Localizare gasita, Acțiuni
- Buton "Marcheaza pentru verificare" per discrepanta
- Status: "PENDING_VERIFICATION"

**Acceptance criteria:**
- [ ] Pagina se deschide fără erori
- [ ] Dropdown an funcționează
- [ ] 9 secții se afișează în 3x3 grid
- [ ] Status colors: roșu, galben, verde
- [ ] Progres bar se calculează: (found / total) * 100
- [ ] Click secție → Checklist modal apare
- [ ] Checkbox "Găsit" updates state local
- [ ] Input "Localizare" salvează valoarea
- [ ] Click "Salvează" → POST la backend
- [ ] Discrepanțe apar automat după salvare
- [ ] PDF raport se descarcă cu succes

**Verificare:**
```bash
# http://localhost:5173/inventory/annual
# Dropdown an funcționează
# 9 secții se afișează
# Click pe secție → checklist modal
# Check 5 dispozitive → bar crește la 22%
# Save → POST la backend
# Discrepanțe se afișează
```

**Fișiere ce trebuie editate:**
- `frontend/src/pages/AnnualInventoryPage.jsx` — criere nouă
- `frontend/src/App.jsx` — adaugă ruta: `<Route path="/inventory/annual" element={<AnnualInventoryPage />} />`

---

### Task 2.3.4: Import Excel din Contabilitate
**Timp:** 45 min  
**Status:** 0%

**Backend:** `backend/src/routes/annualInventory.js` — adaugă rută:
```javascript
POST /api/annual-inventory/import-fixed-assets
// Upload Excel din contabilitate
// Coloane: Cod, Denumire, Valoare, DataInchidere
// Mapează la Device: cndCode, name, acquisitionValue, acquisitionDate
```

**Frontend:** `frontend/src/pages/AnnualInventoryPage.jsx` — adaugă:
- Buton "Import din Contabilitate"
- File picker pentru `.xlsx`
- Validare: coloane corecte
- Upload + toast success/error
- Refresh inventar după import

**Acceptance criteria:**
- [ ] Upload file handler pe frontend
- [ ] Validare coloane Excel (Cod, Denumire, Valoare)
- [ ] POST backend cu FormData
- [ ] Backend parsează cu XLSX lib
- [ ] Mapează CND code → cndCode
- [ ] Creeaza dispozitive noi (dacă nu exista)
- [ ] Updates acquisitionValue
- [ ] Audit log CREATE/UPDATE
- [ ] Toast success: "123 dispozitive importate"

**Verificare:**
```bash
# http://localhost:5173/inventory/annual
# Click "Import din Contabilitate"
# Selectează fișier test Excel
# Verifică că dispozitive noi apar în inventar
```

**Fișiere ce trebuie editate:**
- `backend/src/routes/annualInventory.js` — adaugă POST import
- `frontend/src/pages/AnnualInventoryPage.jsx` — adaugă file input + logic upload

---

## TESTING E2E (10 puncte) — ~45 min

### Task TESTING.1: Scenario 1 — Adaugare completa DM
**Timp:** 15 min

**Checklist din `SIMDM-Faza2-Checklist-Complet.md`:**
- [ ] Deschizi `/devices/new`
- [ ] Completeaza formular cu date valide
- [ ] Selectezi sectie, clasa, status
- [ ] Upload fisier PDF manual
- [ ] Click "Adauga DM" → Toast "DM adaugat cu succes"
- [ ] Esti redirectionat la pagina DM
- [ ] Verifica in BD: DM apare in `devices`
- [ ] Verifica audit: inregistrare cu `action: CREATE`
- [ ] Verifica upload: fisierul PDF exista in `backend/uploads/devices/`

**Verificare:**
```bash
# 1. Start app: npm run dev (root)
# 2. Login
# 3. Go to /devices/new
# 4. Fill form, upload PDF
# 5. Save
# 6. Check Prisma Studio: npx prisma studio
# 7. Check audit_logs table
# 8. Check uploads folder
```

---

### Task TESTING.2: Scenario 2 — Editare + PDF
**Timp:** 10 min

- [ ] Deschizi DM creat la Scenario 1
- [ ] Editeaza "Denumire"
- [ ] Click "Salveaza" → Toast "DM actualizat"
- [ ] Verifica: Denumire changed in BD
- [ ] Verifica audit: UPDATE log
- [ ] Click "Fisa PDF" → se descarca
- [ ] PDF arata denumire actualizata

---

### Task TESTING.3: Scenario 3 — Inventar + Export
**Timp:** 10 min

- [ ] Deschizi `/inventory`
- [ ] Filtrezi status = "FUNCTIONAL"
- [ ] Tabelul arata doar functional
- [ ] Click "Excel" → descarca `.xlsx`
- [ ] Deschizi in Excel → datele sunt corecte

---

### Task TESTING.4: Scenario 4 — Cautare + Delete
**Timp:** 10 min

- [ ] Cauti "INV-001" → tabel filtra
- [ ] Click icoana Delete → confirm
- [ ] Click OK → DM marked CASAT
- [ ] Verifica BD: `device.status = 'CASAT'`

---

## CHECKPOINT — După toate etapele

- [ ] Frontend build: `npm run build` (0 erori, warnings OK)
- [ ] Backend start: `npm run dev` (port 3001, no errors)
- [ ] All API endpoints return correct data
- [ ] Prisma Studio: all tables populated
- [ ] All 4 E2E scenarios pass
- [ ] No red errors in browser DevTools
- [ ] Export Excel/CSV files open correctly in Excel

---

## SUMMARY — PUNCTAJE

| Task | Puncte | Estimat | Status |
|------|--------|---------|--------|
| 2.4.1 API Consumables | 5 | 45 min | — |
| 2.4.2 Frontend Consumables | 3 | 60 min | — |
| 2.4.3 Alerte Widget | 2 | 30 min | — |
| **Subtotal 2.4** | **10/10** | **2h15m** | — |
| 2.3.1 Backend Annual | 6 | 60 min | — |
| 2.3.2 Migrations | 1 | 10 min | — |
| 2.3.3 Frontend Annual | 6 | 90 min | — |
| 2.3.4 Import Excel | 2 | 45 min | — |
| **Subtotal 2.3** | **15/15** | **3h05m** | — |
| TESTING 1-4 | 10 | 45 min | — |
| | | | |
| **TOTAL FAZA 2** | **130/130** | **~6h** | — |

---

## NOTES IMPLEMENTARE

1. **Consumables:** Schema deja în Prisma, doar exponere API
2. **Annual Inventory:** Trebuie noi tabele, rute, UI
3. **Testing:** Manual E2E, nu unit tests
4. **Stack:** React, Express, Prisma — same patterns as 2.1/2.2
5. **Data:** Seed/populate manual cu test data înainte de testing

---

## ORDINE STRICTĂ DE LUCRU

```
1. Task 2.4.1 (API) → curl test
   ↓
2. Task 2.4.2 (ConsumablesPage) → browser test
   ↓
3. Task 2.4.3 (Alerte Widget) → verify in /inventory
   ↓
4. Task 2.3.1 (Backend Annual Routes) → curl test
   ↓
5. Task 2.3.2 (Migrations) → prisma studio verify
   ↓
6. Task 2.3.3 (AnnualInventoryPage) → browser test
   ↓
7. Task 2.3.4 (Import Excel) → upload test
   ↓
8. Testing 1-4 (E2E Scenarios) → full flow test
   ↓
9. FINAL: npm run build + verify all tests pass ✅
```

---

**Status: READY TO IMPLEMENT** ✅

Data: 2026-05-30  
Țintă completare: Aceeași zi, ~18:00
