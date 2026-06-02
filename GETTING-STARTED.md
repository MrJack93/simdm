# 🚀 Pornire Rapidă — SIMDM

Ghid rapid pentru a porni aplicația SIMDM pe calculatorul tău în **5-10 minute**.

---

## ✅ Condiții Preliminare

Înainte de a începe, asigură-te că ai instalat:

- **Node.js** v22 LTS — descarcă de la [nodejs.org](https://nodejs.org/) (sau v20+)
- **PostgreSQL** v14+ — descarcă de la [postgresql.org](https://www.postgresql.org/download/)
- **Git** — descarcă de la [git-scm.com](https://git-scm.com/)

**Verificare:**
```bash
node --version      # Ar trebui v22.x.x sau mai nou
npm --version       # Ar trebui 11.x.x
git --version       # Ar trebui 2.x.x
psql --version      # Ar trebui PostgreSQL 14+ (optional dacă folosești Docker)
```

---

## 🐳 Opțiunea 1: Cu Docker (Cea mai ușoară)

Dacă ai Docker instalat, aceasta e **cea mai rapidă și mai sigură** metodă.

```bash
# 1. Deschide terminal în folderul proiectului
cd simdm

# 2. Pornește containerele
docker-compose up --build

# Așteptă până apare:
# ✅ PostgreSQL: listening on port 5432
# ✅ Backend: Server SIMDM pornit pe http://localhost:3001
# ✅ Frontend: Local: http://localhost:5173
```

**Gata!** Deschide browserul la `http://localhost:5173` și loghează-te.

---

## 💻 Opțiunea 2: Local (Fără Docker)

Dacă preferi să rulezi pe mașina ta local.

### Pasul 1: Configurare PostgreSQL

#### **Pe Windows:**

1. Deschide **pgAdmin 4** (instalat cu PostgreSQL)
2. Conectează-te la server local cu:
   - Host: `localhost`
   - User: `postgres`
   - Password: (cea setată la instalare)

3. Creează baza de date:
   ```sql
   CREATE DATABASE simdm_db;
   CREATE USER simdm_user WITH PASSWORD 'simdm_secure_2024';
   GRANT ALL PRIVILEGES ON DATABASE simdm_db TO simdm_user;
   ```

4. Apoi:
   ```bash
   psql -U postgres -d simdm_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simdm_user;"
   ```

#### **Pe macOS/Linux:**
```bash
# Pornește PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Creează DB și user
createdb simdm_db
createuser simdm_user
psql -d simdm_db -c "ALTER USER simdm_user WITH PASSWORD 'simdm_secure_2024';"
psql -d simdm_db -c "GRANT ALL PRIVILEGES ON SCHEMA public TO simdm_user;"
```

### Pasul 2: Instalare dependențe

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed

# Frontend (în alt terminal)
cd frontend
npm install
```

### Pasul 3: Pornire server

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

**Deschide browserul:**
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/api/health`

---

## 🔑 Logare

Odată ce serverele sunt pornite:

1. Deschide `http://localhost:5173`
2. Introdu credențialele:
   - **Utilizator:** `admin`
   - **Parolă:** `admin`
3. Click **"Conectare"** → ✅ Ești logat!

✅ Ești în aplicație!

---

## 📚 Următorii Pași

| Sarcină | Fișier |
|---------|--------|
| **Cum să adaug un dispozitiv?** | [SPEC.md - Faza 2 Endpoints](SPEC.md#52-faza-2--inventar-dm-) |
| **Arhitectura proiectului** | [CLAUDE.md](CLAUDE.md) |
| **Ghid developer complet** | [docs/2-DEVELOPER-GUIDE.md](docs/2-DEVELOPER-GUIDE.md) |
| **Design & Accesibilitate** | [docs/1-DESIGN-AND-ACCESSIBILITY.md](docs/1-DESIGN-AND-ACCESSIBILITY.md) |

---

## 🐛 Probleme Frecvente

### ❌ Eroare: `connection refused on port 5432`
**Cauză:** PostgreSQL nu e pornit.
**Soluție:**
```bash
# Windows: Deschide pgAdmin 4 și asigură-te că serverul e verde
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### ❌ Eroare: `Cannot find module '@prisma/client'`
**Cauză:** Dependențele nu sunt instalate.
**Soluție:**
```bash
cd backend && npm install
npx prisma generate
```

### ❌ Eroare: `Credentiale incorecte` la login
**Cauză:** Credențialele introduse sunt greșite.
**Soluție:** Parolă implicit e `admin`, username `admin`. Dacă ai modificat-o, reia seed-ul:
```bash
cd backend
npx prisma db seed
```
Apoi relogin cu `admin` / `admin`.

### ❌ Frontend nu se conectează la backend
**Cauză:** Proxy Vite nu e configurat.
**Soluție:** Verifică că backend rulează pe port 3001 și frontend pe 5173. Reîncarcă pagina.

---

## 🚀 Gata pentru lucru!

Acum poți:
- ➕ Adăuga dispozitive medicale
- 🔧 Planifica mentenanță
- 📊 Raporta incidente
- 📄 Gestiona documente

Plăcere! Dacă ai întrebări, citește [CONTRIBUTING.md](docs/CONTRIBUTING.md).

---

**Versiunea:** v2.1 · **Data:** 2026-06-02 · **Status:** Faza 1-2 Completă + Docker Optimized ✅✅
