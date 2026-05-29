# SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale

**Version:** 1.0 (Phase 1 Complete)  
**Status:** Foundation Layer ✅ Ready for Phase 2  
**Last Updated:** 2026-05-29

---

## 🎯 Despre Proiect

**SIMDM** este o aplicație web pentru gestionarea centralizată a dispozitivelor medicale (DM) conform [Ghidului Bioinginerului — Ordinul MS nr. 889/2024](https://www.ms.gov.md) (Republica Moldova).

- **Utilizator:** 1 bioinginer medical (tu)
- **Hosting:** localhost / rețea locală spital
- **Date:** Gestionare DM, mentenanță (preventivă/corectivă), incidente, documente

---

## ⚡ Quick Start

### Prerequisite-uri
- Node.js v22 LTS
- PostgreSQL v16
- pgAdmin 4 (GUI bază de date)

### Setup
```bash
# 1. Clone / init proiect
cd simdm

# 2. Setup Backend
cd backend
npm install
# Completează .env cu DATABASE_URL, JWT_SECRET, credentiale admin
npx prisma migrate dev --name init  # Creează tabele
npm run db:seed                      # Populează date inițiale

# 3. Setup Frontend
cd ../frontend
npm install

# 4. Pornire simultană
cd ..
npm run dev
```

**Rezultat:**
- Frontend: http://localhost:5173 (React + Vite)
- Backend: http://localhost:3001 (Express API)
- Database: http://localhost:5555 (Prisma Studio)

Login cu username din `.env` (default: `bioinginer`).

---

## 📚 Documentație

| Document | Scop | Cititori |
|----------|------|----------|
| **[CLAUDE.md](./CLAUDE.md)** | Instrucțiuni pentru Claude Code | Developeri (cu AI) |
| **[SPEC.md](./SPEC.md)** | Spec Faza 1 + Boundaries | Project Managers + Devs |
| **[docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md)** | Design System + WCAG 2.1 AA | Frontend Devs + Designers |
| **[docs/2-DEVELOPER-GUIDE.md](./docs/2-DEVELOPER-GUIDE.md)** | Implementare practică + Patterns | Frontend Devs |
| **[docs/3-AUDIT-LOG.md](./docs/3-AUDIT-LOG.md)** | Audit Accessibility (snapshot) | Reference archive |
| **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** | Workflow pentru Faza 2+ | Contributors |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Cheat-sheet developer | Devs (print & desk) |

---

## 🛠 Tech Stack

| Strat | Tehnologie | Note |
|-------|-----------|------|
| Frontend | React 18 + Vite + TailwindCSS | Dark theme (cyan accent) |
| Backend | Node.js + Express.js | Port 3001 |
| Database | PostgreSQL 16 | 5 tabele (Device, Section, MaintenanceRecord, Incident, Document) |
| ORM | Prisma | Migrații versionizate |
| Auth | JWT + bcryptjs | Single user, simple login |
| HTTP | Axios | Interceptor JWT automat |

---

## 📂 Structura Proiect

```
simdm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # SURSA DE ADEVĂR — baza de date
│   │   ├── migrations/            # Istoric migrații
│   │   └── seed.js                # Date inițiale
│   ├── src/
│   │   ├── routes/auth.js         # POST /api/auth/login, /verify
│   │   ├── middleware/auth.js     # JWT validation
│   │   └── index.js               # Server Express
│   ├── .env                        # NU in Git! Completează local
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # (Faza 2+: componente reutilizabile)
│   │   ├── pages/Login.jsx        # Autentificare
│   │   ├── api/axios.js           # HTTP instance + interceptori
│   │   ├── App.jsx                # Router principal
│   │   └── main.jsx               # Entry point
│   ├── vite.config.js             # Proxy /api → backend
│   └── package.json
│
├── docs/                          # Documentație
│   ├── 1-DESIGN-AND-ACCESSIBILITY.md
│   ├── 2-DEVELOPER-GUIDE.md
│   ├── 3-AUDIT-LOG.md
│   └── CONTRIBUTING.md
│
├── CLAUDE.md                      # Instrucțiuni Claude Code
├── SPEC.md                        # Specificație Faze
├── QUICK_REFERENCE.md             # Cheat-sheet
└── README.md                      # Acest fișier
```

---

## 🚀 Faze de Dezvoltare

| Fază | Modul | Status | Note |
|------|-------|--------|------|
| **1** | Fundație & Infrastructură | ✅ Complete | Auth, DB setup, login |
| **2** | Inventar DM | ⏳ Next | CRUD, tabel, filtre |
| **3** | Mentenanță | 📋 Planned | Plan preventiv, ticketing |
| **4** | Documente & Proceduri | 📋 Planned | DMS, PDF formulate |
| **5** | Vigilență & Incidente | 📋 Planned | Raportare, notificări |
| **6** | Procurare | 📋 Planned | PIF, planning |
| **7** | Dashboard & Raportare | 📋 Planned | KPI, export |
| **8** | QA & Launch | 📋 Planned | Testing, go-live |

Fiecare fază construiește incrementat. Start cu MVP (Faze 1-3) înainte de complexitate.

---

## 🎨 Design System

SIMDM folosește **dark theme modern** cu accent **cyan**, optimizat pentru WCAG 2.1 AA (accessibility).

### Culori Principale
- **Primary:** `cyan-400` (#22d3ee) — headings, buttons, accent
- **Background:** `gray-950` (#030712) — fundal pagină
- **Surface:** `gray-900` (#111827) — cards, surfaces
- **Error:** `red-400` (#f87171) — validare fail
- **Success:** `green-400` (#4ade80) — succes

Detalii complete: [docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md)

---

## ♿ Accessibility (WCAG 2.1 AA)

**Obligatoriu pentru ORICE componentă:**
1. ✅ Label-uri asociate (`htmlFor`/`id`)
2. ✅ Focus ring vizibil (cyan ring, 2px)
3. ✅ Dimensiuni minimum 44px (butoane, inputuri)
4. ✅ Erori anunțate (`role="alert"`)
5. ✅ Contrast text ≥ 4.5:1

Cum să testezi:
- **Tastatură:** Tab + Shift+Tab, nici un trap
- **Screen reader:** NVDA / Narrator — teste erori anunțate
- **Lighthouse:** DevTools → Accessibility ≥ 95 puncte
- **axe DevTools:** 0 erori critice

Audit complet: [docs/3-AUDIT-LOG.md](./docs/3-AUDIT-LOG.md)

---

## 📝 Convenții Cod

### Limba
- **Variabile, funcții, clase:** English (camelCase JS, PascalCase React)
- **UI, erori, mesaje:** Română (cu diacritice)

### Backend
```javascript
// ✅ Async/await, validare input, erori în română
router.post('/login', async (req, res) => {
  if (!username) return res.status(400).json({ error: 'Username obligatoriu' });
  // ...
});
```

### Frontend
```jsx
// ✅ Hooks, Tailwind, useState pattern
import { useState } from 'react';

export default function Form() {
  const [email, setEmail] = useState('');
  // ...
}
```

### Database
- Citește `schema.prisma` înainte de orice operație
- Rulează `npx prisma migrate dev` după schimbări schema
- Pastrează `.env` **secret** — NU în Git

---

## 🧪 Testing

### Manual Testing (Faza 1)
- ✅ Login end-to-end (React → Express → PostgreSQL)
- ✅ JWT token salvat în localStorage
- ✅ Endpoints testate în Postman / Thunder Client

### Automated Testing (Faza 2+)
- Unit tests cu Jest
- Integration tests cu Supertest
- E2E tests cu Cypress

---

## 🔒 Securitate

- ✅ Parole cu bcrypt (NU clar)
- ✅ JWT expirare 30 zile
- ✅ CORS permis doar localhost:5173
- ✅ `.env` NU în Git (protejează JWT_SECRET, DATABASE_URL)
- ✅ Validare server-side pentru orice input

---

## 🆘 Suport & Debugging

### De-bugs Comuni

**"Cannot find module"**
```bash
npm install  # Reinstalează dependencies
```

**"Database connection failed"**
```bash
# Verifica .env
echo $DATABASE_URL
# Testează conexiune PostgreSQL
psql postgresql://user:pass@localhost:5432/simdm_db
```

**"Port 3001 already in use"**
```bash
lsof -i :3001  # Găsește proces
kill -9 <PID>
```

---

## 📖 Links Utile

- [Tailwind CSS](https://tailwindcss.com)
- [Prisma ORM](https://www.prisma.io)
- [WCAG 2.1 Quick Ref](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring](https://www.w3.org/WAI/ARIA/apg/)
- [Ghidul Bioinginerului (MS RM)](https://www.ms.gov.md)

---

## 📝 Git Workflow

```bash
# Fiecare feature = branch + PR
git checkout -b feature/inventar-devices

# Commit messages în engleză
git commit -m "feat: add device list endpoint"

# PR review înainte de merge la main
# Merge curat — NO merge commits
```

---

## 👤 Contact

**Project Owner:** Bioinginer Medical, Spital Privat  
**Maintained by:** Claude Code + Development Team

**Report issues:** [Create GitHub Issue] / Contact PM

---

**Version History:**
- v1.0 — 2026-05-29: Phase 1 complete (auth, DB, login UI)

---

**Ready to contribute?** Citește [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) pentru workflow Faza 2+.
