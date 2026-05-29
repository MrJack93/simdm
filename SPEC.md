# SPEC — SIMDM: Faze de Dezvoltare

> **Sistem Informațional de Management al Dispozitivelor Medicale**  
> Bioinginer medical · Spital privat · Single-user · Localhost / LAN  
> Ghid de referință: Ordinul MS nr. 889/2024

---

## Obiectiv

**Ce construim:** Aplicație web care înlocuiește evidența pe hârtie/Excel cu o bază de date centralizată pentru gestionarea dispozitivelor medicale conform Ghidului Bioinginerului.

**Pentru cine:** Un singur utilizator — bioinginerul medical al spitalului.

**NU implementăm:** RBAC, multi-user, înregistrare, cloud deploy, OAuth.

---

## Stiva Tehnologică (Locked)

| Strat | Tehnologie | Versiune reală |
|-------|-----------|----------------|
| **Frontend** | React + Vite + TailwindCSS | React 19, Vite 8, Tailwind v4 |
| **Backend** | Node.js + Express.js | Node v22 LTS, Express 5 |
| **Baza de date** | PostgreSQL 16 în Docker | postgres:16 |
| **ORM** | Prisma | v7.8 (schema multi-fișier) |
| **Auth** | JWT + bcryptjs | access token 15min + refresh httpOnly cookie |
| **HTTP Client** | Axios | v1 — withCredentials, auto-refresh-on-401 |
| **Routing frontend** | react-router-dom | v7 |
| **State/Fetching** | TanStack Query | v5 |

**NU adăuga alte framework-uri sau librării fără cerere explicită.**

---

## Comenzi Principale

```bash
# DOCKER (necesar înainte de backend)
docker compose up -d          # Pornește PostgreSQL 16

# RĂDĂCINA (simdm/)
npm run dev                   # Pornește backend + frontend simultan (concurrently)

# BACKEND (simdm/backend/)
npm run dev                   # Serverul cu nodemon (port 3001)
npm start                     # Serverul fără watch
npm run db:migrate            # npx prisma migrate dev
npm run db:studio             # Prisma Studio GUI (port 5555)
npm run db:seed               # node prisma/seed.js

# FRONTEND (simdm/frontend/)
npm run dev                   # Vite dev server (port 5173)
npm run build                 # Build producție

# UTILITĂȚI
node backend/scripts/generateHash.js   # Hash bcrypt pentru parolă admin

# DUPĂ MODIFICAREA SCHEMEI PRISMA — întotdeauna ambele:
npx prisma migrate dev --name descriere
npx prisma generate
```

---

## Structura Proiectului (stare reală)

```
simdm/
├── backend/
│   ├── prisma/
│   │   ├── schema/              # Schema multi-fișier (SURSA DE ADEVĂR)
│   │   │   ├── schema.prisma    # generator + datasource
│   │   │   ├── user.prisma      # User, RefreshToken, Section
│   │   │   ├── device.prisma    # Device, Consumable, DeviceConsumable
│   │   │   ├── maintenance.prisma # MaintenanceRecord, Incident
│   │   │   ├── document.prisma  # Document, AuditLog
│   │   │   └── enums.prisma     # toate enum-urile
│   │   ├── migrations/          # migrații aplicate (nu șterge!)
│   │   └── seed.js              # admin user + 8 secții + DM test
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # login / refresh / logout / me
│   │   │   └── devices.js       # (Faza 2) CRUD dispozitive
│   │   ├── middleware/
│   │   │   └── auth.js          # authMiddleware + requireRole
│   │   ├── services/
│   │   │   └── authService.js   # login, refresh, logout logic
│   │   ├── lib/
│   │   │   └── tokens.js        # signAccessToken, issueRefreshToken, rotate
│   │   ├── db.js                # PrismaClient unic cu PrismaPg adapter
│   │   └── index.js             # Entry point server Express
│   ├── scripts/
│   │   └── generateHash.js
│   ├── uploads/                 # (Faza 2) fișiere uploadate — în .gitignore
│   ├── .env                     # NU în Git!
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Axios cu withCredentials + auto-refresh-on-401
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx  # (Faza 2)
│   │   ├── hooks/
│   │   │   └── useAuth.js       # login / logout / user / loading
│   │   ├── pages/
│   │   │   ├── Login.jsx        # ✅ Faza 1
│   │   │   ├── InventoryPage.jsx   # (Faza 2)
│   │   │   └── DeviceForm.jsx   # (Faza 2)
│   │   ├── schemas/
│   │   │   └── deviceSchema.js  # (Faza 2) Zod schema
│   │   ├── App.jsx              # Router principal
│   │   ├── main.jsx             # Entry point React
│   │   └── index.css            # Tailwind CSS + utility classes
│   ├── vite.config.js           # Proxy /api → localhost:3001
│   └── package.json
│
├── faze/                        # Documente de specificație pe faze
│   ├── SIMDM-Faza2-Plan.md
│   └── SIMDM-Faza2-Complet.md
├── tasks/                       # Plan și checklist curent de lucru
│   ├── plan.md                  # Context, decizii, dependency graph
│   └── todo.md                  # Checklist detaliat
├── docs/                        # Documente tehnice
│   ├── 1-DESIGN-AND-ACCESSIBILITY.md
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   └── CONTRIBUTING.md
├── docker-compose.yml           # PostgreSQL 16
├── .gitignore
├── CLAUDE.md                    # Context permanent pentru Claude Code
├── SPEC.md                      # Acest fișier
└── package.json                 # Scripts concurrently (root)
```

---

## Modelul de Date (10 modele — stare reală Faza 1)

| Model | Tabel | Scopul |
|-------|-------|--------|
| `User` | users | utilizatorul unic (admin) |
| `RefreshToken` | refresh_tokens | refresh tokens rotative |
| `Section` | sections | secțiile spitalului |
| `Device` | devices | dispozitivele medicale (central) |
| `Consumable` | consumables | consumabile & piese schimb |
| `DeviceConsumable` | device_consumables | relație many-to-many Device↔Consumable |
| `MaintenanceRecord` | maintenance_records | intervenții MP și MC |
| `Incident` | incidents | incidente și defecțiuni |
| `Document` | documents | documente atașate |
| `AuditLog` | audit_logs | log complet modificări |

**Enum-uri reale (sursa de adevăr — nu le inventa):**
- `DeviceStatus`: `FUNCTIONAL`, `IN_REPARATIE`, `DEFECT`, `CASAT`, `IMPRUMUTAT`, `REZERVA`
- `RiskClass`: `I`, `IIa`, `IIb`, `III`
- `MaintenanceType`: `PREVENTIVA`, `CORECTIVA`, `VERIFICARE`, `CALIBRARE`
- `IncidentSeverity`: `NEAR_MISS`, `MINOR`, `MODERAT`, `GRAV`, `CRITIC`
- `IncidentStatus`: `DESCHIS`, `IN_LUCRU`, `REZOLVAT`, `INCHIS`, `ESCALADAT_AMDM`
- `DocumentCategory`: `PROCEDURA_MDM`, `FORMULAR`, `LEGISLATIE`, `MANUAL_TEHNIC`, `CERTIFICAT`, `CONTRACT`, `RAPORT`, `ALTUL`

---

## Autentificare (implementare reală)

| Aspect | Implementare |
|--------|-------------|
| Access token | JWT semnat cu `JWT_ACCESS_SECRET`, TTL 15min, payload `{ sub: userId, username, role }` |
| Refresh token | opac `crypto.randomBytes`, stocat **hash sha256** în DB, livrat ca **cookie httpOnly** `refreshToken` |
| Token frontend | `sessionStorage['accessToken']` (NU localStorage) |
| Auto-refresh | axios interceptor: 401 TOKEN_EXPIRED → POST /auth/refresh → reia requestul |
| Rotație refresh | fiecare /refresh revocă tokenul vechi și emite unul nou |

**Endpoint-uri auth (existente):**
```
POST /api/auth/login    → { accessToken, user } + Set-Cookie: refreshToken
POST /api/auth/refresh  → { accessToken } + nou cookie refreshToken
POST /api/auth/logout   → revocă cookie + AuditLog
GET  /api/auth/me       → { user } (necesită Bearer token)
GET  /api/health        → { status, database, uptime }
```

---

## Stil Cod

### Convenții
- Cod și variabile în **engleză** (camelCase JS, PascalCase React)
- Texte utilizator, erori, UI în **română cu diacritice**
- `async/await` — nu `.then()` lanțuri
- Fără comentarii decât pentru logică non-evidentă

### Reguli backend critice
- `const prisma = require('../db')` — **niciodată** `new PrismaClient()` în routes
- Toate rutele (exceptând `/api/auth/login` și `/api/health`) → `authMiddleware`
- Răspunsuri eroare: `res.status(cod).json({ error: 'mesaj în română' })`
- Validare server-side pe orice input, indiferent de validarea frontend

### Reguli frontend critice
- `import api from '../api/axios'` — **niciodată** `http://localhost:3001` direct
- `sessionStorage['accessToken']` pentru token (nu localStorage)
- Stilizare exclusiv cu clase Tailwind; zero CSS inline sau fișiere separate
- Folosește utilitățile din `src/index.css`: `.btn-primary`, `.input-base`, `.label-base`, `.alert-error` etc.

### Accesibilitate (obligatoriu)
- `htmlFor`/`id` pe toate labelurile
- `focus-visible:ring-2 focus-visible:ring-cyan-400` pe orice element interactiv
- `min-h-[44px]` pe butoane și inputuri
- `role="alert"` pe erori, `role="status"` pe succes/loading
- Text cu diacritice consistente: "Se încarcă", "Parolă", "Deconectare"

---

## Graniță (Boundaries)

### ✅ ÎNTOTDEAUNA fă:
- Citește schema Prisma înainte de orice operație cu date — e sursa de adevăr
- Rulează `prisma migrate dev` + `prisma generate` după orice schimbare schema
- Folosește `require('../db')` pentru Prisma — instanță unică
- Validează input-uri server-side
- Compară parole cu `bcrypt.compare()`, nu în clar
- Mesaje utilizator în română, cod în engleză
- Confirmă înainte de comenzi distructive

### ❓ ÎNTREABĂ ÎNAINTE:
- Orice modificare în schema Prisma (noi modele, coloane, relații)
- Adăugare librării noi
- Migrații de date sau importuri
- Modificări CORS, strategie JWT, cookie settings
- Variabile `.env` noi

### ❌ NICIODATĂ:
- Commit `.env` în Git
- Loga parole, hash-uri sau tokenuri JWT
- Șterge migrații Prisma existente fără confirmare
- `prisma migrate reset` fără backup + confirmare
- Adăuga roluri RBAC sau gestionare multi-user

---

## Faze de Dezvoltare

### ✅ FAZA 1 — Fundație & Infrastructură (COMPLETĂ)

**Ce s-a construit:**
- Docker Compose cu PostgreSQL 16
- Schema Prisma 7 multi-fișier, 10 modele + enums, 4 migrații aplicate
- Backend Express 5: health, auth DB-backed (login/refresh/logout/me), rate limiting, helmet
- Auth: access JWT 15min + refresh cookie httpOnly rotativ + AuditLog
- Frontend React 19 + Vite 8 + Tailwind v4: Login accesibil, useAuth hook, axios auto-refresh
- Seed: admin user + 8 secții + DM test

**Testare Faza 1 — confirmată:**
| Endpoint | Metodă | Rezultat |
|----------|--------|----------|
| `/api/health` | GET | `{status:"ok", database:"connected"}` ✓ |
| `/api/auth/login` | POST | `{accessToken, user}` + cookie ✓ |
| `/api/auth/login` (parolă greșită) | POST | 401 ✓ |
| `/api/auth/refresh` | POST (cookie) | `{accessToken}` nou + cookie rotit ✓ |
| `/api/auth/logout` | POST | cookie golit + AuditLog ✓ |
| `/api/auth/me` | GET (Bearer) | `{user}` ✓ |
| Login UI React | Browser | Form accesibil, login → dashboard ✓ |
| Reload browser | Browser | Sesiune păstrată via refresh cookie ✓ |

---

### 🔄 FAZA 2 — Modul Inventar DM (în lucru)

**Scope:**
- CRUD complet Device (formular add/edit cu React Hook Form + Zod)
- Tabel inventar cu filtre avansate + paginare server-side
- Export Excel (.xlsx) și CSV
- PDF Fișă DM — Formular Nr.8 (PDFKit)
- Upload documente (manual, certificat CE, factură, pașaport)
- Audit log la fiecare operație

**Dependențe noi necesare:**

| Pachet | Loc |
|--------|-----|
| react-hook-form, @hookform/resolvers, zod | frontend |
| react-select, react-datepicker, react-toastify, lucide-react | frontend |
| multer, pdfkit, exceljs | backend |

**Endpoint-uri Faza 2:**
```
GET    /api/sections                     → secții active (dropdown)
GET    /api/devices                      → lista DM (filtre + paginare)
POST   /api/devices                      → creare DM + AuditLog
GET    /api/devices/:id                  → detalii + relatii
PUT    /api/devices/:id                  → actualizare + AuditLog
DELETE /api/devices/:id                  → soft delete (CASAT) + AuditLog
POST   /api/devices/:id/upload           → upload fișier (multer)
GET    /api/devices/:id/fisa-pdf         → PDF Fișă DM
GET    /api/devices/export/xlsx          → export Excel (static route, before /:id)
GET    /api/devices/export/csv           → export CSV (static route, before /:id)
GET    /api/devices/dropdown/sections    → secții pentru formular (static route, before /:id)
```

**Checklist Faza 2:**
- [ ] Dependențe instalate frontend + backend
- [ ] BrowserRouter + Routes + ProtectedRoute în App.jsx / main.jsx
- [ ] `GET /api/sections` endpoint funcțional
- [ ] `deviceSchema.js` (Zod, JavaScript pur — fără TypeScript)
- [ ] `DeviceForm.jsx` — mode add și edit funcționale
- [ ] `routes/devices.js` — CRUD complet (rute statice ÎNAINTE de `/:id`)
- [ ] Multer upload + `uploads/devices/` autocreate
- [ ] PDF Fișă DM descărcabil (diacritice ok)
- [ ] `InventoryPage.jsx` — tabel, filtre, paginare
- [ ] Export Excel + CSV (cu filtrele active)
- [ ] Soft delete cu confirmare
- [ ] AuditLog la fiecare mutație Device
- [ ] Verificare end-to-end completă
- [ ] `uploads/` în `.gitignore`

**Detalii implementare:** `tasks/plan.md` + `tasks/todo.md`

---

### ⬜ FAZA 3 — Modul Mentenanță (urmează)

- Plan mentenanță preventivă (MPP) conform `MaintenanceType.PREVENTIVA`
- Înregistrare intervenții corective (`MaintenanceType.CORECTIVA`)
- Calendar mentenanță + alerte scadente (`nextMaintenanceAt` din Device)
- Ticketing mentenanță corectivă

---

### ⬜ FAZA 4 — Documente & Proceduri
- DMS (Document Management System) utilizând modelul `Document`
- Generare formulare PDF din Ghid
- Versionare documente (câmpul `previousVersionId` deja în schema)

---

### ⬜ FAZA 5 — Vigilență & Incidente
- Raportare incidente (`Incident`) cu severitate și status
- Notificări și escaladare AMDM (`reportedToAmdm`, `amdmReportDate`)
- Casare DM (`decommissionDate`)

---

### ⬜ FAZA 6 — Procurare
- Planificare achiziții
- PIF (Punere În Funcțiune)

---

### ⬜ FAZA 7 — Dashboard & Raportare
- KPI: dispozitive per status, mentenanță restantă, incidente deschise
- Rapoarte lunare + export

---

### ⬜ FAZA 8 — QA & Launch
- Testare completă, import date reale, go-live pe LAN spital

---

## Referințe Domeniu

| Abreviere | Înțeles |
|-----------|---------|
| DM | Dispozitiv Medical |
| MP | Mentenanță Preventivă |
| MC | Mentenanță Corectivă |
| PIF | Punere În Funcțiune (dare în exploatare) |
| MDM | Managementul Dispozitivelor Medicale |
| AMDM | Agenția Medicamentului și Dispozitivelor Medicale (RM) |
| SIMDM | Sistemul național; aplicația trebuie compatibilă la export |
| Ghidul | Ghidul Bioinginerului, Ordinul MS nr. 889/2024 |
