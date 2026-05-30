# SPEC — Specificație Tehnică SIMDM

**Versiune:** 1.0 (Faza 1 Complete)  
**Actualizat:** 2026-05-30  
**Audiență:** Developeri, Arhitecți, PM  
**Status:** ✅ Aprobat pentru Faza 2

---

## 1. Obiectiv & Context

### 1.1 Ce Construim

**SIMDM** = Sistem Informațional de Management al Dispozitivelor Medicale  
**Scop:** Înlocuiește evid eviden ența pe hârtie/Excel cu bază de date centralizată conform **Ghidului Bioinginerului — Ordinul MS nr. 889/2024** (Republica Moldova).

### 1.2 Utilizator & Hosting

- **Utilizator:** 1 bioinginer medical (utilizator **UNIC**)
- **Hosting:** localhost / rețea locală spital (fără cloud)
- **Deploy:** Docker container-uri pe server spital sau mașina bioinginerului
- **Legea:** GDPR (date medicale locale, nu cloud)

### 1.3 NU Implementăm

❌ Multi-user, RBAC, roluri multiple  
❌ Înregistrare de utilizatori noi  
❌ Cloud deploy (AWS, Azure, etc.)  
❌ OAuth / SSO  
❌ CI/CD automat (doar manual git push)  
❌ Analitica / logging la terți

---

## 2. Stivă Tehnologică (LOCKED)

Această stivă a fost aleasă strategically și **NU se schimbă fără meeting explicit cu PM**.

| Strat | Tehnologie | Version | Rol | Notă |
|-------|-----------|---------|-----|------|
| **Frontend** | React | 19.2 | UI, routing | Vite dev server |
| **Frontend Bundler** | Vite | 8.0 | Build, dev | Fast refresh |
| **Styling** | Tailwind CSS | 4.3 | Utility-first CSS | @tailwindcss/vite |
| **Forms** | React Hook Form | 7.7 | Form state | Performance |
| **Validation** | Zod | 4.4 | Type-safe schemas | Frontend + backend |
| **HTTP Client** | Axios | 1.16 | API calls | Interceptors JWT |
| **State/Fetching** | TanStack Query | 5.1 | Caching, refetch | Auto-sync |
| **Routing** | react-router-dom | 7.1 | Navigation | Nested routes |
| **UI Components** | Tailwind + custom | — | Design system | No Shadcn/Material/etc |
| **Backend** | Node.js | 22 LTS | API server | Production-ready |
| **API Framework** | Express.js | 5.2 | HTTP handlers | REST endpoints |
| **Database** | PostgreSQL | 16 | Data persistence | Docker image |
| **ORM** | Prisma | 7.8 | Query builder | Multi-file schema |
| **Auth** | JWT | 9.0 | Token-based | +bcryptjs hashing |
| **Hashing** | bcryptjs | 3.0 | Password hashing | 12 rounds |
| **Containerization** | Docker | Compose | Dev + Prod | PostgreSQL, backend, frontend |
| **Environment** | dotenv | 17.4 | Secrets management | .env (NU în Git) |
| **Rate Limiting** | express-rate-limit | 8.5 | Brute-force protection | Login limit 5/15min |
| **Security** | helmet.js | 8.2 | HTTP headers | CSP, HSTS, etc. |

### 2.1 De Ce Această Stivă?

✅ **Frontend:**
- React = standard industry, component-based, reusable
- Vite = build ultra-rapid (150ms), HMR out-of-box
- Tailwind = utility-first, responsive, accessible defaults
- TanStack Query = de-facto standard state management (2025)

✅ **Backend:**
- Node.js = JavaScript full-stack, npm ecosystem
- Express = minimal, stable, widely-used
- Prisma = type-safe ORM, migrations, seed, GUI (Studio)

✅ **Database:**
- PostgreSQL = robust, ACID, open-source, containers
- Docker = reproducible dev environment

### 2.2 Restricții & Reguli

```
🚫 NO: Next.js, Nuxt, Remix, SvelteKit
🚫 NO: GraphQL, tRPC, gRPC
🚫 NO: Styled-components, Emotion, CSS-in-JS
🚫 NO: Zustand, Redux, Recoil (TanStack Query e destul)
🚫 NO: MongoDB, MySQL, SQLite (PostgreSQL only)
🚫 NO: S3, Cloudinary, external storage (local uploads only)

✅ OK (dacă cerere explicită + PM aprobă):
   - Testing frameworks (Jest, Vitest, Playwright)
   - Build optimization (vite plugins)
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
npx prisma generate             # Regenerează @prisma/client

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
npm run db:reset --force  # DISTRUGE datele — cerere user consent
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
}

enum IncidentSeverity {
  NEAR_MISS       # Aproape incident
  MINOR           # Mic
  MODERAT         # Moderat
  GRAV            # Grav
  CRITIC          # Critic
}

enum MaintenanceType {
  MP              # Preventivă
  MC              # Corectivă
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

## 5. API Endpoints (Faza 1)

### 5.1 Health & Auth

```
GET  /api/health                       # Status server + DB
POST /api/auth/login                   # { username, password } → token
POST /api/auth/refresh                 # Refresh access token
POST /api/auth/logout                  # Clear refresh token
GET  /api/auth/me                      # Current user info
```

### 5.2 Faze Viitoare (Stubs)

```
# Faza 2 — Inventar
GET    /api/devices                    # Lista cu filtre
POST   /api/devices                    # Creare
GET    /api/devices/:id                # Detalii
PUT    /api/devices/:id                # Editare
DELETE /api/devices/:id                # Ștergere

# Faza 3 — Mentenanță
GET    /api/maintenance                # Istoric mentenanță
POST   /api/maintenance                # Planificare

# Faza 4 — Documente
GET    /api/documents
POST   /api/documents

# Faza 5 — Incidente
GET    /api/incidents
POST   /api/incidents

# Admin
GET    /api/audit-logs                 # Jurnal complet
POST   /api/backup                     # Export DB
```

---

## 6. Frontend Routes (Faza 1)

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

## 7. Autentificare & Sigurență

### 7.1 Flow Auth

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
6. Frontend: localStorage.setItem('simdm_token', accessToken)
   ↓
7. Every request: Authorization: Bearer <token>
   ↓
8. Token expira → auto-refresh via interceptor
```

### 7.2 Secrets & .env

```env
# Database
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

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000                       # 15 min
RATE_LIMIT_MAX_REQUESTS=5                         # 5 tries

# Cookies
COOKIE_SECURE="false"                             # Dev: false, Prod: true
COOKIE_DOMAIN="localhost"                         # Dev: localhost
```

**Regulă:** `.env` **NICIODATĂ** în Git. Generat local / via secrets manager producție.

---

## 8. Data Seeding (Faza 1)

După `npm run db:seed`, baza de date conține:

| Entitate | Cantitate | Detalii |
|----------|-----------|---------|
| Users | 1 | bioinginer (admin) |
| Sections | 8 | ATI, Bloc Op, Cardio, Chir, Med, Lab, RX, Urgențe |
| Devices | 8 | Monitor, Defibrilator, ECG, Analizor, Difuzor, Pompă, Endoscop, Ventilator |
| Consumables | 4 | Electrozi, căi vasculare, filtre, baterii |
| Incidents | 2 | MODERAT (pompă), GRAV (ventilator) |
| Maintenance | 0 | (Testing, adăugate manual în Faza 2+) |

Fisier: [`backend/prisma/seed.js`](backend/prisma/seed.js)

---

## 9. Depanare & Repornire

### 9.1 Reset Database (NUMAI DEV)

```bash
cd backend
npm run db:reset --force   # Cere consent! DISTRUGE datele!
```

### 9.2 Prisma Issues

```bash
# Regenerează client
npx prisma generate

# Validează schema
npx prisma validate

# Inspecționează migrații
ls prisma/migrations/

# View live data
npm run db:studio  # http://localhost:5555
```

### 9.3 Port Conflicts

```bash
# Windows PowerShell
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3001
kill -9 <PID>
```

---

## 10. Performanță & Limezări

### 10.1 Limitări Cunoscute (Faza 1)

- ✅ Suportă **1 utilizator concurrent** (arhitectură single-user)
- ✅ Bază de date poate crești la **10K+ dispozitive** fără probleme
- ✅ Queries sunt indexate pe `inventoryNumber`, `status`, `createdAt`
- ⚠️ File uploads pentru documente (Faza 4) — limit 50MB per fișier

### 10.2 Optimization Future

| Fază | Optimizare | Priority |
|------|-----------|----------|
| 2 | Pagination tabel (100 rows/page) | Medium |
| 3 | Caching Redis pentru KPI | Low |
| 5 | Full-text search pe incidente | Medium |
| 7 | PDF generation server-side | Medium |
| 8 | Database replication backup | High |

---

## 11. Compliance & Standarde

### 11.1 Ghid Bioinginerului (Ordinul MS 889/2024)

Aplicația conformează următoarelor cerințe:

- ✅ Jurnal audit complet (audit_logs)
- ✅ Raportare incidente (severity-based)
- ✅ Mentenanță preventivă planificată (Faza 3)
- ✅ Documente & proceduri (Faza 4)
- ✅ Accesibilitate WCAG 2.1 AA (Faza 1+)
- ✅ Sigurență criptare (bcrypt, JWT, HTTPS prod)
- ✅ Backup & recovery procedures (TBD Faza 8)

### 11.2 Standardul WCAG 2.1 AA

Frontend-ul este **100% accesibil:**
- ✅ Semantic HTML, ARIA labels
- ✅ Focus rings vizibile, keyboard navigation
- ✅ Contrast ≥ 4.5:1 (AAA text, AA UI)
- ✅ Hit targets ≥ 44px
- ✅ Dark + Light mode suportate

---

## 12. Faze de Dezvoltare (8 Total)

| Fază | Modul | Estimate | Status |
|------|-------|----------|--------|
| **1** | Fundație (Auth, DB, Login) | ✅ Done | **COMPLETĂ** |
| **2** | Inventar DM (CRUD, tabel, export) | 3-4 săptămâni | Planning |
| **3** | Mentenanță (MP/MC, plan preventiv) | 3-4 săptămâni | Planning |
| **4** | Documente & Proceduri (DMS, PDF) | 2-3 săptămâni | Planning |
| **5** | Incidente & Vigilență (raportare) | 2-3 săptămâni | Planning |
| **6** | Procurement (PIF, planificare) | 2-3 săptămâni | Planning |
| **7** | Dashboard & Raportare (KPI, export) | 2-3 săptămâni | Planning |
| **8** | QA & Go-Live (testare, import real) | 1-2 săptămâni | Planning |

**Total estimate:** 16-22 săptămâni (4-5 luni dev time)

---

## 13. Resurse & Documentație

| Document | Audiență | Link |
|----------|----------|------|
| **GETTING-STARTED.md** | Bioinginer, dev new | [Link](GETTING-STARTED.md) |
| **CLAUDE.md** | AI + backend dev | [Link](CLAUDE.md) |
| **Design System** | Frontend dev | [docs/1-DESIGN-AND-ACCESSIBILITY.md](docs/1-DESIGN-AND-ACCESSIBILITY.md) |
| **Developer Guide** | Frontend dev | [docs/2-DEVELOPER-GUIDE.md](docs/2-DEVELOPER-GUIDE.md) |
| **Contributing** | All | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |
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
