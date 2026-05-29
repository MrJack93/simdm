# Design System & Accessibility — SIMDM

**Version:** 1.0  
**Status:** Phase 1 Foundation (Faza 1)  
**Last Updated:** 2026-05-29  
**Audience:** Frontend Developers + Designers

> This document consolidates design tokens, component patterns, and WCAG 2.1 AA accessibility guidelines. **Single source of truth** for all visual & accessibility standards.

---

## 📑 Table of Contents

1. [Design Tokens](#design-tokens)
2. [Accessibility — WCAG 2.1 AA](#accessibility--wcag-21-aa)
3. [Component Patterns](#component-patterns)
4. [Accessibility Checklist per Component](#accessibility-checklist-per-component)

---

## Design Tokens

### 1. Color Palette

**Primary Brand Colors**

| Rol | Tailwind | Hex | WCAG AA Contrast | Usage |
|-----|----------|-----|-----------------|-------|
| **Primary** | `cyan-400` | #22d3ee | 9.8:1 ✅ | Headings, buttons, accent icons |
| **Primary Hover** | `cyan-500` | #06b6d4 | 8.9:1 ✅ | Hover state buttons |
| **Background** | `gray-950` | #030712 | — | Page background |
| **Surface Primary** | `gray-900` | #111827 | — | Cards, main surfaces |
| **Surface Secondary** | `gray-800` | #1f2937 | — | Input fields, secondary surfaces |
| **Border** | `gray-600` | #4b5563 | 3:1 ✅ | Borders, dividers |
| **Text Primary** | `white` | #ffffff | 17.7:1 ✅ | Main text |
| **Text Secondary** | `gray-400` | #9ca3af | 6.8:1 ✅ | Labels, helper text |
| **Text Muted** | `gray-500` | #6b7280 | 3.7:1 ❌ | Avoid for main content |
| **Error** | `red-400` | #f87171 | 5.6:1 ✅ | Error messages, validation |
| **Success** | `green-400` | #4ade80 | — | Success messages, checkmarks |
| **Warning** | `amber-400` | #fbbf24 | — | Warnings |
| **Info** | `blue-400` | #60a5fa | — | Info messages |

**Guidance:**
- ✅ `cyan-400` + `gray-900` = 9.8:1 (excellent)
- ✅ `white` + `gray-800` = 13.6:1 (excellent)
- ✅ `gray-400` + `gray-900` = 6.8:1 (very good)
- ❌ `gray-600` on `gray-800` = 1.5:1 (fail — use gray-600 on gray-900)
- ❌ `gray-500` = 3.7:1 (avoid for text, use for placeholder only)

### 2. Typography

```css
/* Heading 1 (h1) */
font-size: 48px;
font-weight: 700;
line-height: 1.2;
color: cyan-400;
margin-bottom: 1.5rem;

/* Heading 2 (h2) */
font-size: 32px;
font-weight: 700;
color: cyan-400;
margin-bottom: 1.25rem;

/* Heading 3 (h3) */
font-size: 24px;
font-weight: 700;
color: white;
margin-bottom: 1rem;

/* Body Text */
font-size: 16px;
font-weight: 400;
line-height: 1.5;
color: gray-100;

/* Small / Label */
font-size: 14px;
font-weight: 500;
color: gray-400;
```

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### 3. Spacing Scale (8px base)

| Alias | Value | Usage |
|-------|-------|-------|
| `xs` | 2px | Fine borders, small details |
| `sm` | 4px | Inline gaps |
| `md` | 8px | Default padding, normal gap |
| `lg` | 16px | Card padding, component gap |
| `xl` | 24px | Section spacing |
| `2xl` | 32px | Large block spacing |
| `3xl` | 48px | Hero/page level |

**Apply via Tailwind:** `p-4`, `gap-6`, `mb-8`, etc.

### 4. Border & Radius

| Element | Radius | Border |
|---------|--------|--------|
| Input | `rounded-lg` (8px) | 1px solid `gray-600` |
| Button | `rounded-lg` (8px) | None |
| Card | `rounded-lg` (8px) | 1px solid `gray-700` (decorative) |
| Modal | `rounded-xl` (12px) | None |

### 5. Sizing

| Element | Size | Note |
|---------|------|------|
| **Input Height** | 44px min (`py-3`) | WCAG 2.5.5 Operable |
| **Button Height** | 44px min | Touch target |
| **Button Width** | fit-content / full-width | Context-dependent |
| **Focus Ring** | 2px, cyan-400 | Offset 2px from element |

---

## Accessibility — WCAG 2.1 AA

### Mandatory Rules (Every Component)

1. **Labels Associated**
   ```jsx
   <label htmlFor="username">Username</label>
   <input id="username" ... />
   ```
   - ✅ NEVER input without associated label
   - ✅ Use `htmlFor`/`id` matching
   - ✅ Labels visible (not placeholder-only)

2. **Focus Ring Visible**
   ```jsx
   // Use utility class
   className="... focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ..."
   
   // OR preset in CSS
   @layer components {
     .focusable {
       @apply focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-cyan-400 focus-visible:ring-offset-2
              focus-visible:ring-offset-gray-900;
     }
   }
   ```
   - ✅ 2px ring, visible contrast
   - ✅ Offset 2px from element
   - ✅ NO `outline: none` without replacement

3. **Touch Targets 44x44px**
   ```jsx
   <button className="... min-h-[44px] px-4 py-3 ...">
   <input className="... min-h-[44px] ..."/>
   ```
   - ✅ Buttons: `min-h-[44px]`
   - ✅ Inputs: `py-3` or `min-h-[44px]`
   - ✅ Gap between clickables ≥8px

4. **Errors Announced**
   ```jsx
   {error && (
     <p id="username-error" role="alert" aria-live="assertive" className="text-red-400">
       {error}
     </p>
   )}
   <input aria-describedby="username-error" aria-invalid={!!error} />
   ```
   - ✅ `role="alert"` for errors
   - ✅ `aria-live="assertive"` (immediate announce)
   - ✅ Link input to error via `aria-describedby`

5. **Status Messages Announced**
   ```jsx
   <div role="status" aria-live="polite">
     ✓ Dispozitiv salvat!
   </div>
   ```
   - ✅ Loading: `aria-live="polite"` + `aria-busy="true"`
   - ✅ Success/Info: `role="status"`

6. **Semantic HTML**
   ```jsx
   <header>...</header>
   <main id="main">...</main>
   <table>
     <thead><tr><th scope="col">...</th></tr></thead>
   </table>
   ```
   - ✅ `<header>`, `<main id="main">`, `<footer>`
   - ✅ `<th scope="col">` / `<th scope="row">`
   - ✅ Use `<button>` not `<div onClick>`

7. **Color is Not Only Source**
   ```jsx
   // ❌ WRONG: Color alone
   <span className="text-red-400">Defect</span>
   
   // ✅ RIGHT: Text + Icon + Color
   <span className="flex items-center gap-2 text-red-400">
     ✗ Defect
   </span>
   ```
   - ✅ Use text + icon + color together
   - ✅ Decorative SVGs: `aria-hidden="true"`
   - ✅ Functional icons: `aria-label="..."`

8. **Contrast ≥ 4.5:1 (Text) / 3:1 (UI)**
   - ✅ Check with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - ✅ Dark on light / light on dark
   - ✅ Large text (18pt+): 3:1 OK

### Testing Manually

| Test | How | Target |
|------|-----|--------|
| **Keyboard** | Tab only, no mouse | Focus visible everywhere, logical order, no traps |
| **Screen Reader** | NVDA / Narrator | Errors announced, labels read, buttons labeled |
| **Zoom 200%** | Chrome Ctrl+Shift++ | No horizontal scroll, text readable |
| **Lighthouse** | DevTools → Lighthouse | Accessibility score ≥95 |
| **axe DevTools** | Chrome extension | 0 critical/serious errors |

---

## Component Patterns

### Button (4 Variants)

```jsx
// Primary
<button className="px-4 py-3 min-h-[44px] bg-cyan-500 hover:bg-cyan-400 
                   text-black font-bold rounded-lg focusable
                   disabled:bg-cyan-500/50 disabled:cursor-not-allowed">
  Conectare
</button>

// Secondary
<button className="px-4 py-3 min-h-[44px] bg-gray-700 hover:bg-gray-600
                   text-gray-100 font-semibold rounded-lg focusable">
  Anulare
</button>

// Danger
<button className="px-4 py-3 min-h-[44px] bg-red-600 hover:bg-red-700
                   text-white font-bold rounded-lg focusable-danger">
  Ștergere
</button>

// Ghost (link-like)
<button className="px-4 py-3 text-cyan-400 hover:text-cyan-300 font-semibold focusable">
  Link-button
</button>

// Loading state
<button disabled aria-busy={loading} className="btn-primary">
  {loading ? <span className="flex items-center gap-2"><Spinner /> Se conectează…</span> : "Conectare"}
</button>
```

### Input + Label

```jsx
<div className="mb-4">
  <label htmlFor="email" className="text-gray-400 text-sm mb-1 block font-medium">
    Email <span className="text-red-400">*</span>
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    autoFocus
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? "email-error" : undefined}
    placeholder="example@example.com"
    className="w-full px-4 py-3 min-h-[44px] bg-gray-800 border border-gray-600
               text-white rounded-lg focusable placeholder:text-gray-500
               disabled:opacity-50"
  />
  {error && (
    <p id="email-error" role="alert" className="text-red-400 text-sm mt-1">
      {error}
    </p>
  )}
</div>
```

### Card

```jsx
<div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-6 transition-all hover:shadow-lg">
  <h3 className="text-lg font-bold text-cyan-400 mb-2">Titlu Card</h3>
  <p className="text-gray-400 text-sm">Descriere...</p>
</div>
```

### Alert (Feedback Messages)

```jsx
// Error
{error && (
  <div role="alert" aria-live="assertive" className="bg-red-950/30 border border-red-600
       px-4 py-3 rounded-lg text-red-400 text-sm">
    ❌ Eroare: {error}
  </div>
)}

// Success
{success && (
  <div role="status" aria-live="polite" className="bg-green-950/30 border border-green-600
       px-4 py-3 rounded-lg text-green-400 text-sm">
    ✓ {success}
  </div>
)}

// Info
<div role="status" aria-live="polite" className="bg-blue-950/30 border border-blue-600
     px-4 py-3 rounded-lg text-blue-400 text-sm">
  ℹ️ Informație
</div>
```

### Table (Accessible)

```jsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-gray-600">
        <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-cyan-400"
            aria-sort={sortKey === 'name' ? 'ascending' : 'none'}>
          <button onClick={() => handleSort('name')}>
            Denumire {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
          </button>
        </th>
        <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-cyan-400">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-800/50">
          <td className="px-4 py-3 text-gray-100">{row.name}</td>
          <td className="px-4 py-3">
            <StatusBadge status={row.status} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**StatusBadge Component:**
```jsx
function StatusBadge({ status }) {
  const styles = {
    FUNCTIONAL: 'bg-green-950/30 border border-green-600 text-green-400',
    DEFECT: 'bg-red-950/30 border border-red-600 text-red-400',
    IN_REPARATIE: 'bg-amber-950/30 border border-amber-600 text-amber-400',
    CASAT: 'bg-gray-700 border border-gray-600 text-gray-400',
  };
  const labels = {
    FUNCTIONAL: '✓ Funcțional',
    DEFECT: '✗ Defect',
    IN_REPARATIE: '⟳ În Reparație',
    CASAT: '− Casat',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
```

### Modal (Accessible Dialog)

```jsx
{showModal && (
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
       className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-gray-900 rounded-xl px-6 py-6 max-w-md w-full mx-4">
      <h2 id="modal-title" className="text-xl font-bold text-cyan-400 mb-4">
        Confirmă ștergere
      </h2>
      <p className="text-gray-400 mb-6">
        Ești sigur? Această acțiune nu poate fi anulată.
      </p>
      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
          Anulare
        </button>
        <button className="btn-danger flex-1" onClick={handleDelete}>
          Ștergere
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Accessibility Checklist per Component

Before merging ANY component:

- [ ] **Labels & Inputs**
  - [ ] All inputs have `id` + label with `htmlFor`
  - [ ] `autoComplete` set correctly
  - [ ] `autoFocus` on first field if form

- [ ] **Focus Management**
  - [ ] Focus ring visible on all interactive elements
  - [ ] Tab order is logical (top-left → bottom-right)
  - [ ] No keyboard traps

- [ ] **Error Handling**
  - [ ] Errors have `role="alert" aria-live="assertive"`
  - [ ] Input has `aria-describedby` linking to error
  - [ ] Input has `aria-invalid="true"` when error

- [ ] **Button & Touch Targets**
  - [ ] `min-h-[44px]` or `py-3` (44px height)
  - [ ] `.focusable` class or manual focus ring
  - [ ] Gap between buttons ≥8px

- [ ] **Colors & Contrast**
  - [ ] Text contrast ≥ 4.5:1 (checked with WebAIM)
  - [ ] Color is NOT only source of info
  - [ ] Icons + text + color together

- [ ] **Tables** (if applicable)
  - [ ] `<th scope="col">` for headers
  - [ ] `aria-sort="ascending|descending|none"` if sortable
  - [ ] Proper `<thead>`, `<tbody>`

- [ ] **SVG Icons**
  - [ ] Decorative: `aria-hidden="true"`
  - [ ] Functional: `aria-label="Description"`

- [ ] **Testing**
  - [ ] Keyboard-only navigation (Tab/Enter/Escape)
  - [ ] Screen reader test (NVDA/Narrator — errors announced)
  - [ ] Lighthouse Accessibility ≥95
  - [ ] axe DevTools: 0 critical errors

---

## Implementation Checklist

### Setup Tailwind with Design Tokens

`tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // SIMDM Brand
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
        // Use standard gray but verify contrast
      },
    },
  },
};
```

`src/index.css`:
```css
@layer components {
  .focusable {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-gray-950 transition-all;
  }
  
  .focusable-danger {
    @apply focus-visible:ring-red-400 focus-visible:ring-offset-gray-950;
  }

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

  .input-base {
    @apply w-full px-4 py-3 min-h-[44px] bg-gray-800 border border-gray-600
           text-white text-base rounded-lg focusable placeholder:text-gray-500
           disabled:opacity-50;
  }

  .label-base {
    @apply text-gray-400 text-sm mb-1 block font-medium;
  }

  .card-base {
    @apply bg-gray-900 border border-gray-700 rounded-lg px-6 py-6 transition-all;
  }

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
```

---

## External Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [NVDA Screen Reader](https://www.nvaccess.org)
- [Deque axe DevTools](https://www.deque.com/axe/devtools/)

---

**Version History:**
- v1.0 — 2026-05-29: Consolidation of Phase 1 design + audit

**Questions?** Refer to [CLAUDE.md](../CLAUDE.md) or [2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md)
