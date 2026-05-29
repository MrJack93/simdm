# SPEC: SIMDM — Faza 1: Fundație & Infrastructură

## Obiectiv

**Ce construim:** Fundația tehnică completă a SIMDM (Sistem Informațional de Management al Dispozitivelor Medicale).

**Pentru cine:** Bioinginer medical (utilizatorul unic) dintr-un spital privat.

**De ce:** Înlocuire a evidenței pe hârtie/Excel cu o aplicație centralizată care respectă Ghidul Bioinginerului (Ordinul MS nr. 889/2024) pentru gestionarea dispozitivelor medicale.

**Succes = când:**
- Frontend și backend pornesc simultan fără erori
- Login end-to-end funcțional (React → Express → PostgreSQL)
- Baza de date conține 5 tabele și date seed inițiale
- Toate endpoint-urile de autentificare testate și funcționale
- Proiectul este gata pentru Faza 2 (Modul Inventar DM)

---

## Stiva Tehnologică (Locked)

| Strat | Tehnologie | Versiune |
|-------|-----------|----------|
| **Frontend** | React + Vite + TailwindCSS | React 18, Vite, latest |
| **Backend** | Node.js + Express.js | v22 LTS, latest Express |
| **Baza de date** | PostgreSQL | v16 |
| **ORM** | Prisma | latest |
| **Autentificare** | JWT + bcryptjs | jsonwebtoken, bcryptjs |
| **HTTP Client** | Axios | latest |
| **Routing** | react-router-dom | latest |
| **State/Fetching** | react-query (TanStack Query) | latest |

**NU adaugi alte framework-uri sau librării fără cerere explicită.**

---

## Comenzi Principale

```bash
# RĂDĂCINA (simdm/)
npm run dev              # Pornește backend + frontend simultan (concurrently)

# BACKEND (simdm/backend/)
npm run dev              # Pornește serverul cu nodemon (port 3001, watch mode)
npm start                # Pornește serverul fără watch
npm run db:migrate       # Crează/aplică migrații Prisma
npm run db:studio        # Deschide Prisma Studio GUI (port 5555)
npm run db:seed          # Populează date inițiale

# FRONTEND (simdm/frontend/)
npm run dev              # Pornește Vite dev server (port 5173)
npm run build            # Build pentru producție

# UTILITĂȚI
node scripts/generateHash.js  # Generează hash bcrypt pentru parola admin
```

---

## Structura Proiectului

```
simdm/                           # Rădăcina proiectului
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Definiția bazei de date (SURSA DE ADEVĂR)
│   │   ├── migrations/          # Istoric migrații
│   │   └── seed.js              # Date inițiale (secții spital, dispozitiv test)
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.js          # POST /api/auth/login, POST /api/auth/verify
│   │   ├── middleware/
│   │   │   └── auth.js          # authMiddleware (verifică JWT)
│   │   ├── controllers/         # (Gol în Faza 1, completat în Faza 2+)
│   │   └── index.js             # Entry point server Express
│   ├── scripts/
│   │   └── generateHash.js      # Utilitate generare hash bcrypt
│   ├── .env                      # Variabile mediu (NU în Git!)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # (Gol în Faza 1, componente reutilizabile în Faza 2+)
│   │   ├── pages/
│   │   │   └── Login.jsx        # Pagina de login (Faza 1)
│   │   ├── hooks/               # (Gol în Faza 1)
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance cu JWT interceptor
│   │   ├── App.jsx              # Router principal
│   │   ├── main.jsx             # Entry point React
│   │   └── index.css            # Tailwind CSS imports
│   ├── vite.config.js           # Proxy /api → localhost:3001
│   ├── tailwind.config.js       # Konfigurare Tailwind
│   └── package.json
│
├── .gitignore                   # Node modules, .env, dist/, etc.
├── CLAUDE.md                    # Context proiect
├── SPEC.md                      # Acest fișier
├── README.md                    # Documentație publică
└── package.json                 # Scripts concurrently (root-level)
```

---

## Stil Cod

### Convenții Generale
- **Variabile, funcții, fișiere:** English (camelCase pentru JS, PascalCase pentru React)
- **Texte utilizator, UI, erori:** Română
- **Async/await:** preferință asupra `.then()` lanțuri
- **Fără comentarii** decât pentru logică non-evidentă

### Backend
```javascript
// ✅ BUN: Const, async/await, validare input
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username și parola sunt obligatorii' });
    }
    
    const isValid = await bcrypt.compare(password, hashStored);
    if (!isValid) return res.status(401).json({ error: 'Credentiale incorecte' });
    
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token, user: { username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare server' });
  }
});
```

### Frontend
```jsx
// ✅ BUN: Hooks, Tailwind classes, handleSubmit pattern
import { useState } from 'react';
import api from '../api/axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('simdm_token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError('Credentiale incorecte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-cyan-400 text-center mb-8">SIMDM</h1>
        {/* form... */}
      </div>
    </div>
  );
}
```

**Tema:** Fundal închis (gray-950/900), accent cyan-400/500, text gray-100/400. Toate stilurile via Tailwind, zero CSS separate.

---

## Strategie de Testare

### Testare Manuală (Faza 1 nu are unit tests automatizate)

| Step | Endpoint | Metoda | Body | Expected | Status |
|------|----------|--------|------|----------|--------|
| 1.4 | `/api/health` | GET | — | `{"status":"ok"}` | ✓ |
| 1.5 | `/api/auth/login` | POST | `{username, password}` | `{token, user}` + 200 | ✓ |
| 1.5 | `/api/auth/login` (bad pass) | POST | `{username, wrongPass}` | `{error: "..."}` + 401 | ✓ |
| 1.5 | `/api/auth/verify` | POST | `{token}` | `{valid: true, user}` + 200 | ✓ |
| 1.6 | Login page React | UI | navigare → Login | Form afișat, login funcțional | ✓ |
| 1.6 | Token storage | DevTools localStorage | după login | `simdm_token` prezent cu valoare JWT | ✓ |
| 1.5 | Seed data | pgAdmin | query DB | 8 secții + 1 dispozitiv test | ✓ |

**Instrumente:** Postman / Thunder Client (pentru API), pgAdmin (pentru DB), Browser DevTools (pentru localStorage/Network).

### Checklist Validare Completă (Faza 1 100%)
- [ ] Frontend pe `http://localhost:5173` — pagina Login vizibilă
- [ ] Backend pe `http://localhost:3001` — `/api/health` funcționează
- [ ] Login end-to-end: introduc credențiale → token salvat → redirecționare
- [ ] pgAdmin conectat → baza `simdm_db` cu 5 tabele și date seed
- [ ] `npm run dev` din rădăcină pornește ambele procese simultan
- [ ] `.env` NU este în Git (verifică `.gitignore`)

---

## Graniță (Boundaries)

### ✅ **ÎNTOTDEAUNA fă:**
- Citește `schema.prisma` înainte de orice operație cu date — e sursa de adevăr
- Rulează `npx prisma migrate dev` + `npx prisma generate` după orice schimbare schema
- Salvează token JWT în `localStorage` cu cheia `simdm_token`
- Folosește instanța axios din `src/api/axios.js` pentru orice apel — are JWT interceptor
- Validează input-uri server-side (nu te baza pe validare frontend)
- Parolele se compară cu `bcrypt.compare()`, NU în clar
- Mesajele pentru utilizator în ROMÂNĂ, cod în ENGLISH
- Confirmi inainte de comenzi distructive (migrations, resets, deletes)

### ❓ **ÎNTREABĂ ÎNAINTE:**
- Orice schimbare în `schema.prisma` (noi tabele, coloane, relații)
- Adăugarea altor framework-uri / librării (menține stiva simplă)
- Migrații de date sau importuri în BD
- Modificări în CORS, autentificare, JWT strategy
- Orice schimbare în `.env` (variabile noi)

### ❌ **NICIODATĂ:**
- Commit `.env` în Git — e în `.gitignore`
- Loga parole, hash-uri, JWT tokens în console / logs
- Șterge migrații Prisma existente fără confirmare
- Folosești `prisma migrate reset` fără backup și confirmare user
- Editezi fișierele `vendor/` sau `node_modules/`
- Schimbi hosting-ul / deployment strategy fără discuție (rămâne localhost / LAN)
- Adaugi roluri RBAC / gestionare multi-user — proiect single-user

---

## Criteriile de Succes (Acceptare Faza 1)

**Faza 1 este 100% COMPLETĂ când:**

### Infrastructură ✓
- [ ] Node.js v22 LTS, PostgreSQL v16, pgAdmin, Git, VS Code instalate
- [ ] Structura folder `simdm/backend/` + `simdm/frontend/` creată
- [ ] Git repository inițializat cu `.gitignore` corect (NU `.env`, NU `node_modules`)

### Baza de Date ✓
- [ ] Baza `simdm_db` creată în PostgreSQL
- [ ] Schema Prisma definită complet (5 tabele: Device, Section, MaintenanceRecord, Incident, Document)
- [ ] Prima migrație rulată: `npx prisma migrate dev --name init`
- [ ] Date seed: 8 secții spital + 1 dispozitiv test, vizibile în pgAdmin

### Backend ✓
- [ ] Server Express pornit pe `http://localhost:3001` fără erori
- [ ] `/api/health` returnează `{"status":"ok"}`
- [ ] `/api/auth/login` returnează JWT token la credențiale corecte
- [ ] `/api/auth/login` returnează eroare 401 la credențiale greșite
- [ ] `/api/auth/verify` verifică validitatea token-ului
- [ ] `authMiddleware` creat și gata pentru Faza 2
- [ ] CORS configurat corect: frontend (5173) ↔ backend (3001)

### Frontend ✓
- [ ] React + Vite pornit pe `http://localhost:5173` fără erori
- [ ] TailwindCSS configurat și funcțional (stiluri vizibile)
- [ ] Pagina Login afișată corect (dark theme: gray-950, cyan accent)
- [ ] Axios instance cu JWT interceptor creat în `src/api/axios.js`
- [ ] Proxy Vite configurat (`/api` → `localhost:3001`)
- [ ] Token JWT salvat în `localStorage['simdm_token']` după login

### Integrare & Testare ✓
- [ ] Frontend + Backend pornesc simultan: `npm run dev` din rădăcină
- [ ] Login end-to-end funcțional: React → Express → PostgreSQL
- [ ] Toate endpoint-urile testate în Postman / Thunder Client
- [ ] Database query-uri executate cu succes în pgAdmin
- [ ] Zero fisiere `.env` sau secrete în Git history

---

## Întrebări Deschise / Asumții

### Asumții Curente (Correct-mă dacă greșesc):
1. ✅ Utilizatorul e singurul, NU trebuie RBAC / multi-user
2. ✅ Hosting: localhost / LAN spital, NU cloud / deploy extern
3. ✅ Autentificare: simple JWT, NU OAuth / SAML / SSO
4. ✅ Database: PostgreSQL 16, NU alte BD
5. ✅ ORM: Prisma, NU Sequelize / TypeORM / raw SQL
6. ✅ Frontend: React 18 + Vite, NU Next.js / Remix
7. ✅ Stiluri: TailwindCSS, NU Bootstrap / Material UI / CSS-in-JS

### Întrebări pentru Tine (Înainte de Implementare):
1. **Datele existente:** Ai o bază de date Excel / CSV existentă cu dispozitive? (Relevant pentru seeding Faza 2)
2. **Securitate locală:** Este LAN-ul spitalului separatist / closed network, sau conectat la internet?
3. **Backup & Recovery:** Cine administrează backup-urile PostgreSQL? Sunt scripturile nece în repo?
4. **Browser support:** Doar Chrome/Firefox modern, sau trebuie IE11 / Safari vechi?

---

## Următoarele Faze (Context Planning)

După Faza 1 completă, urmează:

- **Faza 2:** Modul Inventar DM (CRUD, tabel cu filtre, fișă detale)
- **Faza 3:** Modul Mentenanță (Plan preventiv, corectiv, ticketing)
- **Faza 4:** Documente & Proceduri (DMS, formularePDF)
- **Faza 5:** Vigilență & Incidente (Raportare, notificări)
- **Faza 6:** Procurare (Planificare, PIF)
- **Faza 7:** Dashboard & Raportare (KPI, export)
- **Faza 8:** QA & Launch

Faza 1 nu trebuie să-și asumească construcția ulterioară — fiecare fază adaugă propria schema, endpoint-uri, UI.

---

## Cum Procedez?

1. **Aprobă** acest SPEC (sau corectează-mi asumțiile)
2. **Implementez** pas cu pas după document (1.1 → 1.2 → ... → 1.6)
3. **Verific** fiecare checkpoint din checklist-ul final
4. **Testez** manual endpoint-urile și UI
5. **Commit** la Git după fiecare pas major
6. **Raportez** progresul și blocaje

---

**Ești de acord cu acest spec? Sunt corecte asumțiile? Sau trebuie să modific ceva?**
