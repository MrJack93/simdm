# Plan Detaliat — Faza 5: Documente & Proceduri (DMS)

**Versiune:** 1.0 · **Creat:** 2026-06-14 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Durată estimată:** 5–6 zile lucrătoare (1 modul, 3 sub-componente)

> **Scop:** bibliotecă centralizată de documente pentru bioinginer — proceduri MDM, formulare, legislație, manuale tehnice, certificate, contracte, rapoarte — cu versionare, categorisire, căutare și servire autentificată. Acoperă cerința Ghidului de a păstra și gestiona documentația D/SIBM.
>
> **Avantaj-cheie:** modelul `documents` **există deja** în schemă (cu versionare), iar infrastructura de upload (multer + antivirus) și de servire autentificată (`GET /file/:filename` cu protecție anti path-traversal) a fost construită în Faza 2. Faza 5 e în mare parte „cablare", nu cod nou de la zero.

---

## 0. Reguli obligatorii (din lecțiile auditelor 1–3)

Fiecare endpoint nou TREBUIE să respecte:

1. **`req.user.sub`** pentru id-ul utilizatorului (NU `req.user.id`).
2. **Validare id cu Zod**: `const idSchema = z.coerce.number().int().positive();` → 400 la id invalid.
3. **`prisma.$transaction([...])`** pentru orice operație + audit log (atomic).
4. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null).
5. **Validare body cu Zod** (schema per resursă).
6. **Mesaje utilizator în română**, cod în engleză.
7. **Servire fișiere autentificată** — prin `GET /api/documents/file/:filename` cu `authMiddleware` + gardă anti path-traversal (reutilizează patternul din `devices.js`). NU static public.
8. **Upload** prin `multer` + `antivirusMiddleware` (magic bytes + ClamAV), cu cleanup orfani la eroare (ca în Faza 2).
9. **Teste** pentru fiecare rută (țintă ≥90%) — un test verifică `audit_logs.userId` ne-null.
10. Fără librării noi (toate există: multer, file-type, pdfkit, zod).

---

## 1. Pre-requisite (Ziua 0 — 0.25 zi)

**Dependințe:** niciuna nouă. Tot ce trebuie există deja.

**Decizii de modelare confirmate față de schema existentă:**
- `documents` există: `id, title, category, fileUrl, fileSize, mimeType, version, isCurrent, previousVersionId (self-relation), description, tags[], uploadedAt, updatedAt`.
- `DocumentCategory` enum există: `PROCEDURA_MDM, FORMULAR, LEGISLATIE, MANUAL_TEHNIC, CERTIFICAT, CONTRACT, RAPORT, ALTUL`.
- **Adăugiri minime** la model (migrare nouă):
  - `uploadedById Int?` + relație la `users` (cine a încărcat — pentru audit/atribuire).
  - `deviceId Int?` + relație opțională la `devices` (atașează un manual/certificat la un DM specific). Index pe `deviceId`.
  - `isDeleted Boolean @default(false)` (soft-delete, consistent cu `consumables`).
  - `@@index([isCurrent])`.
- `documents.documents` (self-relation pentru versionare) rămâne — o folosim la „upload versiune nouă".

```prisma
// adăugiri la model documents
uploadedById Int?
deviceId     Int?
isDeleted    Boolean  @default(false)
uploadedBy   users?   @relation(fields: [uploadedById], references: [id])
device       devices? @relation(fields: [deviceId], references: [id])
@@index([deviceId])
@@index([isCurrent])
```
Plus relații inverse pe `users` (`documents documents[]`) și `devices` (`documents documents[]`).
Rulează: `npx prisma migrate dev --name add_documents_fields && npx prisma generate`.

---

## 2. MODULUL — Document Management System

### 2.1 Backend — rute CRUD + upload + versionare + servire (2.5 zile)
Fișier nou: `backend/src/routes/documents.js`. Montează în `index.js` (decomentează linia existentă):
```js
documentRoutes = require('./routes/documents');
app.use('/api/documents', authMiddleware, documentRoutes);
```

**Zod schemas:**
```js
const idSchema = z.coerce.number().int().positive();
const VALID_CATEGORIES = ['PROCEDURA_MDM','FORMULAR','LEGISLATIE','MANUAL_TEHNIC','CERTIFICAT','CONTRACT','RAPORT','ALTUL'];
const createDocSchema = z.object({
  title: z.string().min(2).max(255),
  category: z.enum(VALID_CATEGORIES),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  deviceId: z.coerce.number().int().positive().optional(),
  version: z.string().max(20).optional(), // default "1.0"
});
```

**Endpoint-uri:**
- **GET `/api/documents`** — listă cu filtre + paginare:
  - Params: `?search=` (title/description/tags), `?category=`, `?deviceId=`, `?onlyCurrent=true` (default: doar `isCurrent && !isDeleted`), `?page=`, `?limit=` (max 100).
  - Căutare prin Prisma `contains` (parametrizat, fără SQLi); `tags` cu `has`.
  - Răspuns: `{ data, pagination }`.
- **GET `/api/documents/:id`** — detalii (cu `uploadedBy`, `device`, lanțul de versiuni anterioare).
- **POST `/api/documents`** — `upload.single('file')` + `antivirusMiddleware`:
  - Verifică `req.file` (400 dacă lipsește).
  - Zod pe `req.body`; `fileUrl = /api/documents/file/${req.file.filename}` (servire autentificată).
  - `$transaction`: creează `documents` (`isCurrent=true`, `version` sau "1.0", `uploadedById=req.user.sub`, `fileSize`, `mimeType` din scan) + audit log CREATE.
  - Cleanup fișier orfan la orice eroare (`fs.unlink`), ca în Faza 2.
- **POST `/api/documents/:id/version`** — încarcă **versiune nouă** a unui document (`upload.single` + antivirus):
  - `idSchema`; verifică documentul-părinte există.
  - `$transaction`:
    1. `documents.update` pe părinte → `isCurrent=false`;
    2. creează document nou → `isCurrent=true`, `previousVersionId=<părinte>`, `version` incrementat (sau din body), moștenește `category/title/deviceId` dacă nu sunt furnizate;
    3. audit log UPDATE (entity `documents`, changes `{ newVersion }`).
- **PUT `/api/documents/:id`** — editează metadate (title, category, description, tags, deviceId) — fără fișier; `$transaction` + audit.
- **DELETE `/api/documents/:id`** — soft-delete (`isDeleted=true`); `idSchema` + existență (404) + `$transaction` + audit DELETE. (Fișierul rămâne pe disc pentru audit trail; nu se șterge fizic.)
- **GET `/api/documents/file/:filename`** — servire autentificată:
  - Gardă anti path-traversal (respinge `..`, `/`, `\`; verifică path rezolvat în `uploads/documents`), exact ca `devices.js`.
  - `res.download(filePath)` + audit `FILE_ACCESS`.
- **GET `/api/documents/categories`** — listă categorii (pentru dropdown-uri în frontend).

**Multer setup:** director `uploads/documents`, nume fișier `${timestamp}-${random}${ext}`, `limits: { fileSize: 25 * 1024 * 1024 }` (documentele pot fi mai mari decât 10MB — PDF-uri scanate); `fileFilter` permite pdf, word, excel, imagini (reutilizează `SAFE_MIME_TYPES` din `antivirus.js`).

### 2.2 Frontend — pagină bibliotecă (2 zile)
`frontend/src/pages/DocumentsPage.jsx` (rută `/documents`, sub `ProtectedRoute`; adaugă în nav cu icon).

- **Listă/grid** de documente: titlu, badge categorie (culoare per categorie din token-uri), versiune, dată, dimensiune, tag-uri.
- **Filtre:** căutare text (debounced), dropdown categorie, filtru „doar curente".
- **Empty state** + **skeleton** la loading (componentele există din Faza 3).
- **Upload modal:** câmp fișier (drag&drop), titlu, categorie (select), descriere, tag-uri, link opțional la DM (autocomplete devices).
- **Acțiuni per document:** Descarcă (apel `GET /file/...` autentificat cu token), Versiune nouă (modal upload), Editează metadate, Șterge (cu `DeleteConfirmDialog`).
- **Vizualizare istoric versiuni:** listă cronologică (versiunea curentă + cele anterioare prin `previousVersionId`).
- Respectă DESIGN.md: token-uri `var(--color-*)`, fără hex hardcodat, heading serif, dark mode parity.

**Hooks/API:** `frontend/src/api/documents.js` (axios) + `useDocuments` hook (TanStack Query) — model după `useConsumables`/`api/consumables.js`.

### 2.3 (Opțional) Pre-încărcare documente normative
Seed/script care încarcă în categoria `LEGISLATIE`/`PROCEDURA_MDM` documentele de referință (Ghidul, formularele goale). Nu obligatoriu pentru MVP — se pot încărca manual din UI.

### 2.4 Teste (incluse în durată)
`backend/src/__tests__/documents.test.js` ≥10 teste:
- upload creează document `isCurrent=true` + audit ne-null;
- versiune nouă → părintele devine `isCurrent=false`, copilul are `previousVersionId` corect;
- filtrare după categorie/tag/search;
- soft-delete exclude din listă;
- id invalid → 400; document inexistent → 404;
- path-traversal pe `/file/:filename` → 400;
- upload fără fișier → 400; tip fișier nepermis → respins.

`frontend/src/__tests__/DocumentsPage.test.jsx`: render listă, filtre, modal upload, empty state.

### 2.5 Acceptance criteria
- [ ] Încarc un PDF → apare în bibliotecă cu categoria corectă.
- [ ] Încarc versiune nouă → versiunea veche devine „anterioară", curenta e cea nouă.
- [ ] Descărcarea merge doar autentificat; path-traversal respins.
- [ ] Filtrare după categorie + căutare text funcționează.
- [ ] Soft-delete ascunde documentul, dar rămâne în audit.
- [ ] Atașez un manual la un DM (deviceId) și îl regăsesc filtrând după dispozitiv.
- [ ] Audit log cu `userId` ne-null la fiecare operație. Dark mode OK. Teste verzi.

---

## 3. Integrare & rute
- `index.js`: decomentează + montează `documents` cu `authMiddleware`.
- `App.jsx`: rută `/documents` + link în meniu (icon `FileText`).
- (Opțional) pe fișa DM (`DeviceForm`/detalii): tab „Documente atașate" care filtrează `GET /api/documents?deviceId=<id>`.

---

## 4. Definiția lui „Faza 5 = 100%"
- [ ] Model `documents` extins (uploadedById, deviceId, isDeleted) + migrare aplicată.
- [ ] CRUD complet + upload + versionare + servire autentificată + soft-delete.
- [ ] 8 categorii funcționale; căutare + filtre; istoric versiuni vizibil.
- [ ] Toate regulile §0 respectate (sub, tranzacții, audit ne-null, Zod, anti path-traversal).
- [ ] Pagină frontend conformă DESIGN.md (token-uri, dark mode, empty/skeleton).
- [ ] Teste ≥90% backend pe modul; `npm test` verde backend + frontend.
- [ ] `index.js` montează ruta; `App.jsx` are ruta + nav.
- [ ] README/INDEX/todo actualizate (Faza 5 → DONE).

---

**Referințe Ghid:** cap. 1.5 (legislație), 3.x (proceduri MDM + formulare ca documente), Anexele cu Formulare Nr. 1–12 (de păstrat ca șabloane în categoria FORMULAR). `DocumentCategory` acoperă exact tipurile cerute de Ghid.
