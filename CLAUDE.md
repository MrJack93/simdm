# CLAUDE.md — SIMDM
 
Acest fisier ofera context pentru Claude Code (VS Code) despre proiectul SIMDM.
Citeste-l complet inainte de a scrie sau modifica cod.
 
---
 
## Despre proiect
 
**SIMDM** = Sistem Informational de Management al Dispozitivelor Medicale.
 
Este o aplicatie web personala pentru un **bioinginer medical** dintr-un **spital privat**,
folosita pentru a gestiona dispozitivele medicale (DM) conform **Ghidului Bioinginerului
in domeniul dispozitivelor medicale** (Republica Moldova, Ordinul MS nr. 889 din 31.10.2024).
 
### Scop
Inlocuieste evidenta pe hartie / Excel cu o baza de date centralizata care acopera:
inventarul DM, mentenanta (preventiva si corectiva), incidentele, documentele si raportarea.
 
### Context critic
- **UTILIZATOR UNIC.** Aplicatia este folosita de o singura persoana (bioinginerul).
  NU implementa RBAC, roluri multiple, inregistrare sau gestiune de utilizatori.
  Autentificarea este un login simplu cu username + parola, credentialele fiind in `.env`.
- **RULEAZA LOCAL.** Hosting pe `localhost` sau retea locala a spitalului. Fara cloud, fara deploy extern.
- **DATE MEDICALE.** Datele sunt importante. Trateaza integritatea datelor cu seriozitate
  (validare, tranzactii unde e cazul, backup).
- **LIMBA.** Interfata, mesajele si comentariile pentru utilizator sunt in limba romana.
  Numele variabilelor si codul raman in engleza (conventie standard).
---
 
## Stiva tehnologica
 
| Strat | Tehnologie |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Baza de date | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| HTTP client | Axios |
| Routing frontend | react-router-dom |
| State/fetching | react-query (TanStack Query) |
 
NU adauga alte framework-uri sau librarii fara a fi cerute explicit. Pastreaza stiva simpla.
 
---
 
## Structura proiectului
 
```
simdm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # definitia bazei de date (sursa de adevar)
│   │   ├── migrations/       # migratiile generate de Prisma
│   │   └── seed.js           # date initiale (sectii spital etc.)
│   ├── src/
│   │   ├── routes/           # definirea endpoint-urilor (un fisier per resursa)
│   │   ├── controllers/      # logica de business
│   │   ├── middleware/       # auth.js, errorHandler.js, validare
│   │   └── index.js          # punctul de intrare al serverului
│   ├── scripts/              # utilitare (ex: generateHash.js)
│   ├── .env                  # secrete — NICIODATA in Git
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # componente UI reutilizabile
│   │   ├── pages/            # paginile aplicatiei (Login, Dashboard, Inventar...)
│   │   ├── hooks/            # custom React hooks
│   │   ├── api/              # axios.js + apeluri grupate per resursa
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js        # contine proxy /api -> localhost:3001
│   └── package.json
│
├── .gitignore
├── CLAUDE.md                 # acest fisier
└── README.md
```
 
---
 
## Comenzi
 
### Backend (din `backend/`)
```bash
npm run dev          # porneste serverul cu nodemon (port 3001)
npm start            # porneste serverul fara watch
npm run db:migrate   # prisma migrate dev (creeaza/aplica migratii)
npm run db:studio    # deschide Prisma Studio (GUI DB) la :5555
npm run db:seed      # ruleaza prisma/seed.js
```
 
### Frontend (din `frontend/`)
```bash
npm run dev          # porneste Vite (port 5173)
npm run build        # build pentru productie
```
 
### Radacina (din `simdm/`)
```bash
npm run dev          # porneste backend + frontend simultan (concurrently)
```
 
### Dupa modificarea schemei Prisma
Ruleaza INTOTDEAUNA aceste comenzi dupa ce editezi `schema.prisma`:
```bash
npx prisma migrate dev --name descriere_modificare
npx prisma generate
```
 
---
 
## Modelul de date (Prisma)
 
Tabelele de baza (Faza 1). `schema.prisma` este sursa de adevar — citeste-l mereu inainte de a lucra cu datele.
 
- **Section** — sectiile spitalului (Bloc Operator, ATI, Laborator etc.)
- **Device** — dispozitivele medicale (tabelul central). Camp cheie: `inventoryNumber` (unic).
  Status posibil: `FUNCTIONAL`, `DEFECT`, `IN_REPARATIE`, `CASAT`.
  Clasa risc: `I`, `IIa`, `IIb`, `III`.
- **MaintenanceRecord** — interventii de mentenanta. Tip: `MP` (preventiva) sau `MC` (corectiva).
- **Incident** — defectiuni/incidente. Severitate: `MINOR`, `MODERAT`, `GRAV`, `CRITIC`.
- **Document** — documente atasate. Categorie: `PROCEDURA`, `FORMULAR`, `LEGISLATIE`, `MANUAL`, `CONTRACT`.
Relatii: `Device` apartine unei `Section`; `MaintenanceRecord` si `Incident` apartin unui `Device`.
 
---
 
## Design System & Accesibilitate

Inainte de Faza 2, **citeste obligatoriu**:
- `AUDIT_ACCESIBILITATE.md` — WCAG 2.1 AA audit, top 3 priorități, reparații specifice
- `DESIGN_SYSTEM.md` — Design tokens, componente reutilizabile, culori verificate
- `IMPLEMENTATION_GUIDE.md` — Cod JSX practic, checklist-uri, testare

### Design Tokens (Tailwind)
- **Primary:** cyan-400 (#22d3ee) — heading-uri, accent, icoane active
- **Secondary:** gray-400 (#9ca3af) — label-uri, text helper
- **Background:** gray-950 (#030712) — fundal pagina
- **Surfaces:** gray-900 (text), gray-800 (input), gray-600 (border)
- **Text Primary:** white (#ffffff) — text normal
- **Error:** red-400 (#f87171); Success: green-400 (#4ade80)

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

## Conventii de cod
 
### Generale
- Cod si nume de variabile in **engleza**; texte vizibile utilizatorului in **limba romana cu diacritice**.
- Foloseste async/await, nu `.then()` lanturi.
- Nume fisiere: camelCase pentru JS (`deviceController.js`), PascalCase pentru componente React (`DeviceList.jsx`).
### Backend
- Fiecare resursa are propriul fisier de rute in `src/routes/` (ex: `devices.js`, `maintenance.js`).
- Logica de business sta in `src/controllers/`, nu in fisierele de rute.
- TOATE rutele de date (exceptand `/api/auth/login` si `/api/health`) trec prin `authMiddleware`.
- Raspunsuri de eroare consistente: `res.status(cod).json({ error: 'mesaj in romana' })`.
- Foloseste instanta Prisma comuna (un singur `PrismaClient` per proces), nu crea instante noi in fiecare fisier.
- Valideaza datele de intrare inainte de a scrie in DB.
### Frontend
- Foloseste instanta `api` din `src/api/axios.js` pentru TOATE apelurile (are deja JWT interceptor).
- NU apela `http://localhost:3001` direct — foloseste caile relative `/api/...` (proxy Vite).
- Tokenul JWT se pastreaza in `localStorage` cu cheia `simdm_token`.
- Stilizare exclusiv cu clase TailwindCSS. Fara fisiere CSS separate, fara stiluri inline.
- Tema: fundal inchis (gray-950/900), accent cyan-400/500, text gray-100/400.

#### CSS Utilities Reutilizabile (din `src/index.css`)
```css
.focusable        /* Focus ring standard pe orice interactive element */
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
Foloseste aceste clase — nu duplica styling!
### Securitate
- `.env` nu intra niciodata in Git (e in `.gitignore`).
- Parolele se compara cu `bcrypt.compare`, nu in clar.
- Nu loga niciodata parole, hash-uri sau tokenuri JWT.
- Validare server-side pentru orice input — nu te baza doar pe validarea din frontend.
---
 
## Endpoint-uri API
 
### Faza 1 (existente)
```
GET  /api/health          # health check
POST /api/auth/login      # { username, password } -> { token, user }
POST /api/auth/verify     # { token } -> { valid, user }
```
 
### Faze viitoare (de implementat — nu exista inca)
```
GET    /api/devices            # lista DM (cu filtre)
POST   /api/devices            # adauga DM
GET    /api/devices/:id        # detalii DM
PUT    /api/devices/:id        # editeaza DM
DELETE /api/devices/:id        # sterge DM
GET    /api/maintenance        # interventii mentenanta
POST   /api/maintenance        # adauga interventie
GET    /api/incidents          # incidente
POST   /api/incidents          # raporteaza incident
GET    /api/documents          # documente
GET    /api/sections           # sectii spital
```
Toate rutele de mai sus trebuie protejate cu `authMiddleware`.
 
---
 
## Fluxul de lucru (faze)
 
Proiectul se construieste in 8 faze. Construieste in ordine, nu sari peste faze.
 
1. **Fundatie & Infrastructura** — setup, DB, auth, server. *(in lucru / completata)*
2. **Modul Inventar DM** — CRUD DM, tabel cu filtre, fisa DM, consumabile.
3. **Modul Mentenanta** — plan preventiv, corectiva (ticketing), verificari periodice.
4. **Documente & Proceduri** — DMS, generare formulare PDF, registru instruire.
5. **Vigilenta & Incidente** — raportare incidente, notificari siguranta, casare.
6. **Procurare** — planificare, dare in exploatare (PIF).
7. **Dashboard & Raportare** — KPI, rapoarte lunare, export.
8. **Testare & Lansare** — QA, import date reale, go-live.
Abordare: construieste mai intai un MVP functional (fazele 1-3) inainte de modulele complexe.
 
---
 
## Reguli importante pentru Claude Code
 
1. **Citeste `schema.prisma` inainte de orice operatie cu date** — este sursa de adevar pentru modelul de date.
2. **Nu introduce roluri sau RBAC** — proiectul are un singur utilizator. Daca vezi referinte la roluri, ignora-le; e mostenire din planul initial.
3. **Pastreaza stiva simpla** — nu adauga librarii noi fara cerere explicita.
4. **Confirma inainte de stergeri** — nu rula `prisma migrate reset` sau comenzi distructive fara confirmare; ar sterge datele.
5. **Dupa modificarea schemei** — ruleaza intotdeauna `prisma migrate dev` + `prisma generate`.
6. **Mesajele pentru utilizator in romana**, codul in engleza.
7. **Refera-te la Ghid** — cand un camp sau formular corespunde unui Formular MDM din Ghid (ex: Formular Nr. 8 = Fisa DM), pastreaza acea corespondenta in cod si comentarii.
8. **Intreaba daca ceva e neclar** despre domeniul medical sau cerintele Ghidului, in loc sa presupui.
---
 
## Referinte domeniu
 
- **DM** = Dispozitiv Medical
- **MP** = Mentenanta Preventiva
- **MC** = Mentenanta Corectiva
- **PIF** = Punere In Functiune (dare in exploatare)
- **MDM** = Managementul Dispozitivelor Medicale
- **AMDM** = Agentia Medicamentului si Dispozitivelor Medicale (autoritatea din RM)
- **SIMDM** = Sistemul national; aplicatia trebuie sa fie compatibila la export cu acesta
- **Ghidul** = Ghidul Bioinginerului, Ordinul MS nr. 889/2024 (documentul de referinta al proiectului)
 