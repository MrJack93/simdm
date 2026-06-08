# Ghid de Contribuție — SIMDM

**Versiune:** 2.2 (Faza 1-2 Complete + Module Quick-Win + Faza 3 Ready)
**Actualizat:** 2026-06-05  
**Audiență:** Toți contributorii (backend, frontend, docs, DevOps)  
**Limbă:** Română (interfață + docs), Engleză (cod)

---

## 📋 Cuprins

1. [Înainte de a Începe](#înainte-de-a-începe)
2. [Fluxul de Lucru — Feature → PR → Merge](#fluxul-de-lucru)
3. [Standarde de Cod](#standarde-de-cod)
4. [Testare Locală](#testare-locală)
5. [Documentare](#documentare)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Înainte de a Începe

### Citire Obligatorie

```
1. CLAUDE.md          — Context proiect & instrucțiuni AI
2. SPEC.md            — Stivă tehnologică & arhitectură
3. README.md          — Overview & structură proiect
4. GETTING-STARTED.md — Setup rapid (5-10 min)
```

### Cunoștințe Necesare

- ✅ Git & GitHub (clone, branch, commit, push, PR)
- ✅ Node.js v22 + npm
- ✅ PostgreSQL basics (nu trebuie expert, Docker e gata)
- ✅ React 19 basics (dacă front-end)
- ✅ Express.js basics (dacă back-end)

### Setup Local (5 min)

```bash
# Clone repo
git clone <repo> && cd simdm

# Docker: pornește PostgreSQL
docker-compose up -d postgres

# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev  # Port 3001

# Frontend (alt terminal)
cd ../frontend
npm install
npm run dev  # Port 5173
```

---

## 🔀 Fluxul de Lucru

### Pasul 1: Creează Branch de Feature

**Întotdeauna branchez din `dev`** (brandul principal de lucru):

```bash
git checkout dev
git pull origin dev

# Feature branch (naming convention)
git checkout -b feature/inventar-devices        # Feature nouă
git checkout -b fix/login-contrast              # Bug fix
git checkout -b docs/update-design-system       # Documentație
git checkout -b refactor/auth-service           # Refactoring
git checkout -b test/device-crud-tests          # Teste
```

**Reguli Denumire:**
- `feature/*` — Funcționalitate nouă
- `fix/*` — Bug fix
- `refactor/*` — Refactor (fără schimbare comportament)
- `docs/*` — Documentație
- `test/*` — Teste
- `chore/*` — Setup, deps, tooling

### Pasul 2: Implementare

#### Backend

```bash
cd backend

# Instalare pachete NUMAI dacă necesar
npm install express-validator  # Exemplu

# Editare cod
# AI, endpoint-uri, validare, etc.

# Ai editat schema.prisma?
npx prisma migrate dev --name descriere_modificare
npx prisma generate

# Test local
npm run dev
# Postman/Thunder Client: testează endpoint
# http://localhost:3001/api/health
```

#### Frontend

```bash
cd frontend

# Editare componente / pagini
# React components, hooks, pages, etc.

# Verifică console pentru erori
npm run dev
# Browser: http://localhost:5173
# DevTools → Console, Network, Lighthouse
```

#### Documentație

```bash
# Editare .md fișiere
# README.md, docs/*, SPEC.md, etc.

# Format check
npm run lint  # (dacă repo are lint config)
```

### Pasul 3: Commit cu Mesaje Profesionale

```bash
# Commit frecvent (nu mega-commits)
git add src/components/DeviceForm.jsx
git commit -m "feat: add device form with validation"

git add backend/prisma/schema/device.prisma
git commit -m "feat: add Device model to schema"

git add docs/2-DEVELOPER-GUIDE.md
git commit -m "docs: add form validation examples"
```

**Mesaje de Commit — Format:**

```
<type>(<scope>): <subject>

<body>
```

**Tipuri valide:**
- `feat` — Funcție nouă
- `fix` — Bug fix
- `docs` — Documentație
- `style` — Formatare, linting (fără logică)
- `refactor` — Refactor (fără schimbare logică)
- `test` — Adaugă teste
- `chore` — Build, deps, setup

**Exemple bune:**

```
feat(devices): add inventory table with filtering

- Add DataGrid component with 10 columns
- Implement client-side filtering (name, status)
- Add export-to-CSV button
- Test with 8 seed devices
```

```
fix(auth): fix token expiration on 401 response

Before: User stays on dashboard with expired token
After: Auto-refresh interceptor catches 401, gets new token

Fixes #42
```

```
docs(spec): update API endpoints for Faza 2

- Document GET /api/devices with query params
- Add POST /api/devices request/response examples
```

**❌ Mesaje slabe:**
```
commit: fixed stuff
commit: zzz
commit: temp
```

### Pasul 4: Push și Creează Pull Request

```bash
# Push branch
git push origin feature/inventar-devices

# Pe GitHub: Click "Create Pull Request"
```

**PR Title & Description:**

```markdown
## Summary
Add Device inventory table with real-time filtering

## Description
- DataGrid component displays 8 test devices
- Filter by name, status, section using client-side search
- Export button → CSV file
- Responsive design (mobile: card layout)

## Testing
- [x] Works with 8 test devices from seed
- [x] Filters work (status, name, section)
- [x] Export generates valid CSV
- [x] Accessible (keyboard nav, focus ring, screen reader)
- [x] Dark/light mode (toggle in header)

## Checklist
- [x] Followed SPEC.md & design system
- [x] No console errors/warnings
- [x] Tested in dark + light mode
- [x] Ran Lighthouse (Accessibility ≥ 95)
- [x] Added/updated documentation
```

### Pasul 5: Code Review & Merge

1. **Maintainer** (sau senior dev) reviewează PR
2. Cere modificări dacă necesar
3. Aprobă cu "Request Changes" → "Approve"
4. Contributor fac update-uri
5. Merge → delete branch

---

## 🎯 Standarde de Cod

### Frontend (React)

**Componente:**
```jsx
// ✅ BUN�'
export function DeviceForm({ deviceId, onSave }) {
  const [formData, setFormData] = useState({});
  const { register, handleSubmit, errors } = useForm();

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <label htmlFor="name">Nume Dispozitiv</label>
      <input
        id="name"
        {...register('name', { required: 'Câmp obligatoriu' })}
        className="input-base focusable"
      />
      {errors.name && <p className="text-error">{errors.name.message}</p>}
    </form>
  );
}

// ❌ PROAST�'
function device({ props }) {  // camelCase prop
  return <input placeholder="name" />  // No label
}
```

**Reguli:**
- Component names: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Fișiere component: `ComponentName.jsx`
- Fișiere utils: `fileName.js`
- Text UI: **Română cu diacritice** ("Deconectare", NU "Deconectare")

**Accesibilitate (MANDATORY):**
```jsx
// WCAG 2.1 AA obligatoriu
<label htmlFor="username">Utilizator</label>
<input id="username" className="focusable" />

<button className="btn-primary focusable">Conectare</button>

<div role="alert">{errorMessage}</div>
```

### Backend (Express)

**Endpoint Structure:**
```javascript
// routes/devices.js
const express = require('express');
const { createDevice, listDevices } = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, listDevices);
router.post('/', authMiddleware, createDevice);

module.exports = router;
```

**Controllers:**
```javascript
// controllers/deviceController.js
async function createDevice(req, res) {
  const { inventoryNumber, name, status } = req.body;

  // Validare
  if (!inventoryNumber || !name) {
    return res.status(400).json({ error: 'Câmpuri obligatorii' });
  }

  try {
    const device = await prisma.devices.create({
      data: { inventoryNumber, name, status, createdById: req.user.id },
    });
    res.json({ data: device });
  } catch (error) {
    res.status(500).json({ error: 'Eroare server' });
  }
}
```

**Reguli Backend:**
- Variable names: `camelCase`
- Database field names: `camelCase`
- Error messages: **Română**
- Middleware: `authMiddleware.js`, `errorHandler.js`
- Services: logică business în `/services`, nu în routes

### Documentație

```markdown
# Titlu Secție

Descriere clară despre ce face acest modul.

## Subsecție

- Bullet point 1
- Bullet point 2

### Subsecție Detalii

```javascript
// Code example
```

Explicație cod.
```

**Reguli:**
- Titlu clar: "Cum să Adaug un Dispozitiv" NU "Device Adding"
- Exemple de cod (JSX, SQL, bash)
- Screenshots / diagrame pentru UI changes
- Linkuri la alte docs: `[SPEC.md](../SPEC.md)`

---

## ✅ Testare Locală

### Frontend

```bash
cd frontend

# Dev server
npm run dev  # http://localhost:5173

# Visual check
- ☀️/🌙 Dark/light mode toggle
- Responsive: DevTools → F12 → Device toolbar
- Accessibility: Lighthouse (DevTools → Lighthouse)
  - Target: Accessibility ≥ 95
- Keyboard: Tab, Enter, Escape (fără trap-uri)

# Screen reader test (optional)
NVDA / Narrator Windows / VoiceOver macOS
- Citesc labels corect?
- Citesc error messages?
```

### Backend

```bash
cd backend

# Dev server
npm run dev  # Port 3001

# Test endpoint în Postman / Thunder Client
POST http://localhost:3001/api/devices
{
  "inventoryNumber": "DM-TEST-001",
  "name": "Test Device",
  "status": "FUNCTIONAL"
}

# Response ar trebui 200 + device object
```

### Database

```bash
# GUI Database (Prisma Studio)
cd backend
npm run db:studio  # http://localhost:5555

# Browse tables, add/edit/delete records
# Inspect relationships visually
```

---

## �- Documentație

### Când Să Documentezi

1. **Componentă nouă** → Adaugă exemplu în `docs/2-DEVELOPER-GUIDE.md` și `docs/DESIGN-SYSTEM.md`
2. **Endpoint nou** → Adaugă în `SPEC.md` (secțiunea API) și comentarii în cod
3. **Schimbare API** → Actualizează `SPEC.md`
4. **Workflow nou** → Actualizează `CONTRIBUTING.md`
5. **Token design nou** → Actualizează `docs/DESIGN-SYSTEM.md`
6. **Componentă vizuală** → Actualizează `docs/DESIGN-SYSTEM.md`

### Locuri Documentație

| Document | Ce Conține | Unde |
|----------|-----------|------|
| **README.md** | Overview, setup rapid, status faze | Rădăcină |
| **SPEC.md** | Arhitectură, stivă, faze, schema DB | Rădăcină |
| **INDEX.md** | Index toate documentele | Rădăcină |
| **GETTING-STARTED.md** | Tutorial 5 min | Rădăcină |
| **docs/1-DESIGN...** | Design tokens, WCAG, arhitectura CSS | docs/ |
| **docs/2-DEVELOPER...** | Tipare React/Express, checklist | docs/ |
| **docs/DESIGN-SYSTEM.md** | Referință completă componente | docs/ |
| **docs/DESIGN-SYSTEM.md** | WCAG 2.1 AA patterns, testare | docs/ |
| **docs/DESIGN-SYSTEM.md** | Dark/light mode, token transformări | docs/ |
| **docs/MOBILE_WORKFLOW_GUIDE.md** | Workflow pe teren, 5 scenarii | docs/ |
| **docs/CONTRIBUTING.md** | Flux PR (acest fișier) | docs/ |
| **CLAUDE.md** | Instrucțiuni AI | Rădăcină |

---

## 🐛 Troubleshooting

### Conflicte Git

```bash
# Ai conflict la merge
# 1. Merge dev latest
git fetch origin
git rebase origin/dev

# 2. Rezolva conflicts în editor
# 3. Commit
git add .
git commit -m "resolve merge conflicts"
git push origin feature/branch-name
```

### PostgreSQL Connection Error

```bash
# Docker container nu e pornit
docker-compose ps
# Ar trebui să vadă PostgreSQL RUNNING

# Restart
docker-compose up -d postgres

# Test connection
psql postgresql://simdm_user:simdm_secure_2024@localhost:5432/simdm_db
```

### Prisma Migration Error

```bash
# Reset DB (NUMAI DEV!)
cd backend
npx prisma migrate reset --force

# Sau manual:
npx prisma migrate resolve --rolled-back [migration_name]
npx prisma migrate dev --name [new_name]
```

### Token Expirat

```bash
# Auto-refresh prin interceptor
# Dar dacă manual testezi:

# 1. Logout
POST /api/auth/logout

# 2. Relogin
POST /api/auth/login
```

---

## 📋 Checklist înainte de PR

- [ ] Cod testat local (dev server running)
- [ ] Niciun console error / warning
- [ ] Accesibilitate: Lighthouse ≥ 95 (dacă UI change)
- [ ] Dark mode testat (toggle switch)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Commit messages descriptive
- [ ] Branch updated cu `origin/dev`
- [ ] Documentație updated (dacă feature nouă)
- [ ] PR description completă (summary, testing, checklist)

---

## 🎓 Resurse

- [Git Guides](https://github.com/git-tips/tips)
- [React Best Practices](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [WCAG 2.1 Quick Ref](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Gata? Creează branch și start coding! 🚀**

**Întrebări? Citește [SPEC.md](../SPEC.md) și [CLAUDE.md](../CLAUDE.md).**

