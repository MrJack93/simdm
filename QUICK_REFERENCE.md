# ⚡ Quick Reference — SIMDM Frontend

**Print this.** Keep it next to your desk during development.

---

## 🎨 Colors (Copy-Paste Tailwind Classes)

| Utilizare | Tailwind | Hex | Contrast Check |
|-----------|----------|-----|--------|
| Heading/Accent | `text-cyan-400` | #22d3ee | 9.8:1 ✅ |
| Label/Helper | `text-gray-400` | #9ca3af | 6.8:1 ✅ |
| Input Background | `bg-gray-800` | #1f2937 | — |
| Input Border | `border-gray-600` | #4b5563 | 3:1 ✅ |
| Border (evita) | `border-gray-700` | #374151 | 1.5:1 ❌ |
| Page Background | `bg-gray-950` | #030712 | — |
| Error | `text-red-400` | #f87171 | 5.6:1 ✅ |
| Success | `text-green-400` | #4ade80 | — |

---

## 🧩 Components — Copy-Paste

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
  <h3 className="text-lg font-bold text-cyan-400 mb-2">Titlu</h3>
  <p className="text-gray-400">Conținut...</p>
</div>
```

### Alert Error
```jsx
<div role="alert" className="alert-error">
  ❌ Eroare: Parolă incorectă
</div>
```

### Alert Success
```jsx
<div role="status" className="alert-success">
  ✓ Succes: Salvat
</div>
```

---

## ♿ Accessibility Checklist

### Înainte de git commit:

- [ ] **Input labels:**
  - [ ] Input are `id="field"`
  - [ ] Label are `htmlFor="field"`
  - [ ] `autoComplete` setat corect (`username`, `current-password`, etc.)

- [ ] **Errors:**
  - [ ] Eroare are `role="alert" aria-live="assertive"`
  - [ ] Input are `aria-describedby="field-error"`

- [ ] **Button:**
  - [ ] Are `min-h-[44px]` sau `py-3`
  - [ ] Are `.focusable` class (sau focus ring manual)

- [ ] **Focus:**
  - [ ] Tab pe orice element interactive = focus vizibil
  - [ ] Ordinea Tab logică (top-left → bottom-right)
  - [ ] Niciun keyboard trap

- [ ] **Colors:**
  - [ ] Text contrast ≥ 4.5:1
  - [ ] Status "defect" = text roșu + icoană + text descriptiv (NU doar culoare)

---

## 🧪 Quick Testing

### Keyboard-Only (30 sec)
```bash
# Deactivează mouse
# Tab/Shift+Tab - navighează
# Enter - click button
# Space - toggle
# Esc - cancel

✓ Focus vizibil la fiecare oprire
✓ Tab order logic
✓ Niciun trap
```

### Lighthouse (Chrome DevTools)
```bash
F12 → Lighthouse → Accessibility → Analyze page load
✓ Target: ≥95 points
```

### axe DevTools (Chrome Extension)
```bash
Click axe icon → Scan → Automated Checks
✓ Target: 0 errors, 0 warnings
```

### Screen Reader (NVDA)
```bash
Windows: Download NVDA https://www.nvaccess.org
Win + Ctrl + Enter: Start NVDA
Arrow keys: Navigate
✓ Errors announced
✓ Buttons have labels in Romanian
```

---

## 📐 Sizing

| Element | Size | Class |
|---------|------|-------|
| Button/Input | 44px min | `min-h-[44px]` |
| Padding Default | 16px | `px-4 py-3` |
| Padding Card | 24px | `px-6 py-6` |
| Gap | 8px | `gap-2` |
| Border | 1px | `border` |
| Border Radius | 8px | `rounded-lg` |

---

## 🔤 Typography

| Level | Size | Class | Color |
|-------|------|-------|-------|
| h1 | 48px | `text-4xl font-bold` | `text-cyan-400` |
| h2 | 32px | `text-2xl font-bold` | `text-cyan-400` |
| h3 | 24px | `text-xl font-bold` | `text-white` |
| Body | 16px | `text-base` | `text-gray-100` |
| Small | 14px | `text-sm` | `text-gray-400` |
| Label | 14px | `text-sm font-medium` | `text-gray-400` |

---

## 🚀 Common Patterns

### Form with Validation
```jsx
const [username, setUsername] = useState('');
const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post('/auth/login', { username, password });
    // success
  } catch (err) {
    setError(err.response.data.error || 'Eroare necunoscută');
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

### Loading State
```jsx
<button disabled={loading} aria-busy={loading} className="btn-primary">
  {loading ? "Se conectează…" : "Conectare"}
</button>
```

### Table with Sort
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

## 🎯 Top 3 A11y Rules

1. **LABEL + INPUT**
   ```jsx
   <label htmlFor="field">Label</label>
   <input id="field" ... />
   ```

2. **ERROR ANNOUNCED**
   ```jsx
   {error && <p role="alert" aria-live="assertive">{error}</p>}
   ```

3. **FOCUS RING**
   ```jsx
   className="... focus-visible:ring-2 focus-visible:ring-cyan-400 ..."
   ```

---

## 📚 Documentation

- `AUDIT_ACCESIBILITATE.md` — WCAG 2.1 AA audit complet
- `DESIGN_SYSTEM.md` — Design tokens, componente, culori
- `IMPLEMENTATION_GUIDE.md` — Cod JSX detaliat, checklist-uri

---

## 🔗 Links

- [Tailwind CSS](https://tailwindcss.com)
- [WCAG 2.1 Quick Ref](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast](https://webaim.org/resources/contrastchecker/)
- [NVDA](https://www.nvaccess.org)

---

**Updated:** 2026-05-28 | **Fase:** 1  
**Print & keep at desk** ✌️
