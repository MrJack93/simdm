# Developer Guide — SIMDM Frontend

**Version:** 1.0  
**Status:** Phase 1 (Framework ready for Phase 2+)  
**Last Updated:** 2026-05-29  
**Audience:** Frontend Developers

---

## 📑 Quick Navigation

- [Tailwind Setup](#tailwind-setup)
- [Component Implementation](#component-implementation)
- [Common Patterns](#common-patterns)
- [Testing & Validation](#testing--validation)
- [Accessibility Checklist](#accessibility-checklist)
- [Troubleshooting](#troubleshooting)

---

## Tailwind Setup

### Configuration

`frontend/tailwind.config.js`:
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
          500: '#06b6d4',  // Hover state
        },
        gray: {
          400: '#9ca3af',  // Secondary text
          500: '#6b7280',  // Muted (avoid main content)
          600: '#4b5563',  // Border (use this, not gray-700)
          700: '#374151',  // Border decorative (low contrast)
          800: '#1f2937',  // Card/input background
          900: '#111827',  // Surface primary
          950: '#030712',  // Page background
        },
        // Semantic colors
        error: '#f87171',    // red-400
        success: '#4ade80',  // green-400
        warning: '#fbbf24',  // amber-400
        info: '#60a5fa',     // blue-400
      },
      spacing: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
    },
  },
  plugins: [],
};
```

### Global Styles

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Focus Ring — Universal utility */
@layer components {
  .focusable {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-gray-950 transition-all;
  }

  .focusable-danger {
    @apply focus-visible:ring-red-400 focus-visible:ring-offset-gray-950;
  }

  /* Buttons */
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

  /* Form Elements */
  .input-base {
    @apply w-full px-4 py-3 min-h-[44px] bg-gray-800 border border-gray-600
           text-white text-base rounded-lg focusable
           placeholder:text-gray-500 disabled:opacity-50;
  }

  .label-base {
    @apply text-gray-400 text-sm mb-1 block font-medium;
  }

  /* Card */
  .card-base {
    @apply bg-gray-900 border border-gray-700 rounded-lg
           px-6 py-6 transition-all;
  }

  /* Alerts */
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

/* Typography */
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

## Component Implementation

### FormInput Component

**Use:** Any text/email/password input with label and error handling.

`src/components/FormInput.jsx`:
```jsx
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

**Usage:**
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
  placeholder="ex: bioinginer"
/>
```

### Button Component

`src/components/Button.jsx`:
```jsx
import React from 'react';

export default function Button({
  variant = 'primary', // primary | secondary | danger
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
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
      className={`font-semibold transition-all min-h-[44px] ${variants[variant]} ${sizes[size]}`}
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

**Usage:**
```jsx
<Button variant="primary" onClick={handleSubmit}>
  Conectare
</Button>

<Button variant="danger" loading={isDeleting} onClick={handleDelete}>
  Ștergere
</Button>
```

### Card Component

`src/components/Card.jsx`:
```jsx
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

**Usage:**
```jsx
<Card
  title="DM-001"
  subtitle="Electrocardio"
  action={<Button variant="secondary" size="sm">Editare</Button>}
>
  Status: <strong className="text-green-400">Funcțional</strong>
</Card>
```

---

## Common Patterns

### Form with Validation

```jsx
import { useState } from 'react';
import api from '../api/axios';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' })); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username obligatoriu';
    if (!formData.password) newErrors.password = 'Parolă obligatorie';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('simdm_token', res.data.token);
      // Redirect or callback
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Eroare necunoscută');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div role="alert" className="alert-error">
          ❌ {globalError}
        </div>
      )}

      <FormInput
        id="username"
        label="Utilizator"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        required
        autoFocus
      />

      <FormInput
        id="password"
        label="Parolă"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Button variant="primary" loading={loading} className="w-full">
        {loading ? 'Se conectează…' : 'Conectare'}
      </Button>
    </form>
  );
}
```

### Loading Data with react-query

```jsx
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function DeviceList() {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/api/devices').then(res => res.data),
  });

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="alert-info">
        Se încarcă dispozitivele…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="alert-error">
        ❌ Eroare la încărcarea dispozitivelor: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices?.length === 0 ? (
        <p className="text-gray-400">Nu sunt dispozitive înregistrate.</p>
      ) : (
        devices?.map(device => (
          <Card
            key={device.id}
            title={device.inventoryNumber}
            subtitle={device.name}
          >
            Status: {device.status}
          </Card>
        ))
      )}
    </div>
  );
}
```

### Table with Sorting & Pagination

```jsx
import { useState } from 'react';
import Button from '../components/Button';

function DeviceTable({ data, onSort, sortKey, sortOrder }) {
  const columns = [
    { key: 'inventoryNumber', label: 'Nr. Inventar', sortable: true },
    { key: 'name', label: 'Denumire', sortable: true },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-600">
            {columns.map(col => (
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
                    onClick={() => onSort(col.key)}
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
            <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50">
              <td className="px-4 py-3 text-gray-100">{row.inventoryNumber}</td>
              <td className="px-4 py-3 text-gray-400">{row.name}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// StatusBadge helper
function StatusBadge({ status }) {
  const config = {
    FUNCTIONAL: { styles: 'bg-green-950/30 border border-green-600 text-green-400', label: '✓ Funcțional' },
    DEFECT: { styles: 'bg-red-950/30 border border-red-600 text-red-400', label: '✗ Defect' },
    IN_REPARATIE: { styles: 'bg-amber-950/30 border border-amber-600 text-amber-400', label: '⟳ În Reparație' },
    CASAT: { styles: 'bg-gray-700 border border-gray-600 text-gray-400', label: '− Casat' },
  };
  const { styles, label } = config[status] || {};
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}
```

---

## Testing & Validation

### Pre-Commit Checklist

Before `git commit`:

```markdown
## Code Quality
- [ ] No `console.log()` left in code
- [ ] No unused imports
- [ ] Variables are meaningful (not `a`, `b`, `x`)
- [ ] Function names are descriptive

## Accessibility (WCAG 2.1 AA)
- [ ] All inputs have `id` + associated `<label htmlFor>`
- [ ] All form inputs have `autoComplete` (username, email, current-password, etc.)
- [ ] Error messages have `role="alert" aria-live="assertive"`
- [ ] Buttons/inputs have `min-h-[44px]` or `py-3`
- [ ] Focus ring visible (`focus-visible:ring-...`)
- [ ] No `outline:none` without replacement
- [ ] Tab order is logical

## Testing
- [ ] Form validates input (no empty fields)
- [ ] Error messages appear and are cleared on change
- [ ] Loading state works (button disabled, spinner visible)
- [ ] Success/failure messages appear
- [ ] Works without mouse (keyboard only)

## Colors & Contrast
- [ ] Text contrast ≥ 4.5:1 (check with WebAIM)
- [ ] No color-only status indicators (text + icon + color)
```

### Keyboard Testing

```bash
# Test keyboard navigation (30 sec per page)
1. Disconnect mouse or disable in settings
2. Press Tab to navigate (Shift+Tab backwards)
3. Press Enter to click buttons
4. Press Space to toggle checkboxes
5. Press Escape to close modals

✓ Focus should be visible everywhere
✓ Focus should move logically
✓ No keyboard traps (Tab cycling trapped somewhere)
```

### Screen Reader Testing (NVDA — Free)

```bash
# Download NVDA: https://www.nvaccess.org
# Start NVDA: Win + Ctrl + Enter

1. Navigate form with NVDA
2. Verify labels are announced for inputs
3. Verify errors are announced with alert role
4. Verify button labels in Romanian
5. Verify no "click me" or unlabeled buttons
```

### Lighthouse (Chrome DevTools)

```bash
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"
4. Check Accessibility score
5. Target: ≥95 points
```

### axe DevTools (Chrome Extension)

```bash
1. Install from Chrome Web Store
2. Click axe icon
3. Click "Scan this page"
4. Review "Violations"
5. Target: 0 critical + serious errors
```

---

## Accessibility Checklist

### REQUIRED for Every Component

- [ ] **Label Association:** `<label htmlFor="id">` + `<input id="id">`
- [ ] **Focus Ring:** `.focusable` class or manual `focus-visible:ring-...`
- [ ] **Minimum Size:** `min-h-[44px]` or `py-3` (44px height)
- [ ] **Error Messaging:** `role="alert" aria-live="assertive"`
- [ ] **Color + Text:** Status is NOT color-only (text + icon + color)

### Before Merging PR

**Accessibility Review:**

```markdown
- [ ] Labels & Inputs
  - [ ] All inputs have `id` and associated `<label htmlFor>`
  - [ ] `autoComplete` is set correctly
  - [ ] `autoFocus` on first input if form

- [ ] Focus Management
  - [ ] Focus ring visible on all interactive elements
  - [ ] Tab order is logical
  - [ ] No keyboard traps

- [ ] Errors & Messages
  - [ ] Errors have `role="alert" aria-live="assertive"`
  - [ ] Linked to input via `aria-describedby`
  - [ ] Input has `aria-invalid="true"` when error

- [ ] Buttons & Touch Targets
  - [ ] `min-h-[44px]` or `py-3`
  - [ ] Has `.focusable` class
  - [ ] 8px gap between buttons

- [ ] Contrast & Colors
  - [ ] Text ≥ 4.5:1 contrast (WCAG AA)
  - [ ] No color-only status (uses text + icon)

- [ ] Testing
  - [ ] Tab-only navigation works
  - [ ] NVDA/Narrator announces errors
  - [ ] Lighthouse ≥95
  - [ ] axe DevTools: 0 critical
```

---

## Troubleshooting

### Common Issues

#### "Focus ring not visible"
```jsx
// ❌ WRONG
className="... focus:outline-none focus:border-cyan-500 ..."

// ✅ CORRECT
className="... focusable ..."
// OR manually:
className="... focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ..."
```

#### "Error message not announced"
```jsx
// ❌ WRONG
{error && <p>{error}</p>}

// ✅ CORRECT
{error && (
  <p role="alert" aria-live="assertive">
    {error}
  </p>
)}
```

#### "Button too small"
```jsx
// ❌ WRONG
<button className="px-2 py-1">Click me</button>

// ✅ CORRECT
<button className="px-4 py-3 min-h-[44px]">Click me</button>
```

#### "Input not focusable"
```jsx
// ❌ WRONG
<div onClick={handleClick}>Not focusable</div>

// ✅ CORRECT
<button onClick={handleClick}>Focusable button</button>
// OR semantic input:
<input id="username" />
```

#### "Tab order jumps around"
```jsx
// ❌ WRONG: z-index breaks tab order
<input style={{ position: 'absolute', zIndex: 1000 }} />

// ✅ CORRECT: Use flex/grid for logical flow
<div className="flex flex-col gap-4">
  <input /> {/* Tab 1 */}
  <button /> {/* Tab 2 */}
</div>
```

---

## Resources & Reference

- **[WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)**
- **[ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)**
- **[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)**
- **[Tailwind CSS Docs](https://tailwindcss.com)**
- **[NVDA Screen Reader](https://www.nvaccess.org)**
- **[Design System →](./1-DESIGN-AND-ACCESSIBILITY.md)**

---

**Version History:**
- v1.0 — 2026-05-29: Phase 1 developer guide (consolidation + practical examples)

**Questions?** Check [CLAUDE.md](../CLAUDE.md) or [1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md)
