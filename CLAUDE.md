# CLAUDE.md — SIMDM

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
  Autentificarea este un login simplu cu username + parolă, credențialele fiind în `.env`.
- **RULEAZĂ LOCAL.** Hosting pe `localhost` sau rețea locală a spitalului. Fără cloud, fără deploy extern.
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

```
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
│   ├── .env                  # secrete — NICIODATĂ în Git
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
├── QUICK_REFERENCE.md        # cheat-sheet developer
└── README.md
```

---

## Comenzi

### Backend (din `backend/`)
```bash
npm run dev          # pornește serverul cu nodemon (port 3001)
npm start            # pornește serverul fără watch
npm run db:migrate   # prisma migrate dev (creează/aplică migrații)
npm run db:studio    # deschide Prisma Studio (GUI DB) la :5555
npm run db:seed      # rulează prisma/seed.js
```

### Frontend (din `frontend/`)
```bash
npm run dev          # pornește Vite (port 5173)
npm run build        # build pentru producție
```

### Rădăcina (din `simdm/`)
```bash
npm run dev          # pornește backend + frontend simultan (concurrently)
```

### După modificarea schemei Prisma
Rulează ÎNTOTDEAUNA aceste comenzi după ce editezi `schema.prisma`:
```bash
npx prisma migrate dev --name descriere_modificare
npx prisma generate
```

---

## Modelul de date (Prisma)

Tabelele de bază (Faza 1). `schema.prisma` este sursa de adevăr — citește-l mereu înainte de a lucra cu datele.

- **Section** — secțiile spitalului (Bloc Operator, ATI, Laborator etc.)
- **Device** — dispozitivele medicale (tabelul central). Câmp cheie: `inventoryNumber` (unic).
  Status posibil: `FUNCTIONAL`, `DEFECT`, `IN_REPARATIE`, `CASAT`.
  Clasă risc: `I`, `IIa`, `IIb`, `III`.
- **MaintenanceRecord** — intervenții de mentenanță. Tip: `MP` (preventivă) sau `MC` (corectivă).
- **Incident** — defecțiuni/incidente. Severitate: `MINOR`, `MODERAT`, `GRAV`, `CRITIC`.
- **Document** — documente atașate. Categorie: `PROCEDURA`, `FORMULAR`, `LEGISLATIE`, `MANUAL`, `CONTRACT`.

Relații: `Device` aparține unei `Section`; `MaintenanceRecord` și `Incident` aparțin unui `Device`.

---

## Design System și Accesibilitate

Înainte de Faza 2, **citește obligatoriu**:
- `docs/1-DESIGN-AND-ACCESSIBILITY.md` — Sistem de design + audit WCAG 2.1 AA, culori, componente
- `docs/2-DEVELOPER-GUIDE.md` — Ghid practic de implementare, cod JSX, checklist-uri

### Design Tokens (Tailwind)
- **Primary:** cyan-400 (#22d3ee) — heading-uri, accent, icoane active
- **Secondary:** gray-400 (#9ca3af) — label-uri, text helper
- **Background:** gray-950 (#030712) — fundal pagină
- **Suprafețe:** gray-900 (card), gray-800 (input), gray-600 (border)
- **Text principal:** white (#ffffff) — text normal
- **Eroare:** red-400 (#f87171); Succes: green-400 (#4ade80)

### Accesibilitate — Reguli Obligatorii
1. **Toți labelii sunt asociați** cu `htmlFor`/`id` — niciun input fără nume accesibil
2. **Focus vizibil obligatoriu** — `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900` pe ORICE element interactiv
3. **Ținte de atingere minimum 44px** — `min-h-[44px]` pe butoane și inputuri
4. **Erori și stări anunțate** — `role="alert"` pentru erori, `role="status"` pentru success/loading
5. **Semantic HTML** — `<main id="main">`, `<header>`, `<th scope="col">` în tabele
6. **Contrast WCAG AA** — text ≥ 4.5:1, UI components ≥ 3:1
7. **Diacritice consistente** — "Se încarcă", "Parolă", "Deconectare" (NU amesteca)
8. **Culoare NU e singura sursă** — status "defect" = text + icoană + culoare roșie

Testare: Lighthouse ≥95, axe DevTools zero critice, test tastatură, NVDA/Narrator.

---

## Convenții de cod

### Generale
- Cod și nume de variabile în **engleză**; texte vizibile utilizatorului în **limba română cu diacritice**.
- Folosește async/await, nu `.then()` lanțuri.
- Nume fișiere: camelCase pentru JS (`deviceController.js`), PascalCase pentru componente React (`DeviceList.jsx`).

### Backend
- Fiecare resursă are propriul fișier de rute în `src/routes/` (ex: `devices.js`, `maintenance.js`).
- Logica de business stă în `src/controllers/`, nu în fișierele de rute.
- TOATE rutele de date (exceptând `/api/auth/login` și `/api/health`) trec prin `authMiddleware`.
- Răspunsuri de eroare consistente: `res.status(cod).json({ error: 'mesaj în română' })`.
- Folosește instanța Prisma comună (un singur `PrismaClient` per proces), nu crea instanțe noi în fiecare fișier.
- Validează datele de intrare înainte de a scrie în DB.

### Frontend
- Folosește instanța `api` din `src/api/axios.js` pentru TOATE apelurile (are deja JWT interceptor).
- NU apela `http://localhost:3001` direct — folosește căile relative `/api/...` (proxy Vite).
- Tokenul JWT se păstrează în `localStorage` cu cheia `simdm_token`.
- Stilizare exclusiv cu clase TailwindCSS. Fără fișiere CSS separate, fără stiluri inline.
- Temă: fundal închis (gray-950/900), accent cyan-400/500, text gray-100/400.

#### CSS Utilities Reutilizabile (din `src/index.css`)
```css
.focusable        /* Focus ring standard pe orice element interactiv */
.focusable-danger /* Focus ring roșu pentru butoane danger */
.btn-primary      /* Button primary 44px, cyan, cu focus */
.btn-secondary    /* Button secondary, gray */
.btn-danger       /* Button danger, red, focusable-danger */
.input-base       /* Input standard 44px cu focus */
.label-base       /* Label standard în gray-400 */
.card-base        /* Card cu border și hover effect */
.alert-error      /* Alert box roșu cu role="alert" */
.alert-success    /* Alert box verde cu role="status" */
.alert-info       /* Alert box albastru cu role="status" */
```
Folosește aceste clase — nu duplica styling!

### Securitate
- `.env` nu intră niciodată în Git (e în `.gitignore`).
- Parolele se compară cu `bcrypt.compare`, nu în clar.
- Nu loga niciodată parole, hash-uri sau tokenuri JWT.
- Validare server-side pentru orice input — nu te baza doar pe validarea din frontend.

---

## Endpoint-uri API

### Faza 1 (existente)
```
GET  /api/health          # health check
POST /api/auth/login      # { username, password } -> { token, user }
POST /api/auth/verify     # { token } -> { valid, user }
```

### Faze viitoare (de implementat — nu există încă)
```
GET    /api/devices            # listă DM (cu filtre)
POST   /api/devices            # adaugă DM
GET    /api/devices/:id        # detalii DM
PUT    /api/devices/:id        # editează DM
DELETE /api/devices/:id        # șterge DM
GET    /api/maintenance        # intervenții mentenanță
POST   /api/maintenance        # adaugă intervenție
GET    /api/incidents          # incidente
POST   /api/incidents          # raportează incident
GET    /api/documents          # documente
GET    /api/sections           # secții spital
```
Toate rutele de mai sus trebuie protejate cu `authMiddleware`.

---

## Fluxul de lucru (faze)

Proiectul se construiește în 8 faze. Construiește în ordine, nu sări peste faze.

1. **Fundație și Infrastructură** — setup, DB, auth, server. *(completată)*
2. **Modul Inventar DM** — CRUD DM, tabel cu filtre, fișă DM, consumabile.
3. **Modul Mentenanță** — plan preventiv, corectivă (ticketing), verificări periodice.
4. **Documente și Proceduri** — DMS, generare formulare PDF, registru instruire.
5. **Vigilență și Incidente** — raportare incidente, notificări siguranță, casare.
6. **Procurare** — planificare, dare în exploatare (PIF).
7. **Dashboard și Raportare** — KPI, rapoarte lunare, export.
8. **Testare și Lansare** — QA, import date reale, go-live.

Abordare: construiește mai întâi un MVP funcțional (fazele 1–3) înainte de modulele complexe.

---

## Reguli importante pentru Claude Code

1. **Citește `schema.prisma` înainte de orice operație cu date** — este sursa de adevăr pentru modelul de date.
2. **Nu introduce roluri sau RBAC** — proiectul are un singur utilizator. Dacă vezi referințe la roluri, ignoră-le; e moștenire din planul inițial.
3. **Păstrează stiva simplă** — nu adăuga librării noi fără cerere explicită.
4. **Confirmă înainte de ștergeri** — nu rula `prisma migrate reset` sau comenzi distructive fără confirmare; ar șterge datele.
5. **După modificarea schemei** — rulează întotdeauna `prisma migrate dev` + `prisma generate`.
6. **Mesajele pentru utilizator în română**, codul în engleză.
7. **Referă-te la Ghid** — când un câmp sau formular corespunde unui Formular MDM din Ghid (ex: Formular Nr. 8 = Fișă DM), păstrează acea corespondență în cod și comentarii.
8. **Întreabă dacă ceva e neclar** despre domeniul medical sau cerințele Ghidului, în loc să presupui.

---

## Referințe domeniu

- **DM** = Dispozitiv Medical
- **MP** = Mentenanță Preventivă
- **MC** = Mentenanță Corectivă
- **PIF** = Punere În Funcțiune (dare în exploatare)
- **MDM** = Managementul Dispozitivelor Medicale
- **AMDM** = Agenția Medicamentului și Dispozitivelor Medicale (autoritatea din RM)
- **SIMDM** = Sistemul național; aplicația trebuie să fie compatibilă la export cu acesta
- **Ghidul** = Ghidul Bioinginerului, Ordinul MS nr. 889/2024 (documentul de referință al proiectului)
