# GO-LIVE CHECKLIST — SIMDM

**Verifică fiecare item înainte de deploy pe rețeaua spitalului.**

---

## 1. Securitate

- [ ] `JWT_ACCESS_SECRET` — string random ≥64 caractere (nu placeholder)
- [ ] `JWT_REFRESH_SECRET` — string random ≥64 caractere (diferit de access)
- [ ] `COOKIE_SECURE=true` (obligatoriu pe HTTPS; `false` doar pe localhost HTTP)
- [ ] `COOKIE_DOMAIN` — setat la domeniul real (nu `localhost` în producție)
- [ ] `CORS_ORIGIN` — setat la originea reală a frontend-ului
- [ ] `NODE_ENV=production`
- [ ] `BCRYPT_ROUNDS=12` (sau mai mult)
- [ ] `CLAMAV_ENABLED=true` + ClamAV pornit și funcțional
- [ ] `ADMIN_PASSWORD_HASH` — hash real al parolei admin (nu „admin")
- [ ] Parola admin schimbată la prima logare (mustChangePassword=true)

## 2. Bază de date

- [ ] PostgreSQL 16 pornit
- [ ] `DATABASE_URL`指向 baza corectă
- [ ] Migrații aplicate: `npx prisma migrate deploy`
- [ ] Seed rulat: `npm run db:seed` (dacă e deploy nou)
- [ ] Backup inițial: `npm run db:backup`
- [ ] Backup automat programat (zilnic)

## 3. Backend

- [ ] `npm install` rulat (toate dependențele instalate)
- [ ] `npm start` rulează fără erori
- [ ] Health check: `GET /api/health` → `{"status":"ok"}`
- [ ] Login funcțional: `POST /api/auth/login`
- [ ] Rate limiting activ pe login

## 4. Frontend

- [ ] `npm install && npm run build` — build de producție generat
- [ ] Frontend servit prin reverse proxy (nginx/traefik) cu HTTPS
- [ ] `VITE_API_URL`指向 backend-ul real

## 5. Network

- [ ] HTTPS configurat (certificat valid)
- [ ] Reverse proxy configurat (nginx/traefik)
- [ ] Port 5173 (frontend) și 3001 (backend) nu sunt expuse direct
- [ ] Firewall: doar porturile necesare deschise

## 6. Monitoring

- [ ] Log-uri scrise în fișier (nu doar console)
- [ ] Backup zilnic verificat
- [ ] Uptime monitor (opțional)

## 7. Utilizator

- [ ] Parola admin schimbată din valoarea implicită
- [ ] mustChangePassword=false după prima logare
- [ ] Testare flux complet: login → inventar → mentenanță → raport

---

**Data verificării:** ____________
**Verificat de:** ____________
**Status:** ☐ GATA DE GO-LIVE
