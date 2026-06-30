# Plan Detaliat — Faza 5.1: DMS Hardening (best-practice 2026)

**Versiune:** 1.0 · **Creat:** 2026-06-19 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Durată estimată:** 3–4 zile lucrătoare · **Premisă:** Faza 5 (DMS) este completă (modelul `documents`, rutele, pagina, versionarea, servirea autentificată).

> **Scop:** ridică modulul Documente de la „MVP funcțional" la „DMS conform pentru date medicale" — expirare + alerte, integritate prin hash, metadate condiționate pe categorie și jurnal de acces vizibil. Toate reutilizează infrastructura existentă (cron `notifications.js`, `crypto`, Zod, audit log). Fără librării noi.

---

## 0. Reguli obligatorii (din lecțiile auditelor 1–5 — NU le încălca)

1. **`req.user.sub`** pentru id-ul utilizatorului (NU `req.user.id`).
2. **Validare id cu Zod** (`z.coerce.number().int().positive()`) → 400 la id invalid.
3. **`prisma.$transaction([...])`** pentru orice operație + audit log (atomic).
4. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null).
5. **Validare body cu Zod** (schema per resursă).
6. **Mesaje utilizator în română**, cod în engleză.
7. **Servire fișiere autentificată** (patternul existent din `documents.js`).
8. **Fără librării noi** — `crypto`, `node-cron`, `zod`, `multer` există deja.
9. **Teste** pentru fiecare funcție nouă (țintă ≥90%) — verifică audit ne-null.
10. **Compatibilitate înapoi** — documentele existente (fără hash/validUntil) rămân valide; câmpurile noi sunt opționale/nullable.

---

## 1. Pre-requisite & schema (Ziua 0 — 0.5 zi)

**Adăugiri la modelul `documents`** (migrare nouă):
```prisma
// adăugiri la model documents
fileHash      String?   // SHA-256 hex al fișierului (integritate)
issuer        String?   // emitent (pentru CERTIFICAT/CONTRACT)
validFrom     DateTime? // valabil de la
validUntil    DateTime? // expiră la (CERTIFICAT/CONTRACT/LEGISLATIE)
reviewAt      DateTime? // dată de revizuire (PROCEDURA_MDM/FORMULAR)
@@index([validUntil])
@@index([fileHash])
```
Rulează: `npx prisma migrate dev --name add_documents_hardening && npx prisma generate`.
> `fileHash` rămâne nullable pentru documentele deja încărcate. Opțional: un script de backfill care calculează hash-ul fișierelor existente.

---

## 2. MODULUL A — Integritate prin hash SHA-256 (0.5 zi)

**Scop:** dovedești că un document n-a fost modificat (cerință de audit medical).

### Backend (`routes/documents.js`)
- La **POST `/`** și **POST `/:id/version`**: după ce antivirus-ul a validat fișierul, calculează hash-ul:
  ```js
  const crypto = require('crypto');
  const fileHash = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
  ```
  Salvează `fileHash` în înregistrare (în `$transaction` existentă). Pentru fișiere mari, folosește stream (`createReadStream` + `pipe`) ca să nu blochezi memoria.
- La **GET `/:id`**: include `fileHash` în răspuns.
- **GET `/api/documents/:id/verify`** (nou) — recalculează hash-ul fișierului de pe disc și compară cu `fileHash` stocat:
  - `idSchema`; document există (404); fișier există pe disc (404 dacă lipsește).
  - Răspuns: `{ valid: true/false, storedHash, currentHash }`.
  - Audit `VERIFY` (entity `documents`).

### Frontend (`DocumentsPage.jsx` / detaliu)
- Afișează badge „Integritate ✓" (verde) dacă verificarea trece, „⚠ Modificat" (roșu) dacă nu.
- Afișează hash-ul scurt (primele 12 caractere) în detaliul documentului.

### Teste
- upload → `fileHash` salvat (64 hex);
- verify pe fișier neschimbat → `valid:true`;
- verify după alterarea fișierului (mock) → `valid:false`;
- verify pe document inexistent → 404.

---

## 3. MODULUL B — Expirare + alerte (1 zi)

**Scop:** certificatele/contractele/legislația au valabilitate; bioinginerul trebuie avertizat înainte să expire.

### Backend
- **Validare condiționată** (Zod refine, vezi Modulul D): `validUntil` obligatoriu pentru `CERTIFICAT` și `CONTRACT`.
- **GET `/api/documents/expiring?days=60`** (nou) — documentele cu `validUntil` în următoarele N zile sau expirate:
  - `where: { isDeleted:false, isCurrent:true, validUntil:{ lte: azi+N } }`, ordonate după `validUntil`.
  - Calculează per document `daysLeft` și `status`: `EXPIRAT` (validUntil < azi) / `EXPIRA_CURÂND` (≤30) / `OK`.
  - Răspuns: `{ data, summary: { expirat, expiraCurand } }`.
- **Cron** — extinde `backend/src/jobs/notifications.js`:
  - Adaugă `checkDocumentExpiry()` care la 08:00 (Europe/Chisinau) loghează documentele ce expiră în 60/30/7 zile.
  - Înregistreaz-o în `startCronJobs()` lângă `checkVerificationExpiry`/`checkContractExpiry`/`checkMppDue`.
  - Exportă funcția (`module.exports`) pentru testare.

### Frontend
- Pe `DocumentsPage`: badge de expirare pe card (verde/portocaliu/roșu) + filtru „Expiră curând".
- (Opțional) card-sumar pe `Dashboard`: „X documente expiră în 30 zile".

### Teste
- `validUntil` lipsă pentru CERTIFICAT → 400;
- `/expiring?days=60` clasifică corect EXPIRAT / EXPIRA_CURÂND / OK;
- `checkDocumentExpiry` (mock dată) numără corect.

---

## 4. MODULUL C — Jurnal de acces vizibil (0.5 zi)

**Scop:** trasabilitate — cine a descărcat / vizualizat / verificat un document și când. (Deja loghezi `FILE_ACCESS`; lipsește doar expunerea.)

### Backend
- **GET `/api/documents/:id/access-log`** (nou) — interoghează `audit_logs` pentru `entity IN ('documents','File')` legat de document (după `entityId` = filename sau id), acțiuni `FILE_ACCESS`/`VERIFY`/`UPDATE`/`CREATE`:
  - `idSchema`; paginat; include `users` (cine).
  - Răspuns: listă `{ action, user, timestamp, changes }`.
- Asigură-te că **GET `/file/:filename`** scrie deja `FILE_ACCESS` cu `userId` (există din Faza 5).

### Frontend
- Tab/secțiune „Istoric acces" în detaliul documentului — tabel: Acțiune | Utilizator | Data/ora.

### Teste
- după o descărcare, `access-log` conține o intrare `FILE_ACCESS` cu `userId` ne-null;
- paginare corectă; id invalid → 400.

---

## 5. MODULUL D — Metadate condiționate pe categorie (0.5 zi)

**Scop:** calitatea datelor — fiecare tip de document cere câmpurile relevante.

### Backend (Zod refine în `documents.js`)
```js
const createDocSchema = baseSchema.superRefine((d, ctx) => {
  if (['CERTIFICAT','CONTRACT'].includes(d.category)) {
    if (!d.validUntil) ctx.addIssue({ path:['validUntil'], message:'Data de expirare este obligatorie pentru certificate și contracte' });
    if (!d.issuer)     ctx.addIssue({ path:['issuer'],     message:'Emitentul este obligatoriu' });
  }
});
```
- Aplică la POST `/` și PUT `/:id`.
- Acceptă `issuer`, `validFrom`, `validUntil`, `reviewAt` în body (Zod, opționale, dar impuse condiționat).

### Frontend
- Upload modal: câmpuri condiționate — când categoria e CERTIFICAT/CONTRACT, apar (obligatoriu) „Emitent" + „Valabil până la"; pentru PROCEDURA_MDM/FORMULAR apare „Dată revizuire".

### Teste
- CERTIFICAT fără `validUntil`/`issuer` → 400 cu mesajele corecte;
- document `ALTUL` fără aceste câmpuri → 201 (nu sunt cerute).

---

## 6. (Mic) Aliniere cosmetică
- Icon meniu Documente: **rămâne `BookOpen`** (potrivit pentru „bibliotecă"); actualizează `PLAN-FAZA5-DETALIAT.md` §3 să spună `BookOpen` în loc de `FileText` (aliniere doc↔cod). NU schimba codul.

---

## 7. Definiția lui „Faza 5.1 = 100%"
- [ ] Schema extinsă (fileHash, issuer, validFrom, validUntil, reviewAt) + migrare aplicată; documentele vechi rămân valide.
- [ ] Hash SHA-256 calculat la fiecare upload + endpoint `/verify` funcțional + badge integritate în UI.
- [ ] `validUntil` impus pe CERTIFICAT/CONTRACT; endpoint `/expiring` + `checkDocumentExpiry` în cron + badge/filtru expirare în UI.
- [ ] `/access-log` per document + tab „Istoric acces" în UI.
- [ ] Metadate condiționate pe categorie (Zod refine) + câmpuri condiționate în modal.
- [ ] Toate regulile §0 respectate (sub, tranzacții, audit ne-null, Zod, anti path-traversal moștenit).
- [ ] Teste ≥90% pe funcțiile noi; `npm test` verde backend + frontend; un test verifică `audit_logs.userId` ne-null.
- [ ] Dark mode parity pe noile elemente UI (badge-uri, tab istoric).
- [ ] README/INDEX/todo actualizate (Faza 5.1 → DONE).

---

## 8. Ordine de implementare recomandată
1. Schema + migrare (§1).
2. Modul A — hash integritate (§2) — cel mai mic, valoare de conformitate imediată.
3. Modul D — metadate condiționate (§5) — pregătește câmpurile pentru §3.
4. Modul B — expirare + alerte cron (§3) — depinde de `validUntil`.
5. Modul C — jurnal acces (§4).
6. Teste finale + actualizare documentație.

---

**Referințe Ghid:** certificate de verificare periodică (cap. 3.6) și contracte de mentenanță (cap. 3.4 / Procedura MDM Nr. 4) au valabilitate → justifică `validUntil` + alerte. Integritatea documentelor (hash) susține pista de audit cerută pentru evidența D/SIBM.
