# Prompt pentru CLI — rulare teste, remediere, acoperire >90%

> Copiază tot blocul de mai jos și dă-l agentului CLI în folderul proiectului `simdm`.

---

Lucrezi în proiectul **SIMDM** (folderul curent `simdm`). Stivă: backend Node.js 22 + Express 5 + Prisma 7 + PostgreSQL 16 + Vitest; frontend React 19 + Vite + Vitest + React Testing Library. Mesajele pentru utilizator sunt în română, codul în engleză.

## Obiectiv
1. Fă să **treacă toate testele** (backend + frontend).
2. Acolo unde un test pică, **decide corect** dacă greșeala e în test sau în codul esențial, și repară partea potrivită (vezi „Reguli de decizie").
3. Asigură **acoperire de cod >90%** la backend ȘI la frontend (statements/lines). Adaugă teste unde lipsește acoperirea.
4. La final, raportează: ce ai reparat, numărul de teste verzi și procentele de acoperire.

## Pași

### Backend (`backend/`)
1. `npm install`
2. Pornește baza de date de test: `docker-compose up -d postgres` (din rădăcina proiectului). Confirmă `DATABASE_URL` din `backend/.env`.
3. `npx prisma migrate deploy` apoi `npx prisma generate`.
4. Rulează `npm test`. Repară eșecurile.
5. Rulează `npm run test:coverage`. Dacă acoperirea < 90%, adaugă teste pentru rutele/ramurile neacoperite (țintă ≥90% lines + branches).

### Frontend (`frontend/`)
1. `npm install`
2. `npm test`. Repară eșecurile.
3. `npm run test:coverage`. Dacă < 90%, adaugă teste (componente, pagini, hooks neacoperite).
4. `npm run lint` — rezolvă erorile.

## Reguli de decizie (test vs cod esențial)
- Dacă testul verifică un **comportament corect** și codul îl încalcă → repară **codul**.
- Dacă testul verifică o **presupunere veche/greșită** (ex. mock care nu mai corespunde implementării) → repară **testul**.
- **Nu modifica comportamentul funcțional** doar ca să treacă un test slab. Nu șterge teste ca să „treci" — corectează-le.
- Păstrează convențiile: mesaje utilizator în română, `req.user.sub` pentru id-ul din JWT, validare cu Zod, `prisma.$transaction` pentru operație + audit log, audit log cu `userId` ne-null.
- **Nu adăuga librării noi** fără necesitate clară.

## Atenție — modificări recente care pot rupe teste-mock
Codul a fost actualizat recent; câteva teste mai vechi pot avea nevoie de ajustare ca să reflecte noul comportament:
- `routes/devices.js`: POST/PUT/PATCH/DELETE/upload împachetează acum **modificarea + audit log într-un `prisma.$transaction(async (tx) => …)`**. Testele care mock-uiau separat `prisma.devices.create` / `prisma.audit_logs.create` trebuie să mock-uiască `prisma.$transaction` (sau `tx.*`).
- `DELETE /api/devices/:id`: id invalid → **400**; dispozitiv inexistent → **404**; deja CASAT → **409** (înainte dădea 500/200).
- Validare id cu `idSchema` (Zod) pe rutele de devices → id ne-numeric → **400**, nu 500.
- Upload-ul stochează `fileUrl = /api/devices/file/<filename>` (nu `/uploads/devices/...`).
- `index.js`: `express.json({ limit: '25mb' })` + handler 413/400; `app.set('trust proxy', 1)`.
- Schemele Zod au `.max()` pe câmpurile base64 (`signature`, `engineerSignature`, `managerSignature`, `beforePhoto`, `afterPhoto`).
- `prisma/seed.js`: parola admin din `ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD` (env), fallback `admin` cu avertisment.

## Criterii de finalizare (raportează explicit fiecare)
- [ ] Backend: toate testele verzi (`npm test`).
- [ ] Frontend: toate testele verzi (`npm test`).
- [ ] Backend coverage ≥ 90% (lines).
- [ ] Frontend coverage ≥ 90% (lines).
- [ ] `npm run lint` curat (frontend).
- [ ] Rezumat scurt cu fișierele modificate și de ce.
