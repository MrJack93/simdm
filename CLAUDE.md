# CLAUDE.md - SIMDM

Acest fișier oferă context pentru Claude Code despre proiectul SIMDM.
Citește-l complet înainte de a scrie sau modifica cod.

---

## Despre proiect

**SIMDM** = Sistem Informațional de Management al Dispozitivelor Medicale.

Aplicație web pentru **bioinginerul medical** din **instituții de medicină privată**,
conform **Ghidului Bioinginerului** (Republica Moldova, Ordinul MS nr. 889 din 31.10.2024).

### Context critic
- **UTILIZATOR UNIC (MVP).** NU implementa RBAC sau înregistrare de utilizatori.
- **RULEAZĂ LOCAL.** Hosting pe localhost sau rețea locală spital.
- **DATE MEDICALE.** Tratează integritatea datelor cu seriozitate.
- **LIMBA.** Interfața în română, codul în engleză.

---

## Stivă tehnologică

| Strat | Tehnologie |
|-------|------------|
| Frontend | React 19 + Vite 8 + TailwindCSS 4 |
| Backend | Node.js 22 LTS + Express 5.2 |
| Bază de date | PostgreSQL 16 |
| ORM | Prisma 7.8 |
| Auth | JWT + bcryptjs (12 rounds) |
| Testing | Vitest + React Testing Library + Playwright |
| Containerization | Docker Compose |

---

## Design System — OBLIGATORIU pentru UI

**Înainte de a scrie orice UI, citește `DESIGN.md` la rădăcina proiectului.**

### Reguli de design (din DESIGN.md)
1. **Cream canvas** (#faf9f5) — NU alb pur, NU dark ca default
2. **Coral accent** (#cc785c) — doar pe CTA-uri primare, NU peste tot
3. **Serif display** — Cormorant Garamond (weight 400, negative tracking) pentru h1/h2/h3
4. **Sans body** — Inter (weight 400-500) pentru text, butoane, label-uri
5. **Color-block first** — umbre minimale, doar la hover
6. **Skeleton screens** — NU spinners pentru loading
7. **Empty states** — pe fiecare pagină cu date goale
8. **Token-uri CSS** — NU culori hardcodate, folosește `var(--color-*)`

### Componente UI disponibile
- `btn-primary`, `btn-secondary`, `btn-danger` — butoane
- `input-base`, `label-base` — forme
- `card-base` — carduri
- `focusable` — focus ring WCAG
- `alert-error`, `alert-success`, `alert-info` — alerte
- `skeleton` — loading placeholder
- `StatusBadge` — 6 statusuri medicale

---

## Reguli de cod

1. **Citește `DESIGN.md`** înainte de orice operațiune UI
2. **Citește `backend/prisma/schema/schema.prisma`** înainte de operații cu date
3. **NU introduce roluri sau RBAC** — MVP cu un singur utilizator
4. **Păstrează stiva simplă** — nu adăuga librării noi fără cerere explicită
5. **Confirmă înainte de ștergeri** — nu rula `prisma migrate reset` fără confirmare
6. **După modificarea schemei** — rulează `npx prisma migrate dev` + `npx prisma generate`
7. **Mesajele pentru utilizator în română**, codul în engleză

### Reguli de securitate (din auditul Fazei 1-2)
8. **`req.user.sub`** pentru id-ul utilizatorului din JWT (NU `req.user.id`)
9. **Validare id cu Zod** (`z.coerce.number().int().positive()`) → 400 la id invalid
10. **`prisma.$transaction([...])`** pentru operații + audit log
11. **Audit log** la fiecare CREATE/UPDATE/DELETE
12. **Secrete reale în .env** (niciodată valori placeholder)
13. **Export CSV** cu `escapeCSVField` (anti formula-injection)

### Reguli de design (OBLIGATORII)
14. **Folosește token-uri CSS** — `var(--color-*)`, NU hex hardcodat
15. **Heading-urile sunt serif** — `font-family: var(--font-family-heading)` (CSS global)
16. **`font-weight: 400`** pe h1/h2 (CSS `!important` override)
17. **Dark mode** — `[data-theme="dark"]` — toate paginile funcționează
18. **Reduced motion** — `prefers-reduced-motion: reduce` obligatoriu

---

## Structura proiectului

```
simdm/
├── DESIGN.md                    # SURSA DE ADEVĂR pentru design
├── backend/
│   ├── prisma/schema/           # Schema DB (sursa de adevăr)
│   ├── src/routes/              # Endpoint-uri API
│   ├── src/middleware/          # Auth, validation, error handling
│   └── src/__tests__/          # Teste backend
├── frontend/
│   ├── src/pages/              # 16 pagini
│   ├── src/components/         # 14 componente + 9 Shadcn + 3 modals
│   ├── src/design-system.css   # Token-uri CSS
│   ├── src/index.css           # Clase utilitare
│   └── src/tokens.json         # Token-uri JSON
├── docs/                       # Documentație
├── tasks/                      # Planuri fază
└── docker-compose.yml
```

---

**Următor:** Citește `DESIGN.md` pentru design system, apoi `backend/prisma/schema/schema.prisma` pentru structura de date.
