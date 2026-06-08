# CLAUDE.md - SIMDM

Acest fișier oferă context pentru Claude Code (VS Code) despre proiectul SIMDM.
Citește-l complet înainte de a scrie sau modifica cod.

---

## Despre proiect

**SIMDM** = Sistem Informațional de Management al Dispozitivelor Medicale.

Este o aplicație web pentru **bioinginerul medical** din **instituții de medicină privată**,
folosită pentru a gestiona dispozitivele medicale (DM) conform **Ghidului Bioinginerului
în domeniul dispozitivelor medicale** (Republica Moldova, Ordinul MS nr. 889 din 31.10.2024).

**Viziune:** un SIMDM propriu pentru medicina privată — alternativă locală, independentă față de
SIMDM-ul național al AMDM (care deservește mai ales IMSP publice). Ghidul rămâne referința normativă.

### Scop
Înlocuiește evidența pe hârtie / Excel cu o bază de date centralizată care acoperă:
inventarul DM, mentenanța (preventivă și corectivă), incidentele, documentele și raportarea.

### Context critic
- **UTILIZATOR UNIC (MVP).** Momentan aplicația e folosită de o singură persoană (bioinginerul).
  NU implementa RBAC sau înregistrare de utilizatori în această fază. Login simplu username + parolă,
  credențiale în .env. *Notă:* schema are deja `enum UserRole` (ADMIN/BIOINGINER/MANAGER/MEDIC/VIEWER)
  — câmp vestigial, neutilizat acum; un eventual multi-user pentru clinici private se va decide explicit ulterior.
- **RULEAZĂ LOCAL.** Hosting pe localhost sau rețea locală a spitalului. Fără cloud, fără deploy extern.
- **DATE MEDICALE.** Datele sunt importante. Tratează integritatea datelor cu seriozitate
  (validare, tranzacții unde e cazul, backup).
- **LIMBA.** Interfața, mesajele și comentariile pentru utilizator sunt în limba română.
  Numele variabilelor și codul rămân în engleză (convenție standard).

---

## Stivă tehnologică

| Strat | Tehnologie |
|-------|------------|
| Frontend | React 19 + Vite 8 + TailwindCSS 4 |
| Backend | Node.js 22 LTS + Express 5.2 |
| Bază de date | PostgreSQL 16 |
| ORM | Prisma 7.8 |
| Auth | JWT + bcryptjs (12 rounds) |
| HTTP client | Axios 1.16 |
| Routing frontend | react-router-dom 7.1 |
| State/fetching | TanStack Query 5.1 |
| Validare | Zod (backend + frontend) |
| Testing | Vitest + React Testing Library + Playwright |
| Containerization | Docker Compose (PostgreSQL + Backend + Frontend) |

NU adăuga alte framework-uri sau librării fără a fi cerute explicit. Păstrează stiva simplă.

---

## Structura proiectului

\\\
simdm/
├── backend/
│   ├── prisma/
│   │   ├── schema/schema.prisma  # definiția bazei de date (SURSA DE ADEVĂR)
│   │   ├── migrations/       # migrațiile generate de Prisma
│   │   └── seed.js           # date inițiale (secții spital etc.)
│   ├── src/
│   │   ├── routes/           # definirea endpoint-urilor (un fișier per resursă)
│   │   ├── controllers/      # logica de business
│   │   ├── middleware/       # auth.js, errorHandler.js, validare
│   │   └── index.js          # punctul de intrare al serverului
│   ├── scripts/              # utilitare (ex: generateHash.js)
│   ├── .env                  # secrete - NICIODATĂ în Git
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # componente UI reutilizabile
│   │   ├── pages/            # paginile aplicației (Login, Dashboard, Inventar...)
│   │   ├── hooks/            # custom React hooks
│   │   ├── api/              # axios.js + apeluri grupate per resursă
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js        # conține proxy /api -> localhost:3001
│   └── package.json
│
├── docs/                     # documentație tehnică
│   ├── DESIGN-SYSTEM.md       # design + accesibilitate (consolidat)
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   ├── CONTRIBUTING.md
│   ├── ANTIVIRUS-SETUP.md
│   ├── DOCKER-OPTIMIZATION.md
│   └── MOBILE_WORKFLOW_GUIDE.md
│
├── .gitignore
├── CLAUDE.md                 # acest fișier
├── SPEC.md                   # specificație faze
├── README.md                 # overview
└── docker-compose.yml
\\\

---

## Faza 3: Mentenanță (ÎN LUCRU - START 2026-06-05)

> Faza 1-2 sunt complete și **auditate** (securitate + integritate date), remedierile aplicate.
> Plan pas-cu-pas complet: **[tasks/PLAN-FAZA3-DETALIAT.md](tasks/PLAN-FAZA3-DETALIAT.md)** (citește §0 — regulile obligatorii din lecțiile auditului).

**Durată:** 16 zile (3-4 săptămâni) | **Termin:** 2026-06-26

Implementează sistemul complet de mentenanță cu 5 module:
1. **Plan Mentenanță Preventivă** (4 zile) - Generator plan + calendar + Formular Nr. 5
2. **Execuție MPP** (3 zile) - Checklist + semnătură digitală + Formular Nr. 6
3. **Mentenanță Corectivă** (4 zile) - Ticketing + state machine + Formular Nr. 8
4. **Verificări Periodice** (3 zile) - Registru + metrologie + alerte cron
5. **Contracte Externe** (2 zile) - CRUD furnizori + rating + Formular Nr. 9

**Dependințe noi:**
- Frontend: react-big-calendar, date-fns, react-signature-canvas
- Backend: node-cron

**Vezi detalii complete:** [tasks/PLAN-FAZA3-DETALIAT.md](tasks/PLAN-FAZA3-DETALIAT.md) | [tasks/todo.md](tasks/todo.md) | [SPEC.md § 15](SPEC.md)

---

## Reguli de cod

1. **Citește `backend/prisma/schema/schema.prisma` înainte de orice operație cu date** - sursa de adevăr
2. **NU introduce roluri sau RBAC** - MVP cu un singur utilizator (vezi nota despre UserRole mai sus)
3. **Păstrează stiva simplă** - nu adăuga librării noi fără cerere explicită
4. **Confirmă înainte de ștergeri** - nu rula `prisma migrate reset` fără confirmare
5. **După modificarea schemei** - rulează `npx prisma migrate dev` + `npx prisma generate`
6. **Mesajele pentru utilizator în română**, codul în engleză
7. **Referință la Ghid** - când un câmp corespunde unui Formular MDM, păstrează acea corespondență

### Reguli de securitate/integritate (din auditul Fazei 1-2 — OBLIGATORII pentru cod nou)

8. **`req.user.sub`** pentru id-ul utilizatorului din JWT (NU `req.user.id` — nu există în token)
9. **Validare id cu Zod** (`z.coerce.number().int().positive()`) → 400 la id invalid, nu 500
10. **`prisma.$transaction([...])`** pentru operații + audit log (atomicitate)
11. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null)
12. **Secrete reale în .env** (niciodată valori placeholder); fișiere servite autentificat, nu static public
13. **Export CSV** cu `escapeCSVField` (anti formula-injection)

---

**Următor:** Citire [README.md](README.md) pentru overview
