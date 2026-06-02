# CLAUDE.md - SIMDM

Acest fișier oferă context pentru Claude Code (VS Code) despre proiectul SIMDM.
Citește-l complet înainte de a scrie sau modifica cod.

---

## Despre proiect

**SIMDM** = Sistem Informațional de Management al Dispozitivelor Medicale.

Este o aplicație web personală pentru un **bioinginer medical** dintr-un **spital privat**,
folosită pentru a gestiona dispozitivele medicale (DM) conform **Ghidului Bioinginerului
în domeniul dispozitivelor medicale** (Republica Moldova, Ordinul MS nr. 889 din 31.10.2024).

### Scop
Înlocuiește evidența pe hârtie / Excel cu o bază de date centralizată care acoperă:
inventarul DM, mentenanța (preventivă și corectivă), incidentele, documentele și raportarea.

### Context critic
- **UTILIZATOR UNIC.** Aplicația este folosită de o singură persoană (bioinginerul).
  NU implementa RBAC, roluri multiple, înregistrare sau gestiune de utilizatori.
  Autentificarea este un login simplu cu username + parolă, credențialele fiind în .env.
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
│   │   ├── schema.prisma     # definiția bazei de date (sursa de adevăr)
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
│   ├── 1-DESIGN-AND-ACCESSIBILITY.md
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   └── CONTRIBUTING.md
│
├── .gitignore
├── CLAUDE.md                 # acest fișier
├── SPEC.md                   # specificație faze
├── README.md                 # overview
└── docker-compose.yml
\\\

---

## Faza 3: Mentenanță (PLANNED - START 2026-06-05)

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

**Vezi detalii complete:** [tasks/plan.md](tasks/plan.md) | [tasks/todo.md](tasks/todo.md) | [SPEC.md § 15](SPEC.md)

---

## Reguli de cod

1. **Citește schema.prisma înainte de orice operație cu date** - este sursa de adevăr
2. **NU introduce roluri sau RBAC** - proiectul are un singur utilizator
3. **Păstrează stiva simplă** - nu adăuga librării noi fără cerere explicită
4. **Confirmă înainte de ștergeri** - nu rula prisma migrate reset fără confirmare
5. **După modificarea schemei** - rulează 
px prisma migrate dev + 
px prisma generate
6. **Mesajele pentru utilizator în română**, codul în engleză
7. **Referință la Ghid** - când un câmp corespunde unui Formular MDM, păstrează acea corespondență

---

**Următor:** Citire [README.md](README.md) pentru overview
