# Ghid de Contribuție - SIMDM

Mulțumim pentru interes în a contribui la SIMDM! Acest document descrie procesul și standardele noastre.

## 🏥 Context Medical

SIMDM este o aplicație pentru management dispozitivelor medicale într-un spital. Datele sunt sensibile și trebuie tratate cu grijă maximă.

**Înainte de a scrie cod:**
- Citi [CLAUDE.md](CLAUDE.md) — context complet al proiectului
- Citi [DESIGN_SYSTEM_SIMDM.md](frontend/DESIGN_SYSTEM_SIMDM.md) — sistem de design + accesibilitate
- Verifica [SPEC.md](SPEC.md) — specificație faze

---

## 🚀 Workflow

### 1. Pregătire

```bash
# Clone și setup
git clone <repo>
cd simdm

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (în terminal nou)
cd frontend
npm install
npm run dev
```

### 2. Branch-uri

```bash
# Creează branch din `dev`
git checkout -b feature/device-management
# sau
git checkout -b fix/login-validation
```

**Convenție:** `feature/*`, `fix/*`, `docs/*`, `test/*`, `refactor/*`

### 3. Cod

#### **Standards**

- **Limba:** Interfață + mesaje = **limba română**. Cod = **engleză**
- **Naming:** 
  - Componente React: PascalCase (Button.jsx, StatusBadge.jsx)
  - Funcții/variabile: camelCase
  - Constante: UPPER_SNAKE_CASE
  
- **Shadcn Components:** Folosiți bibliotecă Shadcn pentru UI (Button, Input, Card, Dialog, etc.)

- **Accesibilitate (WCAG 2.1 AA):**
  - Toți inputs cu `<label htmlFor="id">`
  - Buttons cu `aria-label` dacă doar icon
  - Semantic HTML: `<nav>`, `<main>`, `<aside>`
  - Color + icon pentru status (nu doar culoare)
  - Focus states vizibile: `focus-visible:ring-2`

- **Medical Design:**
  - Culori healthcare: `--healthcare-primary` (#0891B2 cyan), `--healthcare-success` (#059669 verde)
  - Contrast >= 4.5:1 pentru text
  - Touch targets >= 44x44px

#### **Exemplu component**

```jsx
import { Button } from '@/components/ui/button';

export function DeviceActions({ deviceId, onDelete }) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        aria-label={`Editare dispozitiv ${deviceId}`}
      >
        Editare
      </Button>
      <Button
        variant="destructive"
        aria-label={`Ștergere dispozitiv ${deviceId}`}
        onClick={() => {
          if (confirm('Sigur doriți să ștergeți?')) {
            onDelete(deviceId);
          }
        }}
      >
        Ștergere
      </Button>
    </div>
  );
}
```

#### **Exemple Validare (Zod)**

```javascript
import { z } from 'zod';

const deviceSchema = z.object({
  name: z.string().min(3, 'Minim 3 caractere').max(100),
  serialNumber: z.string().regex(/^[A-Z0-9-]+$/, 'Format serial invalid'),
  riskClass: z.enum(['I', 'IIa', 'IIb', 'III']),
});
```

### 4. Testing

```bash
# Unit tests (Vitest)
npm run test
npm run test:watch
npm run test:coverage

# Accessibility tests (Axe)
npm run test:a11y

# Component tests
npm run test:components

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui

# Build bundle analysis
npm run analyze
```

**Test-Driven Development (TDD):**
1. Scrie test care cade
2. Implementează cod care trece testul
3. Refactorizează

### 5. Commit

```bash
# Stagează fișierele relevante
git add frontend/src/components/DeviceActions.jsx

# Commit cu mesaj descriptiv
git commit -m "feat: Device actions cu butoane medical-themed

- Adaug Editare și Ștergere butoane
- Aria-labels pentru accessibility
- Confirm dialog pentru ștergeri
- Healthcare colors pe buttons"
```

**Mesaj commit:**
- Tip: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Scurtă descriere (< 50 caractere)
- Detalii în body (ce și de ce)
- **NU** include: `Co-Authored-By` (doar la PR)

---

## 📋 Checklist Pre-Push

- [ ] Codul e în limba română (UI) + engleză (cod)
- [ ] Tests scrise și trec: `npm run test`
- [ ] Accessibility: `npm run test:a11y` (Axe compliance)
- [ ] Build: `npm run build` (fără erori)
- [ ] Messajes în engleză pentru console/logs
- [ ] Componente Shadcn pentru UI (nu custom)
- [ ] WCAG 2.1 AA: labels, focus, contrast, touch targets
- [ ] Healthcare palette pe componente medicale
- [ ] No console errors/warnings
- [ ] Branch e actualizat: `git pull origin dev`

---

## 🔄 Pull Request Process

1. **Pushează branch-ul:**
   ```bash
   git push -u origin feature/device-management
   ```

2. **Creează PR:**
   - Titlu scurt: "feat: Device actions cu butoane"
   - Descriere: ce schimbă, de ce, testing done
   - Link issues: "Closes #123"

3. **PR template:**
   ```markdown
   ## 📝 Descriere
   Adaug Device Actions componenta cu Editare/Ștergere butoane.

   ## 🧪 Testing
   - [x] Unit tests (100% coverage)
   - [x] Accessibility (Axe - 0 violations)
   - [x] Browser testing (Chrome, Firefox)

   ## 🎨 Design
   - Healthcare colors (#0891B2, #059669)
   - WCAG 2.1 AA compliant
   - Touch targets 44x44px

   ## 📸 Screenshots
   [Dacă UI changes]
   ```

4. **Review:** Așteptă ✅ de la co-contributors

5. **Merge:** Squash commits (1 commit = 1 feature)

---

## 🐛 Raportare Bug

```markdown
**Titlu:** Login nu funcționează pe Safari

**Context:**
- Browser: Safari 17.0
- Device: iPhone 14
- Pasul: Click "Conectare"

**Comportament actual:**
Pagina se reîncarcă fără a autentifica

**Comportament așteptat:**
Utilizatorul se autentifică și se redirectează la Dashboard

**Pasii pentru reproducere:**
1. Mergi la login
2. Introdu credențiale
3. Click "Conectare"
```

---

## 📚 Structură Fișiere

```
simdm/
├── frontend/
│   ├── src/
│   │   ├── components/       # Shadcn + custom
│   │   ├── pages/            # Route pages (lazy-loaded)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # API clients
│   │   ├── __tests__/        # Unit + E2E tests
│   │   └── design-system.css # Healthcare palette
│   ├── DESIGN_SYSTEM_SIMDM.md
│   ├── CONTRAST_TESTING.md
│   └── SHADCN_SETUP.md
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   └── prisma/
├── docs/
├── CLAUDE.md
├── SPEC.md
└── CONTRIBUTING.md (tu ești aici)
```

---

## 🔐 Securitate

- **NU commitează:** `.env`, `node_modules/`, `build/`, `dist/`
- **NU adaugă:** API keys, parolă hash-uri, token-uri
- **JWT:** Stocați în `sessionStorage` (nu localStorage)
- **CORS:** Configurat strict (`http://localhost:3000` dev)
- **SQL Injection:** Prisma ORM e sigur
- **Medical data:** Criptare în tranzit (HTTPS)

---

## 🤝 Cod Review

**Ce căutam:**
- ✅ Tests scrise
- ✅ Accessibility passes
- ✅ Medical design consistency
- ✅ Mesaje clare în limba română
- ❌ Componente custom (folosești Shadcn?)
- ❌ SQL queries (folosești Prisma?)
- ❌ Hardcoded strings (extenzi i18n?)

---

## 📞 Ajutor

- **Documentație:** [DESIGN_SYSTEM_SIMDM.md](frontend/DESIGN_SYSTEM_SIMDM.md)
- **Questions:** Deschide issue cu tag `question`
- **Accessibility help:** [CONTRAST_TESTING.md](frontend/CONTRAST_TESTING.md)

---

**Mulțumim că ai ales să contribui! 💙**

Fiecare contribuție ajută ca SIMDM să fie mai bun pentru bioinginerul medical care o folosește.

---

*Ultima actualizare: 2026-06-05*
