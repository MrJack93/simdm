# Referință Rapidă — SIMDM Frontend (Clinical Precision 2.0)

Imprimă și ține lângă monitor în timpul dezvoltării.

---

## Culori — CSS Variables (Dark/Light Mode) 🎨

### Dark Mode (Default)
| Utilizare | Variabilă | Hex | Contrast |
|-----------|-----------|-----|----------|
| **Accent principal** | `var(--color-accent)` | #ffb597 | 9.8:1 |
| **Heading/Labels** | `var(--color-accent)` | #ffb597 | 9.8:1 |
| **Text principal** | `var(--color-text-primary)` | #e2e2e2 | 17.7:1 |
| **Text ajutător** | `var(--color-text-secondary)` | #dfc0b4 | 12.2:1 |
| **Fundal pagină** | `var(--color-bg-primary)` | #0a0d0d | — |
| **Fundal input** | `var(--color-bg-tertiary)` | #1a1c1c | — |
| **Border** | `var(--color-border)` | #333535 | 3:1 |
| **Eroare** | `var(--color-error)` | #ffb4ab | 5.6:1 |
| **Succes** | `var(--color-success)` | #4ade80 | — |

### Light Mode
Același setup, dar pe fundal clar (#f5f5f5) și text negru (#1a1a1a).

**Tip:** Folosește MEREU CSS variables, NU clase Tailwind hardcodate! Se schimbă automat la dark/light toggle.

---

## Componente — copiază direct

### Input + Label
```jsx
<div className="mb-4">
  <label htmlFor="field" className="label-base">
    Etichetă
  </label>
  <input
    id="field"
    type="text"
    autoComplete="username"
    autoFocus
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? "field-error" : undefined}
    className="input-base"
  />
  {error && (
    <p id="field-error" role="alert" className="text-red-400 text-sm mt-1">
      {error}
    </p>
  )}
</div>
```

### Button Primary
```jsx
<button className="btn-primary">
  Conectare
</button>
```

### Button Danger
```jsx
<button className="btn-danger">
  Ștergere
</button>
```

### Card
```jsx
<div className="card-base">
  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-accent)' }}>Titlu</h3>
  <p style={{ color: 'var(--color-text-secondary)' }}>Conținut...</p>
</div>
```

### Step Indicator (Multi-step Form)
```jsx
<div className="flex gap-2 items-center mb-4">
  {['Pas 1', 'Pas 2', 'Pas 3'].map((step, idx) => (
    <div key={idx} className="flex items-center">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full font-bold"
        style={{
          backgroundColor: idx < currentStep ? 'var(--color-success)' : 'var(--color-accent)',
          color: '#1a1a1a',
        }}
      >
        {idx < currentStep ? '✓' : idx + 1}
      </div>
    </div>
  ))}
</div>
```

### Autocomplete Search
```jsx
<div className="relative">
  <input
    type="text"
    className="input-base"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  {suggestions.length > 0 && (
    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg animate-slide-down"
         style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid', borderColor: 'var(--color-border)' }}>
      {suggestions.map((s) => (
        <button key={s.id} onClick={() => setSearch(s.inventory)} className="w-full text-left px-4 py-2">
          {s.inventory}
        </button>
      ))}
    </div>
  )}
</div>
```

### Alert Eroare
```jsx
<div role="alert" className="alert-error">
  Eroare: Parolă incorectă
</div>
```

### Alert Succes
```jsx
<div role="status" className="alert-success">
  Salvat cu succes
</div>
```

---

## Checklist accesibilitate

Înainte de `git commit`:

- [ ] **Input labels:**
  - [ ] Input are `id="field"`
  - [ ] Label are `htmlFor="field"`
  - [ ] `autoComplete` setat corect (`username`, `current-password` etc.)

- [ ] **Erori:**
  - [ ] Eroarea are `role="alert" aria-live="assertive"`
  - [ ] Input are `aria-describedby="field-error"`

- [ ] **Butoane:**
  - [ ] Are `min-h-[44px]` sau `py-3`
  - [ ] Are clasa `.focusable` (sau focus ring manual)

- [ ] **Focus:**
  - [ ] Tab pe orice element interactiv = focus vizibil
  - [ ] Ordinea Tab logică (sus-stânga → jos-dreapta)
  - [ ] Niciun keyboard trap

- [ ] **Culori:**
  - [ ] Contrast text ≥ 4.5:1
  - [ ] Status "defect" = text roșu + icoană + text descriptiv (NU doar culoare)

---

## Testare rapidă

### Tastatură (30 secunde)
```
Dezactivează mouse-ul
Tab / Shift+Tab — navighează
Enter — activează buton
Space — toggle checkbox
Escape — anulare / închidere modal

Verifică:
  Focus vizibil la fiecare element
  Ordinea Tab logică
  Niciun trap
```

### Lighthouse (Chrome DevTools)
```
F12 → Lighthouse → Accessibility → Analyze page load
Țintă: ≥ 95 puncte
```

### axe DevTools (extensie Chrome)
```
Click iconiță axe → Scan → Automated Checks
Țintă: 0 erori, 0 avertismente critice
```

### Screen Reader (NVDA)
```
Descarcă NVDA: https://www.nvaccess.org
Start: Win + Ctrl + Enter
Taste săgeți: navigare
Verifică:
  Erorile sunt anunțate
  Butoanele au etichete în română
```

---

## Dimensiuni

| Element | Dimensiune | Clasă |
|---------|------------|-------|
| Buton / Input | min 44px | `min-h-[44px]` |
| Padding implicit | 16px | `px-4 py-3` |
| Padding card | 24px | `px-6 py-6` |
| Spațiere elemente | 8px | `gap-2` |
| Border | 1px | `border` |
| Border radius | 8px | `rounded-lg` |

---

## Tipografie

| Nivel | Mărime | Clasă | Culoare |
|-------|--------|-------|---------|
| h1 | 48px | `text-4xl font-bold` | `text-cyan-400` |
| h2 | 32px | `text-2xl font-bold` | `text-cyan-400` |
| h3 | 24px | `text-xl font-bold` | `text-white` |
| Body | 16px | `text-base` | `text-gray-100` |
| Small | 14px | `text-sm` | `text-gray-400` |
| Label | 14px | `text-sm font-medium` | `text-gray-400` |

---

## Tipare frecvente

### Formular cu validare
```jsx
const [username, setUsername] = useState('');
const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post('/auth/login', { username, password });
    // succes
  } catch (err) {
    setError(err.response?.data?.error || 'Eroare necunoscută');
  }
};

<form onSubmit={handleSubmit}>
  <FormInput
    id="username"
    label="Utilizator"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    error={error}
    required
  />
</form>
```

### Stare de încărcare
```jsx
<button disabled={loading} aria-busy={loading} className="btn-primary">
  {loading ? "Se conectează…" : "Conectare"}
</button>
```

### Tabel cu sortare
```jsx
<table>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortKey === 'name' ? 'ascending' : 'none'}>
        <button onClick={() => handleSort('name')}>
          Denumire {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
      </th>
    </tr>
  </thead>
</table>
```

---

## Top 3 reguli accesibilitate

1. **LABEL + INPUT asociate**
   ```jsx
   <label htmlFor="field">Etichetă</label>
   <input id="field" ... />
   ```

2. **EROAREA ANUNȚATĂ**
   ```jsx
   {error && <p role="alert" aria-live="assertive">{error}</p>}
   ```

3. **FOCUS RING VIZIBIL**
   ```jsx
   className="... focus-visible:ring-2 focus-visible:ring-cyan-400 ..."
   ```

---

## Documentație

| Document | Conținut |
|----------|----------|
| [docs/1-DESIGN-AND-ACCESSIBILITY.md](./docs/1-DESIGN-AND-ACCESSIBILITY.md) | Design tokens, culori, componente, reguli WCAG |
| [docs/2-DEVELOPER-GUIDE.md](./docs/2-DEVELOPER-GUIDE.md) | Implementare practică, tipare JSX, depanare |
| [docs/3-AUDIT-LOG.md](./docs/3-AUDIT-LOG.md) | Jurnal audit accesibilitate Faza 1 |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Flux de lucru, PR template, checklist |

---

## Resurse externe

- [Tailwind CSS](https://tailwindcss.com)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org)

---

---

## 🆕 Faza 2.1 — Clinical Precision 2.0 Redesign (2026-05-30) ✨

### Componente redesignate:
- `Login.jsx` — Hero section + split layout (stânga marketing, dreapta form)
- `App.jsx` — Dark/Light mode toggle persistent (localStorage)
- `InventoryPage.jsx` — Enhanced cu search autocomplete + inline edit modal
- `DeviceForm.jsx` — Multi-step wizard (6 pași cu progress indicator)
- `index.css` — Clinical Precision 2.0 CSS variables + dark/light mode

### Noi feature-uri (Faza 2.1):
✅ **Dark/Light Mode Toggle** — persistent în localStorage
✅ **Search Autocomplete** — 5 sugestii live în timp real
✅ **Inline Edit Modal** — editare rapidă dispozitive în modal dialog
✅ **Multi-step Wizard** — 6 pași cu progress indicator și validare treptată
✅ **Status Badges cu Icoane** — ✓ Funcțional, ✗ Defect, ⟳ Reparație, − Casat
✅ **Animații subtile** — 150-300ms transitions (slideDown, slideUp, fadeIn)
✅ **Print Stylesheet** — Ctrl+P → tabel alb pe negru
✅ **Responsive complet** — Card layout pe mobile, tabel pe desktop

### Design System — Clinical Precision 2.0:
- **Accent:** Portocaliu #ffb597 (nu mai cyan)
- **Temă:** 9/10 închis dark mode + light mode complet
- **Tipografie:** Inter (via system fonts)
- **Focus ring:** Portocaliu 2px cu offset
- **Contrast:** 17.7:1 dark mode (WCAG AAA)

### Librării noi (Faza 2.1):
- CSS variables pentru dark/light mode switching
- Animații CSS (slideDown, slideUp, fadeIn)
- `aria-expanded`, `role="combobox"` — accessibility autocomplete

**Status:** Faza 2.1 ✅ Complet | **Fază curentă:** 3 (Mentenanță) — Planned
