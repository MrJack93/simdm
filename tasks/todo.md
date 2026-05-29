# SIMDM — Faza 1 Continuare (1.2–1.4) — TODO Checklist

> Generat de `/plan` · 2026-05-29. Vezi `tasks/plan.md` pentru context complet.
> Stiva reală: Prisma **7.8**, Express 5, React 19, Vite 8, Tailwind v4.

## Faza A — Infrastructură DB & fundație Prisma

- [ ] **A1 — Docker Compose Postgres 16**
  - `docker-compose.yml` (rădăcină): serviciu `db` postgres:16, volum persistent, port 5432, healthcheck
  - Env credențiale (user/parolă/db) + `DATABASE_URL` în `backend/.env` aliniat
  - ✅ Acceptanță: `docker compose up -d` → `docker compose ps` arată `healthy`
  - 🔍 Verificare: conectare psql / Prisma Studio reușește

- [ ] **A2 — Dependențe Prisma 7 + driver adapter**
  - `cd backend && npm i @prisma/adapter-pg pg cookie-parser`
  - ✅ Acceptanță: prezente în `backend/package.json`
  - 🔍 Verificare: `node -e "require('@prisma/adapter-pg')"` fără eroare

- [ ] **A3 — Schema multi-fișier (8+1 modele)**
  - Creează `backend/prisma/schema/`: `schema.prisma` (generator+datasource), `user.prisma` (User, RefreshToken, Section), `device.prisma` (Device, Consumable), `maintenance.prisma` (MaintenanceRecord, Incident), `document.prisma` (Document, AuditLog)
  - Șterge vechiul `prisma/schema.prisma`; `prisma.config.ts` → `schema: "prisma/schema"`
  - ✅ Acceptanță: `npx prisma validate` trece; `npx prisma format` curat
  - 🔍 Verificare: `npx prisma validate`

### ⛳ Checkpoint A — CONFIRMARE UTILIZATOR înainte de migrație
- [ ] `docker compose up -d` → DB healthy
- [ ] `npx prisma validate` trece cu schema multi-fișier
- [ ] **Confirmare explicită înainte de prima comandă DB** (boundary SPEC)

- [ ] **A4 — Prima migrație + generate + client unic**
  - `npx prisma migrate dev --name init` + `npx prisma generate`
  - `backend/src/db.js`: `PrismaClient` unic cu `PrismaPg` adapter din `DATABASE_URL`
  - ✅ Acceptanță: migrație în `prisma/migrations/`; 9 tabele în Studio; `$connect()` ok
  - 🔍 Verificare: `npm run db:studio`

## Faza B — Seed cu admin user

- [ ] **B1 — Seed admin User + secții + DM test**
  - `prisma/seed.js` folosește `src/db.js`; upsert `User` din `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH` (role ADMIN); 8 secții + DM test
  - ✅ Acceptanță: `npm run db:seed` → 1 user, 8 secții, 1 DM; idempotent
  - 🔍 Verificare: Studio arată User + 8 secții

### ⛳ Checkpoint B
- [ ] Seed idempotent; admin user vizibil; parolă = hash bcrypt

## Faza C — Auth backend DB-backed cu refresh tokens

- [ ] **C1 — Helpers tokens + RefreshToken**
  - `backend/src/lib/tokens.js`: `signAccessToken`, `issueRefreshToken` (random+sha256→DB), `rotateRefreshToken`, `revokeRefreshToken`, cookie helpers
  - ✅ Acceptanță: creează/validează/rotește; refresh expirat/revocat respins

- [ ] **C2 — Rute auth + middleware + cookie-parser**
  - `src/routes/auth.js`: `POST /login` (DB lookup, bcrypt, lastLoginAt, cookie refresh, AuditLog LOGIN), `POST /refresh` (validează+rotește), `POST /logout` (revocă+golește, AuditLog LOGOUT), `GET /me` (înlocuiește `/verify`)
  - `src/middleware/auth.js`: verifică access token → `req.user = {id, username, role}`
  - `src/index.js`: adaugă `cookie-parser`
  - ✅ Acceptanță: login bun → 200+token+Set-Cookie; parolă greșită → 401; refresh fără cookie → 401; `/me` fără token → 401
  - 🔍 Verificare: secvență curl (login → /me → /refresh → /logout)

### ⛳ Checkpoint C
- [ ] Flux login→me→refresh→logout testat
- [ ] Refresh rotit (vechiul revocat) și revocabil
- [ ] Niciun secret/hash/token logat

## Faza D — Auth frontend

- [ ] **D1 — axios refresh-on-401 + Login + App bootstrap**
  - `src/api/axios.js`: `withCredentials:true`; access token în `localStorage['simdm_token']`; pe 401 → `POST /auth/refresh` o singură dată (flag `_retry`), reia requestul; eșec → curăță + redirect login
  - `src/pages/Login.jsx`: `api.post('/auth/login')`, stochează accessToken, `onLogin(user)`
  - `src/App.jsx`: la mount `/auth/refresh` → `/auth/me`; logout → `/auth/logout`
  - ✅ Acceptanță: login browser ok; reload păstrează sesiunea; logout o termină
  - 🔍 Verificare: DevTools (Set-Cookie pe login, /refresh pe reload, cookie httpOnly)

## Faza E — Integrare & verificare finală

- [ ] **E1 — Scripturi root + verificare end-to-end**
  - `package.json` rădăcină: `db:up`, `db:migrate`, `db:seed`
  - ✅ Acceptanță: checklist 1.2–1.4 integral; vezi `plan.md` § Verificare
  - 🔍 Verificare: `npm run dev` + flux complet; `git status` fără `.env`

### ⛳ Checkpoint final
- [ ] `docker compose up -d` + `npm run dev` pornesc tot
- [ ] Login end-to-end (React → Express → Postgres) cu refresh cookie
- [ ] 9 tabele cu date seed
- [ ] Review uman → gata de Faza 2
