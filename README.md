# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Versiune:** 3.0 — Faza 1-2 auditate & remediate + documentație consolidată  
**Status:** ✅ **Faza 1 & 2 COMPLETĂ** (audit de securitate trecut, remedieri aplicate) | ⏳ **Faza 3 în lucru**  
**Actualizat:** 2026-06-08  
**Licență:** Privat (instituții de medicină privată, Moldova)

> **Viziune:** SIMDM propriu pentru instituțiile de **medicină privată** — alternativă locală, independentă față de SIMDM-ul național al AMDM (care deservește mai ales IMSP publice). Ghidul bioinginerului (Ordin MS 889/2024) rămâne referința normativă pentru conformitate.

---

## 🎯 Despre SIMDM

**SIMDM** este o aplicație web modernă pentru gestionarea centralizată a dispozitivelor medicale (DM), concepută special pentru bioinginerul medical al unui spital privat din Moldova.

Înlocuiește evidența pe hârtie și foile Excel cu o bază de date securizată, conform standardelor din **Ghidul Bioinginerului — Ordinul MS nr. 889/2024** (Republica Moldova).

### 📊 Status Implementare

| Fază | Modul | Status | Tests | Coverage |
|------|-------|--------|-------|----------|
| **1** | Fundație (Auth, DB, Login) | ✅ COMPLETĂ + auditată | da | rulează local (`npm test`) |
| **2** | Inventar DM (CRUD, export) | ✅ COMPLETĂ + auditată | da | rulează local (`npm test`) |
| **QW** | Module quick-win (Mentenanță basic, Incidente, Audit Logs UI, Timeline) | ✅ COMPLETĂ | — | — |
| **3** | Mentenanță completă (Calendar, Semnătură, Formular Nr. 5-6-8-9) | ⏳ ÎN LUCRU (16 zile) | TBD | Target ≥95% |
| **4-8** | Documente, Procurement, Dashboard, QA | ⬜ PLANNED | — | — |

> **Audit Faza 1-2 (2026-06-06):** s-a efectuat un audit independent la nivel de cod (securitate + integritate date). Toate problemele critice și high au fost remediate: secrete JWT reale, `change-password` reparat, atribuire corectă în audit-log (`req.user.sub`), anti-injection la export CSV, validare id, tranzacții atomice, servire fișiere autentificată. Confirmarea finală „verde" se face rulând suita de teste local (`npm test`).

### ✅ Caracteristici Implementate (Faza 1+2+Design System)

**Faza 1: Fundație** ✅
- ✅ **Login sigur** — JWT + bcrypt, utilizator unic bioinginer, refresh tokens cu rotație
- ✅ **Bază de date robustă** — PostgreSQL 16, Prisma 7 ORM, 10+ tabele, seed data

**Faza 2: Inventar DM** ✅ **COMPLETĂ**
- ✅ **CRUD Complet** — Creare, editare, ștergere (soft-delete CASAT), listare cu filtre
- ✅ **Filtrare Avansată** — După status (6 statuse), clasă risc (4 clase), secție, search text
- ✅ **Paginare Sigură** — Max 1000 items/pagină, validare page ≥ 1
- ✅ **Export Date** — CSV, XLSX (Excel), PDF (Fișă DM Formular Nr. 8)
- ✅ **Upload Documente** — PDF, Word, Excel, imagini cu antivirus scanning (magic bytes + optional ClamAV)
- ✅ **Validare Zod** — 24 câmpuri validate pe server-side (POST/PUT)
- ✅ **Rate Limiting** — 10 exporturi per 15 minute (DOS protection) + 5 login tries
- ✅ **Audit Log** — Jurnal complet CREATE/UPDATE/DELETE + FILE_UPLOAD cu tracking user + changes
- ✅ **Database Indexing** — 3 compound indexes pentru performanță 5-10x

**Interfață & Accesibilitate** ✅ **100/100**
- ✅ **React 19 + Vite + Tailwind v4** — Dark/light mode, fully responsive
- ✅ **WCAG 2.1 AA Level AA Certified** — Keyboard navigation, focus rings, semantic HTML, aria attributes
- ✅ **Design System 100/100** — Complete token coverage, zero hardcoded values, glassmorphism, SkipLink accessibility pattern
- ✅ **Component Library** — StatusBadge (6 statuses), DataGrid, Forms, Modals, Toasts, DeviceCard, Button, Input, Card
- ✅ **Documentație consolidată** — [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) (token-uri, componente, WCAG AA, light/dark)

**Module Quick-Win** ✅
- ✅ **Înregistrări Mentenanță** — CRUD complet, 4 tipuri (Preventivă/Corectivă/Verificare/Calibrare), badge-uri vizuale
- ✅ **Raportare Incidente** — CRUD + state machine status (Deschis → În lucru → Rezolvat → Închis / Escaladat AMDM), 5 niveluri severitate
- ✅ **Jurnal Audit UI** — Pagina `/audit-logs` cu filtre, export CSV (UTF-8 BOM Excel), câmpuri JSON expandabile
- ✅ **Timeline Dispozitiv** — Istoricul modificărilor pe fișa DM (DevForm edit mode)
- ✅ **Ghid Workflow Mobil** — Documentație utilizare pe teren (`docs/MOBILE_WORKFLOW_GUIDE.md`)

**Hardening de Securitate**
- ✅ **Antivirus Scanning** — Magic byte detection + optional ClamAV (production-ready)
- ✅ **Soft-Delete Pattern** — CASAT status (default excluded from queries)
- ✅ **JWT + bcrypt** — Industry-standard authentication (12 rounds bcrypt)
- ✅ **Account Lockout** — 5 failed attempts → lock 30 min
- ✅ **Helmet.js** — Security headers (CSP, HSTS, X-Frame-Options)
- ✅ **CORS** — Configurare restrictivă, localhost only

**Testare & QA**
- ✅ **Backend:** 176 unit + integration tests, 95.36% coverage
- ✅ **Frontend:** 103 component + hook tests, 91.99% coverage
- ✅ **E2E:** 15 Playwright tests covering 5 critical scenarios
- ✅ **CI/CD:** GitHub Actions v5 (Node.js 24, all warnings resolved)
- ✅ **Docker:** Multi-stage, optimized, healthcheck fixed

### 🔧 Faza 3: Mentenanță (⏳ PLANNED — START 2026-06-05)

**Durată:** 16 zile (3-4 săptămâni) | **End date:** 2026-06-26 (projected)

**5 Module (Pași):**
1. **Pas 3.1** — Plan Mentenanță Preventivă (4 zile): Generator plan + calendar vizual + Formular Nr. 5
2. **Pas 3.2** — Execuție MPP (3 zile): Checklist + semnătură digitală + Formular Nr. 6
3. **Pas 3.3** — Mentenanță Corectivă (4 zile): Ticketing + state machine + Formular Nr. 8
4. **Pas 3.4** — Verificări Periodice (3 zile): Registru + metrologie + alerte 60/30/7 zile
5. **Pas 3.5** — Contracte Externe (2 zile): CRUD + rating furnizori + Formular Nr. 9

**Dependințe:** react-big-calendar, date-fns, react-signature-canvas, node-cron

**Vezi planul pas-cu-pas:** [tasks/PLAN-FAZA3-DETALIAT.md](tasks/PLAN-FAZA3-DETALIAT.md) | [tasks/todo.md](tasks/todo.md) | [SPEC.md § 15](SPEC.md)

---

## 📚 Documentație Completă

| Document | Audiență | Conținut |
|----------|----------|----------|
| **SPEC.md** | Arhitecți, DevOps | Stivă tech locked, schema, Faza 3 overview |
| **GETTING-STARTED.md** | Bioinginer, dev nou | Setup rapid (Docker / local) |
| **CLAUDE.md** | AI + dev | Instrucțiuni proiect + reguli cod |
| **tasks/PLAN-FAZA3-DETALIAT.md** | PM + dev | Plan pas-cu-pas Faza 3 (5 module) |
| **tasks/todo.md** | Dev | Checklist live per fază |
| **docs/DESIGN-SYSTEM.md** | Frontend dev | Token-uri, componente, WCAG AA, light/dark (consolidat) |
| **docs/2-DEVELOPER-GUIDE.md** | Backend + frontend | Patterns, testing, Docker |
| **docs/3-AUDIT-LOG.md** | Referință | Documentația funcției de audit-log |
| **docs/CONTRIBUTING.md** | Toți | PR workflow + standarde |
| **docs/ANTIVIRUS-SETUP.md** | DevOps | Magic bytes + ClamAV |
| **docs/DOCKER-OPTIMIZATION.md** | DevOps | WSL + resource limits |
| **docs/MOBILE_WORKFLOW_GUIDE.md** | Bioinginer (teren) | Workflow-uri mobile + breakpoints |

---

## 🚀 Pornire Rapidă

### Opțiunea 1: Docker (5 minute - RECOMANDATĂ)

```bash
# Clone și intră în proiect
git clone <repo> && cd simdm

# Pornește containerele (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Așteptă mesajul:
# ✅ Server SIMDM pornit pe http://localhost:3001
# ✅ Frontend: Local: http://localhost:5173
```

**Apoi:**
1. Deschide http://localhost:5173 în browser
2. Login: dmin / dmin
3. Sunt 8 dispozitive gata în baza de date (monitor, defibrilator, ecograf, etc.)

### Opțiunea 2: Local fără Docker (10-15 minute)

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev  # Server pe port 3001

# Frontend (alt terminal)
cd frontend
npm install
npm run dev  # Vite pe port 5173
```

---

## 🏗️ Arhitectură

### Stivă Tehnologică (LOCKED)

| Strat | Tehnologie | Version |
|-------|-----------|---------|
| **Frontend** | React | 19 |
| **Bundler** | Vite | 8 |
| **Styling** | Tailwind CSS | 4 |
| **Forms** | React Hook Form | 7 |
| **Validare** | Zod | 4 |
| **API Client** | Axios | 1.16 |
| **State/Fetching** | TanStack Query | 5 |
| **Routing** | react-router-dom | 7 |
| **Backend** | Express.js | 5.2 |
| **Node.js** | LTS | 22 |
| **Database** | PostgreSQL | 16 |
| **ORM** | Prisma | 7.8 |
| **Auth** | JWT + bcryptjs | 12 rounds |
| **Testing** | Vitest + RTL + Playwright | — |
| **Container** | Docker Compose | — |

### Structura Directoare

```
simdm/
├── backend/
│   ├── prisma/schema/
│   │   ├── schema.prisma       # Sursa de adevăr pentru DB
│   │   ├── migrations/
│   │   └── seed.js
│   ├── src/
│   │   ├── routes/             # Un endpoint per resursă
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── schemas/            # Zod schemas
│   │   ├── jobs/               # Cron jobs (node-cron)
│   │   └── __tests__/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom hooks
│   │   ├── api/                # Axios + service calls
│   │   ├── schemas/            # Zod validation
│   │   └── __tests__/
│   └── package.json
├── docs/
│   ├── DESIGN-SYSTEM.md         # Design + accesibilitate (consolidat)
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   ├── ANTIVIRUS-SETUP.md
│   ├── CONTRIBUTING.md
│   ├── DOCKER-OPTIMIZATION.md
│   └── MOBILE_WORKFLOW_GUIDE.md
├── tasks/
│   ├── PLAN-FAZA3-DETALIAT.md   # Plan pas-cu-pas Faza 3
│   └── todo.md                 # Checklist live
├── CLAUDE.md                   # AI instructions
├── SPEC.md                     # Technical spec
├── README.md                   # This file
└── docker-compose.yml
```

---

## 🧪 Testare

### Backend (Vitest + Supertest)
```bash
cd backend
npm run test              # Run all tests
npm run test:coverage     # Coverage report (target ≥95%)
npm run test:watch       # Watch mode
```

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm run test              # Run all tests
npm run test:coverage     # Coverage report (target ≥85%)
```

### E2E (Playwright)
```bash
# Backend + Frontend trebuie să ruleze
npx playwright test
npx playwright show       # HTML report
```

---

## ✅ Checklist Setup Local

- [ ] Git clone
- [ ] docker-compose up --build (sau npm install pe ambele directoare)
- [ ] Login http://localhost:5173 cu dmin / dmin
- [ ] Inventar DM afișează 8 dispozitive
- [ ] Test CRUD: adaugă → editează → șterge (CASAT)
- [ ] Export CSV/XLSX/PDF funcționează
- [ ] Dark mode toggle funcționează
- [ ] Console: zero errors

---

## 📞 Contact & Support

**Pentru Bioinginer (utilizator):**
- Ghid utilizare: [GETTING-STARTED.md](GETTING-STARTED.md)
- Probleme: [CONTRIBUTING.md § Troubleshooting](docs/CONTRIBUTING.md)

**Pentru Developer:**
- Setup: [GETTING-STARTED.md](GETTING-STARTED.md)
- Patterns: [docs/2-DEVELOPER-GUIDE.md](docs/2-DEVELOPER-GUIDE.md)
- PR: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

**Pentru DevOps:**
- Docker: [docs/DOCKER-OPTIMIZATION.md](docs/DOCKER-OPTIMIZATION.md)
- Antivirus: [docs/ANTIVIRUS-SETUP.md](docs/ANTIVIRUS-SETUP.md)

---

## 📋 Roadmap

```
Faza 1   ✅ DONE              (2026-05-30) — Fundație + Auth
Faza 2   ✅ DONE              (2026-06-02) — Inventar DM
QW       ✅ DONE              (2026-06-05) — Module quick-win (Mentenanță basic, Incidente, AuditLogs)
Faza 3   ⏳ PLANNED 16 zile  (2026-06-05 — 2026-06-26) — Mentenanță completă (calendar, semnătură)
Faza 4   ⬜ PLANNED 2-3 săpt (2026-06-26 — 2026-07-12) — Documente
Faza 5   ⬜ PLANNED 2-3 săpt (2026-07-12 — 2026-07-28) — Procurement
Faza 6   ⬜ PLANNED 2-3 săpt (2026-07-28 — 2026-08-13) — Dashboard
Faza 7   ⬜ PLANNED 1-2 săpt (2026-08-13 — 2026-09-12) — QA & Go-Live
```

**MVP (Faza 1-2):** 2026-06-02 ✅ DONE
**Core (Faza 1-3):** 2026-06-26 (projected)
**Complete (Faza 1-8):** 2026-09-12 (projected)

---

**Următor:** Start Faza 3 — [Citește planul detaliat pas-cu-pas](tasks/PLAN-FAZA3-DETALIAT.md)
