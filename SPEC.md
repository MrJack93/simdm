# SPEC — Specificație Tehnică SIMDM

**Versiune:** 2.1 (Faza 1-2 Completă + Production Ready)  
**Actualizat:** 2026-06-02  
**Audiență:** Developeri, Arhitecți, PM  
**Status:** ✅ Faza 2 Aprobată (176 tests, 97.42% backend, 91.99% frontend, Docker optimized)

---

## 1. Obiectiv & Context

### 1.1 Ce Construim

**SIMDM** = Sistem Informațional de Management al Dispozitivelor Medicale  
**Scop:** Înlocuiește evidența pe hârtie/Excel cu bază de date centralizată conform **Ghidului Bioinginerului — Ordinul MS nr. 889/2024** (Republica Moldova).

### 1.2 Utilizator & Hosting

- **Utilizator:** 1 bioinginer medical (utilizator **UNIC**)
- **Hosting:** localhost / rețea locală spital (fără cloud)
- **Deploy:** Containere Docker pe server spital sau mașina bioinginerului
- **Legea:** GDPR (date medicale locale, nu cloud)

### 1.3 NU Implementăm

❌ Multi-utilizator, RBAC, roluri multiple  
❌ Înregistrare de utilizatori noi  
❌ Cloud deploy (AWS, Azure, etc.)  
❌ OAuth / SSO  
❌ CI/CD automat (doar manual git push)  
❌ Analitica / logging la terți

---

## 2. Stivă Tehnologică (LOCKED)

Această stivă a fost aleasă strategic și **NU se schimbă fără meeting explicit cu PM**.

| Strat | Tehnologie | Version | Rol | Notă |
|-------|-----------|---------|-----|------|
| **Frontend** | React | 19.2 | UI, routing | Dev server Vite |
| **Frontend Bundler** | Vite | 8.0 | Build, dev | Refresh rapid |
| **Styling** | Tailwind CSS | 4.3 | Utility-first CSS | @tailwindcss/vite |
| **Forme** | React Hook Form | 7.7 | Stare formular | Performanță |
| **Validare** | Zod | 4.4 | Scheme type-safe | Frontend + backend |
| **HTTP Client** | Axios | 1.16 | Apeluri API | Interceptors JWT |
| **State/Fetching** | TanStack Query | 5.1 | Caching, refetch | Auto-sync |
| **Routing** | react-router-dom | 7.1 | Navigare | Rute imbricate |
| **Componente UI** | Tailwind + custom | — | Design system | Fără Shadcn/Material/etc |
| **Backend** | Node.js | 22 LTS | Server API | Production-ready |
| **API Framework** | Express.js | 5.2 | Handlers HTTP | REST endpoints |
| **Bază de date** | PostgreSQL | 16 | Persistență date | Imagine Docker |
| **ORM** | Prisma | 7.8 | Query builder | Schema multi-fișier |
| **Auth** | JWT | 9.0 | Token-based | +bcryptjs hashing |
| **Hashing** | bcryptjs | 3.0 | Hashing parole | 12 runde |
| **Containerization** | Docker | Compose | Dev + Prod | PostgreSQL, backend, frontend |
| **Environment** | dotenv | 17.4 | Gestiune secrete | .env (NU în Git) |
| **Rate Limiting** | express-rate-limit | 8.5 | Protecție brute-force | Login limit 5/15min |
| **Securitate** | helmet.js | 8.2 | HTTP headers | CSP, HSTS, etc. |

### 2.1 De Ce Această Stivă?

✅ **Frontend:**
- React = standard industrie, component-based, reutilizabil
- Vite = build ultra-rapid (150ms), HMR out-of-box
- Tailwind = utility-first, responsive, accesibil implicit
- TanStack Query = standard de facto state management (2025)

✅ **Backend:**
- Node.js = JavaScript full-stack, npm ecosystem
- Express = minimal, stabil, larg utilizat
- Prisma = ORM type-safe, migrații, seed, GUI (Studio)

✅ **Bază de date:**
- PostgreSQL = robust, ACID, open-source, containerizabil
- Docker = mediu dev reproducibil

### 2.2 Restricții & Reguli

```
🚫 NU: Next.js, Nuxt, Remix, SvelteKit
🚫 NU: GraphQL, tRPC, gRPC
🚫 NU: Styled-components, Emotion, CSS-in-JS
🚫 NU: Zustand, Redux, Recoil (TanStack Query e destul)
🚫 NU: MongoDB, MySQL, SQLite (doar PostgreSQL)
🚫 NU: S3, Cloudinary, stocare externă (doar uploaduri locale)

✅ OK (dacă cerere explicită + PM aprobă):
   - Framework-uri testing (Jest, Vitest, Playwright)
   - Optimizare build (vite plugins)
   - UI kit minimal (dacă Tailwind nu ajunge)
```

---

## 3. Comenzi Principale

### 3.1 Development

```bash
# DOCKER — pornire PostgreSQL (necesar înainte de backend)
docker-compose up -d postgres

# ROOT — build + dev simultan
npm run dev

# BACKEND (simdm/backend/)
npm install                    # Instalare dependențe
npm run dev                    # Port 3001, nodemon auto-reload
npm start                      # Production (fără watch)
npx prisma migrate dev         # Creare + aplică migrație
npx prisma db seed             # Rulează seed.js
npm run db:studio              # GUI bază de date (port 5555)
npx prisma validate            # Validare schema.prisma
npx prisma generate            # Regenerează @prisma/client

# FRONTEND (simdm/frontend/)
npm install                    # Instalare dependențe
npm run dev                    # Vite server (port 5173)
npm run build                  # Build producție → dist/
npm run lint                   # ESLint check
```

### 3.2 Bază de Date

```bash
# PostgreSQL CLI
psql postgresql://simdm_user:simdm_secure_2024@localhost:5432/simdm_db

# Backup
pg_dump -U simdm_user -d simdm_db > backup.sql

# Restore
psql -U simdm_user -d simdm_db < backup.sql

# Reset (NUMAI în dev!)
npm run db:reset --force  # Cere consent! DISTRUGE datele!
```

---

## 4. Structură Bază de Date

### 4.1 Tabele Principale (Faza 1)

```sql
-- users: Bioinginer medical
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  passwordHash VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'BIOINGINER',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT now()
);

-- sections: Secții spitalului (ATI, Bloc Op, etc.)
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  code VARCHAR UNIQUE,
  floor VARCHAR,
  isActive BOOLEAN DEFAULT true
);

-- devices: Dispozitivele medicale
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  inventoryNumber VARCHAR UNIQUE NOT NULL,  -- Cheie de căutare
  serialNumber VARCHAR,
  name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  status VARCHAR DEFAULT 'FUNCTIONAL',      -- enum
  riskClass VARCHAR,                        -- I, IIa, IIb, III
  sectionId INT REFERENCES sections(id),
  createdById INT REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT now()
);

-- incidents: Rapoarte de defecțiuni
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  deviceId INT NOT NULL REFERENCES devices(id),
  occurredAt TIMESTAMP NOT NULL,
  severity VARCHAR NOT NULL,                -- enum
  description TEXT NOT NULL,
  status VARCHAR DEFAULT 'DESCHIS',
  reportedById INT REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT now()
);

-- consumables: Piese de schimb, electrozi, etc.
CREATE TABLE consumables (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  manufacturer VARCHAR,
  quantity INT DEFAULT 0,
  minQuantity INT DEFAULT 0,
  expiryDate DATE,
  location VARCHAR,
  createdAt TIMESTAMP DEFAULT now()
);

-- audit_logs: Jurnal acțiuni (compliance)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id),
  action VARCHAR NOT NULL,                  -- 'CREATE', 'UPDATE', 'DELETE'
  entity VARCHAR NOT NULL,                  -- 'Device', 'Incident', etc.
  entityId VARCHAR,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT now()
);
```

### 4.2 Enumerări

```prisma
enum DeviceStatus {
  FUNCTIONAL      # Funcțional
  IN_REPARATIE    # În reparație
  DEFECT          # Defect
  CASAT           # Casare
  IMPRUMUTAT      # Împrumutat (la alte spitale)
  REZERVA         # Rezervă (în depozit)
}

enum IncidentSeverity {
  NEAR_MISS       # Aproape incident
  MINOR           # Mic
  MODERAT         # Moderat
  GRAV            # Grav
  CRITIC          # Critic
}

enum MaintenanceType {
  PREVENTIVA      # Mentenanță preventivă
  CORECTIVA       # Mentenanță corectivă
  VERIFICARE      # Verificare de siguranță
  CALIBRARE       # Calibrare / Ajustare
}
```

### 4.3 Relații

```
users (1) ──→ (N) devices              [createdById]
sections (1) ──→ (N) devices           [sectionId]
devices (1) ──→ (N) incidents          [deviceId]
devices (1) ──→ (N) maintenance_records [deviceId]
devices (M) ──↔ (N) consumables        [device_consumables join]
```

---

## 5. Endpoint-uri API (Faza 1)

### 5.1 Sănătate & Autentificare

```
GET  /api/health                       # Status server + DB
POST /api/auth/login                   # { username, password } → token
POST /api/auth/refresh                 # Refresh access token
POST /api/auth/logout                  # Clear refresh token
GET  /api/auth/me                      # Info utilizator actual
```

### 5.2 Faza 2 — Inventar DM (✅ IMPLEMENTAT)

```
# CRUD Dispozitive
GET    /api/devices                    # Lista cu filtre, paginare, soft-delete
  Params: ?search=, ?status=, ?riskClass=, ?sectionId=
           ?page=1, ?limit=50 (max 1000), ?includeCasat=true
  Response: { devices: [...], pagination: { page, limit, total, pages } }

POST   /api/devices                    # Creare (Zod validation 24 câmpuri)
  Body: { inventoryNumber, name, riskClass, sectionId, status, ... }
  Response: 201 { device + audit log }

GET    /api/devices/:id                # Detalii (cu relații: section, maintenance, incidents)
PUT    /api/devices/:id                # Editare (Zod validation)
DELETE /api/devices/:id                # Soft-delete (CASAT, audit log)

# Upload & Exporuri
POST   /api/devices/:id/upload         # Upload fișier (magic byte + antivirus scan)
GET    /api/devices/export/csv         # Export CSV (rate limited: 10/15min)
GET    /api/devices/export/xlsx        # Export Excel XLSX (rate limited)
GET    /api/devices/:id/fisa-pdf       # PDF Fișă DM Form 8 (rate limited)

# Dropdown-uri
GET    /api/devices/dropdown/sections  # Secții pentru select-uri

# Logging Audit
- CREATE, UPDATE, DELETE actionlog automat
- FILE_UPLOAD cu metadata: mimeType, clamavScanned, etc.
```

### 5.3 Faze Viitoare (Stubs)

```
# Faza 3 — Mentenanță
GET    /api/maintenance                # Istoric mentenanță
POST   /api/maintenance                # Planificare

# Faza 4 — Documente
GET    /api/documents
POST   /api/documents

# Faza 5 — Incidente
GET    /api/incidents
POST   /api/incidents

# Admin (Faza 7+)
GET    /api/audit-logs                 # Jurnal complet
POST   /api/backup                     # Export DB
```

---

## 6. Rute Frontend (Faza 1)

```
/              # Redirect → /login sau /dashboard
/login         # Pagina autentificare
/dashboard     # Home (Faza 2+)
/devices       # Inventar dispozitive (Faza 2)
/maintenance   # Mentenanță (Faza 3)
/incidents     # Incidente (Faza 5)
/reports       # Dashboard KPI (Faza 7)
/settings      # Preferințe bioinginer (Faza 6+)
```

---

## 7. Autentificare & Securitate

### 7.1 Flux Autentificare

```
1. POST /login { username, password }
   ↓
2. Backend: bcrypt.compare(password, hash)
   ↓
3. Genereaza JWT access token (15 min)
   ↓
4. Genereaza refresh token → httpOnly cookie (7 zile)
   ↓
5. Response: { accessToken, user }
   ↓
6. Frontend: sessionStorage.setItem('accessToken', accessToken)
   ↓
7. Fiecare request: Authorization: Bearer <token>
   ↓
8. Token expira → auto-refresh via interceptor
```

### 7.2 Secrete & .env

```env
# Bază de date
DATABASE_URL="postgresql://simdm_user:simdm_secure_2024@localhost:5432/simdm_db"

# JWT
JWT_ACCESS_SECRET="<64-char-random-string>"        # openssl rand -hex 32
JWT_REFRESH_SECRET="<64-char-random-string>"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_EXPIRES="7d"

# Server
PORT=3001
NODE_ENV="development"

# Admin (seed)
ADMIN_USERNAME="inginer"
ADMIN_PASSWORD_HASH="$2b$12$..."                   # bcrypt hash

# Securitate
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000                       # 15 min
RATE_LIMIT_MAX_REQUESTS=5                         # 5 încercări

# Cookie-uri
COOKIE_SECURE="false"                             # Dev: false, Prod: true
COOKIE_DOMAIN="localhost"                         # Dev: localhost
```

**Regulă:** `.env` **NICIODATĂ** în Git. Generat local / via secrets manager producție.

---

## 8. Seed-ing Date (Faza 1)

După `npm run db:seed`, baza de date conține:

| Entitate | Cantitate | Detalii |
|----------|-----------|---------|
| Users | 1 | bioinginer (admin) |
| Sections | 8 | ATI, Bloc Op, Cardio, Chir, Med, Lab, RX, Urgențe |
| Devices | 8 | Monitor, Defibrilator, ECG, Analizor, Difuzor, Pompă, Endoscop, Ventilator |
| Consumables | 4 | Electrozi, căi vasculare, filtre, baterii |
| Incidents | 2 | MODERAT (pompă), GRAV (ventilator) |
| Maintenance | 0 | (Testing, adăugate manual în Faza 2+) |

Fișier: [`backend/prisma/seed.js`](backend/prisma/seed.js)

---

## 9. Depanare & Repornire

### 9.1 Reset Bază de Date (NUMAI DEV)

```bash
cd backend
npm run db:reset --force   # Cere consent! DISTRUGE datele!
```

### 9.2 Probleme Prisma

```bash
# Regenerează client
npx prisma generate

# Validează schema
npx prisma validate

# Inspecționează migrații
ls prisma/migrations/

# Vizualizează date live
npm run db:studio  # http://localhost:5555
```

### 9.3 Conflicte Porturi

```bash
# Windows PowerShell
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3001
kill -9 <PID>
```

---

## 10. Performanță & Limitări

### 10.1 Limitări Cunoscute (Faza 1)

- ✅ Suportă **1 utilizator concurrent** (arhitectură single-user)
- ✅ Bază de date poate crește la **10K+ dispozitive** fără probleme
- ✅ Queries sunt indexate pe `inventoryNumber`, `status`, `createdAt`
- ⚠️ File uploads pentru documente (Faza 4) — limit 50MB per fișier

### 10.2 Optimizare Viitoare

| Fază | Optimizare | Prioritate |
|------|-----------|-----------|
| 2 | Paginare tabel (100 rânduri/pagină) | Medie |
| 3 | Caching Redis pentru KPI | Joasă |
| 5 | Full-text search pe incidente | Medie |
| 7 | Generare PDF server-side | Medie |
| 8 | Database replication backup | Înaltă |

---

## 11. Conformitate & Standarde

### 11.1 Ghidul Bioinginerului (Ordinul MS 889/2024)

Aplicația conformează următoarelor cerințe:

- ✅ Jurnal audit complet (audit_logs)
- ✅ Raportare incidente (bazată pe severitate)
- ✅ Mentenanță preventivă planificată (Faza 3)
- ✅ Documente & proceduri (Faza 4)
- ✅ Accesibilitate WCAG 2.1 AA (Faza 1+)
- ✅ Securitate criptare (bcrypt, JWT, HTTPS prod)
- ✅ Proceduri backup & recovery (TBD Faza 8)

### 11.2 Standardul WCAG 2.1 AA

Frontend-ul este **100% accesibil:**
- ✅ HTML semantic, ARIA labels
- ✅ Focus rings vizibile, navigare tastatură
- ✅ Contrast ≥ 4.5:1 (AAA text, AA UI)
- ✅ Ținte atingere ≥ 44px
- ✅ Dark + Light mode suportate

---

## 12. Faze de Dezvoltare (8 Total)

| Fază | Modul | Estimare | Status |
|------|-------|----------|--------|
| **1** | Fundație (Auth, DB, Login) | ✅ Gata | **COMPLETĂ** |
| **2** | Inventar DM (CRUD, tabel, export) | 3-4 săptămâni | Planning |
| **3** | Mentenanță (MP/MC, plan preventiv) | 3-4 săptămâni | Planning |
| **4** | Documente & Proceduri (DMS, PDF) | 2-3 săptămâni | Planning |
| **5** | Incidente & Vigilență (raportare) | 2-3 săptămâni | Planning |
| **6** | Procurement (PIF, planificare) | 2-3 săptămâni | Planning |
| **7** | Dashboard & Raportare (KPI, export) | 2-3 săptămâni | Planning |
| **8** | QA & Go-Live (testare, import real) | 1-2 săptămâni | Planning |

**Total estimare:** 16-22 săptămâni (4-5 luni timp dev)

---

## 13. Resurse & Documentație

| Document | Audiență | Link |
|----------|----------|------|
| **GETTING-STARTED.md** | Bioinginer, dev nou | [Link](GETTING-STARTED.md) |
| **CLAUDE.md** | AI + backend dev | [Link](CLAUDE.md) |
| **Design System** | Frontend dev | [docs/1-DESIGN-AND-ACCESSIBILITY.md](docs/1-DESIGN-AND-ACCESSIBILITY.md) |
| **Developer Guide** | Frontend dev | [docs/2-DEVELOPER-GUIDE.md](docs/2-DEVELOPER-GUIDE.md) |
| **Contributing** | Toți | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |
| **Project Plan** | PM | [tasks/plan.md](tasks/plan.md) |
| **API Docs** | Backend dev | *(generat swagger — Faza 3+)* |

---

## 14. Aprobări & Sign-Off

**Specificație aprobată:**
- ✅ Tech Lead: Faza 1 COMPLETĂ
- ✅ PM: Roadmap 8 faze validat
- ✅ Security: Audit passou 100%
- ✅ Product: Ready for Faza 2

**Data aprobării:** 2026-05-30  
**Versiune:** 1.0  
**Status:** ✅ LOCKED (modificări doar cu PM approval)

---

**Următor:** Start Faza 2 (Inventar DM) — citire [tasks/plan.md](tasks/plan.md)
