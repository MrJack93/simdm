# Ghid Dezvoltator — SIMDM Frontend

**Versiune:** 1.0
**Status:** Faza 1 (infrastructura pregătită pentru Faza 2+)
**Actualizat:** 2026-05-29
**Audiență:** Developeri frontend

---

## Navigare rapidă

- [Configurare Tailwind](#configurare-tailwind)
- [Implementare componente](#implementare-componente)
- [Tipare frecvente](#tipare-frecvente)
- [Testare și validare](#testare-și-validare)
- [Checklist accesibilitate](#checklist-accesibilitate)
- [Depanare](#depanare)

---

## Configurare Tailwind

### Configurare `tailwind.config.js`

`frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Culorile brandului SIMDM
        cyan: {
          400: '#22d3ee',  // Accent principal
          500: '#06b6d4',  // Hover
        },
        gray: {
          400: '#9ca3af',  // Text secundar
          500: '#6b7280',  // Estompat (evită pentru conținut principal)
          600: '#4b5563',  // Border (folosește asta, nu gray-700)
          700: '#374151',  // Border decorativ (contrast scăzut)
          800: '#1f2937',  // Fundal card/input
          900: '#111827',  // Suprafață primară
          950: '#030712',  // Fundal pagină
        },
        // Culori semantice
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

### Stiluri globale

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Focus Ring — utilitar universal */
@layer components {
  .focusable {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-gray-950 transition-all;
  }

  .focusable-danger {
    @apply focus-visible:ring-red-400 focus-visible:ring-offset-gray-950;
  }

  /* Butoane */
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

  /* Elemente de formular */
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

  /* Alerte */
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

/* Tipografie */
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

## Implementare componente

### Componenta FormInput

**Utilizare:** Orice input de tip text/email/parolă cu label și tratarea erorilor.

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
          {required && <span className="text-red-400 ml-1">*</span>}
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
  placeholder="ex: bioinginer"
/>
```

### Componenta Button

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
  const variante = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  const dimensiuni = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={`font-semibold transition-all min-h-[44px] ${variante[variant]} ${dimensiuni[size]}`}
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

**Utilizare:**
```jsx
<Button variant="primary" onClick={handleSubmit}>
  Conectare
</Button>

<Button variant="danger" loading={isDeleting} onClick={handleDelete}>
  Ștergere
</Button>
```

### Componenta Card

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

**Utilizare:**
```jsx
<Card
  title="DM-001"
  subtitle="Electrocardiograf"
  action={<Button variant="secondary" size="sm">Editare</Button>}
>
  Status: <strong className="text-green-400">Funcțional</strong>
</Card>
```

---

## Tipare frecvente

### Formular cu validare

```jsx
import { useState } from 'react';
import api from '../api/axios';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function FormularLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Utilizatorul este obligatoriu';
    if (!formData.password) newErrors.password = 'Parola este obligatorie';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('simdm_token', res.data.token);
      // Redirect sau callback
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
          {globalError}
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

### Încărcare date cu react-query

```jsx
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function ListaDispozitive() {
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
        Eroare la încărcarea dispozitivelor: {error.message}
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

### Tabel cu sortare și paginare

```jsx
import { useState } from 'react';
import Button from '../components/Button';

function TabelDispozitive({ data, onSort, sortKey, sortOrder }) {
  const coloane = [
    { key: 'inventoryNumber', label: 'Nr. Inventar', sortabil: true },
    { key: 'name', label: 'Denumire', sortabil: true },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-600">
            {coloane.map(col => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left text-sm font-bold text-cyan-400"
                aria-sort={
                  sortKey === col.key
                    ? sortOrder === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
              >
                {col.sortabil ? (
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

function StatusBadge({ status }) {
  const config = {
    FUNCTIONAL: { stiluri: 'bg-green-950/30 border border-green-600 text-green-400', eticheta: '✓ Funcțional' },
    DEFECT: { stiluri: 'bg-red-950/30 border border-red-600 text-red-400', eticheta: '✗ Defect' },
    IN_REPARATIE: { stiluri: 'bg-amber-950/30 border border-amber-600 text-amber-400', eticheta: '⟳ În Reparație' },
    CASAT: { stiluri: 'bg-gray-700 border border-gray-600 text-gray-400', eticheta: '− Casat' },
  };
  const { stiluri, eticheta } = config[status] || {};
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${stiluri}`}>
      {eticheta}
    </span>
  );
}
```

---

## Testare și validare

### Checklist pre-commit

Înainte de `git commit`:

```
Calitate cod
- [ ] Niciun console.log() rămas în cod
- [ ] Niciun import nefolosit
- [ ] Variabile cu nume descriptive (nu a, b, x)
- [ ] Funcțiile au nume descriptive

Accesibilitate (WCAG 2.1 AA)
- [ ] Toate inputurile au id + <label htmlFor> asociat
- [ ] Toate câmpurile de formular au autoComplete setat
- [ ] Mesajele de eroare au role="alert" aria-live="assertive"
- [ ] Butoane/inputuri au min-h-[44px] sau py-3
- [ ] Focus ring vizibil (focus-visible:ring-...)
- [ ] Niciun outline:none fără înlocuitor
- [ ] Ordinea Tab logică

Testare
- [ ] Formularul validează (câmpuri goale blocate)
- [ ] Mesajele de eroare apar și se șterg la modificare
- [ ] Starea de încărcare funcționează (buton dezactivat, spinner vizibil)
- [ ] Mesajele de succes/eroare apar corect
- [ ] Funcționează fără mouse (tastatură singură)

Culori și contrast
- [ ] Contrast text ≥ 4.5:1 (verificat cu WebAIM)
- [ ] Status-urile nu sunt indicate doar prin culoare (text + icoană + culoare)
```

### Testare cu tastatură

```
Testare navigare cu tastatură (30 secunde per pagină)
1. Deconectează mouse-ul
2. Apasă Tab pentru a naviga (Shift+Tab înapoi)
3. Apasă Enter pentru a activa butoane
4. Apasă Space pentru a bifa checkbox-uri
5. Apasă Escape pentru a închide modale

Verifică:
  Focus vizibil la fiecare oprire
  Ordinea Tab logică
  Niciun keyboard trap
```

### Testare cu screen reader (NVDA — gratuit)

```
Descarcă NVDA: https://www.nvaccess.org
Start NVDA: Win + Ctrl + Enter

1. Navighează formularul cu NVDA
2. Verifică că label-urile sunt anunțate pentru inputuri
3. Verifică că erorile sunt anunțate cu role alert
4. Verifică că butoanele au etichete în română
5. Verifică că nu există butoane fără etichetă
```

### Lighthouse (Chrome DevTools)

```
1. Deschide DevTools (F12)
2. Mergi la tab-ul Lighthouse
3. Click "Analyze page load"
4. Verifică scorul Accessibility
5. Țintă: ≥ 95 puncte
```

### axe DevTools (extensie Chrome)

```
1. Instalează din Chrome Web Store
2. Click pe iconița axe
3. Click "Scan this page"
4. Vizualizează "Violations"
5. Țintă: 0 erori critice + serioase
```

---

## Checklist accesibilitate

### Obligatoriu pentru orice componentă

- [ ] **Asociere Label:** `<label htmlFor="id">` + `<input id="id">`
- [ ] **Focus Ring:** clasa `.focusable` sau `focus-visible:ring-...` manual
- [ ] **Dimensiune minimă:** `min-h-[44px]` sau `py-3` (înălțime 44px)
- [ ] **Mesaj eroare:** `role="alert" aria-live="assertive"`
- [ ] **Culoare + Text:** Status-ul NU e doar culoare (text + icoană + culoare)

### Înainte de merge PR

```
Accesibilitate:
  - [ ] Toate inputurile au id și <label htmlFor> asociat
  - [ ] autoComplete setat corect
  - [ ] autoFocus pe primul input din formular

  - [ ] Focus ring vizibil pe toate elementele interactive
  - [ ] Ordinea Tab logică
  - [ ] Niciun keyboard trap

  - [ ] Erori cu role="alert" aria-live="assertive"
  - [ ] Legate la input prin aria-describedby
  - [ ] Input cu aria-invalid="true" când e eroare

  - [ ] min-h-[44px] sau py-3
  - [ ] Clasa .focusable prezentă
  - [ ] Spațiu de 8px între butoane

  - [ ] Text contrast ≥ 4.5:1 (WCAG AA)
  - [ ] Status nu e indicat doar prin culoare

Testare:
  - [ ] Navigare cu tastatură funcționează
  - [ ] NVDA/Narrator anunță erorile
  - [ ] Lighthouse ≥ 95
  - [ ] axe DevTools: 0 erori critice
```

---

## Depanare

### Probleme frecvente

#### "Focus ring nu e vizibil"
```jsx
// Greșit
className="... focus:outline-none focus:border-cyan-500 ..."

// Corect
className="... focusable ..."
// SAU manual:
className="... focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ..."
```

#### "Mesajul de eroare nu e anunțat"
```jsx
// Greșit
{error && <p>{error}</p>}

// Corect
{error && (
  <p role="alert" aria-live="assertive">
    {error}
  </p>
)}
```

#### "Butonul e prea mic"
```jsx
// Greșit
<button className="px-2 py-1">Acțiune</button>

// Corect
<button className="px-4 py-3 min-h-[44px]">Acțiune</button>
```

#### "Elementul nu e focusabil"
```jsx
// Greșit
<div onClick={handleClick}>Nu e focusabil</div>

// Corect
<button onClick={handleClick}>Focusabil</button>
// SAU input semantic:
<input id="camp" />
```

#### "Ordinea Tab sare aleator"
```jsx
// Greșit: z-index rupe ordinea Tab
<input style={{ position: 'absolute', zIndex: 1000 }} />

// Corect: folosești flex/grid pentru flux logic
<div className="flex flex-col gap-4">
  <input />  {/* Tab 1 */}
  <button /> {/* Tab 2 */}
</div>
```

---

## Resurse și referințe

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [NVDA Screen Reader](https://www.nvaccess.org)
- [Sistem de Design](./1-DESIGN-AND-ACCESSIBILITY.md)

---

**Istoric versiuni:**
- v1.0 — 2026-05-29: Ghid developer Faza 1 (consolidare + exemple practice)

**Întrebări?** Vezi [CLAUDE.md](../CLAUDE.md) sau [1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md)
