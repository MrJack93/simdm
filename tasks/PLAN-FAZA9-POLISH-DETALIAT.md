# Plan Detaliat — Faza 9: Polish (Hardening Faza 1 & 2)

**Creat:** 2026-06-29 · **Bază:** [`tasks/BACKLOG-FAZA1-2-NICE-TO-HAVE.md`](BACKLOG-FAZA1-2-NICE-TO-HAVE.md)
**Scop:** ducerea Fazei 1 (fundație/auth/infra) și Fazei 2 (inventar DM) de la „100% conform Ghid" la „100% best practices 2026", fără a schimba arhitectura (mono-utilizator, local/LAN, RO/RU).

> **Regulă de aur:** fiecare sub-fază e independentă și livrabilă separat. Nu trece la următoarea până testele sub-fazei curente nu sunt verzi (`npm test` + coverage ≥90). Nimic din aceasta nu blochează go-live-ul actual.

---

## §0 — Reguli obligatorii (din auditul Faza 1-2)

Se aplică la TOT codul nou din această fază:

1. `req.user.sub` pentru id-ul utilizatorului din JWT (NU `req.user.id`).
2. `idSchema = z.coerce.number().int().positive()` → `400` la id invalid.
3. `prisma.$transaction([...])` pentru operație + audit log (atomic).
4. Audit log la fiecare CREATE/UPDATE/DELETE, `userId = req.user.sub` (non-null).
5. Validare body cu Zod; mesaje în română, cod în engleză.
6. Servire fișiere autentificată, cu gardă anti path-traversal (nu `static` public).
7. `escapeCSVField` pentru CSV; PDF cu fonturi TTF încorporate (diacritice).
8. Teste ≥90% pe codul nou; UI conform `DESIGN.md` (token-uri CSS, fără hex hardcodat).
9. După modificarea schemei: `npx prisma migrate dev --name <nume>` + `npx prisma generate`.
10. **Verificare în editor (Read), nu doar bash** — mount-ul poate servi conținut vechi.

---

## Ordinea de implementare (6 sub-faze, ~2 săptămâni)

| # | Sub-fază | Items backlog | Risc | Prioritate |
|---|----------|---------------|------|-----------|
| 9.1 | Config fail-fast la boot | A1 | mic | P1 |
| 9.2 | Câmp `supplier` + UDI/GMDN pe DM | C1 ⭐, C2 | mic | P1 |
| 9.3 | Audit-log tamper-evident (hash-chain) | A2, D2 | mediu | P1 |
| 9.4 | Etichete QR + scanare pe teren | C5 | mediu | P1 |
| 9.5 | Auth hardening (parolă breach, sesiuni UI) | A4, A5 | mediu | P2 |
| 9.6 | CI/DevEx (gate coverage, audit deps) | B1, B2 | mic | P1 |

> P2/P3 rămase (2FA, OpenAPI, PWA offline, i18n RO/RU, TypeScript) → Faza 9.x ulterioară, planificate separat când e nevoie.

---

## Sub-faza 9.1 — Config fail-fast la boot (A1)

**Obiectiv:** aplicația refuză să pornească dacă `.env` e nesigur (previne reapariția bug-ului C1 — secret placeholder).

### Pas 1 — Schema de mediu
Creează `backend/src/config/env.js`:

```js
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET trebuie să aibă minim 32 de caractere'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET trebuie să aibă minim 32 de caractere'),
  JSON_BODY_LIMIT: z.string().default('25mb'),
  CLAMAV_ENABLED: z.coerce.boolean().default(false),
  CORS_ORIGIN: z.string().optional(),
});

// Interzice valori placeholder cunoscute
const FORBIDDEN = ['changeme', 'placeholder', 'secret', 'your-secret-here', 'dev'];

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Configurație .env invalidă:\n' +
      parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'));
    process.exit(1);
  }
  const env = parsed.data;

  // În producție: secrete reale + cookie securizat
  if (env.NODE_ENV === 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
      if (FORBIDDEN.some((f) => env[key].toLowerCase().includes(f))) {
        console.error(`❌ ${key} pare a fi un placeholder. Folosește un secret real în producție.`);
        process.exit(1);
      }
    }
  }
  return env;
}

export const env = loadEnv();
```

### Pas 2 — Folosește `env` peste tot
În `backend/src/index.js`, importă `env` la început și înlocuiește `process.env.X` cu `env.X` pentru variabilele validate. Pornirea continuă identic dacă totul e valid.

### Pas 3 — Teste
`backend/src/__tests__/config.env.test.js`:
- `.env` valid → `loadEnv()` întoarce obiectul.
- `JWT_SECRET` < 32 → `process.exit(1)` (mock `process.exit`).
- `NODE_ENV=production` + secret „changeme" → exit.

**Definiție de „gata":** `npm test` verde; pornire cu secret slab eșuează cu mesaj clar în română.

---

## Sub-faza 9.2 — `supplier` + UDI/GMDN pe DM (C1 ⭐, C2)

**Obiectiv:** paritate 1:1 cu Fișa de mentenanță (Furnizor) + trasabilitate MDR/EUDAMED.

### Pas 1 — Schema Prisma
În `backend/prisma/schema/schema.prisma`, model `devices`, adaugă:

```prisma
  supplier         String?   // Furnizor (Formular Nr. 6)
  udiDi            String?   // UDI Device Identifier (EU MDR/EUDAMED)
  udiPi            String?   // UDI Production Identifier (lot/serie/dată)
  gmdnCode         String?   // Cod nomenclator GMDN/UMDNS (vigilență)
```

Apoi:
```bash
cd backend && npx prisma migrate dev --name add_supplier_udi_gmdn && npx prisma generate
```

### Pas 2 — Validare backend
În `backend/src/routes/devices.js`, extinde Zod-ul de body (create + update):

```js
  supplier: z.string().trim().max(255).optional().nullable(),
  udiDi:    z.string().trim().max(255).optional().nullable(),
  udiPi:    z.string().trim().max(255).optional().nullable(),
  gmdnCode: z.string().trim().max(64).optional().nullable(),
```
Câmpurile se salvează în același `$transaction` cu audit log-ul existent (fără cod nou de audit).

### Pas 3 — Fișa PDF
În handler-ul `fisa-pdf`, adaugă rândurile „Furnizor", „UDI-DI", „UDI-PI", „Cod GMDN" în secțiunea de identificare (folosind fontul TTF deja înregistrat pentru diacritice).

### Pas 4 — Frontend (formular DM)
În formularul de creare/editare DM (`DeviceForm`/pagina respectivă):
- adaugă 4 câmpuri sub secțiunea „Identificare", cu `label-base` + `input-base`, token-uri CSS;
- `supplier` lângă `manufacturer`; grup separat „Trasabilitate (UDI/GMDN)" pentru cele 3 UDI/GMDN;
- afișează-le și în fișa de vizualizare a DM (read-only) cu empty-state „—" când lipsesc.

### Pas 5 — Export
Adaugă coloanele `Furnizor`, `UDI-DI`, `UDI-PI`, `GMDN` în export CSV (cu `escapeCSVField`) și XLSX.

### Pas 6 — Teste
- backend: create/update cu noile câmpuri persistă + apar în audit log; export conține coloanele.
- frontend: formularul randează și trimite câmpurile.

**Definiție de „gata":** migrare aplicată, fișa DM + PDF + export afișează Furnizor/UDI/GMDN; teste verzi.

---

## Sub-faza 9.3 — Audit-log tamper-evident + diff lizibil (A2, D2)

**Obiectiv:** pista de audit dovedibil nemodificată (hash-chain) + vizualizare before/after prietenoasă.

### Pas 1 — Schema
La modelul `audit_logs` adaugă:
```prisma
  prevHash  String?   // hash-ul intrării anterioare (lanț)
  hash      String?   // hash-ul acestei intrări
```
`npx prisma migrate dev --name audit_hash_chain`.

### Pas 2 — Funcția de scriere a audit-log-ului
Acolo unde se creează audit log (helper existent, ex. `writeAuditLog`):
```js
import crypto from 'node:crypto';

function computeHash(entry, prevHash) {
  const payload = JSON.stringify({
    userId: entry.userId, action: entry.action, entity: entry.entity,
    entityId: entry.entityId, changes: entry.changes,
    createdAt: entry.createdAt, prevHash: prevHash ?? '',
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}
```
La fiecare scriere (în același `$transaction`): citește ultimul `hash` din tabel → setează-l ca `prevHash` → calculează `hash`. **Atenție:** serializează scrierile (lanțul cere ordine) — folosește o tranzacție cu `SELECT ... ORDER BY id DESC LIMIT 1` în interior.

### Pas 3 — Endpoint de verificare integritate
`GET /api/audit/verify-integrity` (doar autentificat):
```js
// reparcurge toate intrările în ordine, recalculează hash-ul,
// întoarce { ok: true } sau { ok: false, brokenAtId }
```

### Pas 4 — Diff lizibil (D2)
`audit_logs.changes` conține before/after. În pagina de audit / fișa DM, componentă `AuditDiff` care randează tabel: `Câmp | Valoare veche | Valoare nouă`, cu evidențiere token-uri (`--color-danger` șters / `--color-success` adăugat). Empty-state când nu sunt schimbări.

### Pas 5 — Teste
- hash-chain: 3 scrieri → al treilea `prevHash` == al doilea `hash`.
- alterarea unei intrări în DB → `verify-integrity` întoarce `brokenAtId`.
- `AuditDiff` randează corect câmpurile modificate.

**Definiție de „gata":** lanț valid pe scrieri normale; verificarea detectează manipularea; diff vizibil în UI.

---

## Sub-faza 9.4 — Etichete QR + scanare pe teren (C5)

**Obiectiv:** scanezi un DM fizic → se deschide fișa lui. Cel mai mare câștig pe teren.

### Pas 1 — Bibliotecă (client-side, fără backend nou)
```bash
cd frontend && npm i qrcode.react html5-qrcode
```

### Pas 2 — Generare etichetă printabilă
Componentă `DeviceLabel` (pe fișa DM, buton „Printează eticheta"):
- QR cu URL relativ `/{deviceId}` SAU payload `SIMDM:{inventoryNumber}`;
- sub QR: `inventoryNumber`, denumire, secție;
- layout de print (CSS `@media print`, dimensiune etichetă ~50×30mm), token-uri CSS.

### Pas 3 — Scanare
Pagină/modal `ScanDevice` (buton în header mobil):
- `html5-qrcode` deschide camera;
- la citire: parsează payload → `navigate('/devices/' + id)` sau caută după `inventoryNumber`;
- fallback: input manual de `inventoryNumber`;
- gestionare permisiuni cameră refuzată (alert-error în română).

### Pas 4 — Endpoint lookup (dacă scanezi inventoryNumber)
`GET /api/devices/by-inventory/:inventoryNumber` → întoarce id-ul (autentificat, validat). Reutilizează patternul existent.

### Pas 5 — Teste
- `DeviceLabel` randează QR cu inventoryNumber corect;
- lookup endpoint: număr valid → device; inexistent → 404;
- E2E (Playwright): buton scanare prezent pe mobil (mock cameră).

**Definiție de „gata":** etichetă printabilă + scanare funcțională cu fallback manual; legat de `MOBILE_WORKFLOW_GUIDE`.

---

## Sub-faza 9.5 — Auth hardening (A4, A5)

### A4 — Politică parolă + verificare breach
1. `cd backend && npm i zxcvbn` (frontend la fel pentru meter live).
2. La `change-password`, după validarea Zod: scor `zxcvbn(password)` ≥ 3, altfel `400` „Parolă prea slabă".
3. Verificare HaveIBeenPwned (k-anonymity): SHA-1 al parolei → trimite doar primele 5 caractere la `api.pwnedpasswords.com/range/{prefix}` → caută sufixul în răspuns. Dacă apare → `400` „Această parolă a fost compromisă în breșe cunoscute". (Failsafe: dacă API-ul e indisponibil offline/LAN, sari peste verificarea breach — nu bloca.)
4. Frontend: meter de tărie sub câmpul parolă (bară colorată cu token-uri).

### A5 — Management sesiuni în UI
1. `GET /api/auth/sessions` → listează `refresh_tokens` ale utilizatorului (dispozitiv/UA, IP, `lastUsedAt`, `createdAt`), fără token-ul brut.
2. `DELETE /api/auth/sessions/:id` → revocă o sesiune; `POST /api/auth/sessions/revoke-all` → revocă tot exceptând sesiunea curentă.
3. Pagina Settings → secțiune „Sesiuni active": tabel + buton „Deconectează" per rând + „Deconectează toate celelalte". Toate în `$transaction` + audit log.

### Teste
- parolă slabă/compromisă respinsă; meter randează scorul;
- listarea sesiunilor nu expune token brut; revoke invalidează refresh-ul.

**Definiție de „gata":** parole slabe/compromise blocate (cu failsafe offline); utilizatorul își vede și revocă sesiunile.

---

## Sub-faza 9.6 — CI/DevEx (B1, B2)

**Obiectiv:** automatizarea care previne regresiile.

### Pas 1 — GitHub Actions
`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: simdm_test }
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: cd backend && npm ci
      - run: cd backend && npx prisma migrate deploy
        env: { DATABASE_URL: 'postgresql://postgres:test@localhost:5432/simdm_test' }
      - run: cd backend && npm run lint
      - run: cd backend && npm run test:coverage
      - run: cd backend && npm audit --audit-level=high || true
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run test:coverage
      - run: cd frontend && npm run build
```

### Pas 2 — Gate de coverage
În config Vitest (backend + frontend), `coverage.thresholds` la 90 (lines/functions/branches/statements). CI eșuează sub prag.

### Pas 3 — Dependențe
Adaugă `.github/dependabot.yml` (npm, săptămânal, backend + frontend).

**Definiție de „gata":** PR-urile rulează lint+test+coverage+build; sub 90% → roșu; Dependabot activ.

---

## Verificare finală a Fazei 9 (checklist)

- [ ] 9.1 — pornire cu `.env` slab eșuează cu mesaj clar; teste verzi.
- [ ] 9.2 — `supplier`+UDI/GMDN în schema, formular, fișă, PDF, export; audit log capturează modificările.
- [ ] 9.3 — hash-chain valid; `verify-integrity` detectează manipularea; diff vizibil în UI.
- [ ] 9.4 — etichetă QR printabilă + scanare cu fallback manual.
- [ ] 9.5 — parole slabe/compromise blocate (failsafe offline); sesiuni vizibile/revocabile.
- [ ] 9.6 — CI verde cu gate coverage ≥90; Dependabot activ.
- [ ] `npm test` + `npm run test:coverage` verzi (backend + frontend) — rulat LOCAL (nu există Postgres în sandbox).
- [ ] `npx playwright test` verde (E2E lifecycle + scanare).
- [ ] Toate paginile noi conform `DESIGN.md` (token-uri, dark mode, reduced-motion, WCAG 2.2 AA).

---

## Notă de scope
Rămase pentru o eventuală **Faza 9.x** (planificate separat la nevoie): 2FA TOTP (A3), logging structurat + correlation IDs (A6), graceful shutdown/readiness (A7), OpenAPI (B3), hardening container (B4), TypeScript (B5), foto+atașamente DM (C3), concurență optimistă (C4), timeline unificat (D1), filtre salvate/full-text (D3), PWA offline (D4), i18n RO+RU (E1), telemetrie erori (E2).
