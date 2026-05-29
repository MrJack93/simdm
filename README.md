# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Versiune:** 1.0 (Faza 1 completă)
**Status:** Fundație gata pentru Faza 2
**Actualizat:** 2026-05-29

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
```bash
# 1. Backend
cd backend
npm install
# Completează .env cu DATABASE_URL, JWT_SECRET, credențiale admin
npx prisma migrate dev --name init
npm run db:seed

# 2. Frontend
cd ../frontend
npm install

# 3. Pornire simultană (din rădăcina proiectului)
cd ..
npm run dev
```

**Rezultat:**
- Frontend: http://localhost:5173 (React + Vite)
- Backend: http://localhost:3001 (Express API)
- Bază de date GUI: http://localhost:5555 (Prisma Studio)

Login cu username-ul din `.env` (implicit: `bioinginer`).

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
| Frontend | React 18 + Vite + TailwindCSS | Temă închisă, accent cyan |
| Backend | Node.js + Express.js | Port 3001 |
| Bază de date | PostgreSQL 16 | 5 tabele principale |
| ORM | Prisma | Migrații versionizate |
| Auth | JWT + bcryptjs | Un singur utilizator, login simplu |
| HTTP | Axios | Interceptor JWT automat |

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

## Sistem de design

SIMDM folosește o temă închisă cu accent cyan, optimizată pentru WCAG 2.1 AA.

### Culori principale (Tailwind)
| Rol | Clasă | Hex |
|-----|-------|-----|
| Accent principal | `text-cyan-400` | #22d3ee |
| Fundal pagină | `bg-gray-950` | #030712 |
| Suprafețe (card) | `bg-gray-900` | #111827 |
| Input | `bg-gray-800` | #1f2937 |
| Eroare | `text-red-400` | #f87171 |
| Succes | `text-green-400` | #4ade80 |

Detalii complete: [docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md)

---

## Accesibilitate (WCAG 2.1 AA)

Obligatoriu pentru ORICE componentă nouă:

1. Label-uri asociate cu `htmlFor`/`id`
2. Focus ring vizibil (cyan, 2px, offset)
3. Dimensiuni minimum 44px (butoane, inputuri)
4. Erori anunțate cu `role="alert"`
5. Contrast text ≥ 4.5:1

Cum să testezi:
- **Tastatură:** Tab + Shift+Tab, fără trap
- **Screen reader:** NVDA / Narrator — erori anunțate
- **Lighthouse:** DevTools → Accessibility ≥ 95 puncte
- **axe DevTools:** 0 erori critice

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
