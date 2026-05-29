# Referință Rapidă — SIMDM Frontend

Imprimă și ține lângă monitor în timpul dezvoltării.

---

## Culori (clase Tailwind — copiază direct)

| Utilizare | Tailwind | Hex | Contrast |
|-----------|----------|-----|----------|
| Heading / Accent | `text-cyan-400` | #22d3ee | 9.8:1 |
| Label / Text ajutător | `text-gray-400` | #9ca3af | 6.8:1 |
| Fundal input | `bg-gray-800` | #1f2937 | — |
| Border input | `border-gray-600` | #4b5563 | 3:1 |
| Border decorativ (evită) | `border-gray-700` | #374151 | 1.5:1 |
| Fundal pagină | `bg-gray-950` | #030712 | — |
| Eroare | `text-red-400` | #f87171 | 5.6:1 |
| Succes | `text-green-400` | #4ade80 | — |

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
  <h3 className="text-lg font-bold text-cyan-400 mb-2">Titlu</h3>
  <p className="text-gray-400">Conținut...</p>
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

**Actualizat:** 2026-05-29 | **Fază curentă:** 1
