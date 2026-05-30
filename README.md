# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Versiune:** 2.1 (Faza 2 completă + Redesign Clinical Precision 2.0)
**Status:** ✅ CRUD + Inventar + Redesign UI · Gata pentru Faza 3 (Mentenanță)
**Actualizat:** 2026-05-30

| Faza | Modul | Status | Commits |
|------|-------|--------|---------|
| **1** | Fundație (Docker, Auth, Schema) | ✅ Complet | fab7394, 450a5ea + ... |
| **2** | CRUD Device + Inventar Tabel | ✅ Complet | fab7394, 5663d9d, 454e2af |
| **3** | Mentenanță (MP/MC, ticketing) | ⬜ Planned | — |
| **4-8** | Documente, Incidente, KPI, QA | ⬜ Planned | — |

---

## Despre proiect

**SIMDM** este o aplicație web pentru gestionarea centralizată a dispozitivelor medicale (DM) conform [Ghidului Bioinginerului — Ordinul MS nr. 889/2024](https://www.ms.gov.md) (Republica Moldova).

- **Utilizator:** 1 bioinginer medical (utilizator unic)
- **Hosting:** localhost / rețea locală spital
- **Date gestionate:** inventar DM, mentenanță (preventivă/corectivă), incidente, documente

---

## Pornire rapidă

### Prerequisite
- Node.js v22 LTS
- PostgreSQL v16
- pgAdmin 4 (GUI bază de date)

### Instalare și configurare

#### **Opțiunea 1: Docker Compose (Recomandată) 🐳**
```bash
cd simdm
docker-compose up --build
```

Containerele se vor porni automat:
- PostgreSQL: port 5432
- Backend Express: port 3001
- Frontend Vite: port 5173

#### **Opțiunea 2: Local cu Node.js**
```bash
# 1. Backend
cd backend
npm install
# Completează .env cu DATABASE_URL, JWT_SECRET, credențiale admin
npx prisma migrate dev --name init
npm run db:seed
npm run dev

# 2. Frontend (alt terminal)
cd frontend
npm install
npm run dev

# 3. Prisma Studio (alt terminal) — GUI bază de date
cd backend
npm run db:studio
```

**Rezultat:**
- Frontend: http://localhost:5173 (React + Vite + Clinical Precision UI)
- Backend: http://localhost:3001 (Express API)
- Bază de date GUI: http://localhost:5555 (Prisma Studio)

**Login:**
- Utilizator: `bioinginer`
- Parolă: `parola`

**Testează:**
- ☀️/🌙 Dark/Light mode toggle (header)
- 🔍 Search cu autocomplete (Inventar)
- ✏️ Inline edit modal (click "Editare")
- 📝 Multi-step wizard (+ Adaugă DM)

---

## Documentație

| Document | Scop |
|----------|------|
| [CLAUDE.md](./CLAUDE.md) | Instrucțiuni pentru Claude Code — citit de AI |
| [SPEC.md](./SPEC.md) | Specificație Faza 1 + limite de responsabilitate |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Cheat-sheet developer — culori, componente, checklist |
| [docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md) | Sistem de design + reguli WCAG 2.1 AA |
| [docs/2-DEVELOPER-GUIDE.md](./docs/2-DEVELOPER-GUIDE.md) | Ghid practic de implementare + tipare de cod |
| [docs/3-AUDIT-LOG.md](./docs/3-AUDIT-LOG.md) | Jurnal audit accesibilitate Faza 1 (arhivă) |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Flux de contribuție pentru Faza 2+ |

---

## Stivă tehnologică

| Strat | Tehnologie | Note |
|-------|-----------|------|
| Frontend | React 19 + Vite 8 + TailwindCSS v4 | Clinical Precision 2.0: temă (9/10 închis), accent portocaliu #ffb597, dark/light toggle, multi-step forms |
| Backend | Node.js v22 + Express.js 5 | Port 3001 |
| Bază de date | PostgreSQL 16 | 10+ tabele (Prisma 7 multi-file schema) |
| ORM | Prisma 7 | Migrații versionizate, seed data |
| Auth | JWT + bcryptjs | Un singur utilizator, login cu hero section |
| HTTP | Axios | Interceptor JWT automat |
| State Management | TanStack Query v5 | Caching, sincronizare real-time |
| Forms | React Hook Form + Zod | Validare sigură tip-safe |

---

## Structura proiectului

```
simdm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # SURSA DE ADEVĂR — baza de date
│   │   ├── migrations/            # Istoric migrații
│   │   └── seed.js                # Date inițiale
│   ├── src/
│   │   ├── routes/auth.js         # POST /api/auth/login, /verify
│   │   ├── middleware/auth.js     # Validare JWT
│   │   └── index.js               # Server Express
│   ├── .env                        # NU în Git — completează local
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # (Faza 2+: componente reutilizabile)
│   │   ├── pages/Login.jsx        # Autentificare
│   │   ├── api/axios.js           # Instanță HTTP + interceptori
│   │   ├── App.jsx                # Router principal
│   │   └── main.jsx               # Entry point
│   ├── vite.config.js             # Proxy /api → backend
│   └── package.json
│
├── docs/                          # Documentație tehnică
│   ├── 1-DESIGN-AND-ACCESSIBILITY.md
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   └── CONTRIBUTING.md
│
├── CLAUDE.md                      # Instrucțiuni Claude Code
├── SPEC.md                        # Specificație faze
├── QUICK_REFERENCE.md             # Cheat-sheet
└── README.md                      # Acest fișier
```

---

## Faze de dezvoltare

| Fază | Modul | Status |
|------|-------|--------|
| 1 | Fundație și Infrastructură | Completat — auth, DB, login |
| 2 | Inventar DM | Următor — CRUD, tabel, filtre |
| 3 | Mentenanță | Planificat — plan preventiv, ticketing |
| 4 | Documente și Proceduri | Planificat — DMS, formulare PDF |
| 5 | Vigilență și Incidente | Planificat — raportare, notificări |
| 6 | Procurare | Planificat — PIF, planificare |
| 7 | Dashboard și Raportare | Planificat — KPI, export |
| 8 | QA și Lansare | Planificat — testare, go-live |

Fiecare fază construiește incremental. Start cu MVP (Fazele 1–3) înainte de complexitate.

---

## Sistem de design — Clinical Precision 2.0 🎨

SIMDM folosește **Clinical Precision 2.0**, o temă modernă cu accente portocalii și dark/light mode, optimizată pentru WCAG 2.1 AA și best practices 2025-2026.

### Culori principale — CSS Variables
| Rol | Dark Mode | Light Mode | Hex |
|-----|-----------|-----------|-----|
| **Accent principal** | `--color-accent` | Portocaliu | #ffb597 |
| **Fundal pagină** | `--color-bg-primary` | #0a0d0d | #f5f5f5 |
| **Suprafețe (card)** | `--color-bg-secondary` | #121414 | #ffffff |
| **Input** | `--color-bg-tertiary` | #1a1c1c | #f0f0f0 |
| **Text principal** | `--color-text-primary` | #e2e2e2 | #1a1a1a |
| **Text secundar** | `--color-text-secondary` | #dfc0b4 | #5a5a5a |
| **Eroare** | `--color-error` | #ffb4ab | #ffb4ab |
| **Succes** | `--color-success` | #4ade80 | #4ade80 |

### Caracteristici noi — Faza 2.1
✅ **Dark/Light mode toggle** — persistent în localStorage
✅ **Search cu autocomplete** — 5 sugestii live, keyboard support
✅ **Multi-step form wizard** — 6 pași pentru Device form
✅ **Inline edit modal** — editare rapidă în tabel
✅ **Status badges cu icoane** — accesibil pentru daltonici
✅ **Animații subtile** — 150-300ms transitions
✅ **Print stylesheet** — Ctrl+P → alb pe negru
✅ **Responsive complet** — card layout pe mobile

Detalii complete: [docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md)

---

## Accesibilitate (WCAG 2.1 AA) ♿

**Clinical Precision 2.0** e complet accesibil. Obligatoriu pentru orice componentă nouă:

1. ✅ Label-uri asociate cu `htmlFor`/`id` pe TOATE inputurile
2. ✅ Focus ring vizibil (portocaliu, 2px, offset) pe orice element interactiv
3. ✅ Dimensiuni minimum **44px** (butoane, inputuri, hit targets)
4. ✅ Erori anunțate cu `role="alert"` + `aria-describedby`
5. ✅ Contrast text **≥ 4.5:1** (AAA: 17.7:1 dark mode)
6. ✅ Status badges cu text + icoană (nu doar culoare — accesibil daltonici)
7. ✅ Semantic HTML: `<header>`, `<main>`, `<table>`, `<th scope>`
8. ✅ Keyboard navigation: Tab/Shift+Tab, Enter pe sugestii, Escape pe modal

### Cum să testezi
- **Tastatură:** Tab prin toți elementele interactive, fără trap-uri
- **Screen reader:** NVDA / Narrator citesc labels și erori corect
- **Lighthouse:** DevTools → Accessibility ≥ 95 puncte
- **axe DevTools:** 0 erori critice
- **Dark/Light mode:** Contrast ≥ 3:1 pe ambele teme

Audit complet: [docs/3-AUDIT-LOG.md](./docs/3-AUDIT-LOG.md)

---

## Convenții de cod

- **Variabile, funcții, clase:** engleză (camelCase JS, PascalCase React)
- **Texte UI, erori, mesaje:** română cu diacritice
- **Async/await** în loc de `.then()` lanțuri
- **Stilizare:** exclusiv Tailwind CSS, fără CSS separat

---

## Securitate

- Parole cu bcrypt (niciodată în clar)
- JWT cu expirare 30 zile
- CORS permis doar localhost:5173
- `.env` exclus din Git (protejează JWT_SECRET, DATABASE_URL)
- Validare server-side pentru orice input

---

## Depanare frecventă

**"Cannot find module"**
```bash
npm install
```

**"Database connection failed"**
```bash
# Verifică .env
# Testează conexiunea PostgreSQL
psql postgresql://user:pass@localhost:5432/simdm_db
```

**"Port 3001 already in use"** (PowerShell)
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## Resurse utile

- [Tailwind CSS](https://tailwindcss.com)
- [Prisma ORM](https://www.prisma.io)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Ghidul Bioinginerului (MS RM)](https://www.ms.gov.md)

---

## Istoric versiuni

- v1.0 — 2026-05-29: Faza 1 completă (auth, DB, login UI)

---

Gata să contribui? Citește [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) pentru fluxul Faza 2+.
