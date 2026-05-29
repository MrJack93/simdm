# Implementation Plan: SIMDM — Faza 1 Continuare (Pașii 1.2, 1.3, 1.4)

> Generat de `/plan` · 2026-05-29 · Suprascrie planul vechi din 28 mai (vechea Faza 1 fără User/Docker/refresh).

## Context

Faza 1.1 e gata: server Express 5, frontend React 19 + Vite 8 + Tailwind v4, pagină Login,
axios cu interceptor JWT și autentificare **bazată pe `.env`** (`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`).

Dar fundația de date **nu este materializată**:
- **Nu există nicio migrație** — `prisma migrate dev` nu a rulat niciodată; tabelele nu există în DB.
- Schema are doar 5 modele, **fără `User`** — autentificarea nu are autor pentru audit.
- Lipsesc Docker Compose, driver adapter, refresh tokens.

Acest plan duce Pașii 1.2–1.4 la 100% conform deciziei strategice „utilizator unic acum, extensibil mai
târziu": adăugăm un tabel `User` complet (cu `role`), păstrăm login single-user, aliniem la best
practices 2025–2026. **Rezultat:** DB în Docker, schema completă migrată, autentificare DB-backed cu
access + refresh tokens, login end-to-end funcțional, gata pentru Faza 2.

### Decizii confirmate cu utilizatorul
1. **PostgreSQL în Docker Compose** (Postgres 16) — nu instalare locală.
2. **Refresh token în cookie httpOnly** (access token scurt + refresh rotativ, revocabil).
3. **Schema completă acum**: User, Section, Device, Consumable, MaintenanceRecord, Incident, Document, AuditLog (+ RefreshToken).

### Adaptare la Prisma 7 (instalat: 7.8.0)
Argumentele inițiale folosesc sintaxă Prisma 6. Adaptăm la Prisma 7 (deja instalat):
- Schema multi-fișier e **GA** — **fără** `previewFeatures = ["prismaSchemaFolder"]`. Se face cu un **folder** `prisma/schema/`.
- `prisma.config.ts` există deja și ține `datasource.url` (Prisma 7) — păstrăm; blocul `datasource` declară doar `provider`.
- Driver adapter `@prisma/adapter-pg` la instanțierea `PrismaClient({ adapter })`.
- Generatorul rămâne `prisma-client-js` (cod CommonJS). **Risc:** dacă Prisma 7 îl respinge → comut pe `prisma-client` cu `output` explicit.

---

## Dependency Graph

```
docker-compose.yml (Postgres 16)
  └─ Prisma 7: @prisma/adapter-pg + pg, schema multi-fișier (8+1 modele)
       └─ migrate dev --name init  +  prisma generate
            └─ src/db.js (PrismaClient unic, cu pg adapter)
                 └─ seed.js (admin User + 8 secții + DM test)
                      └─ Auth backend (login / refresh / logout / me + RefreshToken + cookie-parser)
                           └─ Auth frontend (axios withCredentials + refresh-on-401, Login, App bootstrap)
                                └─ Verificare end-to-end
```

---

## Architecture Decisions

- **Schema multi-fișier** în `backend/prisma/schema/`:
  - `schema.prisma` → `generator` + `datasource`
  - `user.prisma` → `User`, `RefreshToken`, `Section`
  - `device.prisma` → `Device`, `Consumable`
  - `maintenance.prisma` → `MaintenanceRecord`, `Incident`
  - `document.prisma` → `Document`, `AuditLog`
- **Tokens:** access JWT scurt (`15m`, payload `{ sub, username, role }`, semnat cu `JWT_SECRET`) + refresh **opac** (`crypto.randomBytes`), stocat **hash-uit (sha256)** în `RefreshToken`, livrat ca cookie `httpOnly; SameSite=Lax; Secure=false în dev`. Refresh-ul rotește (revocă vechiul, emite unul nou).
- **PrismaClient unic** în `backend/src/db.js` (rute, middleware, seed) — conform CLAUDE.md.
- **Login rămâne single-user**: fără înregistrare, fără UI management useri, fără enforcement RBAC. `role` doar pentru extensibilitate + audit.
- **Admin user** creat de `seed.js` (upsert din `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`); login-ul citește din DB.

### Modele noi (câmpuri cheie)
- `User`: `id, username @unique, passwordHash, name?, role @default("ADMIN"), isActive @default(true), lastLoginAt?, timestamps`, relații `refreshTokens[]`, `auditLogs[]`.
- `RefreshToken`: `id, tokenHash @unique, userId→User (onDelete Cascade), expiresAt, revokedAt?, createdAt`.
- `Consumable`: `id, name, code? @unique, unit?, stock @default(0), minStock?, deviceId?→Device, timestamps`. Pe `Device` se adaugă `consumables Consumable[]`.
- `AuditLog`: `id, userId?→User, action, entity, entityId?, details Json?, ipAddress?, createdAt`.

### Variabile `.env` noi (necesită confirmare — boundaries SPEC)
`ACCESS_TOKEN_TTL="15m"`, `REFRESH_TOKEN_TTL_DAYS="30"`, `COOKIE_SECURE="false"`.
Se păstrează `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`. (Refresh opac — nu cere secret.)

---

## Task List (vezi `todo.md` pentru checklist detaliat)

| # | Task | Scope | Depinde |
|---|------|-------|---------|
| A1 | Docker Compose Postgres 16 | S | — |
| A2 | Dependențe Prisma 7 + driver adapter + cookie-parser | XS | — |
| A3 | Schema multi-fișier (8+1 modele) | M | A2 |
| **⛳** | **Checkpoint A** + confirmare înainte de migrație | — | A1–A3 |
| A4 | Prima migrație + generate + `src/db.js` | M | A1, A3 |
| B1 | Seed admin User + secții + DM test | S | A4 |
| **⛳** | **Checkpoint B** | — | B1 |
| C1 | Helpers tokens + RefreshToken | M | A4 |
| C2 | Rute auth (login/refresh/logout/me) + middleware + cookie-parser | M | C1, B1 |
| **⛳** | **Checkpoint C** | — | C2 |
| D1 | axios refresh-on-401 + Login + App bootstrap | M | C2 |
| E1 | Scripturi root + verificare end-to-end | S | D1 |
| **⛳** | **Checkpoint final** | — | E1 |

---

## Verificare (end-to-end)

1. `docker compose up -d` → DB healthy.
2. `cd backend && npx prisma migrate dev` → tabele; `npm run db:seed` → admin + secții + DM.
3. `npm run dev` (rădăcină) → backend :3001, frontend :5173.
4. `GET /api/health` → `{status:"ok"}`.
5. curl login → 200 `{accessToken,user}` + `Set-Cookie: refresh=...; HttpOnly`.
6. `GET /api/auth/me` cu Bearer → user; fără token → 401.
7. `POST /api/auth/refresh` cu cookie → nou access token; vechiul rotit.
8. Browser: login → reload (sesiune păstrată) → logout (cookie golit).
9. Parolă greșită → 401 `{error:"Credentiale incorecte"}`.
10. `git status` → `.env` NU apare.

---

## Riscuri & Mitigări

| Risc | Impact | Mitigare |
|------|--------|----------|
| `prisma-client-js` deprecat în Prisma 7 | Mediu | Dacă `generate` eșuează → generator `prisma-client` cu `output` explicit + actualizez importurile. Verific la A4. |
| Driver adapter `@prisma/adapter-pg` greșit configurat | Mediu | Izolat în `src/db.js`; test `$connect()` imediat după A4. |
| Cookie httpOnly pe `localhost` http (Secure) | Mic | `COOKIE_SECURE=false` dev; `SameSite=Lax`; `withCredentials` + CORS `credentials:true`. |
| Refresh-on-401 → buclă infinită | Mediu | Flag `_retry`; refresh o singură dată. |
| Migrație pe DB cu date | Mic | DB nou/gol; confirm înainte de orice comandă DB. |

## Open Questions
- `createdById` (autor) pe `MaintenanceRecord`/`Incident` acum sau în fazele 3/5? **Implicit: amân** — `AuditLog` acoperă auditul global în Faza 1.
