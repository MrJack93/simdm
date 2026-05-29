# Ghid de Implementare — SIMDM Design System + Accessibility

**Versiune:** 1.0  
**Auditoriu:** Developeri Frontend (React + Tailwind)  
**Valabil pentru:** Fazele 2-8  
**Status:** Activ — actualizează după fiecare fază

---

## 🎯 Scopul Acestui Ghid

Conectează **AUDIT_ACCESIBILITATE.md** ← → **DESIGN_SYSTEM.md** cu cod real.  
Arată cum să implementezi componente accesibile, pe măsură ce construiești modulele din Fazele 2-8.

---

## 📋 Checklist Pre-Implementare (Înainte de Orice Componentă)

- [ ] Citit `AUDIT_ACCESIBILITATE.md` — înțeleg top 3 priorități
- [ ] Citit `DESIGN_SYSTEM.md` — cunosc design token-urile și culori
- [ ] Setup Tailwind CSS cu color palette din tokens
- [ ] Instalat extensii Chrome: **axe DevTools** + **Lighthouse**
- [ ] Gata să testez cu NVDA/Narrator și tastatură

---

## 🛠️ Setup Tailwind cu Design Tokens

### 1. `frontend/tailwind.config.js` — Extinde Palet

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // SIMDM Brand Colors
        cyan: {
          400: '#22d3ee',  // Primary accent
          500: '#06b6d4',  // Primary hover
        },
        gray: {
          400: '#9ca3af',  // Secondary text
          500: '#6b7280',  // Muted (evita)
          600: '#4b5563',  // Border (folosesc asta, nu gray-700)
          700: '#374151',  // Border decorativ (evita)
          800: '#1f2937',  // Card/input background
          900: '#111827',  // Surface primary
          950: '#030712',  // Page background
        },
        // Semantic Colors
        error: '#f87171',    // red-400
        success: '#4ade80',  // green-400
        warning: '#fbbf24',  // amber-400
        info: '#60a5fa',     // blue-400
      },
      spacing: {
        // 8px base scale
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      // Focus ring preset
      ringColor: {
        focus: '#22d3ee', // cyan-400
      },
      ringOffsetColor: {
        focus: '#030712', // gray-950
      },
    },
  },
  plugins: [],
};
```

### 2. `frontend/src/index.css` — Utilități Globale

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Focus Ring Utility — Reutilizabil pe orice interactiv */
@layer components {
  .focusable {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-gray-950 transition-all;
  }

  .focusable-danger {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-red-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-gray-950;
  }

  /* Button Presets */
  .btn-primary {
    @apply px-4 py-3 min-h-[44px] bg-cyan-500 hover:bg-cyan-400
           text-black font-bold rounded-lg focusable
           disabled:bg-cyan-500/50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply px-4 py-3 min-h-[44px] bg-gray-700 hover:bg-gray-600
           text-gray-100 font-semibold rounded-lg focusable;
  }

  .btn-danger {
    @apply px-4 py-3 min-h-[44px] bg-red-600 hover:bg-red-700
           text-white font-bold rounded-lg focusable-danger;
  }

  /* Input Preset */
  .input-base {
    @apply w-full px-4 py-3 min-h-[44px] bg-gray-800 border border-gray-600
           text-white text-base rounded-lg focusable
           placeholder:text-gray-500 disabled:opacity-50;
  }

  /* Label Preset */
  .label-base {
    @apply text-gray-400 text-sm mb-1 block font-medium;
  }

  /* Card Preset */
  .card-base {
    @apply bg-gray-900 border border-gray-700 rounded-lg
           px-6 py-6 transition-all;
  }

  /* Alert Presets */
  .alert-error {
    @apply bg-red-950/30 border border-red-600 px-4 py-3 rounded-lg
           text-red-400 text-sm;
  }

  .alert-success {
    @apply bg-green-950/30 border border-green-600 px-4 py-3 rounded-lg
           text-green-400 text-sm;
  }

  .alert-info {
    @apply bg-blue-950/30 border border-blue-600 px-4 py-3 rounded-lg
           text-blue-400 text-sm;
  }
}

/* Typography Presets */
h1 {
  @apply text-4xl font-bold text-cyan-400 mb-6 leading-tight;
}

h2 {
  @apply text-2xl font-bold text-cyan-400 mb-4 leading-tight;
}

h3 {
  @apply text-xl font-bold text-white mb-3;
}

p {
  @apply text-gray-100 leading-relaxed;
}

small {
  @apply text-sm text-gray-400;
}
```

---

## 🧩 Componente — Implementare Practică

### Input cu Validare & Accesibilitate

```jsx
// src/components/FormInput.jsx
import React from 'react';

export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  autoFocus,
  disabled,
  required,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="label-base">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className="input-base"
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="assertive"
          className="text-red-400 text-sm mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

**Utilizare:**
```jsx
<FormInput
  id="username"
  label="Utilizator"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  autoComplete="username"
  autoFocus
  error={errors.username}
  required
/>
```

### Button cu Stări de Încărcare

```jsx
// src/components/Button.jsx
import React from 'react';

export default function Button({
  variant = 'primary', // primary | secondary | danger
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const baseClass = 'font-semibold transition-all min-h-[44px]';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseClass} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Se procesează…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

**Utilizare:**
```jsx
<Button
  variant="primary"
  loading={isLoading}
  onClick={handleSubmit}
>
  Conectare
</Button>
```

### Card Reutilizabil

```jsx
// src/components/Card.jsx
import React from 'react';

export default function Card({
  title,
  subtitle,
  children,
  action,
  hoverable = true,
}) {
  return (
    <div className={`card-base ${hoverable ? 'hover:shadow-lg' : ''}`}>
      {(title || action) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && <h3 className="text-lg font-bold text-cyan-400">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-gray-100">{children}</div>
    </div>
  );
}
```

**Utilizare:**
```jsx
<Card
  title="DM-001"
  subtitle="Electrocardio"
  action={<Button variant="secondary" size="sm">Editare</Button>}
>
  Status: <strong className="text-green-400">Funcțional</strong>
</Card>
```

### Tabel Accesibil

```jsx
// src/components/DataTable.jsx
import React, { useState } from 'react';

export default function DataTable({
  columns,       // [{key, label, render?, sortable?}]
  data,
  onSort,
  sortKey,
  sortOrder,
}) {
  const handleSort = (key) => {
    onSort?.(key);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-600">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold text-cyan-400"
                aria-sort={
                  sortKey === col.key
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="focusable hover:text-cyan-300"
                  >
                    {col.label} {sortKey === col.key && (sortOrder === 'asc' ? '▲' : '▼')}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-700 hover:bg-gray-800/50"
            >
              {columns.map((col) => (
                <td key={`${idx}-${col.key}`} className="px-4 py-3 text-gray-100">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Utilizare:**
```jsx
const columns = [
  { key: 'inventoryNumber', label: 'Nr. Inventar', sortable: true },
  { key: 'name', label: 'Denumire' },
  {
    key: 'status',
    label: 'Status',
    render: (status) => (
      <span
        className={
          status === 'FUNCTIONAL'
            ? 'px-2 py-1 bg-green-950/30 text-green-400 rounded text-xs font-semibold'
            : 'px-2 py-1 bg-red-950/30 text-red-400 rounded text-xs font-semibold'
        }
      >
        {status === 'FUNCTIONAL' ? '✓ Funcțional' : '✗ Defect'}
      </span>
    ),
  },
];

<DataTable columns={columns} data={devices} onSort={handleSort} />
```

---

## ♿ Accessibility Checklist per Componentă

### Înainte de a Merge PR

```markdown
## Accessibility Review

- [ ] **Labels & Inputs**
  - [ ] Toți input-urile au `id` și `htmlFor` pe label
  - [ ] `autoComplete` setat corect
  - [ ] `autoFocus` pe primul input din formular

- [ ] **Focus Management**
  - [ ] Focus ring vizibil pe toate interactive element-uri
  - [ ] Ordinea Tab logică (testeaz cu Tab + Shift+Tab)
  - [ ] Nu există keyboard trap-uri

- [ ] **Errors & Messages**
  - [ ] Erori au `role="alert" aria-live="assertive"`
  - [ ] Erori sunt asociate cu input via `aria-describedby`
  - [ ] Success messages au `role="status" aria-live="polite"`

- [ ] **Contrast & Colors**
  - [ ] Text contrast ≥ 4.5:1 (WCAG AA)
  - [ ] Culoarea NU este singura sursă de info (folosește text + icon)

- [ ] **Sizes & Touch Targets**
  - [ ] Butoane/inputuri au `min-h-[44px]`
  - [ ] Gap între clickable elements ≥ 8px

- [ ] **Tables** (dacă este cazul)
  - [ ] `<thead>`, `<th scope="col">`
  - [ ] Sortare cu `aria-sort="ascending" | "descending"`

- [ ] **Testing**
  - [ ] Testat cu tastatură singură (fără mouse)
  - [ ] Testat cu NVDA/Narrator
  - [ ] Lighthouse Accessibility ≥ 95
  - [ ] axe DevTools: 0 erori critice
```

---

## 🧪 Testare Automată & Manuală

### 1. Lighthouse (Chrome DevTools)

```bash
# În browser:
# 1. Deschide DevTools (F12)
# 2. Mergi pe Lighthouse
# 3. Selectează "Accessibility"
# 4. Rulează audit
# 5. Target: ≥95 puncte
```

### 2. axe DevTools (Extensie Gratuită)

```bash
# Instalează din Chrome Web Store
# Rulează scan pe pagina
# Target: 0 erori critice, 0 erori serioase
```

### 3. Test Manual cu Tastatură

```bash
# Deactivează mouse-ul
# Tab/Shift+Tab pentru navigare
# Enter pentru submit
# Space pentru toggle
# Escape pentru cancel

# ✓ Focus trebuie vizibil la fiecare pas
# ✓ Ordinea trebuie logică (top-left → bottom-right)
# ✗ Niciun keyboard trap
```

### 4. Test cu Cititor de Ecran

#### Windows — Narrator (inclus)
```bash
# Tastează: Windows + Ctrl + Enter
# Ascultă cum este anuntat textul, butoanele, erori
```

#### Windows — NVDA (gratuit)
```bash
# Descarcă: https://www.nvaccess.org
# Instalează și pornește
# Folosește NVDA + Săgeți pentru navigare
```

---

## 📊 Raportare Bug-uri de Accesibilitate

**Template pentru Issue:**

```markdown
## [A11y] Etichetă componentă

**Descriere:**
[Ce e problematic?]

**Componenta:**
- Pagina: Login / Dashboard / Inventar
- Componentă: Button / Input / Table

**Problema WCAG:**
- [ ] 1.3.1 — Info și relații
- [ ] 1.4.3 — Contrast (Minimum)
- [ ] 2.4.7 — Focus Vizibil
- [ ] 3.3.1 — Identificare Erori
- [ ] 4.1.2 — Nume, Rol, Valoare

**Cum să reproduci:**
1. [Pași]
2. [Pași]

**Ce se întâmplă:**
- Descrie comportamentul curent
- Încluri screenshot

**Ce trebuie să se întâmple:**
- Descrie comportamentul așteptat
- Cu ref. la WCAG (dacă e cazul)

**Environment:**
- Browser: Chrome vX
- OS: Windows 11
```

---

## 📚 Referințe Rapide

| Topic | Link |
|-------|------|
| WCAG 2.1 AA | https://www.w3.org/WAI/WCAG21/quickref/ |
| ARIA Patterns | https://www.w3.org/WAI/ARIA/apg/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| WebAIM Contrast | https://webaim.org/resources/contrastchecker/ |
| NVDA | https://www.nvaccess.org |
| axe DevTools | https://www.deque.com/axe/devtools/ |

---

## ✅ Faze Implementare

- **Faza 1** ✅ — Login + Audit + Design System
- **Faza 2** — Inventar (Tabel + CRUD)
- **Faza 3+** — Mentenanță, Documente, Incidente

După fiecare fază, actualizează `DESIGN_SYSTEM.md` cu noi componente și pattern-uri.

---

**Ultimă actualizare:** 2026-05-28  
**Întrebări?** Consultă `AUDIT_ACCESIBILITATE.md` și `DESIGN_SYSTEM.md`
