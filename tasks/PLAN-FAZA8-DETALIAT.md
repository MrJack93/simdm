# Plan Detaliat — Faza 8: Dashboard KPI, Hardening & Go-Live

**Versiune:** 1.0 · **Creat:** 2026-06-29 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Durată estimată:** 7–9 zile lucrătoare (3 module) · **Scop:** finalizarea pentru producție — dashboard de indicatori, întărirea securității de deploy și pregătirea de go-live.

> **Audit care a generat acest plan (stare reală verificată):**
> - **Dashboard:** `frontend/src/pages/Dashboard.jsx` există dar e minimal — afișează doar 5 contoare de status DM, calculate **client-side** din `useDevices`. NU există endpoint agregat (`/api/dashboard`), nici indicatori din mentenanță/verificări/incidente/documente/contracte.
> - **Hardening — DEJA FĂCUT:** `app.set('trust proxy', 1)` ✅, `express.json({ limit: '25mb' })` ✅, `CLAMAV_ENABLED=true` ✅, `ADMIN_PASSWORD_HASH` = hash real (nu „admin") ✅.
> - **Hardening — RĂMAS:** `COOKIE_SECURE="false"` (trebuie `true` pe HTTPS), **fără flag de schimbare obligatorie a parolei la prima logare**, **fără script de backup/restore**, fără checklist de producție.
> - **Toate fazele 1–7** sunt implementate; Capitolele 2 și 3 din Ghid sunt acoperite integral. Faza 8 nu adaugă funcționalitate normativă nouă — pregătește sistemul pentru utilizare reală.

---

## 0. Reguli obligatorii (din lecțiile auditelor 1–7)

1. **`req.user.sub`** pentru id utilizator (NU `req.user.id`).
2. **Validare cu Zod** pe query/body unde e cazul → 400 la input invalid.
3. **`prisma.$transaction([...])`** pentru orice operație + audit log (atomic).
4. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null).
5. **Mesaje utilizator în română**, cod în engleză.
6. **Servire fișiere autentificată**; **export CSV** cu `escapeCSVField`.
7. **Token-uri DESIGN.md** pe tot UI nou (fără hex hardcodat, dark mode parity, empty/skeleton).
8. **Teste** per funcție nouă (țintă ≥90%); un test verifică `audit_logs.userId` ne-null pe operațiile noi.
9. Fără librării noi (pdfkit, zod, recharts dacă există deja; altfel grafice simple cu SVG/CSS — confirmă înainte).

---

## 1. MODULUL A — Dashboard KPI (3–4 zile)

**Scop:** un singur ecran cu starea reală a parcului de DM și a activității D/SIBM, agregat eficient pe backend (NU 10 fetch-uri separate în frontend).

### 1.1 Backend — `backend/src/routes/dashboard.js` (montat cu `authMiddleware`)
- **GET `/api/dashboard/summary`** — un singur răspuns agregat, calculat cu `prisma.$transaction([...])` de `count`/`aggregate` paralele:
  - **DM pe status:** FUNCTIONAL / IN_REPARATIE / DEFECT / CASAT / CONSERVAT / IMPRUMUTAT / REZERVA + total.
  - **DM pe clasă de risc** (I/IIa/IIb/III).
  - **Mentenanță:** ocurențe MPP scadente (≤7 zile) și depășite (din `mpp_occurrences` neefectuate).
  - **Verificări:** câte expiră în 30 zile / expirate / neconforme (din `verifications` + `devices.nextVerificationAt`).
  - **Incidente:** deschise / raportate la AMDM.
  - **Tichete corective:** deschise / în lucru.
  - **Documente:** câte expiră în 30 zile (din `documents.validUntil`).
  - **Contracte:** câte expiră în 30 zile (din `service_contracts.endDate`).
  - **Consumabile:** sub stoc minim.
  - Răspuns structurat `{ devices:{...}, maintenance:{...}, verifications:{...}, incidents:{...}, tickets:{...}, documents:{...}, contracts:{...}, consumables:{...} }`.
- **GET `/api/dashboard/cost-summary?year=YYYY`** (opțional, reutilizează logica din `serviceContracts`/`repair_tickets`): cost intern (reparații) vs extern (contracte) pe anul curent.
- Read-only → fără tranzacții de scriere/audit (corect, ca la `activityReport`).

### 1.2 Frontend — `frontend/src/pages/Dashboard.jsx` (rescriere)
- **Carduri KPI** (reutilizează `StatCard`): total DM, funcționale, defecte, în reparație + un rând nou cu „MPP scadente", „Verificări expirate", „Tichete deschise", „Documente/Contracte ce expiră" — fiecare card linkează către pagina filtrată corespunzătoare.
- **Widget alerte** (reutilizează `AlertsWidget`): listă acționabilă a lucrurilor scadente (MPP, verificări, contracte, documente) cu link direct.
- **Grafice** (dacă `recharts` e deja instalat — verifică în `package.json`; altfel bare CSS simple): DM pe status (donut), cost intern vs extern (bar).
- Înlocuiește calculul client-side actual cu un singur apel `useDashboard` → `GET /api/dashboard/summary` (skeleton la loading, empty/error states).
- Token-uri DESIGN.md, dark mode parity.

### 1.3 Teste
`dashboard.test.js` ≥6: summary întoarce toate secțiunile; numerele se potrivesc cu un set seed; clasificarea „scadent/expirat" corectă (mock dată); query invalid → 400; fără token → 401.

---

## 2. MODULUL B — Hardening Go-Live (2 zile)

**Scop:** închiderea ultimelor item-uri de securitate pentru deploy real pe rețeaua spitalului.

### 2.1 Schimbare obligatorie a parolei la prima logare
- Schema: adaugă pe `users` câmpul `mustChangePassword Boolean @default(false)`. Seed-ul setează `true` pentru admin (migrare `add_must_change_password`).
- Backend: la `GET /api/auth/me` include `mustChangePassword`; după `change-password` reușit → setează `false` (în tranzacția existentă).
- Frontend: dacă `user.mustChangePassword === true`, redirect forțat la `/settings` (sau un modal blocant) până la schimbarea parolei. Token-uri DESIGN.md.

### 2.2 COOKIE_SECURE pentru HTTPS
- `.env.example` + `GETTING-STARTED.md`: documentează `COOKIE_SECURE=true` obligatoriu la deploy pe HTTPS; păstrează `false` doar pentru localhost HTTP. (Codul citește deja `process.env.COOKIE_SECURE` — nicio modificare de cod.)

### 2.3 Backup & Restore
- Script nou `backend/scripts/backup.js` (sau `.sh`): `pg_dump` al bazei → fișier cu timestamp în `backups/`; păstrează ultimele N (rotație).
- Script `backend/scripts/restore.js`: restore dintr-un fișier de backup (cu confirmare explicită, ca să nu suprascrie accidental).
- `package.json`: script-uri `db:backup` și `db:restore`.
- (Opțional) `scheduled-task` zilnic de backup, dacă rulează ca serviciu.
- Documentație în `docs/` (secțiune backup/recovery).

### 2.4 Checklist de producție
- `docs/GO-LIVE-CHECKLIST.md`: secrete JWT reale, `COOKIE_SECURE=true`, `CLAMAV_ENABLED=true` + ClamAV pornit, `NODE_ENV=production`, CORS_ORIGIN corect, backup programat, parolă admin schimbată, HTTPS/reverse-proxy, migrări aplicate.

### 2.5 Teste
- `auth` test: după `change-password`, `mustChangePassword` devine `false`; `GET /me` îl include.
- (Backup-ul se testează manual/integrare — nu necesită PostgreSQL în CI.)

---

## 3. MODULUL C — QA final & Go-Live (2–3 zile)

**Scop:** verificare finală end-to-end și import date reale.

### 3.1 Coverage gate la 90%
- Ridică pragurile din `backend/vitest.config.js` și `frontend/vitest.config.js` la 90 (statements/branches/functions/lines), adaugă testele lipsă până trec. (Auditul anterior a semnalat că backend avea praguri la 72.)

### 3.2 E2E smoke complet (Playwright)
- Scenariu end-to-end al ciclului de viață: login → procurare (Formular Nr.1) → dare în exploatare (Formular Nr.4) → apare în inventar → generează plan MPP → execută MPP → raportează defecțiune (jurnal gardă) → tichet corectiv → verificare periodică → casare (Formular Nr.10) → raport de activitate. Verifică și descărcarea câtorva PDF-uri (diacritice).

### 3.3 Import date reale
- Reutilizează importul existent (`annualInventory/import-fixed-assets` sau `devices`) pentru încărcarea inventarului real al clinicii; documentează formatul CSV/XLSX așteptat.

### 3.4 Security review final
- Re-rulează regulile §0 pe tot codul (grep `req.user.id`, endpoint-uri fără `authMiddleware`, hex hardcodat în UI).
- Confirmă servirea autentificată a tuturor fișierelor; rate-limiting pe login + export.

---

## 4. Definiția lui „Faza 8 = 100%"
- [ ] `GET /api/dashboard/summary` agregat + Dashboard rescris cu KPI/alerte/grafice (un singur apel).
- [ ] `mustChangePassword` pe users + flux forțat de schimbare la prima logare.
- [ ] `COOKIE_SECURE=true` documentat pentru HTTPS; `GO-LIVE-CHECKLIST.md` complet.
- [ ] Scripturi `db:backup` / `db:restore` funcționale + documentate.
- [ ] Coverage ≥90% blocat în config pe backend ȘI frontend.
- [ ] E2E smoke al ciclului complet de viață trece.
- [ ] Import date reale documentat și testat.
- [ ] Security review final fără probleme (§0 respectat peste tot).
- [ ] README/INDEX/todo actualizate (Faza 8 → DONE; proiect → Production Ready).

---

## 5. Ordine de implementare
1. Modul A — Dashboard KPI (cea mai vizibilă valoare; agregare backend + rescriere frontend).
2. Modul B — Hardening (mustChangePassword, backup, checklist) — necesar înainte de orice deploy real.
3. Modul C — QA final (coverage 90, E2E, import, security review) — ultimul, validează totul.

---

**Notă:** Faza 8 NU mai adaugă formulare/proceduri din Ghid (toate Nr. 1–12 și MDM Nr. 1–10 relevante sunt acoperite în Fazele 1–7). Este faza de „producție-ready": vizibilitate (dashboard), siguranță (hardening) și încredere (QA + backup). La final, SIMDM e gata de utilizare reală de către bioinginer în clinica privată.
