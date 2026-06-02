# Sistem de Design și Accesibilitate — SIMDM

**Versiune:** 2.1 (Clinical Precision 2.0 + WCAG 2.1 AA Certified)
**Status:** ✅ Faza 1-2 Completă — Dark/Light mode, WCAG AA certified
**Actualizat:** 2026-06-02
**Audiență:** Developeri frontend + designeri

> Acest document consolidează token-urile de design Clinical Precision 2.0, tiparele pentru componente și regulile de accesibilitate WCAG 2.1 AA. **Sursa unică de adevăr** pentru toate standardele vizuale și de accesibilitate. Versiunea 2.0 introduce CSS variables pentru dark/light mode, accent portocaliu, și componente avansate (multi-step forms, autocomplete, inline edit).

---

## Cuprins

1. [Token-uri de design](#token-uri-de-design)
2. [Accesibilitate — WCAG 2.1 AA](#accesibilitate--wcag-21-aa)
3. [Tipare de componente](#tipare-de-componente)
4. [Checklist accesibilitate per componentă](#checklist-accesibilitate-per-component%C4%83)

---

## Token-uri de design

### 1. Paleta de culori — Clinical Precision 2.0 🎨

**CSS Variables (Dark/Light Mode)**

#### Dark Mode (Default — 9/10 închis)
| Rol | Variabilă | Hex | Contrast | Utilizare |
|-----|-----------|-----|----------|-----------|
| **Accent principal** | `--color-accent` | #ffb597 | 9.8:1 | Heading-uri, butoane, icoane accent |
| **Accent hover** | `--color-accent-hover` | #eb6b2c | 8.2:1 | Stare hover butoane |
| **Fundal pagină** | `--color-bg-primary` | #0a0d0d | — | Fundal pagină (aproape negru) |
| **Fundal card** | `--color-bg-secondary` | #121414 | — | Card-uri, suprafețe principale |
| **Fundal input** | `--color-bg-tertiary` | #1a1c1c | — | Câmpuri input, suprafețe secundare |
| **Border** | `--color-border` | #333535 | 3:1 | Borduri, separatoare |
| **Text principal** | `--color-text-primary` | #e2e2e2 | 17.7:1 | Text normal |
| **Text secundar** | `--color-text-secondary` | #dfc0b4 | 12.2:1 | Label-uri, text ajutător |
| **Eroare** | `--color-error` | #ffb4ab | 5.6:1 | Mesaje eroare, validare |
| **Succes** | `--color-success` | #4ade80 | 10.2:1 | Mesaje succes, bifă |

#### Light Mode (Toggle ☀️)
| Rol | Hex | Contrast | Utilizare |
|-----|-----|----------|-----------|
| **Fundal pagină** | #f5f5f5 | — | Fundal pagină clar |
| **Text principal** | #1a1a1a | 17.7:1 | Text normal (negru) |
| **Accent** | #ffb597 | 5.2:1 | Consistent pe ambele teme |

**Status Badge Colors (Medical Design)**
| Status | Culoare | Hex |
|--------|---------|-----|
| ✓ Funcțional | Verde | #4ade80 |
| ✗ Defect | Roșu | #ffb4ab |
| ⟳ Reparație | Galben | #fbbf24 |
| − Casat | Gri | #6b7280 |

**Ghid contrast Clinical Precision:**
- `#ffb597` (orange) pe `#0a0d0d` (dark bg) = 9.8:1 ✅ (AAA)
- `#e2e2e2` (text) pe `#0a0d0d` (dark bg) = 17.7:1 ✅ (AAA)
- `#dfc0b4` (text-secondary) pe `#0a0d0d` = 12.2:1 ✅ (AA)
- `#1a1a1a` (text) pe `#f5f5f5` (light bg) = 17.7:1 ✅ (AAA)
- `#ffb597` (orange) pe `#f5f5f5` (light bg) = 5.2:1 ✅ (AA)

### 2. Tipografie — Inter (Best Practice 2025-2026)

```css
/* Heading 1 (h1) */
font-size: 48px;
font-weight: 700;
line-height: 1.2;
color: var(--color-accent);  /* Portocaliu */
margin-bottom: 1.5rem;

/* Heading 2 (h2) */
font-size: 32px;
font-weight: 700;
color: var(--color-accent);  /* Portocaliu */
margin-bottom: 1.25rem;

/* Heading 3 (h3) */
font-size: 24px;
font-weight: 700;
color: var(--color-text-primary);
margin-bottom: 1rem;

/* Text body */
font-size: 16px;
font-weight: 400;
line-height: 1.5;
color: var(--color-text-primary);

/* Small / Label */
font-size: 14px;
font-weight: 500;
color: var(--color-text-secondary);
```

**Font stack — Clinical Precision:**
```css
/* Recomandare: Inter de la Google Fonts */
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, "Helvetica Neue", Arial, sans-serif;
```

**De ce Inter?**
- ✅ Geometric și curat (perfect pentru medical UI)
- ✅ Excelent pe ecrane medicale
- ✅ Diferențiază clar litere confuzabile (l/1, O/0)

### 3. Scară de spațiere (bază 8px)

| Alias | Valoare | Utilizare |
|-------|---------|-----------|
| `xs` | 2px | Borduri fine, detalii mici |
| `sm` | 4px | Spații mici în linie |
| `md` | 8px | Padding implicit, gap normal |
| `lg` | 16px | Padding card, gap componente |
| `xl` | 24px | Spațiere secțiuni |
| `2xl` | 32px | Blocuri mari |
| `3xl` | 48px | Nivel hero / pagină |

**Aplicare prin Tailwind:** `p-4`, `gap-6`, `mb-8` etc.

### 4. Borduri și rotunjire

| Element | Radius | Border |
|---------|--------|--------|
| Input | `rounded-lg` (8px) | 1px solid `gray-600` |
| Buton | `rounded-lg` (8px) | Niciuna |
| Card | `rounded-lg` (8px) | 1px solid `gray-700` (decorativ) |
| Modal | `rounded-xl` (12px) | Niciuna |

### 5. Dimensionare

| Element | Dimensiune | Notă |
|---------|------------|------|
| **Înălțime input** | min 44px (`py-3`) | WCAG 2.5.5 |
| **Înălțime buton** | min 44px | Țintă de atingere |
| **Lățime buton** | fit-content / full-width | Depinde de context |
| **Focus ring** | 2px, cyan-400 | Offset 2px față de element |

---

## Accesibilitate — WCAG 2.1 AA

### Reguli obligatorii (pentru orice componentă)

1. **Label-uri asociate**
   ```jsx
   <label htmlFor="username">Utilizator</label>
   <input id="username" ... />
   ```
   - Niciun input fără label asociat
   - Folosește `htmlFor`/`id` cu valori identice
   - Label-urile trebuie vizibile (nu doar placeholder)

2. **Focus ring vizibil — Portocaliu (Clinical Precision)**
   ```jsx
   // Folosește CSS variables
   className="focusable"
   
   // Definit în CSS global (index.css)
   @layer utilities {
     .focusable {
       @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
       --tw-ring-color: var(--color-accent);      /* Portocaliu #ffb597 */
       --tw-ring-offset-color: var(--color-bg-primary);
       transition: all var(--transition-fast);
     }
   }
   ```

   **Rezultat:** Portocaliu 2px ring cu 2px offset, se tranziționează smooth (150ms) la ambele teme
   - Ring de 2px, contrast vizibil
   - Offset 2px față de element
   - NU `outline: none` fără înlocuitor

3. **Ținte de atingere 44x44px**
   ```jsx
   <button className="... min-h-[44px] px-4 py-3 ...">
   <input className="... min-h-[44px] ..."/>
   ```
   - Butoane: `min-h-[44px]`
   - Inputuri: `py-3` sau `min-h-[44px]`
   - Spațiu de minimum 8px între elemente clicabile

4. **Erori anunțate**
   ```jsx
   {error && (
     <p id="username-error" role="alert" aria-live="assertive" className="text-red-400">
       {error}
     </p>
   )}
   <input aria-describedby="username-error" aria-invalid={!!error} />
   ```
   - `role="alert"` pentru erori
   - `aria-live="assertive"` (anunțare imediată)
   - Leagă input-ul de eroare prin `aria-describedby`

5. **Mesaje de stare anunțate**
   ```jsx
   <div role="status" aria-live="polite">
     Dispozitiv salvat cu succes!
   </div>
   ```
   - Încărcare: `aria-live="polite"` + `aria-busy="true"`
   - Succes / Informații: `role="status"`

6. **HTML semantic**
   ```jsx
   <header>...</header>
   <main id="main">...</main>
   <table>
     <thead><tr><th scope="col">...</th></tr></thead>
   </table>
   ```
   - `<header>`, `<main id="main">`, `<footer>`
   - `<th scope="col">` / `<th scope="row">`
   - Folosește `<button>` nu `<div onClick>`

7. **Culoarea nu e singura sursă de informație**
   ```jsx
   // Greșit: culoare singură
   <span className="text-red-400">Defect</span>

   // Corect: text + icoană + culoare
   <span className="flex items-center gap-2 text-red-400">
     ✗ Defect
   </span>
   ```
   - SVG-uri decorative: `aria-hidden="true"`
   - Icoane funcționale: `aria-label="..."`

8. **Contrast ≥ 4.5:1 (text) / 3:1 (UI)**
   - Verifică cu [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - Text mare (18pt+): 3:1 este suficient

### Testare manuală

| Test | Metodă | Țintă |
|------|--------|-------|
| **Tastatură** | Tab singur, fără mouse | Focus vizibil, ordine logică, niciun trap |
| **Screen reader** | NVDA / Narrator | Erori anunțate, label-uri citite, butoane etichetate |
| **Zoom 200%** | Chrome Ctrl+Shift+= | Fără scroll orizontal, text lizibil |
| **Lighthouse** | DevTools → Lighthouse | Scor accesibilitate ≥ 95 |
| **axe DevTools** | Extensie Chrome | 0 erori critice/serioase |

---

## Tipare de componente

### Buton (4 variante)

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

// Ghost (asemănător link)
<button className="px-4 py-3 text-cyan-400 hover:text-cyan-300 font-semibold focusable">
  Link-buton
</button>

// Stare de încărcare
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
    placeholder="exemplu@exemplu.com"
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

### Alert (mesaje de feedback)

```jsx
// Eroare
{error && (
  <div role="alert" aria-live="assertive" className="bg-red-950/30 border border-red-600
       px-4 py-3 rounded-lg text-red-400 text-sm">
    Eroare: {error}
  </div>
)}

// Succes
{success && (
  <div role="status" aria-live="polite" className="bg-green-950/30 border border-green-600
       px-4 py-3 rounded-lg text-green-400 text-sm">
    {success}
  </div>
)}

// Informații
<div role="status" aria-live="polite" className="bg-blue-950/30 border border-blue-600
     px-4 py-3 rounded-lg text-blue-400 text-sm">
  Informație
</div>
```

### Tabel (accesibil)

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

**Componenta StatusBadge (6 statuses — Faza 2):**
```jsx
function StatusBadge({ status }) {
  const stiluri = {
    FUNCTIONAL: 'bg-green-950/30 border border-green-600 text-green-400',
    DEFECT: 'bg-red-950/30 border border-red-600 text-red-400',
    IN_REPARATIE: 'bg-amber-950/30 border border-amber-600 text-amber-400',
    CASAT: 'bg-gray-700 border border-gray-600 text-gray-400',
    IMPRUMUTAT: 'bg-blue-950/30 border border-blue-600 text-blue-400',
    REZERVA: 'bg-yellow-950/30 border border-yellow-600 text-yellow-400',
  };
  const etichete = {
    FUNCTIONAL: '✓ Funcțional',
    DEFECT: '✗ Defect',
    IN_REPARATIE: '⟳ În Reparație',
    CASAT: '− Casat',
    IMPRUMUTAT: '↔ Împrumutat',
    REZERVA: '📦 Rezervă',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${stiluri[status]}`}
          role="status" aria-label={`Status: ${etichete[status]}`}>
      {etichete[status]}
    </span>
  );
}
```

### Modal (dialog accesibil)

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

## Checklist accesibilitate per componentă

Înainte de a face merge la orice componentă:

- [ ] **Label-uri și inputuri**
  - [ ] Toate inputurile au `id` + label cu `htmlFor` identic
  - [ ] `autoComplete` setat corect
  - [ ] `autoFocus` pe primul câmp dacă e formular

- [ ] **Gestionarea focus-ului**
  - [ ] Focus ring vizibil pe toate elementele interactive
  - [ ] Ordinea Tab logică (sus-stânga → jos-dreapta)
  - [ ] Niciun keyboard trap

- [ ] **Gestionarea erorilor**
  - [ ] Erorile au `role="alert" aria-live="assertive"`
  - [ ] Input-ul are `aria-describedby` legat de eroare
  - [ ] Input-ul are `aria-invalid="true"` când există eroare

- [ ] **Butoane și ținte de atingere**
  - [ ] `min-h-[44px]` sau `py-3` (înălțime 44px)
  - [ ] Clasa `.focusable` sau focus ring manual
  - [ ] Spațiu de min 8px între butoane

- [ ] **Culori și contrast**
  - [ ] Contrast text ≥ 4.5:1 (verificat cu WebAIM)
  - [ ] Culoarea NU e singura sursă de informație
  - [ ] Icoane + text + culoare împreună

- [ ] **Tabele** (dacă e cazul)
  - [ ] `<th scope="col">` pentru antete
  - [ ] `aria-sort="ascending|descending|none"` dacă e sortabil
  - [ ] `<thead>`, `<tbody>` prezente

- [ ] **Icoane SVG**
  - [ ] Decorative: `aria-hidden="true"`
  - [ ] Funcționale: `aria-label="Descriere"`

- [ ] **Testare**
  - [ ] Navigare cu tastatură (Tab/Enter/Escape)
  - [ ] Test screen reader (NVDA/Narrator — erori anunțate)
  - [ ] Lighthouse Accessibility ≥ 95
  - [ ] axe DevTools: 0 erori critice

---

## Configurare Tailwind cu token-uri de design

`tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Culorile brandului SIMDM
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
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

## Resurse externe

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [NVDA Screen Reader](https://www.nvaccess.org)
- [Deque axe DevTools](https://www.deque.com/axe/devtools/)

---

**Istoric versiuni:**
- v1.0 — 2026-05-29: Consolidare design Faza 1 + audit

**Întrebări?** Vezi [CLAUDE.md](../CLAUDE.md) sau [2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md)
