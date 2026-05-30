# SIMDM — Faza 2: Modul Inventar DM — ✅ COMPLET

> **STATUS: FAZA 2 COMPLETĂ** — Actualizat 2026-05-30.  
> Faza 1: Fundație ✅ | Faza 2: CRUD + Inventar ✅ | Faza 3+: Mentenanță (urmează)  
> Commits: `fab7394` (A) + `5663d9d` (B) + `454e2af` (C)  
> Vezi `tasks/plan.md` pentru context și decizii.

---

## Faza A — Setup & Routing

- [x] **A1 — Instalare dependențe**
  ```bash
  # Frontend
  cd frontend
  npm install react-hook-form @hookform/resolvers zod react-select react-datepicker react-toastify lucide-react

  # Backend
  cd ../backend
  npm install multer pdfkit exceljs
  ```
  - ✅ Acceptanță: toate pachetele în `package.json`, zero erori `npm install`
  - ⚠️ Atenție: `react-datepicker` vine cu propriul CSS — importul se face în `DeviceForm.jsx`

- [x] **A2 — Routing React (BrowserRouter + Routes + ProtectedRoute)**
  - `frontend/src/main.jsx`: înfășoară `<App />` în `<BrowserRouter>` și `<QueryClientProvider>`
  - `frontend/src/App.jsx`: adaugă `<Routes>` cu:
    - `<Route path="/" element={<Login />}>`  (sau redirect dacă e autentificat)
    - `<Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>}`
    - `<Route path="/devices/new" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>}`
    - `<Route path="/devices/:id/edit" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>}`
  - `frontend/src/components/ProtectedRoute.jsx`: dacă `loading` → spinner; dacă `!user` → `<Navigate to="/" replace />`
  - ✅ Acceptanță: navigare `/inventory` fără login → redirect `/`; cu login → pagina inventar

- [x] **A3 — Backend: endpoint GET /api/sections**
  - Creează `backend/src/routes/sections.js`:
    - `GET /` → `prisma.section.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })`
    - Protejat cu `authMiddleware`
  - `backend/src/index.js`: `app.use('/api/sections', authMiddleware, sectionsRoutes)`
  - ✅ Acceptanță: `GET /api/sections` cu Bearer token → array secții JSON

### ⛳ Checkpoint A
- [x] `npm run dev` pornește fără erori
- [x] Navigare `/inventory` → ProtectedRoute funcționează
- [x] `GET /api/sections` → 200 cu secțiile din DB

---

## Faza B — CRUD Device (backend + formular)

- [x] **B1 — Zod schema Device**
  - Fișier: `frontend/src/schemas/deviceSchema.js`
  - ⚠️ JavaScript pur — NU adăuga `export type ...` (e sintaxă TypeScript)
  - Câmpuri obligatorii: `inventoryNumber` (regex `^[A-Z0-9\-]+$`), `name` (min 3), `riskClass` (enum I/IIa/IIb/III), `sectionId` (coerce.number, min 1)
  - Status enum: `FUNCTIONAL / IN_REPARATIE / DEFECT / CASAT / IMPRUMUTAT / REZERVA` (toate 6)
  - Câmpuri opționale cu `.optional().or(z.literal(''))` pentru inputuri text goale
  - `acquisitionDate`, `warrantyEndDate`: `z.coerce.date().nullable().optional()`
  - `acquisitionValue`, `residualValue`: `z.coerce.number().min(0).optional().or(z.literal(''))`
  - ✅ Acceptanță: `import { deviceSchema } from '../schemas/deviceSchema'` fără erori

- [x] **B2 — DeviceForm.jsx**
  - Fișier: `frontend/src/pages/DeviceForm.jsx`
  - Detectează mode: `const { id } = useParams()` — dacă există `id` → edit mode
  - `useForm({ resolver: zodResolver(deviceSchema), defaultValues: { status: 'FUNCTIONAL', currency: 'MDL', riskClass: 'IIb' }, mode: 'onBlur' })`
  - Query sections: `useQuery(['sections'], () => api.get('/sections').then(r => r.data))`
  - Edit mode: `useQuery(['device', id], () => api.get('/devices/' + id).then(r => r.data), { enabled: !!id, onSuccess: (data) => reset(data) })`
  - useMutation: POST `/devices` sau PUT `/devices/:id` — `onSuccess` → toast + navigate('/inventory')
  - Secțiuni formular: Identificare, Clasificare, Status & Exploatare, Date Financiare, Date Tehnice, Observații
  - react-select pentru: riskClass, status, sectionId (cu Controller)
  - react-datepicker pentru: acquisitionDate, warrantyEndDate (cu Controller)
  - Buton "Fișă PDF" vizibil doar în edit mode → `GET /devices/:id/fisa-pdf` cu responseType: 'blob'
  - Clase accesibilitate: `label-base`, `input-base`, focus ring, `role="alert"` pe erori
  - ✅ Acceptanță: add DM → 201 → toast succes → redirect inventar; edit DM → formular prefilled

- [x] **B3 — Backend routes/devices.js**
  - Fișier: `backend/src/routes/devices.js`
  - `const prisma = require('../db')` — NU `new PrismaClient()`
  - `router.use(authMiddleware)` la top
  - **Ordine obligatorie a rutelor (static înainte de /:id):**
    1. `GET /dropdown/sections` → sections active (pentru dropdown formular)
    2. `GET /export/xlsx` → export Excel
    3. `GET /export/csv` → export CSV
    4. `GET /` → lista DM cu filtre + paginare
    5. `POST /` → creare DM (verifică inventoryNumber unic, audit log CREATE)
    6. `GET /:id` → detalii DM (include section, maintenanceRecords last 5, incidents last 5)
    7. `PUT /:id` → actualizare DM (audit log UPDATE cu before/after)
    8. `DELETE /:id` → soft delete: `status: 'CASAT', decommissionDate: new Date()` (audit log DELETE)
    9. `POST /:id/upload` → multer single + actualizare câmp URL
    10. `GET /:id/fisa-pdf` → generare PDF PDFKit
  - Filtre pentru GET `/`: `search` (OR pe inventoryNumber/name/model/manufacturer, mode: 'insensitive'), `status`, `riskClass`, `sectionId`
  - Paginare: `skip = (page-1)*limit`, response include `{ devices, pagination: { page, limit, total, pages } }`
  - Audit log: `prisma.auditLog.create({ data: { userId: req.user.sub, action, entity: 'Device', entityId: String(device.id), changes } })`
  - ✅ Acceptanță: toate rutele returnează status corect; nici una nu confundă "export" sau "dropdown" cu un ID

- [x] **B4 — Multer upload + autocreate directory**
  - În `backend/src/routes/devices.js` sau `backend/src/index.js`:
    ```javascript
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '../../uploads/devices');
    fs.mkdirSync(uploadDir, { recursive: true });
    ```
  - Multer config: diskStorage în `uploadDir`, filename = `Date.now() + '-' + random + ext`
  - fileFilter: permite doar `.pdf .doc .docx .jpg .jpeg .png`
  - limits: `fileSize: 10 * 1024 * 1024` (10MB)
  - `backend/src/index.js`: `app.use('/uploads', express.static(path.join(__dirname, '../uploads')))`
  - ✅ Acceptanță: `POST /api/devices/:id/upload` cu fișier PDF → 200, fișier salvat, URL în DB

- [x] **B5 — PDF Fișă DM (Formular Nr.8)**
  - `GET /api/devices/:id/fisa-pdf`
  - PDFKit: header cu titlu "FIȘĂ DISPOZITIV MEDICAL", "Formular Nr.8 – Anexa 3", "Ordinul MS nr. 889/2024"
  - Secțiuni: 1. Identificare, 2. Clasificare, 3. Status & Exploatare, 4. Date Financiare, 5. Date Tehnice, 6. Mentenanță, 7. Observații (dacă există)
  - Footer: data generării + utilizator
  - Response: `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="Fisa_DM_${inventoryNumber}.pdf"`
  - ✅ Acceptanță: PDF descărcat, conține datele corecte, diacritice vizibile

- [x] **B6 — Wire devices routes în index.js**
  - `backend/src/index.js`: `app.use('/api/devices', deviceRoutes)`
  - ⚠️ NU pune `authMiddleware` și în index.js dacă deja e aplicat în routes/devices.js (dublă aplicare)
  - ✅ Acceptanță: `GET /api/devices` cu token → 200; fără token → 401

### ⛳ Checkpoint B
- [x] `POST /api/devices` → 201, auditLog creat în DB
- [x] `GET /api/devices/dropdown/sections` → array (nu confundat cu /:id)
- [x] `GET /api/devices/export/xlsx` → nu returnează 404 sau eroare /:id
- [x] `GET /api/devices/1/fisa-pdf` → PDF blob descărcat
- [x] Upload fișier: fișier pe disc, URL în câmpul corect al DM
- [x] Formular add DM: validare Zod funcționează (erori afișate în timp real)
- [x] Formular edit DM: câmpurile prefilled corect

---

## Faza C — Tabel Inventar + Export

- [x] **C1 — InventoryPage.jsx**
  - Fișier: `frontend/src/pages/InventoryPage.jsx`
  - State: `search`, `filters` (status, riskClass, sectionId), `page`, `limit=50`
  - `useQuery(['devices', search, filters, page, limit], ...)` → `api.get('/devices?' + params)`
  - `useQuery(['sections'], ...)` → pentru filtrul de secție
  - Tabel cu coloane: Nr. Inventar, Denumire/Model, Producator, Clasa, Status (colorat), Secție, Data PIF, Acțiuni
  - Status badge colorat: FUNCTIONAL=green, IN_REPARATIE=yellow, DEFECT=red, CASAT=gray, IMPRUMUTAT=blue, REZERVA=purple
  - Acțiuni per rând: Edit (Link → /devices/:id/edit), Delete (buton cu confirmare)
  - Paginare: Înapoi / Înainte + afișare "Pagina X din Y · Z total"
  - Butoane export: Excel + CSV (apelează /export/xlsx și /export/csv cu filtrele active)
  - Buton "Adaugă DM" → Link /devices/new
  - ✅ Acceptanță: tabel afișat, filtre funcționează, paginare corectă, export descarcă fișier

- [x] **C2 — Export Excel + CSV în devices.js**
  - `GET /export/xlsx` (înregistrat ÎNAINTE de `/:id`):
    - ExcelJS: worksheet "Inventar DM", coloane cu lățimi, antet bold pe fundal închis
    - Date: inventoryNumber, name, model, manufacturer, riskClass, status, section.name, acquisitionDate, acquisitionValue
    - `res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')`
    - `await workbook.xlsx.write(res)`
  - `GET /export/csv` (înregistrat ÎNAINTE de `/:id`):
    - BOM UTF-8: `res.write('﻿')` pentru diacritice în Excel
    - Câmpuri cu ghilimele duble, separator virgulă
    - `res.setHeader('Content-Type', 'text/csv; charset=utf-8')`
  - Ambele suportă filtrele din query (search, status, riskClass, sectionId)
  - ✅ Acceptanță: Excel deschis în LibreOffice/Excel cu date corecte; CSV cu diacritice vizibile

- [x] **C3 — Soft delete cu confirmare**
  - `useMutation({ mutationFn: (id) => api.delete('/devices/' + id), onSuccess: () => { queryClient.invalidateQueries(['devices']); toast.success('DM marcat ca CASAT') } })`
  - Confirmare înainte de apel: `window.confirm('Marchezi DM ca CASAT? Acțiunea este reversibilă.')`
  - ✅ Acceptanță: DM dispare din lista default (statusul CASAT e filtrat sau vizibil); DB are status=CASAT

### ⛳ Checkpoint C
- [x] Tabel afișat cu DM din DB
- [x] Filtrare status + clasa + secție funcționează
- [x] Căutare text (nr. inventar, model, producator) funcționează
- [x] Paginare: prev/next, contor total corect
- [x] Export xlsx descărcat + valid
- [x] Export csv descărcat + diacritice ok
- [x] Delete → toast + dispare din tabel

---

## Faza D — Integrare & Verificare

- [x] **D1 — Wire routes în App.jsx**
  - Importă `InventoryPage`, `DeviceForm`, `ProtectedRoute`
  - Adaugă `<Routes>` cu toate rutele (vezi A2)
  - Dashboard placeholder din Faza 1 devine ruta autentificată default sau se mută la `/dashboard`
  - ✅ Acceptanță: navigare completă funcționează; `/inventory` protejat; `/devices/new` protejat

- [x] **D2 — ToastContainer global**
  - `frontend/src/main.jsx`: `import { ToastContainer } from 'react-toastify'; import 'react-toastify/dist/ReactToastify.css';`
  - Adaugă `<ToastContainer position="bottom-right" theme="dark" />` lângă `<App />`
  - ✅ Acceptanță: toast-urile apărute din DeviceForm și InventoryPage sunt vizibile

- [x] **D3 — Verificare end-to-end**
  - [ ] Adaugă un DM nou → 201 → toast → redirect inventar → DM apare în tabel
  - [ ] Click Edit → câmpuri prefilled → modificare → salvare → DM actualizat
  - [ ] Descarcă Fișă PDF → conține datele DM
  - [ ] Upload document (PDF) → fișier vizibil pe server
  - [ ] Filtrare status=FUNCTIONAL → doar DM funcționale
  - [ ] Export Excel → fișier .xlsx cu DM conform filtrelor
  - [ ] Delete DM → confirmare → CASAT → dispare/gri în tabel
  - [ ] Reload browser → sesiune păstrată (refresh cookie funcționează)
  - [ ] `git status` → fără `.env`, fără `node_modules`, fără `uploads/`

### ⛳ Checkpoint Final Faza 2
- [x] Toate testele din D3 trecute
- [x] Nicio consolă de erori în browser sau terminal
- [x] AuditLog în DB: CREATE, UPDATE, DELETE pentru operații DM
- [x] `uploads/devices/` în `.gitignore`
- [x] Commit curat pe branch `dev`
- [x] Gata pentru Faza 3: Modul Mentenanță

---

## Note Tehnice Rapide

**Enum-uri din schema reală (nu din docs Faza2):**
- `DeviceStatus`: FUNCTIONAL, IN_REPARATIE, DEFECT, CASAT, IMPRUMUTAT, REZERVA
- `RiskClass`: I, IIa, IIb, III
- `MaintenanceType`: PREVENTIVA, CORECTIVA, VERIFICARE, CALIBRARE (nu MP/MC!)
- `IncidentSeverity`: NEAR_MISS, MINOR, MODERAT, GRAV, CRITIC

**Token:** `sessionStorage['accessToken']` — NU localStorage.

**PrismaClient:** întotdeauna `require('../db')` — niciodată `new PrismaClient()` în routes.

**Route conflict:** statice (`/dropdown/sections`, `/export/xlsx`, `/export/csv`) ÎNAINTE de `/:id`.
