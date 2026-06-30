# Plan Detaliat — Faza 7: Procurement (Planificare, Procurare & Instalare)

**Versiune:** 1.0 · **Creat:** 2026-06-19 · **Bază normativă:** Ghidul bioinginerului, Ordinul MS nr. 889/2024
**Durată estimată:** 8–10 zile lucrătoare (2 module) · **Scop:** acoperirea **Capitolului 2** din Ghid (planificarea procurării + darea în exploatare).

> **Audit care a generat acest plan:**
> - **SIMDM (cod):** NU există modul de procurement. `devices` are deja câmpuri de achiziție (`acquisitionDate`, `acquisitionValue`, `warrantyEndDate`, `countryOfOrigin`, `yearMade`, `invoiceUrl`) — le reutilizăm la darea în exploatare. Nu există planificare procurare, recepție, sau dare în exploatare.
> - **Ghid:** Cap. 1 (context, N/A) ✅; Cap. 3 (mentenanță) ✅ Faza 2–6. Rămâne neacoperit **Cap. 2** — Procedurile MDM **Nr. 2** (planificare procurare) și **Nr. 3** (dare în exploatare), Formularele **Nr. 1, 2, 3, 4**. Structurile lor au fost citite din Ghid și sunt reflectate mai jos.

---

## 0. Reguli obligatorii (din lecțiile auditelor 1–6)

1. **`req.user.sub`** pentru id utilizator (NU `req.user.id`).
2. **Validare id cu Zod** (`z.coerce.number().int().positive()`) → 400.
3. **`prisma.$transaction([...])`** pentru orice operație + audit log (atomic).
4. **Audit log** la fiecare CREATE/UPDATE/DELETE (`userId = req.user.sub`, ne-null).
5. **Validare body cu Zod** (schema per resursă).
6. **Mesaje utilizator în română**, cod în engleză.
7. **PDF cu font TTF** (`times.ttf`) pentru diacritice; servire autentificată.
8. **Export CSV** cu `escapeCSVField`.
9. **Teste** per rută (țintă ≥90%) — un test verifică `audit_logs.userId` ne-null.
10. Fără librării noi (pdfkit, zod, multer, xlsx există deja).

---

## 1. Pre-requisite & schema (Ziua 0–1)

**Modele noi** (migrare `add_phase7_procurement`):

```prisma
model procurement_plans {
  id            Int       @id @default(autoincrement())
  year          Int
  sectionId     Int?
  type          String    // DM | CONSUMABIL  (Formular Nr.1 vs Nr.2)
  status        String    @default("DRAFT")   // DRAFT|COORDONAT|APROBAT
  elaboratedBy  String?   // bioinginer
  coordSection  String?   // șef secție medicală
  coordSibm     String?   // șef D/SIBM
  approvedAt    DateTime?
  totalAmount   Decimal?  // sumă totală estimată (recalculată din items)
  createdById   Int?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime
  section       sections? @relation(fields: [sectionId], references: [id])
  createdBy     users?    @relation(fields: [createdById], references: [id])
  items         procurement_items[]
  @@index([year])
  @@index([type])
  @@index([status])
}

model procurement_items {
  id            Int       @id @default(autoincrement())
  planId        Int
  name          String                     // denumire DM / consumabil
  specification String?                     // spec tehnică / cod (Nr.1) sau caracteristici (Nr.2)
  quantity      Int       @default(1)
  unit          String?                     // unitate de măsură (Nr.2)
  funding       String?                     // BUGETARA | EXTRABUGETARA (Nr.1)
  unitPrice     Decimal?                    // preț estimativ/unitate MDL
  totalPrice    Decimal?                    // sumă estimativă MDL (quantity * unitPrice)
  createdAt     DateTime  @default(now())
  plan          procurement_plans @relation(fields: [planId], references: [id], onDelete: Cascade)
  @@index([planId])
}

model commissioning_records {
  id                Int       @id @default(autoincrement())
  deviceId          Int
  installDate       DateTime?
  warrantyMonths    Int?
  contractNo        String?
  contractDate      DateTime?
  // checklist Formular Nr.4 (DA/NU)
  conformityOk      Boolean   @default(false)
  operationTestOk   Boolean   @default(false)
  operationManual   Boolean   @default(false)
  serviceManual     Boolean   @default(false)
  trainingDone      Boolean   @default(false)
  trainees          Json?     // [{ name, role, signature? }]
  commissionMembers String?   // componența comisiei
  commissionDecision String?  // decizia comisiei
  comments          String?
  // act predare-primire (Formular Nr.3) opțional
  handoverActNo     String?
  supplier          String?
  createdById       Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime
  device            devices   @relation(fields: [deviceId], references: [id])
  createdBy         users?    @relation(fields: [createdById], references: [id])
  @@index([deviceId])
}
```
Relații inverse pe `sections`, `users`, `devices`. Migrare: `npx prisma migrate dev --name add_phase7_procurement && npx prisma generate`.

---

## 2. MODULUL A — Planificare procurare (Procedura MDM Nr. 2 · Formulare Nr. 1 + Nr. 2) — 4 zile

**Scop:** planuri anuale de procurare pentru DM (Formular Nr. 1) și consumabile/piese (Formular Nr. 2), cu calcul automat al sumelor și flux de coordonare/aprobare.

### 2.1 Backend — `backend/src/routes/procurement.js` (montat cu `authMiddleware`)
- **POST `/api/procurement/plans`** — body Zod `{ year, type (DM|CONSUMABIL), sectionId?, elaboratedBy? }` → creează plan (status DRAFT) + audit.
- **GET `/api/procurement/plans`** — listă cu filtre (`?year=`, `?type=`, `?status=`) + paginare.
- **GET `/api/procurement/plans/:id`** — detalii cu `items` + `section`.
- **POST `/api/procurement/plans/:id/items`** — adaugă rând: `{ name, specification?, quantity, unit?, funding?, unitPrice? }`:
  - `$transaction`: creează item (`totalPrice = quantity * unitPrice`) + recalculează `plan.totalAmount` + audit.
- **PUT `/api/procurement/items/:id`** / **DELETE `/api/procurement/items/:id`** — editare/ștergere rând + recalcul total + audit.
- **PATCH `/api/procurement/plans/:id/status`** — tranziție `DRAFT → COORDONAT → APROBAT` (validată, ca state machine); la APROBAT setează `approvedAt` + `coordSection`/`coordSibm`; audit.
- **GET `/api/procurement/plans/:id/pdf`** — Formular Nr. 1 sau Nr. 2 (după `type`), vezi 2.2.

### 2.2 PDF Formular Nr. 1 / Nr. 2 (Anexa 6 / 7)
- **Nr. 1 (DM):** titlu „Plan de procurare a dispozitivelor medicale pentru anul 20__"; antet `Nr | Denumire DM | Specificația tehnică / Cod | Cantitatea | Finanțare (bugetară/extrabugetară) | Preț estimativ MDL | Suma estimativă MDL`; rând TOTAL; semnături (Bioinginer / Șef secție / Șef D/SIBM) + dată.
- **Nr. 2 (consumabile):** titlu „Plan de procurare a consumabilelor și pieselor de schimb..."; antet `Nr | Denumire | Caracteristici | Cantitatea | Unitatea de măsură | Preț estimativ/unitate MDL | Suma estimată MDL`; TOTAL + aceleași semnături. Font TTF cu diacritice.

### 2.3 Frontend — `frontend/src/pages/ProcurementPage.jsx` (rută `/procurement`, nav)
- Listă planuri (an, tip badge DM/CONSUMABIL, status badge DRAFT/COORDONAT/APROBAT, total).
- Detaliu plan: tabel editabil de rânduri (adaugă/editează/șterge), total auto-calculat live, buton tranziție status, buton „Descarcă Formular Nr. 1/2 (PDF)".
- Empty state + skeleton; token-uri DESIGN.md, dark mode.

### 2.4 Teste
`procurement.test.js` ≥10: creare plan + audit ne-null; adăugare item recalculează totalul; tranziție status invalidă → 400; filtrare; id invalid → 400; PDF Nr.1 și Nr.2 → 200.

---

## 3. MODULUL B — Recepție & Dare în exploatare (Procedura MDM Nr. 3 · Formulare Nr. 3 + Nr. 4) — 4 zile

**Scop:** procesul de recepție (Act predare-primire, Formular Nr. 3) și dare în exploatare a DM (Formular Nr. 4), cu checklist de conformitate; la finalizare DM devine `FUNCTIONAL` și i se completează datele de achiziție.

### 3.1 Backend — `backend/src/routes/commissioning.js`
- **POST `/api/commissioning`** — body Zod `{ deviceId, installDate, warrantyMonths?, contractNo?, contractDate?, conformityOk, operationTestOk, operationManual, serviceManual, trainingDone, trainees?, commissionMembers?, commissionDecision?, comments?, handoverActNo?, supplier? }`:
  - Verifică device există (404).
  - `$transaction`: creează `commissioning_records` + actualizează `devices` (`status='FUNCTIONAL'`, `acquisitionDate=installDate`, `warrantyEndDate = installDate + warrantyMonths luni`) + audit CREATE.
- **GET `/api/commissioning`** — listă + filtre (`?deviceId=`) + paginare.
- **GET `/api/commissioning/:id`** — detalii cu device.
- **GET `/api/commissioning/:id/formular4-pdf`** — Formular Nr. 4 (dare în exploatare).
- **GET `/api/commissioning/:id/formular3-pdf`** — Formular Nr. 3 (act predare-primire), dacă `handoverActNo` setat.

### 3.2 PDF-uri
- **Formular Nr. 4 (Anexa 10):** Beneficiar/Executor, Date dispozitiv (denumire, model, producător, an, serie, nr inventar, preț — din `device`), secțiune Inspecție/Test/Training cu checkbox-uri (Conformitate DA/NU, Test operare DA/NU, Manual operare/limbă, Manual deservire, Training + listă persoane), comisia, decizia, semnături beneficiar/executor.
- **Formular Nr. 3 (Anexa 9):** Act predare-primire — nr act + dată, predător (în calitate de…) / beneficiar, tabel `Nr | Denumire | Descriere | Cantitate`, confirmare + semnături.

### 3.3 Frontend — `frontend/src/pages/CommissioningPage.jsx` (rută `/commissioning`, nav)
- Listă recepții/dări în exploatare (DM, dată instalare, garanție, status conformitate).
- Modal „Dă în exploatare DM": select DM (autocomplete), dată instalare, garanție, contract, checklist (toggle-uri), listă training, comisie + decizie.
- Acțiune din fișa DM: buton „Dă în exploatare" (pre-completează deviceId).
- Butoane „Descarcă Formular Nr. 4 / Nr. 3 (PDF)". Empty state + skeleton; token-uri DESIGN.md.

### 3.4 Teste
`commissioning.test.js` ≥8: dare în exploatare → device FUNCTIONAL + acquisitionDate/warranty setate + audit ne-null; device inexistent → 404; id invalid → 400; PDF Nr.4 → 200; Nr.3 fără handoverActNo → comportament definit.

---

## 4. Integrare & rute
- `index.js`: montează `procurement`, `commissioning` cu `authMiddleware`.
- `App.jsx`: rute `/procurement`, `/commissioning` (sub `ProtectedRoute`) + linkuri meniu (iconuri `ShoppingCart`, `PackageCheck`).
- (Opțional) Dashboard: card „planuri de procurare APROBATE anul curent".
- (Opțional) Modul Documente: planurile/actele generate pot fi salvate în DMS (categorie `RAPORT`/`CONTRACT`).

---

## 5. Definiția lui „Faza 7 = 100%"
- [ ] Schema: `procurement_plans`, `procurement_items`, `commissioning_records` + migrare aplicată.
- [ ] Modul A: planuri DM + consumabile, rânduri cu total auto, flux DRAFT→COORDONAT→APROBAT, Formular Nr. 1 și Nr. 2 PDF.
- [ ] Modul B: dare în exploatare → device FUNCTIONAL + date achiziție; Formular Nr. 3 și Nr. 4 PDF.
- [ ] Toate regulile §0 respectate (sub, tranzacții, audit ne-null, Zod, PDF diacritice, fișiere autentificate).
- [ ] Pagini frontend conforme DESIGN.md (token-uri, dark mode, empty/skeleton).
- [ ] Teste ≥90% pe modulele noi; `npm test` verde backend + frontend; un test verifică `audit_logs.userId` ne-null.
- [ ] README/INDEX/todo actualizate (Faza 7 → DONE); **Cap. 2 din Ghid 100% acoperit**.

---

## 6. Ordine de implementare
1. Schema + migrare (§1).
2. Modul A — Planificare procurare (Formulare Nr. 1, 2) — fluxul „înainte de achiziție".
3. Modul B — Dare în exploatare (Formulare Nr. 3, 4) — fluxul „după achiziție", închide ciclul (procurare → instalare → inventar → mentenanță).
4. Teste + actualizare documentație.

---

**Referințe Ghid:** cap. 2.1 (planificarea procurării → Procedura MDM Nr. 2, Formulare Nr. 1 & 2, Anexele 5–7), cap. 2.2–2.3 (procurare, primire, instalare → Procedura MDM Nr. 3, Formulare Nr. 3 & 4, Anexele 8–10). Structurile formularelor au fost citite din Ghid și reflectate în PDF-urile de mai sus. La finalul Fazei 7, ciclul de viață complet al DM (procurare → dare în exploatare → inventar → mentenanță → verificare → casare) este acoperit în SIMDM.
