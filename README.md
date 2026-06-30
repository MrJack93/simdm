# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Versiune:** 6.0 · **Status:** ✅ **Faza 1-8 COMPLETATE — Production Ready**
**Actualizat:** 2026-06-29 · **Licență:** Privat (instituții de medicină privată, Moldova)

> **Viziune:** SIMDM propriu pentru instituțiile de **medicină privată** — alternativă locală, independentă față de SIMDM-ul național al AMDM (care deservește mai ales IMSP publice). Ghidul bioinginerului (Ordin MS 889/2024) rămâne referința normativă pentru conformitate.

---

## Despre SIMDM

**SIMDM** este o aplicație web modernă pentru gestionarea centralizată a dispozitivelor medicale (DM), concepută special pentru bioinginerul medical al unui spital privat din Moldova.

Înlocuiește evidența pe hârtie și foile Excel cu o bază de date securizată, conform standardelor din **Ghidul Bioinginerului — Ordinul MS nr. 889/2024** (Republica Moldova).

### Design System — Claude.ai Editorial Theme

Frontend-ul folosește un design **editorial/warm** inspirat de Claude.ai:
- **Canvas:** Cream (#faf9f5) — warm, deliberat nu alb pur
- **Accent:** Coral (#cc785c) — doar pe CTA-uri primare
- **Display:** Cormorant Garamond serif (weight 400, negative tracking)
- **Body:** Inter sans (weight 400-500)
- **Dark mode:** Complet funcțional cu `[data-theme="dark"]`

**Sursa de adevăr:** [`DESIGN.md`](DESIGN.md) la rădăcina proiectului.

---

## Status Implementare

| Fază | Modul | Status |
|------|-------|--------|
| **1** | Fundație (Auth, DB, Login) | ✅ COMPLETĂ + auditată |
| **2** | Inventar DM (CRUD, export) | ✅ COMPLETĂ + auditată |
| **QW** | Module quick-win (Mentenanță, Incidente, Audit Logs) | ✅ COMPLETĂ |
| **3** | Mentenanță completă (Calendar, Semnătură, Formulare) | ✅ COMPLETĂ + auditată |
| **4** | Design System (Cream/Coral theme, componente, pagini) | ✅ COMPLETĂ |
| **5** | Documente & Proceduri (DMS) | ✅ COMPLETĂ |
| **5.1** | DMS Hardening (Hash SHA-256, Expirare, Acces log) | ✅ COMPLETĂ |
| **6** | Casare, Raportare Activitate, Jurnal Gardă | ✅ COMPLETĂ |
| **7** | Procurement (Planificare) + Dare în exploatare | ✅ COMPLETĂ |
| **8** | Dashboard KPI, Hardening Go-Live, QA | ✅ COMPLETĂ |

---

## Caracteristici

### Securitate & Auth
- **Login JWT** cu refresh tokens, account lockout (5 încercări / 15 min)
- **Schimbare obligatorie parolă** la prima logare (mustChangePassword)
- **ClamAV** — scanare antivirus pentru fișiere încărcate
- **Audit log** — jurnal complet al tuturor operațiilor (CREATE/UPDATE/DELETE/FILE_ACCESS/VERIFY)

### Inventar & Mentenanță
- **CRUD complet DM** — 6 statusuri (FUNCTIONAL, IN_REPARATIE, DEFECT, CASAT, CONSERVAT, IMPRUMUTAT), 4 clase risc
- **Export** — CSV (anti formula-injection), XLSX, PDF fișă DM
- **Mentenanță preventivă** — Plan anual, calendar interactiv, execuție cu semnătură digitală
- **Ticketing Kanban** — Defecțiuni → triaj intern/extern → reparație → testare → închidere
- **Verificări periodice** — Registru, metrologie, alerte cron 60/30/7 zile
- **Contracte externe** — CRUD furnizori, rating 1-5, analiză cost intern vs extern

### DMS & Conformitate
- **Bibliotecă documente** — Upload, versionare (self-relation), 8 categorii, căutare + filtre
- **Integritate SHA-256** — hash calculat la upload, verificare endpoint `/verify`
- **Expirare documente** — validUntil pe CERTIFICAT/CONTRACT, alerte cron, badge UI
- **Jurnal de acces** — trasabilitate descărcări + audit trail per document

### Ciclul de viață DM (Cap. 2-3 din Ghid)
- **Planificare procurare** — Formulare Nr. 1 (DM) + Nr. 2 (consumabile), flux DRAFT→COORDONAT→APROBAT
- **Dare în exploatare** — Checklist conformitate, Formulare Nr. 3 + Nr. 4
- **Casare/Conservare** — Formular Nr. 10, actualizare status device automat

### Dashboard & Raportare
- **Dashboard KPI** — 13 indicatori real-time (DM pe status, MPP scadente, verificări expirate, etc.)
- **Raport activitate** — Agregare automată + Formular Nr. 12 PDF
- **Jurnal de gardă** — Raportare defecțiuni + soluționare + Formular Nr. 11 PDF

### Infrastructură
- **WCAG 2.2 AA** — keyboard navigation, screen reader, contrast ≥ 4.5:1
- **Dark/Light mode** — complet funcțional, cream canvas default
- **Backup/Restore** — `npm run db:backup` / `npm run db:restore`
- **GO-LIVE-CHECKLIST** — 25 item-uri de verificat înainte de deploy

---

## Pornire Rapidă

### Docker (5 minute — RECOMANDAT)

```bash
git clone <repo> && cd simdm
docker-compose up --build
# Login: admin / admin la http://localhost:5173
```

### Local (10-15 minute)

```bash
# Backend
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run db:seed:docs && npm run dev

# Frontend (alt terminal)
cd frontend && npm install && npm run dev
```

---

## Structura Proiectului

```
simdm/
├── DESIGN.md                    # Sursa de adevăr pentru design
├── backend/                     # Express.js + Prisma + PostgreSQL
│   ├── src/routes/              # 14 module API (devices, documents, procurement...)
│   ├── src/jobs/                # Cron jobs (notificări, verificări)
│   ├── scripts/                 # Backup/Restore
│   └── prisma/schema/           # Schema DB
├── frontend/                    # React 19 + Vite + Tailwind
│   ├── src/pages/               # 25+ pagini
│   └── e2e/                     # Playwright E2E tests
├── docs/                        # Documentație tehnică
├── tasks/                       # Planuri fază
└── docker-compose.yml
```

---

## Documentație

| Document | Audiență | Conținut |
|----------|----------|----------|
| [`DESIGN.md`](DESIGN.md) | AI + dev | Token-uri, componente, layout — sursa de adevăr |
| [`CLAUDE.md`](CLAUDE.md) | AI + dev | Reguli de cod + design |
| [`SPEC.md`](SPEC.md) | Arhitecți | Stivă tech, schema DB, endpoint-uri |
| [`GETTING-STARTED.md`](GETTING-STARTED.md) | Bioinginer, dev | Setup rapid Docker/local |
| [`docs/GO-LIVE-CHECKLIST.md`](docs/GO-LIVE-CHECKLIST.md) | DevOps | Checklist deploy producție |
| [`docs/IMPORT-DATE-REALE.md`](docs/IMPORT-DATE-REALE.md) | Bioinginer | Import inventar real (XLSX/CSV) |
| [`docs/2-DEVELOPER-GUIDE.md`](docs/2-DEVELOPER-GUIDE.md) | Dev | Patterns frontend/backend |
| [`docs/TESTING.md`](docs/TESTING.md) | Dev | Ghid testare complet |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Frontend dev | CSS tokens, componente |

---

## Testare

```bash
cd backend && npm test           # 1033 tests, ≥90% coverage
cd frontend && npm test          # 127+ tests, ≥90% coverage
npx playwright test              # 7 E2E scenarios (lifecycle complet)
```

---

## Roadmap (Complet)

```
Faza 1   ✅ DONE  — Fundație + Auth + Audit securitate
Faza 2   ✅ DONE  — Inventar DM (CRUD, export, PDF)
QW       ✅ DONE  — Module quick-win (Mentenanță, Incidente, Audit Logs)
Faza 3   ✅ DONE  — Mentenanță completă (Calendar, Semnătură, Formulare Nr. 5-9)
Faza 4   ✅ DONE  — Design System (Claude.ai editorial theme)
Faza 5   ✅ DONE  — Documente & Proceduri (DMS) + seed documente normative
Faza 5.1 ✅ DONE  — DMS Hardening (Hash SHA-256, Expirare, Acces log, Metadate)
Faza 6   ✅ DONE  — Casare (Formular Nr. 10) + Raport Activitate (Nr. 12) + Jurnal Gardă (Nr. 11)
Faza 7   ✅ DONE  — Procurement (Formulare Nr. 1-2) + Dare în exploatare (Formulare Nr. 3-4)
Faza 8   ✅ DONE  — Dashboard KPI + Hardening Go-Live + QA + E2E + Import date
```

**Capitolele 2 și 3 din Ghidul Bioinginerului sunt 100% acoperite. Toate Formularele Nr. 1-12 sunt implementate.**

---

**Următor:** [`DESIGN.md`](DESIGN.md) pentru design system, [`CLAUDE.md`](CLAUDE.md) pentru reguli de cod.
