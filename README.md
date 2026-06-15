# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Versiune:** 4.0 (Claude.ai editorial theme)
**Status:** ✅ **Faza 1-4 COMPLETATE** — Design system implementat, componentele și paginile actualizate
**Actualizat:** 2026-06-13
**Licență:** Privat (instituții de medicină privată, Moldova)

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

### Status Implementare

| Fază | Modul | Status |
|------|-------|--------|
| **1** | Fundație (Auth, DB, Login) | ✅ COMPLETĂ + auditată |
| **2** | Inventar DM (CRUD, export) | ✅ COMPLETĂ + auditată |
| **QW** | Module quick-win (Mentenanță, Incidente, Audit Logs) | ✅ COMPLETĂ |
| **3** | Mentenanță completă (Calendar, Semnătură, Formulare) | ✅ COMPLETĂ + auditată |
| **4** | Design System (Cream/Coral theme, componente, pagini) | ✅ COMPLETĂ |
| **5-8** | Documente, Procurement, Dashboard, QA | ⬜ PLANNED |

### Caracteristici

- **Login sigur** — JWT + bcrypt, refresh tokens, account lockout
- **Inventar DM** — CRUD complet, 6 statusuri, 4 clase risc, export CSV/XLSX/PDF
- **Mentenanță** — Plan preventiv + calendar, execuție cu semnătură, ticketing Kanban
- **Verificări periodice** — Registru, metrologie, alerte cron 60/30/7 zile
- **Contracte externe** — CRUD furnizori, rating, analiză cost
- **Accesibilitate** — WCAG 2.2 AA, keyboard navigation, screen reader
- **Dark/Light mode** — Complet funcțional, cream canvas default
- **176 backend tests** + **103 frontend tests** + **15 E2E tests**

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
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev

# Frontend (alt terminal)
cd frontend && npm install && npm run dev
```

---

## Structura Proiectului

```
simdm/
├── DESIGN.md                    # Sursa de adevăr pentru design
├── backend/                     # Express.js + Prisma + PostgreSQL
├── frontend/                    # React 19 + Vite + Tailwind + Shadcn
├── docs/                        # Documentație tehnică
│   ├── DESIGN-SYSTEM.md         # Implementare CSS
│   ├── ACCESSIBILITY-CHECKLIST.md  # WCAG 2.2 checklist
│   ├── 2-DEVELOPER-GUIDE.md     # Patterns frontend/backend
│   └── MOBILE_WORKFLOW_GUIDE.md # Flux teren
├── tasks/                       # Planuri fază
└── docker-compose.yml
```

---

## Documentație

| Document | Audiență | Conținut |
|----------|----------|----------|
| [`DESIGN.md`](DESIGN.md) | AI agents, dev | Token-uri, componente, layout — sursa de adevăr |
| [`CLAUDE.md`](CLAUDE.md) | AI + dev | Reguli de cod + design |
| [`SPEC.md`](SPEC.md) | Arhitecți | Stivă tech, schema DB |
| [`tasks/todo.md`](tasks/todo.md) | Dev | Checklist progres |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Frontend dev | CSS tokens, componente |
| [`docs/ACCESSIBILITY-CHECKLIST.md`](docs/ACCESSIBILITY-CHECKLIST.md) | Toți | WCAG 2.2 checklist |

---

## Testare

```bash
cd backend && npm test           # 176 tests, ≥95% coverage
cd frontend && npm test          # 103 tests, ≥91% coverage
npx playwright test              # 15 E2E scenarios
```

---

## Roadmap

```
Faza 1   ✅ DONE              — Fundație + Auth
Faza 2   ✅ DONE              — Inventar DM
QW       ✅ DONE              — Module quick-win
Faza 3   ✅ DONE              — Mentenanță completă
Faza 4   ✅ DONE              — Design System (Claude.ai theme)
Faza 5   ⬜ PLANNED           — Documente & Proceduri
Faza 6   ⬜ PLANNED           — Procurement
Faza 7   ⬜ PLANNED           — Dashboard & Raportare
Faza 8   ⬜ PLANNED           — QA & Go-Live
```

---

**Următor:** [`DESIGN.md`](DESIGN.md) pentru design system, [`CLAUDE.md`](CLAUDE.md) pentru reguli de cod.
