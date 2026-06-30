# Plan Detaliat — Faza 6: Casare, Raportare & Jurnal de Gardă

**Versiune:** 1.0 · **Creat:** 2026-06-19 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Durată estimată:** 8–10 zile lucrătoare (3 module) · **Scop:** închiderea Capitolului 3 din Ghid.

> **Audit care a generat acest plan:**
> - **SIMDM (cod):** nu există modul de casare/conservare (doar `devices.decommissionDate` + status `CASAT`), niciun raport de activitate, niciun jurnal de gardă.
> - **Ghid:** Cap. 3 e acoperit aproape integral (3.1–3.6 ✅ Faza 2–3). Rămân neacoperite: **3.8 Raportarea activității** (Formular Nr. 12), **3.10 Casarea** (Procedura MDM Nr. 10 + Formular Nr. 10) și **Formular Nr. 11 Jurnal de gardă**. Faza 6 le implementează.

---

## 0. Reguli obligatorii (din lecțiile auditelor 1–5.1)

1. **`req.user.sub`** pentru id utilizator (NU `req.user.id`).
2. **Validare id cu Zod** (`z.coerce.number().int().positive()`) → 400.
3. **`prisma.$transaction([...])`** pentru orice operație + audit log (atomic).
4. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null).
5. **Validare body cu Zod** (schema per resursă).
6. **Mesaje utilizator în română**, cod în engleză.
7. **Servire fișiere/PDF autentificată** (patternul din `documents.js`/`devices.js`).
8. **Export CSV** cu `escapeCSVField`. **PDF** cu font TTF (`times.ttf`) pentru diacritice (ca la `fisa-pdf`).
9. **Teste** per rută (țintă ≥90%) — un test verifică `audit_logs.userId` ne-null.
10. Fără librării noi (pdfkit, zod, multer, xlsx există deja).

---

## 1. Pre-requisite & schema (Ziua 0–1)

**Enum `DeviceStatus`** — adaugă `CONSERVAT` (lângă `CASAT`).

**Model nou `decommission_records`** (Casare/Conservare — Formular Nr. 10):
```prisma
model decommission_records {
  id                Int       @id @default(autoincrement())
  deviceId          Int
  type              String    // DEFECTARE | CONSERVARE | CASARE
  // Secția medicală (Formular Nr.10, câmpuri 1-4)
  nonUsageDate      DateTime?
  // D/SIBM (câmpuri 5-10) — denumire/model/serie se preiau din device
  // Contabilitate (câmpuri 11-16)
  normativeLifespan String?   // termen normativ de exploatare
  commissioningDate DateTime? // data dării în exploatare
  nominalPrice      Decimal?
  currentValue      Decimal?
  // Descriere
  technicalState    String?   // descrierea stării tehnice
  cause             String?   // cauza neutilizării
  notes             String?
  // Semnături (Nume + rol)
  responsibleName   String?
  sectionChief      String?
  engineerName      String?
  sibmChief         String?
  recyclingInfo     String?   // DEEE / reciclare (cap. 3.10)
  createdById       Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime
  device            devices   @relation(fields: [deviceId], references: [id])
  createdBy         users?    @relation(fields: [createdById], references: [id])
  @@index([deviceId])
  @@index([type])
}
```

**Model nou `duty_log_entries`** (Jurnal de Gardă — Formular Nr. 11):
```prisma
model duty_log_entries {
  id              Int       @id @default(autoincrement())
  deviceId        Int?
  deviceName      String    // text liber (ex. "Incubator Amelia Nr1")
  reportedAt      DateTime  @default(now())   // Data/ora utilizator
  faultDescription String                      // Defectul
  reportedBy      String                       // responsabil gardă secție
  // partea inginerului
  resolution      String?                      // soluționarea problemelor
  resolvedAt      DateTime?                     // Data/ora inginer
  engineerName    String?
  repairTicketId  Int?                          // legătură opțională la tichet corectiv
  createdById     Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime
  device          devices?  @relation(fields: [deviceId], references: [id])
  @@index([deviceId])
  @@index([reportedAt])
}
```
Relații inverse pe `devices`/`users`. Migrare: `npx prisma migrate dev --name add_phase6_casare_raport && npx prisma generate`.

---

## 2. MODULUL A — Casare/Conservare (Procedura MDM Nr. 10 · Formular Nr. 10) — 3 zile

**Scop:** procesul de defectare/conservare/casare a unui DM, cu cele 3 secțiuni de date din Ghid și PDF-ul Formular Nr. 10.

### 2.1 Backend — `backend/src/routes/decommission.js` (montat cu `authMiddleware`)
- **POST `/api/decommission`** — body Zod `{ deviceId, type (enum DEFECTARE|CONSERVARE|CASARE), nonUsageDate?, normativeLifespan?, commissioningDate?, nominalPrice?, currentValue?, technicalState?, cause?, notes?, responsibleName?, sectionChief?, engineerName?, sibmChief?, recyclingInfo? }`:
  - Verifică device există (404).
  - `$transaction`: creează `decommission_records` + actualizează `devices.status` (CASARE → `CASAT` + `decommissionDate`; CONSERVARE → `CONSERVAT`; DEFECTARE → `DEFECT`) + audit log CREATE.
- **GET `/api/decommission`** — listă cu filtre (`?type=`, `?deviceId=`) + paginare.
- **GET `/api/decommission/:id`** — detalii (cu device + createdBy).
- **GET `/api/decommission/:id/formular10-pdf`** — Formular Nr. 10 (vezi 2.2).
- (fără DELETE — înregistrările de casare se păstrează pentru audit; eventual soft-update).

### 2.2 PDF Formular Nr. 10 (Anexa 29)
Titlu cu checkbox-uri: „Formular de ☐ defectare ☐ conservare ☐ casare a dispozitivului medical" (bifează tipul). 3 secțiuni-tabel:
- **Secția medicală:** Denumirea instituției, Locația, Nr. inventar, Data de non-utilizare.
- **D/SIBM:** Producător, An producere, Nume dispozitiv, Model, Nr. serie, Nr. inventar (din `device`).
- **Contabilitate:** Cod dispozitiv, Termen normativ exploatare, Data dării în exploatare, Termen exploatare, Preț nominal, Valoarea curentă.
- Apoi: Descrierea stării tehnice, Cauza neutilizării, Notă, + 4 semnături (Persoană responsabilă, Șef secție medicală, Inginer responsabil, Șef D/SIBM). Font TTF cu diacritice.

### 2.3 Frontend — `frontend/src/pages/DecommissionPage.jsx` (rută `/decommission`, nav)
- Listă înregistrări (DM, tip badge: DEFECTARE/CONSERVARE/CASARE, dată, status).
- Modal „Casare/Conservare DM": select DM (autocomplete), tip (radio), câmpuri pe cele 3 secțiuni, descriere + cauză, semnături.
- Acțiune din fișa DM: buton „Casează/Conservă" care pre-completează datele.
- Buton „Descarcă Formular Nr. 10 (PDF)". Empty state + skeleton. Token-uri DESIGN.md, dark mode.

### 2.4 Teste
`decommission.test.js` ≥8: creare CASARE → device CASAT + audit ne-null; CONSERVARE → CONSERVAT; device inexistent → 404; id invalid → 400; tip invalid → 400; filtrare; PDF 200.

---

## 3. MODULUL B — Raport de activitate (3.8 · Formular Nr. 12) — 3 zile

**Scop:** raport agregat al activității D/SIBM pe o perioadă, generat **automat** din datele existente (NU introdus manual), conform Formular Nr. 12.

### 3.1 Backend — `backend/src/routes/activityReport.js`
- **GET `/api/activity-report?from=YYYY-MM-DD&to=YYYY-MM-DD`** — agregă din tabelele existente:
  - **Analiza activității** (Număr + Ore): Total reparații (din `repair_tickets`), MP efectuate (din `mpp_executions`), Testare (din `verifications`), Training (din viitor modul instruiri — 0 acum), Alte. Orele din `repair_tickets.durationHours` / `mpp_executions.durationMinutes`.
  - **Defalcarea cauzelor defecțiunilor** (Număr + Ore): mapează pe categoriile Ghidului — Vechi&stricat, Variații tensiune, Apă/gaz, Defect mecanic, Defect electronic, Instalat incorect, Greșeala utilizatorului, Abuz, Alte. (Adaugă pe `repair_tickets` un câmp opțional `faultCategory` enum pentru clasificare; dacă lipsește → „Alte".)
  - **Analiza timpului** pe intervale (<1h, 1–5h, 5h–1zi, 1zi–săpt, săpt–lună, >lună).
  - Sumar DM instalate (din `devices` cu `acquisitionDate` în perioadă).
  - Audit `READ`/`EXPORT` (opțional).
- **GET `/api/activity-report/formular12-pdf?from=&to=`** — PDF Formular Nr. 12 cu cele 3 tabele + sumar + semnătură. Font TTF.
- (Opțional) **GET `/api/activity-report/export-csv`** cu `escapeCSVField`.

> Notă schema: adaugă `faultCategory String?` pe `repair_tickets` (enum cele 9 categorii din Ghid) — populat la triaj/reparație. Migrare inclusă în §1.

### 3.2 Frontend — `frontend/src/pages/ActivityReportPage.jsx` (rută `/reports`, nav)
- Selectoare perioadă (de la / până la), buton „Generează".
- Afișează cele 3 tabele + carduri-sumar. Buton „Descarcă Formular Nr. 12 (PDF)" + „Export CSV".
- Skeleton + empty state. Token-uri DESIGN.md.

### 3.3 Teste
`activityReport.test.js` ≥6: agregare corectă a numerelor/orelor pe un set seed; perioadă fără date → zero-uri; clasificare cauze; PDF 200; parametri invalizi → 400.

---

## 4. MODULUL C — Jurnal de Gardă (Formular Nr. 11) — 2 zile

**Scop:** registrul de gardă — utilizatorul raportează defecțiunea, inginerul o soluționează; leagă fluxul corectiv.

### 4.1 Backend — `backend/src/routes/dutyLog.js`
- **POST `/api/duty-log`** — body `{ deviceId?, deviceName, faultDescription, reportedBy }` → creează intrare + audit.
- **PATCH `/api/duty-log/:id/resolve`** — body `{ resolution, engineerName }` → setează `resolvedAt=now`, `resolution`, `engineerName`; `$transaction` + audit. (Opțional: creează automat un `repair_tickets` și leagă `repairTicketId`.)
- **GET `/api/duty-log`** — listă cu filtre (`?resolved=true|false`, `?deviceId=`) + paginare.
- **GET `/api/duty-log/formular11-pdf`** — PDF Formular Nr. 11 (tabel cu 2 jumătăți: completează utilizatorul / completează inginerul).

### 4.2 PDF Formular Nr. 11 (Anexa 4)
Tabel: `Data/ora | Denumire DM defectat | Defectul | Responsabil gardă secție (semnătură) | Soluționarea | Data/ora | Responsabil D/SIBM (semnătură)`. Antet cu responsabili. Font TTF.

### 4.3 Frontend — `frontend/src/pages/DutyLogPage.jsx` (rută `/duty-log`, nav)
- Tabel intrări (badge nerezolvat/rezolvat), modal „Raportează defecțiune" (utilizator), modal „Soluționează" (inginer).
- Buton „Descarcă Formular Nr. 11 (PDF)". Skeleton + empty state.

### 4.4 Teste
`dutyLog.test.js` ≥6: creare intrare + audit ne-null; resolve setează `resolvedAt`; filtrare resolved; id invalid → 400; PDF 200.

---

## 5. (Opțional) Completare vigilență (3.9) — 1 zi
Pe `incidents`: adaugă `imdrfCode`/`gmdnCode` + urmărirea termenului de raportare la AMDM (24h). Aliniază cu Anexa 30 (Raportul utilizatorului). Doar dacă se dorește conformitate deplină 3.9 — altfel rămâne pe Faza 8.

---

## 6. Integrare & rute
- `index.js`: montează `decommission`, `activityReport`, `dutyLog` cu `authMiddleware`.
- `App.jsx`: rute `/decommission`, `/reports`, `/duty-log` (sub `ProtectedRoute`) + linkuri în meniu (iconuri: `Archive`, `BarChart3`, `ClipboardList`).
- Pe `Dashboard`: card-sumar „raport activitate luna curentă" (opțional).

---

## 7. Definiția lui „Faza 6 = 100%"
- [ ] Schema: `CONSERVAT` în DeviceStatus + `decommission_records` + `duty_log_entries` + `faultCategory` pe repair_tickets; migrare aplicată.
- [ ] Modul A: casare/conservare end-to-end + Formular Nr. 10 PDF + status device actualizat corect.
- [ ] Modul B: raport agregat automat + Formular Nr. 12 PDF (3 tabele) + export CSV.
- [ ] Modul C: jurnal de gardă (raportare + soluționare) + Formular Nr. 11 PDF.
- [ ] Toate regulile §0 respectate (sub, tranzacții, audit ne-null, Zod, PDF cu diacritice, fișiere autentificate).
- [ ] Pagini frontend conforme DESIGN.md (token-uri, dark mode, empty/skeleton).
- [ ] Teste ≥90% pe modulele noi; `npm test` verde backend + frontend.
- [ ] README/INDEX/todo actualizate (Faza 6 → DONE); Capitolul 3 din Ghid 100% acoperit.

---

## 8. Ordine de implementare
1. Schema + migrare (§1).
2. Modul A — Casare (cel mai legat de Ghid 3.10, închide ciclul de viață al DM).
3. Modul C — Jurnal de gardă (alimentează fluxul corectiv).
4. Modul B — Raport activitate (agregă tot ce există, deci ultimul).
5. Teste + actualizare documentație.

---

**Referințe Ghid:** cap. 3.8 (Raportarea activității D/SIBM → Formular Nr. 12, Anexa 28), cap. 3.10 (Casarea DM → Procedura MDM Nr. 10 + Formular Nr. 10, Anexa 29), Formular Nr. 11 Jurnal de Gardă (Anexa 4). Structurile formularelor au fost citite din Ghid și sunt reflectate în PDF-urile de mai sus.
