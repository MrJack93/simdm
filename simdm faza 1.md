# SIMDM — Faza 1: Fundatie & Infrastructura (100%)
> **Proiect personal:** Sistem Informational de Management al Dispozitivelor Medicale  
> **Utilizator:** 1 (bioinginer medical — tu)  
> **Hosting:** localhost / retea locala spital  
> **Durata estimata:** 2–3 saptamani
 
---
 
## Ce instalam inainte de orice
 
| Instrument | Versiune | Link download |
|------------|----------|---------------|
| Node.js | v22 LTS | https://nodejs.org |
| PostgreSQL | v16 | https://www.postgresql.org/download |
| pgAdmin 4 | ultima | https://www.pgadmin.org (GUI pentru DB) |
| Git | ultima | https://git-scm.com |
| VS Code | ultima | https://code.visualstudio.com |
| Postman | ultima | https://www.postman.com (testare API) |
 
**Extensii VS Code recomandate:**
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Thunder Client (alternativa Postman direct in VS Code)
- GitLens
---
 
## Structura finala a proiectului
 
```
simdm/
├── backend/                  ← Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     ← definitia bazei de date
│   │   └── migrations/       ← istoricul modificarilor DB
│   ├── src/
│   │   ├── routes/           ← endpoint-urile API
│   │   ├── controllers/      ← logica de business
│   │   ├── middleware/       ← auth, validare, erori
│   │   └── index.js          ← punctul de intrare server
│   ├── .env                  ← variabile de mediu (NU in Git!)
│   └── package.json
│
├── frontend/                 ← React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/       ← componente reutilizabile
│   │   ├── pages/            ← paginile aplicatiei
│   │   ├── hooks/            ← custom React hooks
│   │   ├── api/              ← apeluri catre backend
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```
 
---
 
## PAS 1.1 — Crearea structurii proiectului si Git
**Durata: 1 zi | Prioritate: CRITIC**
 
### 1.1.1 Initializare Git repository
 
```bash
# Creaza folderul principal
mkdir simdm
cd simdm
git init
 
# Creaza .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
*.log
dist/
build/
EOF
```
 
### 1.1.2 Creare backend (Node.js + Express)
 
```bash
mkdir backend
cd backend
npm init -y
 
# Instaleaza dependentele principale
npm install express prisma @prisma/client dotenv cors bcryptjs jsonwebtoken
 
# Instaleaza dependente de development
npm install -D nodemon
 
# Initializeaza Prisma
npx prisma init
```
 
Dupa `npx prisma init` se creeaza automat:
- `prisma/schema.prisma` — aici definesti tabelele
- `.env` — cu DATABASE_URL gol (trebuie completat)
### 1.1.3 Creare frontend (React + Vite)
 
```bash
# Din folderul simdm/
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
 
# Instaleaza TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
 
# Instaleaza librarii utile
npm install axios react-router-dom react-query
```
 
**Configureaza Tailwind** — in `tailwind.config.js`:
```js
content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"]
```
 
**Adauga in `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
 
### Rezultat Pas 1.1:
- [ ] Structura de foldere creata
- [ ] Git initializat cu .gitignore corect
- [ ] Backend: Node.js + Express functional pe port 3001
- [ ] Frontend: React + Vite functional pe port 5173
- [ ] Tailwind CSS configurat si functional
---
 
## PAS 1.2 — Configurarea PostgreSQL si conectarea cu Prisma
**Durata: 2 zile | Prioritate: CRITIC**
 
### 1.2.1 Creare baza de date in PostgreSQL
 
Deschide **pgAdmin 4** sau terminalul PostgreSQL:
 
```sql
-- In pgAdmin sau psql
CREATE DATABASE simdm_db;
CREATE USER simdm_user WITH ENCRYPTED PASSWORD 'parola_ta_sigura';
GRANT ALL PRIVILEGES ON DATABASE simdm_db TO simdm_user;
```
 
### 1.2.2 Configureaza conexiunea in `.env`
 
```env
# backend/.env
DATABASE_URL="postgresql://simdm_user:parola_ta_sigura@localhost:5432/simdm_db"
PORT=3001
JWT_SECRET="un_string_lung_si_random_minim_32_caractere"
JWT_EXPIRES_IN="30d"
NODE_ENV="development"
```
 
> **IMPORTANT:** Fisierul `.env` nu trebuie NICIODATA urcat pe Git.
 
### 1.2.3 Schema Prisma — Faza 1 (tabele de baza)
 
Editeaza `backend/prisma/schema.prisma`:
 
```prisma
generator client {
  provider = "prisma-client-js"
}
 
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
 
// Sectiile spitalului
model Section {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  floor     String?
  createdAt DateTime @default(now())
  devices   Device[]
}
 
// Dispozitivele medicale — tabelul central
model Device {
  id               Int       @id @default(autoincrement())
  inventoryNumber  String    @unique  // Nr. inventar
  serialNumber     String?            // Nr. serie
  name             String             // Denumire DM
  model            String?            // Model
  manufacturer     String?            // Producator
  yearMade         Int?               // Anul fabricatiei
  riskClass        String?            // Clasa de risc: I, IIa, IIb, III
  status           String    @default("FUNCTIONAL") // FUNCTIONAL, DEFECT, IN_REPARATIE, CASAT
  acquisitionDate  DateTime?          // Data PIF
  value            Decimal?           // Valoare
  notes            String?            // Observatii
  sectionId        Int?
  section          Section?  @relation(fields: [sectionId], references: [id])
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
 
  maintenanceRecords MaintenanceRecord[]
  incidents          Incident[]
}
 
// Inregistrari mentenanta
model MaintenanceRecord {
  id          Int      @id @default(autoincrement())
  deviceId    Int
  device      Device   @relation(fields: [deviceId], references: [id])
  type        String   // MP (preventiva) sau MC (corectiva)
  date        DateTime
  description String
  duration    Float?   // Ore lucrate
  cost        Decimal?
  notes       String?
  createdAt   DateTime @default(now())
}
 
// Incidente / defectiuni
model Incident {
  id          Int      @id @default(autoincrement())
  deviceId    Int
  device      Device   @relation(fields: [deviceId], references: [id])
  date        DateTime @default(now())
  description String
  severity    String   // MINOR, MODERAT, GRAV, CRITIC
  status      String   @default("DESCHIS") // DESCHIS, IN_LUCRU, REZOLVAT
  resolution  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
 
// Documente atasate
model Document {
  id         Int      @id @default(autoincrement())
  title      String
  category   String   // PROCEDURA, FORMULAR, LEGISLATIE, MANUAL, CONTRACT
  fileUrl    String?
  version    String?  @default("1.0")
  uploadedAt DateTime @default(now())
  notes      String?
}
```
 
### 1.2.4 Ruleaza prima migratie
 
```bash
cd backend
 
# Creeaza tabelele in baza de date
npx prisma migrate dev --name init
 
# Genereaza Prisma Client (se regenereaza automat la fiecare migratie)
npx prisma generate
 
# Verifica in pgAdmin — tabelele trebuie sa apara in simdm_db
```
 
### 1.2.5 Verifica conexiunea
 
Adauga in `backend/src/index.js`:
 
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL conectat cu succes!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Eroare conexiune DB:', error);
  }
}
 
testConnection();
```
 
### Rezultat Pas 1.2:
- [ ] Baza de date `simdm_db` creata in PostgreSQL
- [ ] `.env` configurat cu DATABASE_URL corecta
- [ ] Schema Prisma definita cu 5 tabele de baza
- [ ] Prima migratie rulata cu succes
- [ ] Conexiunea testata si functionala
---
 
## PAS 1.3 — Autentificare simpla (utilizator unic)
**Durata: 1 zi | Prioritate: CRITIC**
 
> **Nota:** Deoarece esti singurul utilizator, nu avem nevoie de RBAC sau inregistrare.  
> Implementam un **login simplu cu username + parola** si protectie JWT.  
> Parola este setata o singura data direct in `.env`.
 
### 1.3.1 Adauga credentialele in `.env`
 
```env
# Adauga in backend/.env
ADMIN_USERNAME="bioinginer"
ADMIN_PASSWORD_HASH=""  # Se completeaza la pasul urmator
```
 
### 1.3.2 Script pentru generarea hash-ului parolei
 
Creeaza `backend/scripts/generateHash.js`:
 
```javascript
const bcrypt = require('bcryptjs');
 
async function generateHash() {
  const parola = 'PAROLA_TA_SIGURA_AICI'; // Schimba cu parola dorita
  const hash = await bcrypt.hash(parola, 12);
  console.log('Hash parola:');
  console.log(hash);
  console.log('\nCopiaza aceasta valoare in .env la ADMIN_PASSWORD_HASH=');
}
 
generateHash();
```
 
```bash
node scripts/generateHash.js
# Copiaza hash-ul rezultat in .env la ADMIN_PASSWORD_HASH="$2b$12$..."
```
 
### 1.3.3 Ruta de autentificare
 
Creeaza `backend/src/routes/auth.js`:
 
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
 
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
 
    // Verifica username
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Credentiale incorecte' });
    }
 
    // Verifica parola
    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ error: 'Credentiale incorecte' });
    }
 
    // Genereaza token JWT
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
 
    res.json({
      token,
      user: { username, role: 'admin' }
    });
 
  } catch (error) {
    res.status(500).json({ error: 'Eroare server' });
  }
});
 
// POST /api/auth/verify — verifica daca tokenul e valid
router.post('/verify', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.json({ valid: false });
  }
});
 
module.exports = router;
```
 
### 1.3.4 Middleware de autentificare
 
Creeaza `backend/src/middleware/auth.js`:
 
```javascript
const jwt = require('jsonwebtoken');
 
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
 
  if (!token) {
    return res.status(401).json({ error: 'Token lipsa — acces interzis' });
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalid sau expirat' });
  }
}
 
module.exports = authMiddleware;
```
 
### 1.3.5 Pagina de Login in React
 
Creeaza `frontend/src/pages/Login.jsx`:
 
```jsx
import { useState } from 'react';
import axios from 'axios';
 
export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
 
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', {
        username,
        password,
      });
      localStorage.setItem('simdm_token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError('Username sau parola incorecta');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm shadow-2xl">
        <h1 className="text-2xl font-bold text-cyan-400 text-center mb-2">SIMDM</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Sistem Management Dispozitive Medicale
        </p>
 
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                         text-white focus:outline-none focus:border-cyan-500"
              placeholder="bioinginer"
              required
            />
          </div>
 
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Parola</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                         text-white focus:outline-none focus:border-cyan-500"
              placeholder="••••••••"
              required
            />
          </div>
 
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
 
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold
                       py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Se conecteaza...' : 'Conectare'}
          </button>
        </form>
      </div>
    </div>
  );
}
```
 
### Rezultat Pas 1.3:
- [ ] Hash parola generat si salvat in `.env`
- [ ] Ruta POST `/api/auth/login` functionala (testata in Postman)
- [ ] Ruta POST `/api/auth/verify` functionala
- [ ] Middleware `authMiddleware` creat si testat
- [ ] Pagina de Login in React functionala
- [ ] Token JWT salvat in `localStorage` dupa login
---
 
## PAS 1.4 — Server Express complet + CORS + structura API
**Durata: 1 zi | Prioritate: CRITIC**
 
### 1.4.1 Fisierul principal al serverului
 
Creeaza / editeaza `backend/src/index.js`:
 
```javascript
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
 
const authRoutes = require('./routes/auth');
 
const app  = express();
const PORT = process.env.PORT || 3001;
 
// Middleware global
app.use(cors({
  origin: 'http://localhost:5173', // adresa frontend React
  credentials: true,
}));
app.use(express.json());
 
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
 
// Rute
app.use('/api/auth', authRoutes);
// Urmatoarele rute se adauga in fazele urmatoare:
// app.use('/api/devices',      authMiddleware, deviceRoutes);
// app.use('/api/maintenance',  authMiddleware, maintenanceRoutes);
// app.use('/api/incidents',    authMiddleware, incidentRoutes);
// app.use('/api/documents',    authMiddleware, documentRoutes);
// app.use('/api/sections',     authMiddleware, sectionRoutes);
 
// Tratare erori globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Eroare interna de server' });
});
 
app.listen(PORT, () => {
  console.log(`\n✅ Server SIMDM pornit pe http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
```
 
### 1.4.2 Adauga script-uri in `backend/package.json`
 
```json
"scripts": {
  "dev":   "nodemon src/index.js",
  "start": "node src/index.js",
  "db:migrate": "prisma migrate dev",
  "db:studio":  "prisma studio",
  "db:seed":    "node prisma/seed.js"
}
```
 
### 1.4.3 Configureaza proxy in frontend
 
In `frontend/vite.config.js`:
 
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
 
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
```
 
> Dupa aceasta configurare poti folosi `/api/...` direct in React,  
> fara sa scrii `http://localhost:3001` de fiecare data.
 
### 1.4.4 Axios instance in frontend
 
Creeaza `frontend/src/api/axios.js`:
 
```javascript
import axios from 'axios';
 
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});
 
// Adauga automat token-ul JWT la fiecare request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('simdm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
// Redirect la login daca token expirat
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('simdm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
 
export default api;
```
 
### Rezultat Pas 1.4:
- [ ] Server Express pornit pe port 3001 fara erori
- [ ] `http://localhost:3001/api/health` returneaza `{"status":"ok"}`
- [ ] CORS configurat corect (frontend 5173 <--> backend 3001)
- [ ] Proxy Vite configurat (poti apela `/api/...` din frontend)
- [ ] Axios instance cu interceptori JWT functional
---
 
## PAS 1.5 — Date initiale (Seed) si testare completa
**Durata: 0.5 zile | Prioritate: IMPORTANT**
 
### 1.5.1 Seed cu date initiale
 
Creeaza `backend/prisma/seed.js`:
 
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
async function main() {
  console.log('Populare date initiale...');
 
  // Sectiile spitalului — adapteaza la spitalul tau
  const sections = await prisma.section.createMany({
    data: [
      { name: 'Bloc Operator', floor: 'Etaj 1' },
      { name: 'Terapie Intensiva (ATI)', floor: 'Etaj 1' },
      { name: 'Laborator', floor: 'Parter' },
      { name: 'Radiologie', floor: 'Parter' },
      { name: 'Cardiologie', floor: 'Etaj 2' },
      { name: 'Chirurgie', floor: 'Etaj 2' },
      { name: 'Medicina Interna', floor: 'Etaj 3' },
      { name: 'Urgente', floor: 'Parter' },
    ],
    skipDuplicates: true,
  });
 
  console.log(`✅ ${sections.count} sectii adaugate`);
 
  // Un dispozitiv de test
  const device = await prisma.device.upsert({
    where: { inventoryNumber: 'INV-001-TEST' },
    update: {},
    create: {
      inventoryNumber: 'INV-001-TEST',
      name: 'Monitor Semne Vitale',
      model: 'Patient Monitor PM-100',
      manufacturer: 'Philips',
      riskClass: 'IIb',
      status: 'FUNCTIONAL',
      section: { connect: { name: 'Terapie Intensiva (ATI)' } },
    },
  });
 
  console.log(`✅ Dispozitiv test adaugat: ${device.name}`);
  console.log('\nSeed complet!');
}
 
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```
 
```bash
# Ruleaza seed-ul
cd backend
node prisma/seed.js
```
 
### 1.5.2 Testare completa cu Postman / Thunder Client
 
Testeaza urmatoarele endpoint-uri:
 
```
1. GET  http://localhost:3001/api/health
   Expected: { "status": "ok" }
 
2. POST http://localhost:3001/api/auth/login
   Body: { "username": "bioinginer", "password": "PAROLA_TA" }
   Expected: { "token": "eyJ...", "user": {...} }
 
3. POST http://localhost:3001/api/auth/login (parola gresita)
   Expected: 401 { "error": "Credentiale incorecte" }
 
4. POST http://localhost:3001/api/auth/verify
   Body: { "token": "TOKEN_DE_LA_PASUL_2" }
   Expected: { "valid": true, "user": {...} }
```
 
### Rezultat Pas 1.5:
- [ ] Sectiile spitalului adaugate in baza de date
- [ ] Dispozitiv de test adaugat
- [ ] Toate endpoint-urile testate si functionale in Postman
- [ ] Eroarea 401 returnata corect la parola gresita
---
 
## PAS 1.6 — Rulare simultana frontend + backend
**Durata: 0.5 zile | Prioritate: IMPORTANT**
 
### 1.6.1 Instalare concurrently (optional, util)
 
```bash
# In folderul radacina simdm/
npm init -y
npm install -D concurrently
 
# Adauga in package.json radacina:
"scripts": {
  "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\""
}
```
 
Acum poti porni tot cu un singur comand din folderul `simdm/`:
```bash
npm run dev
```
 
### 1.6.2 Verifica ca totul functioneaza
 
1. Deschide `http://localhost:5173` — apare pagina de Login React
2. Introdu username: `bioinginer` si parola ta
3. Token JWT se salveaza in localStorage
4. Poti vedea in Network tab (DevTools) ca requestul a mers la `/api/auth/login`
5. Deschide `http://localhost:5432` in pgAdmin — vezi tabelele create
### Rezultat Pas 1.6:
- [ ] Frontend si backend pornesc simultan cu `npm run dev`
- [ ] Pagina de Login se afiseaza corect in browser
- [ ] Login functional end-to-end (React --> Express --> JWT)
- [ ] Baza de date vizibila in pgAdmin cu date seed
---
 
## Checklist final Faza 1 — 100%
 
### Infrastructura
- [ ] Node.js, PostgreSQL, pgAdmin, Git, VS Code instalate
- [ ] Structura proiect creata (`simdm/backend/` + `simdm/frontend/`)
- [ ] Git repository initializat cu `.gitignore` corect
### Baza de date
- [ ] Baza de date `simdm_db` creata in PostgreSQL
- [ ] Schema Prisma definita (5 tabele: Device, Section, MaintenanceRecord, Incident, Document)
- [ ] Prima migratie rulata cu succes
- [ ] Date seed adaugate (sectii + dispozitiv test)
- [ ] Baza de date vizibila si corecta in pgAdmin
### Backend
- [ ] Server Express pornit pe `http://localhost:3001`
- [ ] `/api/health` returneaza status ok
- [ ] `/api/auth/login` functioneaza (token JWT generat)
- [ ] `/api/auth/verify` functioneaza
- [ ] Middleware de autentificare JWT creat si testat
- [ ] CORS configurat corect
### Frontend
- [ ] React + Vite pornit pe `http://localhost:5173`
- [ ] TailwindCSS configurat si functional
- [ ] Pagina de Login afisata corect
- [ ] Axios instance cu JWT interceptor creat
- [ ] Proxy Vite catre backend configurat
### Rulare & Testare
- [ ] Frontend + Backend pornesc simultan cu un singur comand
- [ ] Login end-to-end functional (React --> Express --> PostgreSQL)
- [ ] Toate request-urile testate in Postman / Thunder Client
- [ ] Nu exista fisiere `.env` in Git
---
 
## Comanda de start zilnic
 
```bash
# Porneste tot sistemul SIMDM
cd simdm
npm run dev
 
# Sau separat:
cd backend && npm run dev   # Terminal 1 — port 3001
cd frontend && npm run dev  # Terminal 2 — port 5173
 
# Vizualizare baza de date (Prisma Studio — util la development)
cd backend
npx prisma studio            # Se deschide la http://localhost:5555
```
 
---