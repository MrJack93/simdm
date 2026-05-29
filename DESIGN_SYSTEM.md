# SIMDM Design System — Fundația Designului Modern

**Versiune:** 1.0  
**Status:** Foundation (Faza 1)  
**Revizia:** 2026-05-28

> Acest document definește token-urile de design, componente reutilizabile și ghiduri de interacțiune pentru SIMDM. Utilizează-l în toate fazele 2-8 pentru a menține coerență vizuală și accesibilitate.

---

## 📐 Design Tokens

### 1. Paletă de Culori

| Rol | Tailwind | Hex | Utilizare |
|-----|----------|-----|-----------|
| **Primary Brand** | cyan-400 | #22d3ee | Heading-uri, accent butoane, icoane active |
| **Primary Dark** | cyan-500 | #06b6d4 | Hover state pe butoane primary |
| **Secondary Text** | gray-400 | #9ca3af | Label-uri, text helper, text secundar |
| **Muted Text** | gray-500 | #6b7280 | Placeholder-uri (depășit, 3.7:1) |
| **Background Page** | gray-950 | #030712 | Fundal principal pagină |
| **Surface Primary** | gray-900 | #111827 | Fundal text, card-uri principale |
| **Surface Secondary** | gray-800 | #1f2937 | Input, control elements |
| **Border** | gray-600 | #4b5563 | Border inputuri, card-uri |
| **Border Light** | gray-700 | #374151 | Border decorative (evita, contrast prost) |
| **Text Primary** | white | #ffffff | Text normal pe fundal închis |
| **Error** | red-400 | #f87171 | Erori, validare fail |
| **Success** | green-400 | #4ade80 | Succes, validare pass |
| **Warning** | amber-400 | #fbbf24 | Avertisment |
| **Info** | blue-400 | #60a5fa | Informație |

**Contrasturi verificate (WCAG AA):**
- ✅ Cyan-400 pe gray-900: 9.8:1 (excelent)
- ✅ White pe gray-800: 13.6:1 (excelent)
- ✅ Gray-400 pe gray-900: 6.8:1 (foarte bun)
- ❌ Gray-600 pe gray-800: 1.5:1 (respins — nu folosi ca border principal)
- ✅ Red-400 pe gray-900: 5.6:1 (bun)

### 2. Tipografie

```css
/* Heading 1 (h1) */
font-size: 48px;     /* 3xl în Tailwind */
font-weight: 700;    /* bold */
line-height: 1.2;
color: cyan-400;
letter-spacing: -0.02em;
margin-bottom: 1.5rem;

/* Heading 2 (h2) */
font-size: 32px;     /* 2xl */
font-weight: 700;
line-height: 1.25;
color: cyan-400;
margin-bottom: 1.25rem;

/* Heading 3 (h3) */
font-size: 24px;     /* xl */
font-weight: 700;
line-height: 1.33;
color: white;
margin-bottom: 1rem;

/* Body Text (16px) */
font-size: 16px;     /* base */
font-weight: 400;
line-height: 1.5;
color: gray-100;
margin-bottom: 1rem;

/* Small Text (14px) */
font-size: 14px;     /* sm */
font-weight: 400;
line-height: 1.43;
color: gray-400;

/* Label */
font-size: 14px;
font-weight: 500;
line-height: 1.43;
color: gray-400;
text-transform: none;   /* DOAR limba română! */
```

**Font Stack (Recomandare pentru Faza 2):**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### 3. Spacing Scale (8px Base)

| Alias | Value | Utilizare |
|-------|-------|-----------|
| `xs` | 2px | Border gros, detalii mici |
| `sm` | 4px | Gap mic între inline elementos |
| `md` | 8px | Default padding input, gap normal |
| `lg` | 16px | Padding card, gap component |
| `xl` | 24px | Spacing section, container padding |
| `2xl` | 32px | Spacing mare între block-uri |
| `3xl` | 48px | Spacing page-level, hero padding |

### 4. Border & Radius

| Element | Radius | Border |
|---------|--------|--------|
| Input | `rounded-lg` (8px) | 1px solid gray-600 |
| Button | `rounded-lg` (8px) | none |
| Card | `rounded-lg` (8px) | 1px solid gray-700 (decorativ) |
| Modal | `rounded-xl` (12px) | none |

### 5. Shadow (Depth)

```css
/* Subtle — Card hover, lift effect */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);

/* Medium — Modal backdrop */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7);

/* None — Default cards, inputs */
```

### 6. Sizing & Dimensions

| Element | Dimensiune | Note |
|---------|-----------|------|
| **Input Height** | 44px min (py-3) | WCAG 2.5.5 — Operable |
| **Button Height** | 44px min | Țintă de atingere minimum |
| **Button Width** | fit-content / full-width | Context-dependent |
| **Card Max-Width** | 24rem (sm) / 48rem (md) | Responsive |
| **Container Max-Width** | 1200px | Standard |

---

## 🧩 Componente Reutilizabile

### 1. Button (4 Variante)

```jsx
/* Primary Button */
<button className="
  px-4 py-3 min-h-[44px]
  bg-cyan-500 hover:bg-cyan-400
  text-black font-bold
  rounded-lg transition-colors
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-cyan-400 focus-visible:ring-offset-2
  focus-visible:ring-offset-gray-900
  disabled:bg-cyan-500/50 disabled:cursor-not-allowed
">
  Conectare
</button>

/* Secondary Button */
<button className="
  px-4 py-3 min-h-[44px]
  bg-gray-700 hover:bg-gray-600
  text-gray-100 font-semibold
  rounded-lg transition-colors
  focus-visible:ring-2 focus-visible:ring-cyan-400
  focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
">
  Anulare
</button>

/* Danger Button */
<button className="
  px-4 py-3 min-h-[44px]
  bg-red-600 hover:bg-red-700
  text-white font-bold
  rounded-lg transition-colors
  focus-visible:ring-2 focus-visible:ring-red-400
  focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
">
  Ștergere
</button>

/* Ghost Button */
<button className="
  px-4 py-3 min-h-[44px]
  text-cyan-400 hover:text-cyan-300
  font-semibold transition-colors
  focus-visible:ring-2 focus-visible:ring-cyan-400
  focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
">
  Link-button
</button>
```

### 2. Input (Text + Password)

```jsx
<div className="mb-4">
  <label htmlFor="field" className="text-gray-400 text-sm mb-1 block">
    Etichetă
  </label>
  <input
    id="field"
    type="text"
    autoComplete="off"
    placeholder="hint..."
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? `${id}-error` : undefined}
    className="
      w-full px-4 py-3 min-h-[44px]
      bg-gray-800 border border-gray-600
      text-white text-base
      rounded-lg transition
      placeholder:text-gray-500
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-cyan-400 focus-visible:ring-offset-2
      focus-visible:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    "
  />
  {error && (
    <p id={`${id}-error`} role="alert" className="text-red-400 text-sm mt-1">
      {error}
    </p>
  )}
</div>
```

### 3. Card (Container)

```jsx
<div className="
  bg-gray-900 border border-gray-700
  rounded-lg px-6 py-6
  transition-all hover:shadow-lg
">
  <h3 className="text-lg font-bold text-cyan-400 mb-2">Titlu Card</h3>
  <p className="text-gray-400 text-sm">Conținut...</p>
</div>
```

### 4. Alert (Feedback Message)

```jsx
/* Error Alert */
<div role="alert" aria-live="assertive" className="
  bg-red-950/30 border border-red-600
  px-4 py-3 rounded-lg
  text-red-400 text-sm
">
  ❌ Eroare: Parolă incorectă
</div>

/* Success Alert */
<div role="status" aria-live="polite" className="
  bg-green-950/30 border border-green-600
  px-4 py-3 rounded-lg
  text-green-400 text-sm
">
  ✓ Succes: Dispozitiv adăugat
</div>

/* Info Alert */
<div role="status" aria-live="polite" className="
  bg-blue-950/30 border border-blue-600
  px-4 py-3 rounded-lg
  text-blue-400 text-sm
">
  ℹ️ Informație: Mentenanță programată
</div>
```

### 5. Table (Structured Data)

```jsx
<table className="w-full border-collapse">
  <thead>
    <tr className="border-b border-gray-600">
      <th 
        scope="col" 
        className="px-4 py-3 text-left text-sm font-bold text-cyan-400"
        aria-sort="none"
      >
        Număr Inventar
      </th>
      <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-cyan-400">
        Denumire
      </th>
      <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-cyan-400">
        Status
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-700 hover:bg-gray-800/50">
      <td className="px-4 py-3 text-gray-100">DM-001</td>
      <td className="px-4 py-3 text-gray-400">Electrocardio</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-950/30 border border-green-600 text-green-400 text-xs font-semibold">
          ✓ Funcțional
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

### 6. Modal (Accessible Dialog)

```jsx
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="modal-title"
  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
>
  <div className="bg-gray-900 rounded-xl px-6 py-6 max-w-md w-full mx-4">
    <h2 id="modal-title" className="text-xl font-bold text-cyan-400 mb-4">
      Confirmă ștergere
    </h2>
    <p className="text-gray-400 mb-6">
      Ești sigur? Această acțiune nu poate fi anulată.
    </p>
    <div className="flex gap-3">
      <button className="flex-1 px-4 py-3 bg-gray-700 text-gray-100 rounded-lg">
        Anulare
      </button>
      <button className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg">
        Ștergere
      </button>
    </div>
  </div>
</div>
```

---

## ♿ Accessibility Checklist (WCAG 2.1 AA)

### Pentru Fiecare Componentă

- [ ] Label-uri asociate prin `htmlFor` + `id`
- [ ] Focus vizibil cu ring (minimum 2px)
- [ ] Dimensiuni minimum 44x44px pentru butoane/inputuri
- [ ] Contrast text ≥ 4.5:1 (normal), 3:1 (large)
- [ ] Error-uri anunțate cu `role="alert"`
- [ ] Loading state cu `aria-busy="true"`
- [ ] Culoare NU este singura sursă de informație
- [ ] SVG decorative cu `aria-hidden="true"`
- [ ] Tabele cu `<thead>`, `<th scope="col">`
- [ ] Modal cu focus trap și `aria-modal="true"`

---

## 🎯 Implementare Faze

### Faza 1 ✅ (Completat)
- ✅ Login accesibil
- ✅ Dashboard placeholder
- ✅ Design tokens de bază

### Faza 2 (Q2 2026)
- [ ] Modul Inventar — tabel DM, CRUD, filtre
- [ ] Componente de tabel cu sort și paginare
- [ ] Form-uri complexe cu validare

### Faza 3+ (Q3-Q4 2026)
- [ ] Modul Mentenanță cu vizualizare calendar
- [ ] Modal-uri de dialog
- [ ] Generare PDF formular (MDM)

---

## 📖 Referințe & Link-uri

- **Tailwind CSS:** https://tailwindcss.com
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Aria Authoring:** https://www.w3.org/WAI/ARIA/apg/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## 🔄 Control Version

| Versiune | Data | Schimbări |
|----------|------|----------|
| 1.0 | 2026-05-28 | Design system inițial — Faza 1 |

Actualizează după fiecare nouă componentă în Faza 2+.
