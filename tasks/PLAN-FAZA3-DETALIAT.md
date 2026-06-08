# Plan Detaliat — Faza 3: Mentenanță (implementare pas-cu-pas până la 100%)

**Versiune:** 1.0 · **Creat:** 2026-06-08 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Termen-țintă:** 2026-06-26 · **Durată estimată:** 16 zile lucrătoare (5 module)

> Acest plan a fost verificat din nou față de Ghid (cap. 3.3–3.6 + Anexele cu formulare). Structurile de formulare (Nr. 5, 6, 7, 8, 9) au fost citite din PDF și sunt reflectate în schema și în generatoarele PDF de mai jos. Planul preia și **lecțiile din auditul Fazei 1–2** ca să nu repetăm aceleași greșeli (vezi §0).

---

## 0. Reguli obligatorii pentru tot codul Fazei 3 (din lecțiile auditului)

Fiecare endpoint nou TREBUIE să respecte:

1. **`req.user.sub`** pentru id-ul utilizatorului (NU `req.user.id` — JWT-ul nu are `id`).
2. **Validare id cu Zod**: `const idSchema = z.coerce.number().int().positive();` → 400 la id invalid, nu 500.
3. **Tranzacții `prisma.$transaction([...])`** ori de câte ori o operație + audit log (sau mai multe scrieri) trebuie să fie atomice (ex. execuție MPP = creare execuție + update ocurență + update device + scădere stoc).
4. **Audit log la fiecare CREATE/UPDATE/DELETE** (entity + entityId + changes + userId = `req.user.sub`).
5. **Validare body cu Zod** (schema per resursă), nu validare manuală ad-hoc.
6. **Mesaje utilizator în română**, cod în engleză.
7. **Servire fișiere autentificată** — PDF-urile/atașamentele se servesc printr-un endpoint cu `authMiddleware`, NU prin static public (vezi M3).
8. **Export CSV** (dacă apare) — folosește helper-ul `escapeCSVField` existent (anti formula-injection).
9. **Teste** pentru fiecare rută (țintă ≥95% coverage) — un test trebuie să verifice că `audit_logs.userId` NU e null.
10. Nu adăuga librării noi în afara celor listate la §1 fără cerere explicită.

---

## 1. Pre-requisite (Ziua 0 — 0.5 zi)

**Dependințe noi (singurele permise):**
```bash
# Frontend
cd frontend && npm install react-big-calendar date-fns react-signature-canvas
# Backend
cd backend && npm install node-cron
```

**Decizii de modelare confirmate față de Ghid:**
- Reutilizăm câmpurile existente pe `devices`: `maintenanceFreq` (luni), `lastMaintenanceAt`, `nextMaintenanceAt`.
- Adăugăm pe `devices`: `requiresVerification` (Boolean), `verificationType` (LABORATOR | METROLOGIC | NONE), `verificationFreqMonths` (Int), `lastVerificationAt`, `nextVerificationAt`.
- `MaintenanceType` enum există deja (PREVENTIVA, CORECTIVA, VERIFICARE, CALIBRARE) — îl păstrăm.
- Tabelul vechi `maintenance_records` rămâne pentru istoricul brut; modulele noi îl pot popula la finalizare (audit trail unificat).

**Mapare frecvență → luni (Formular Nr. 5, grilă Ian–Dec):**

| Frecvență | `maintenanceFreq` (luni) | Ocurențe/an | Lunile marcate (X) |
|---|---|---|---|
| LUNAR | 1 | 12 | 1,2,3,4,5,6,7,8,9,10,11,12 |
| BIMESTRIAL | 2 | 6 | 2,4,6,8,10,12 |
| TRIMESTRIAL | 3 | 4 | 3,6,9,12 |
| SEMESTRIAL | 6 | 2 | 6,12 |
| ANUAL | 12 | 1 | luna ancoră (ex. luna ultimei MPP sau Dec) |

---

## 2. MODULUL 1 — Plan Mentenanță Preventivă (Procedura MDM Nr. 6 · Formular Nr. 5) — 4 zile

**Scop:** generează planul anual de MPP per DM, îl afișează ca un calendar și produce Formularul Nr. 5 (grilă Ian–Dec).

### 2.1 Schema DB (0.5 zi)
Fișier nou: `backend/prisma/schema/maintenance.prisma` (sau extinde `schema.prisma`).

```prisma
model maintenance_plans {
  id              Int       @id @default(autoincrement())
  deviceId        Int
  year            Int
  frequency       String    // LUNAR|BIMESTRIAL|TRIMESTRIAL|SEMESTRIAL|ANUAL
  responsibleName String
  responsibleAffil String?  // "Afiliat" din Formular Nr. 5 (utilizator/bioinginer/companie)
  months          Int[]     // [1..12] lunile marcate
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime
  device          devices   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  occurrences     mpp_occurrences[]
  @@unique([deviceId, year])
  @@index([year])
}

model mpp_occurrences {
  id            Int       @id @default(autoincrement())
  planId        Int
  deviceId      Int
  scheduledDate DateTime
  status        String    @default("PROGRAMAT") // PROGRAMAT|SCADENT|DEPASIT|EFECTUAT
  rescheduledTo DateTime?
  rescheduleReason String?
  executionId   Int?      // link la mpp_executions după efectuare
  createdAt     DateTime  @default(now())
  plan          maintenance_plans @relation(fields: [planId], references: [id], onDelete: Cascade)
  @@index([deviceId])
  @@index([status])
  @@index([scheduledDate])
}
```
Apoi: `npx prisma migrate dev --name add_maintenance_plans && npx prisma generate`.

### 2.2 Backend — generator + calendar (1.5 zile)
Fișier: `backend/src/routes/maintenancePlans.js` (montează cu `authMiddleware` în `index.js`).

- **POST `/api/maintenance-plans/generate`** — body `{ deviceId, year, frequency, responsibleName, responsibleAffil }`:
  - Zod validation; mapare frecvență → `months[]` (tabel §1).
  - `upsert` plan pe `[deviceId, year]`.
  - Șterge ocurențele vechi cu status ≠ EFECTUAT.
  - Creează ocurențe noi: pentru fiecare lună din `months[]`, `scheduledDate` = ziua 15 a lunii (sau zi configurabilă).
  - Audit log CREATE.
- **GET `/api/maintenance-plans/calendar?year=YYYY`**:
  - Returnează ocurențele anului cu status **calculat dinamic** la citire:
    - `EFECTUAT` dacă `executionId != null`;
    - `DEPASIT` dacă `scheduledDate < azi` și neefectuată;
    - `SCADENT` dacă `scheduledDate − azi ≤ 7 zile`;
    - altfel `PROGRAMAT`.
- **PATCH `/api/maintenance-plans/occurrence/:id/reschedule`** — body `{ newDate, reason }`:
  - `idSchema` validare; `reason` obligatoriu **min 5 caractere** → altfel 400.
  - Salvează `rescheduledTo` + `rescheduleReason`; audit log.
- **GET `/api/maintenance-plans/:year/formular5-pdf`** — vezi §2.4.

### 2.3 Frontend — calendar (1.5 zile)
`frontend/src/pages/MaintenanceCalendarPage.jsx` (rută `/maintenance/calendar`):
- `react-big-calendar` + locale `ro` din `date-fns`.
- Dropdown an; legendă culori: PROGRAMAT (verde), SCADENT (portocaliu), DEPASIT (roșu), EFECTUAT (albastru).
- Click pe eveniment → modal cu detalii + buton „Reprogramează" (validare motiv ≥5 car.) + buton „Execută MPP" (→ Modul 2).
- Buton „Descarcă Formular Nr. 5 (PDF)".

### 2.4 PDF Formular Nr. 5 (inclus în 2.2)
Structură (A4 landscape), conform Anexa 16:
- Titlu: „Plan de mentenanță preventivă a dispozitivelor medicale pentru anul 20__".
- Antet tabel: `Nr | Denumirea dispozitivului medical | Cod DM / Nr. de serie | Secția medicală | Persoana responsabilă (Afiliat | Nume) | Ian | Feb | … | Dec`.
- Marcaj „X" în lunile din `months[]`; footer cu data generării.
- Font cu diacritice complete (Times-Roman / DejaVu), ca la `fisa-pdf`.

### 2.5 Teste (incluse în durată)
`maintenancePlans.test.js` ≥8 teste: mapare frecvențe, upsert idempotent, reschedule fără motiv → 400, status calculat corect (mock dată), audit non-null.

### 2.6 Acceptance criteria Modul 1
- [ ] Generez plan pentru un DM → apar ocurențe corecte în calendar.
- [ ] Status se schimbă automat după dată (PROGRAMAT→SCADENT→DEPASIT).
- [ ] Reprogramare fără motiv ≥5 car. e respinsă.
- [ ] Formular Nr. 5 PDF cu grila Ian–Dec, diacritice corecte.
- [ ] Audit log cu `userId` ne-null. Teste verzi.

---

## 3. MODULUL 2 — Execuție MPP (Procedura MDM Nr. 7 · Formular Nr. 6) — 3 zile

**Scop:** înregistrează efectuarea unei MPP cu checklist + semnătură digitală, scade stocul de consumabile, marchează ocurența EFECTUAT și actualizează `lastMaintenanceAt`.

### 3.1 Schema DB (0.5 zi)
```prisma
model mpp_executions {
  id              Int       @id @default(autoincrement())
  deviceId        Int
  occurrenceId    Int?
  executedDate    DateTime
  durationMinutes Int?
  checklist       Json      // [{ operatiune, bifat, nota }]
  consumablesUsed Json?     // [{ consumableId, qty }]
  result          String    // FUNCTIONAL | DEFECT
  engineerName    String
  signature       String?   // dataURL semnătură (react-signature-canvas)
  notes           String?
  createdById     Int?
  createdAt       DateTime  @default(now())
  device          devices   @relation(fields: [deviceId], references: [id])
  @@index([deviceId])
  @@index([executedDate])
}
```
Migrare + generate.

### 3.2 Backend (1 zi)
`backend/src/routes/mppExecutions.js`:
- **POST `/api/mpp-executions`** — într-o **singură tranzacție**:
  1. Creează `mpp_executions`.
  2. Update ocurența: `status=EFECTUAT`, `executionId`.
  3. Update device: `lastMaintenanceAt = executedDate`, recalcul `nextMaintenanceAt` (+`maintenanceFreq` luni).
  4. Pentru fiecare `consumablesUsed` → `decrement` stoc (verifică stoc suficient, altfel 400).
  5. (Opțional) inserează și în `maintenance_records` (type=PREVENTIVA) pentru istoric unificat.
  6. Audit log CREATE.
  - Dacă `result=DEFECT` → întoarce flag pentru a sugera deschiderea unui tichet corectiv (Modul 3).
- **GET `/api/mpp-executions/checklist-template/:deviceId`** — template generic (6 operațiuni standard) + posibil specific pe model.
- **GET `/api/mpp-executions/:id/formular6-pdf`** — Formular Nr. 6.

### 3.3 Frontend (1.5 zile)
`frontend/src/pages/MppExecutionForm.jsx`:
- Selectare DM + ocurență (din calendar sau dropdown).
- Dată execuție, durată (min).
- Checklist dinamic (checkbox + notă per operațiune).
- Selector consumabile + cantitate (`/consumables/dropdown`).
- Semnătură digitală (`react-signature-canvas`) → dataURL.
- (Reutilizează upload foto înainte/după din Faza 2, cu antivirus) — opțional.
- La submit DEFECT → propune „Deschide tichet corectiv".

### 3.4 PDF Formular Nr. 6 (Fișă de mentenanță DM)
Conform Anexa 2: pașaport DM (denumire, serie, inventar, cod, secție, clasă, garanție, furnizor, sursă finanțare) + tabel operațiuni (Nr | Descriere operațiune | Data/Ora început | Data/Ora final | Responsabil + semnătură).

### 3.5 Teste + Acceptance
`mppExecutions.test.js` ≥6 teste: tranzacție scade stoc corect, stoc insuficient → 400, ocurența devine EFECTUAT, `lastMaintenanceAt` actualizat, audit non-null.
- [ ] Execuție completă → ocurența EFECTUAT (albastru în calendar).
- [ ] Stocul de consumabile scade exact.
- [ ] Semnătura se salvează și apare în PDF-ul Formular Nr. 6.

---

## 4. MODULUL 3 — Mentenanță Corectivă (Procedura MDM Nr. 8 · Formular Nr. 7 + Nr. 8) — 4 zile

**Scop:** ticketing de defecțiuni cu state machine, jurnal de chemări (Formular Nr. 7) și fișă de deservire/bon de reparație internă (Formular Nr. 8).

### 4.1 Schema DB (0.5 zi)
```prisma
model repair_tickets {
  id            Int       @id @default(autoincrement())
  ticketNumber  String    @unique          // ex. MC-2026-0001
  deviceId      Int
  sectionId     Int?
  reportedAt    DateTime  @default(now())
  reportedBy    String                       // solicitant (Formular Nr. 7)
  faultDescription String                    // "Solicitarea (scurtă descriere)"
  priority      String    @default("NORMAL") // SCAZUT|NORMAL|RIDICAT|URGENT
  status        String    @default("DESCHIS")// DESCHIS→IN_LUCRU→REZOLVAT→TESTAT→INCHIS (+ ESCALADAT)
  faultCause    String?
  actionsTaken  String?
  partsUsed     Json?     // [{ descriere, qty, costUnit }]
  totalCost     Decimal?
  resolvedAt    DateTime?
  engineerName  String?
  externalized  Boolean   @default(false)   // → leagă Formular Nr. 9 (Modul 5)
  createdById   Int?
  updatedAt     DateTime
  device        devices   @relation(fields: [deviceId], references: [id])
  @@index([status])
  @@index([deviceId])
}
```
Migrare + generate. `ticketNumber` generat secvențial per an.

### 4.2 Backend — state machine (1.5 zile)
`backend/src/routes/repairTickets.js`:
- **POST `/api/repair-tickets`** — creează tichet (status DESCHIS), generează `ticketNumber`; audit.
- **PATCH `/api/repair-tickets/:id/status`** — validează tranzițiile permise:
  - `DESCHIS→IN_LUCRU→REZOLVAT→TESTAT→INCHIS`; orice→`ESCALADAT_EXTERN` (Modul 5).
  - Tranziție invalidă → 400 cu mesaj clar. La `INCHIS` cu `result=funcțional` → opțional update `devices.status=FUNCTIONAL`.
- **PUT `/api/repair-tickets/:id/repair`** — completează `faultCause`, `actionsTaken`, `partsUsed`, `totalCost`, `engineerName`; (opțional scade stoc piese în tranzacție).
- **GET `/api/repair-tickets`** — listă cu filtre (status, deviceId, priority) + paginare.
- **GET `/api/repair-tickets/:id/formular8-pdf`** — Fișă de deservire (Anexa 3).

### 4.3 Frontend (2 zile)
- `frontend/src/pages/RepairTicketsPage.jsx` — **Kanban** pe coloane status (DESCHIS / IN_LUCRU / REZOLVAT / TESTAT / INCHIS), card cu prioritate colorată.
- Formular raportare defecțiune (intake = Formular Nr. 7).
- Detaliu tichet → editare reparație + butoane de tranziție (doar tranziții valide active).
- Buton „Externalizează" → Modul 5.
- Pagina/registru „Jurnal chemări" (Formular Nr. 7) = listă tabelară a tichetelor.

### 4.4 PDF-uri
- **Formular Nr. 7** (Jurnal chemări, Anexa 23): tabel `Nr | Data/ora | Denumire DM defect/Cod | Secția/Solicitant | Solicitarea | Nivel prioritate | Data/ora îndeplinire | Inginer responsabil | Măsuri întreprinse | Stare (F/N)`.
- **Formular Nr. 8** (Fișă de deservire, Anexa 3): instituție, secție, DM (cod/serie/inventar), descriere defecțiune, cauză, raport reparație (acțiuni: data+ore, total ore), materiale (descriere, cantitate, cost unitar, total), testare după reparație (funcțional/nefuncțional), comentarii, nume + semnătură.

### 4.5 Teste + Acceptance
`repairTickets.test.js` ≥12 teste (focus pe edge-cases state machine: tranziții invalide respinse).
- [ ] Tichet trece corect prin toate stările; tranziții invalide → 400.
- [ ] `ticketNumber` unic și secvențial.
- [ ] Formular Nr. 7 și Nr. 8 generate corect.

---

## 5. MODULUL 4 — Verificări Periodice & Metrologie (Anexa 24 + 25) — 3 zile

**Scop:** registru de verificări periodice (laborator) și metrologice, cu buletin/certificat și alerte de expirare. Ghidul distinge clar **două tipuri** (cap. 3.6).

### 5.1 Schema DB (0.5 zi)
Adaugă pe `devices`: `requiresVerification Boolean @default(false)`, `verificationType String?` (LABORATOR|METROLOGIC), `verificationFreqMonths Int?`, `lastVerificationAt DateTime?`, `nextVerificationAt DateTime?`.
```prisma
model verifications {
  id            Int       @id @default(autoincrement())
  deviceId      Int
  type          String    // LABORATOR | METROLOGIC
  performedAt   DateTime
  validUntil    DateTime
  result        String    // CONFORM | NECONFORM
  certificateNo String?   // nr. buletin/certificat de verificare
  inspectionBody String?  // organism de inspecție tip A (ISO 17020) / lab metrologic
  reportUrl     String?   // PDF buletin (servit autentificat)
  notes         String?
  createdById   Int?
  createdAt     DateTime  @default(now())
  device        devices   @relation(fields: [deviceId], references: [id])
  @@index([deviceId])
  @@index([validUntil])
  @@index([result])
}
```
Migrare + generate.

### 5.2 Backend (1 zi)
`backend/src/routes/verifications.js`:
- **POST `/api/verifications`** — creează înregistrare; calculează `validUntil = performedAt + verificationFreqMonths`; update device `lastVerificationAt`/`nextVerificationAt`; audit. NECONFORM → opțional `devices.status=DEFECT` (Ghid: se interzice utilizarea DM neconform).
- **GET `/api/verifications`** — filtre (type, result, deviceId).
- **GET `/api/verifications/compliance-report`** — raport conformitate (DM care necesită verificare, status: valabil / expiră curând / expirat / neconform).
- **GET `/api/verifications/:id/certificate`** — servire autentificată a PDF buletin.

### 5.3 Frontend (1 zi)
`frontend/src/pages/VerificationsPage.jsx`: registru + filtre + badge status valabilitate; raport conformitate descărcabil; upload buletin (antivirus).

### 5.4 Teste + Acceptance
`verifications.test.js` ≥5 teste.
- [ ] `validUntil` calculat corect din frecvență.
- [ ] Raport conformitate clasifică corect (valabil/expiră/expirat/neconform).
- [ ] NECONFORM marchează DM-ul corespunzător.

---

## 6. MODULUL 5 — Contracte Mentenanță Externă (Procedura MDM Nr. 4 · Formular Nr. 9) — 2 zile

**Scop:** furnizori + contracte de service cu rating, analiză cost, și Actul de predare-primire la externalizare (Formular Nr. 9).

### 6.1 Schema DB (0.5 zi)
```prisma
model service_providers {
  id        Int      @id @default(autoincrement())
  name      String
  contact   String?
  email     String?
  phone     String?
  ratingAvg Decimal? // medie din provider_ratings
  createdAt DateTime @default(now())
  updatedAt DateTime
  contracts service_contracts[]
  ratings   provider_ratings[]
}
model service_contracts {
  id         Int      @id @default(autoincrement())
  providerId Int
  contractNo String
  startDate  DateTime
  endDate    DateTime
  value      Decimal?
  currency   String   @default("MDL")
  slaHours   Int?
  scope      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime
  provider   service_providers @relation(fields: [providerId], references: [id], onDelete: Cascade)
  @@index([endDate])
}
model provider_ratings {
  id         Int      @id @default(autoincrement())
  providerId Int
  score      Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now())
  provider   service_providers @relation(fields: [providerId], references: [id], onDelete: Cascade)
}
```
Migrare + generate.

### 6.2 Backend (1 zi)
`backend/src/routes/serviceContracts.js`:
- CRUD furnizori + contracte; POST rating → recalcul `ratingAvg`.
- **GET `/api/service-contracts/cost-analysis`** — cost total/furnizor, contracte active vs expirate.
- **GET `/api/repair-tickets/:id/formular9-pdf`** — Act predare-primire externalizare (leagă tichetul externalizat de Modul 3).

### 6.3 Frontend (0.5 zi)
`frontend/src/pages/ServiceContractsPage.jsx`: listă furnizori + contracte, rating (stele), alertă contracte ce expiră.

### 6.4 PDF Formular Nr. 9 (Anexa 21)
Nr. act + dată, beneficiar, contract nr., tabel DM (denumire, producător, nr. serie, cod, nr. inventar, localizare), descrierea stării fizice la predare, consumabile/accesorii incluse, predat/primit (nume + semnătură).

### 6.5 Teste + Acceptance
`serviceContracts.test.js` ≥6 teste.
- [ ] Rating recalculează media corect.
- [ ] Cost-analysis corect. Formular Nr. 9 generat.

---

## 7. Cross-cutting — Cron Jobs (0.5 zi, integrat)

`backend/src/jobs/maintenanceNotifications.js` cu `node-cron`, zilnic 08:00 `Europe/Chisinau`:
- `checkMppDue` — ocurențe MPP scadente în ≤7 zile.
- `checkVerificationExpiry` — verificări ce expiră în 60 / 30 / 7 zile.
- `checkContractExpiry` — contracte ce expiră în ≤30 zile.
- Output: tabel `alerts` în DB sau log + (viitor) email. Frontend: `AlertsWidget` existent extins pe dashboard.
Test: `jobs/notifications.test.js` ≥4 teste (mock dată).

---

## 8. Integrare frontend & rute

Adaugă în `App.jsx` (toate sub `ProtectedRoute`):
`/maintenance/calendar`, `/maintenance/execute`, `/maintenance/tickets`, `/maintenance/verifications`, `/maintenance/contracts`.
Actualizează meniul/navigarea și `MaintenancePage.jsx` ca hub cu carduri către cele 5 sub-module.
Montează în `index.js` (cu `authMiddleware`): `maintenancePlans`, `mppExecutions`, `repairTickets`, `verifications`, `serviceContracts`.

---

## 9. Secvențiere recomandată (16 zile)

| Zi | Activitate |
|---|---|
| 0 | Dependințe + schema devices (verification fields) + migrare |
| 1–4 | **Modul 1** Plan MPP (schema → backend → calendar → PDF Nr.5 → teste) |
| 5–7 | **Modul 2** Execuție MPP (schema → tranzacție stoc → checklist+semnătură → PDF Nr.6 → teste) |
| 8–11 | **Modul 3** Corectiv (schema → state machine → Kanban → PDF Nr.7+Nr.8 → teste) |
| 12–14 | **Modul 4** Verificări (schema → backend → registru → raport conformitate → teste) |
| 15–16 | **Modul 5** Contracte (schema → CRUD+rating → PDF Nr.9 → teste) + Cron jobs + integrare finală |

---

## 10. Definiția lui „Faza 3 = 100%"

Faza 3 este completă când TOATE de mai jos sunt bifate:

- [ ] 5 module funcționale end-to-end (UI → API → DB).
- [ ] 5 formulare PDF corecte și cu diacritice: Nr. 5, 6, 7, 8, 9.
- [ ] State machine corectiv cu tranziții validate.
- [ ] Generator plan + calendar cu status automat.
- [ ] Execuție MPP cu tranzacție de stoc + semnătură digitală.
- [ ] Registru verificări (laborator + metrologic) + raport conformitate + alerte.
- [ ] Contracte + rating furnizori + analiză cost.
- [ ] Cron jobs zilnice (MPP/verificări/contracte).
- [ ] Toate regulile §0 respectate în fiecare endpoint nou.
- [ ] Teste: ≥95% coverage backend pe modulele noi; ≥1 test verifică `audit_logs.userId` ne-null; toate verzi (`npm test`).
- [ ] ≥1 scenariu E2E: login → generează plan → execută MPP → deschide tichet → reparație → PDF.
- [ ] `tasks/todo.md` actualizat; commit pe `dev`.

---

**Referințe Ghid:** cap. 3.3 (planificare MPP), 3.4 (implementare MPP), 3.5 (corectivă), 3.6 (verificări periodice + metrologice); Anexele 2, 3, 16, 21, 23 (Formulare Nr. 6, 8, 5, 9, 7); Procedurile MDM Nr. 4, 6, 7, 8.
