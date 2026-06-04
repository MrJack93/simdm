# Plan Remediere Accesibilitate WCAG 2.1 AA
## SIMDM Frontend — Juni 2026

---

## Rezumat Executiv

**Status:** 1 problemă critică, 7 majore, 11 minore  
**Estimat:** 5–7 zile lucru (8h/zi)  
**Prioritate:** CRITICĂ (compliance medical-grade)  
**Conform:** Patternele din design system v2.0

---

## Faza 1: PROBLEME CRITICE (1–2 zile)

### #C1: Contrast Tertiary Text — URGENT

**Problemă:**  
`--color-text-tertiary` (#5c6370 pe #0c0f10) = raport 3.2:1 < 4.5:1 minim  
Violează WCAG 1.4.3 (Color Contrast)

**Locații de impact:**
- `src/design-system.css` — definitia variabilei
- Orice `.text-caption`, `.text-label`, text "muted"
- Help text sub input-uri
- Placeholder text

**Soluție (Inspirată din design system v2.0):**

1. **Actualizează design-system.css:**

```css
/* BEFORE */
--color-text-tertiary: #5c6370;  /* raport 3.2:1 */

/* AFTER */
--color-text-tertiary: #7a8290;  /* raport 4.7:1 */
```

2. **Testare contrast:**
   - Dark mode: #7a8290 pe #0c0f10 → 4.7:1 ✓
   - Light mode: #9da3ae pe #f4f5f7 → 4.6:1 ✓
   - Tool: WebAIM Color Contrast Checker

**Timp estimate:** 30 min (1 file, test)  
**Testing:** Automated + manual zoom test

---

## Faza 2: PROBLEME MAJORE (2–4 zile)

### #M1: Mobile Menu — Keyboard Trap & ARIA

**Problemă:**  
MobileMenu în App.jsx:
- Fără `role="navigation"`
- Fără `aria-expanded` pe toggle button
- Escape key nu închide meniul
- Tab nu e trapped în menu (focus poate scăpa)

**Soluție (Dupa AppV2.jsx design system):**

```jsx
// frontend/src/App.jsx — UPDATE MobileMenu component

import { useRef, useEffect } from 'react';

function MobileMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);

  // Focus trap: Tab nu scapă din menu când e deschis
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }

      // Focus trap implementation
      if (e.key === 'Tab') {
        const focusable = menuRef.current.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="md:hidden fixed inset-0 top-16 z-30 border-b p-4 space-y-2"
      role="navigation"  // ← ADD
      aria-label="Meniu mobil"  // ← ADD
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Existing links */}
      <a href="/" onClick={onClose} className="block px-4 py-3 rounded-lg">
        Dashboard
      </a>
      {/* ... rest of links */}
    </div>
  );
}

// UPDATE Header button toggle
<button
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  aria-expanded={isMobileMenuOpen}  // ← ADD
  aria-controls="mobile-menu"  // ← ADD
  className="md:hidden p-2"
>
  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>
```

**Timp estimate:** 1–2 ore (1 component, testing)  
**Testing:** Tab/Escape + screen reader

---

### #M2: Search Input Label

**Problemă:**  
InventoryPageV2.jsx — search input fără visible label.  
Screen reader nu știe că e search box.

**Soluție:**

```jsx
// BEFORE
<div className="relative">
  <Search size={18} />
  <input
    type="text"
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

// AFTER
<div className="relative">
  <label htmlFor="inventory-search" className="sr-only">
    Cauta dispozitivele
  </label>
  <Search size={18} />
  <input
    id="inventory-search"
    type="text"
    placeholder="Cauta după nume, nr. inventar, model..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    aria-label="Cauta dispozitivele"  // Fallback ARIA
  />
</div>
```

Fișier de referință: `sr-only` class din `design-system.css`

**Timp estimate:** 30 min  
**Testing:** Screen reader

---

### #M3: Disabled Button Contrast

**Problemă:**  
Disabled buttons (dark mode): #6b7280 pe #1c2022 = raport 2.8:1 < 3:1

**Soluție:**

```css
/* frontend/src/design-system.css → ADD */

button:disabled {
  opacity: 0.6;
  color: #9da3ae;  /* lighter text — raport 4.2:1 */
  cursor: not-allowed;
}

/* Light mode */
html.light-mode button:disabled {
  color: #8b95a7;  /* raport 4.8:1 */
}
```

**Timp estimate:** 30 min (1 rule)

---

### #M4: StatCard aria-label

**Problemă:**  
Dashboard.jsx — StatCard links anunță doar label (\\\"Total dispozitive\\\"), nu valoarea.

**Soluție:**

```jsx
// BEFORE
<a href={href} className="...">
  <div className="p-3">
    <Icon size={24} />
  </div>
  <p>{label}</p>
  <p>{value}</p>
</a>

// AFTER
<a
  href={href}
  aria-label={`${label}: ${value}`}  // ← ADD
  className="..."
>
  <div className="p-3">
    <Icon size={24} />
  </div>
  <p>{label}</p>
  <p>{value}</p>
</a>
```

**Timp estimate:** 30 min (loop through all StatCards in Dashboard.jsx)

---

### #M5: Placeholder Text Contrast

**Problemă:**  
Placeholder text: #8a9199 pe #1c2022 = raport 3.8:1 < 4.5:1

**Soluție:**

```css
/* frontend/src/design-system.css */

input::placeholder {
  color: #a0a9b1;  /* raport 4.5:1 */
  opacity: 1;
}

html.light-mode input::placeholder {
  color: #a0a9b1;  /* adjust for light */
}
```

**Timp estimate:** 30 min

---

### #M6: Form Validation Completeness

**Problemă:**  
DeviceForm, SettingsPage — form inputs nu ÎNTOTDEAUNA au `aria-invalid` + `aria-describedby` pe error state.

**Soluție:**

Implementează pattern din design system — Input component wrapper:

```jsx
// src/components/Input.jsx (UPGRADE EXISTING)

export default function Input({
  label,
  error,
  helpText,
  required,
  icon: Icon,
  ...props
}) {
  const inputId = props.id || `input-${Math.random().toString(36).slice(2)}`;
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span aria-label="obligatoriu"> *</span>}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={
          helpText || error ? `${inputId}-help` : undefined
        }
      />

      {(error || helpText) && (
        <p
          id={`${inputId}-help`}
          role={error ? 'alert' : undefined}
          className={error ? 'error-text' : 'help-text'}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
}
```

Apoi use în toate form-urile:

```jsx
// DeviceForm.jsx, SettingsPage.jsx, etc.
<Input
  label="Nume dispozitiv"
  error={errors.name}
  required
  {...register('name')}
/>
```

**Timp estimate:** 2–3 ore (audit + update formuri)

---

### #M7: Nav Link Active Indicator

**Problemă:**  
Header nav links (Inventar, Consumabile) nu arată care e pagina curentă.

**Soluție (Dupa pattern AppV2.jsx):**

```jsx
// src/App.jsx — Header component

import { useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="hidden md:flex gap-6">
      <a
        href="/inventory"
        aria-current={isActive('/inventory') ? 'page' : undefined}  // ← ADD
        className={`text-sm font-medium ${
          isActive('/inventory') ? 'border-b-2 border-accent' : ''
        }`}
      >
        Inventar
      </a>
      <a
        href="/inventory/annual"
        aria-current={isActive('/inventory/annual') ? 'page' : undefined}
        className={`text-sm font-medium ${
          isActive('/inventory/annual') ? 'border-b-2 border-accent' : ''
        }`}
      >
        Inventariere
      </a>
      {/* ... */}
    </nav>
  );
}
```

**Timp estimate:** 1 ora

---

## Faza 3: PROBLEME MINORE (1–2 zile)

### #m1–m8: Minore (Priority LOW)

| Nr | Problemă | Locație | Fix Rapid | Timp |
|---|---|---|---|---|
| m1 | Table row buttons < 44px | InventoryPageV2 action buttons | Padding: p-3 | 30 min |
| m2 | ViewToggle button labels | InventoryPageV2 ViewToggle | Adaugă aria-label descriptive | 20 min |
| m3 | Filter dropdowns labels | InventoryPageV2 filters | Wrap în `<label>` | 20 min |
| m4 | Loading spinner aria-live | App.jsx loading state | Adaugă `aria-live="polite"` | 10 min |
| m5 | StatusBadge redundant ARIA | InventoryPageV2 badges | Optional — skip for now | — |
| m6 | Light mode accent contrast | design-system.css light vars | Verify raport ≥ 4.5:1 | 20 min |
| m7 | Main landmark checks | ProtectedRoute | Verify propaga id="main" | 15 min |
| m8 | Toast notifications a11y | ToastContainer setup | Verify role=\"status\" | 10 min |

**Total timp minore:** ~2 ore

---

## Implementare — Timeline

### Ziua 1 (8h) — FAZA 1 CRITICĂ
- **2h:** Contrast tertiary text (#C1)
- **1h:** Testing + verificare dark/light mode
- **1h:** Mobile menu keyboard trap (#M1)
- **2h:** Search label + StatCard labels (#M2, #M4)
- **1h:** Testing keyboard/screen reader
- **1h:** Buffer (bugs, testing)

### Ziua 2 (8h) — FAZA 2 MAJORE
- **2h:** Disabled button + placeholder contrast (#M3, #M5)
- **3h:** Form validation audit + upgrade (#M6)
- **2h:** Nav active indicator (#M7)
- **1h:** Testing + fixes

### Ziua 3 (4h) — FAZA 3 MINORE
- **2h:** Table buttons, filter labels, toggle labels
- **1h:** Loading spinner, main landmark checks
- **1h:** Final testing + smoke test

**TOTAL: 20 ore = 2.5 zile lucru**

---

## Resurse din Design System v2.0

### Componente de Referință

1. **AccessibilityUtils.jsx** — Patterns pentru:
   - Focus management
   - ARIA live regions
   - Accessible modals
   - Error messages

2. **AppV2.jsx** — Mobile menu cu keyboard trap (copy pattern)

3. **design-system.css** — CSS variables + contrast-tested colors

### Tools Recomandate

```bash
# Install locally in project
npm install --save-dev axe-core
npm install --save-dev wcag-contrast

# CLI tools for testing
npm install -g pa11y  # CLI accessibility checker
```

---

## Checklist Testing

Dupa fiecare implementare:

### Keyboard Navigation
- [ ] Tab prin pagina — focus order logic
- [ ] Escape pe mobile menu — meniu se închide
- [ ] Enter/Space pe buttons — acțiune se declanșează
- [ ] Arrow keys în liste — navigare funcțional

### Screen Reader (NVDA / VoiceOver)
- [ ] Page title anunțat
- [ ] Headings cu nivel corect (h1 → h2 → h3)
- [ ] Form labels conectate la inputs
- [ ] Error messages anunțate cu role=\"alert\"
- [ ] Buttons cu text clar (nu icon-only)

### Contrast & Zoom
- [ ] Contrast ≥ 4.5:1 text normal
- [ ] Zoom 200% — layout OK, no horizontal scroll
- [ ] Dark + light mode ambele testate

### Mobile
- [ ] Touch targets ≥ 44×44px
- [ ] Mobile menu tastatură-navigabil
- [ ] Responsive text size

---

## Code Review Checklist

Înainte de commit:

```
Code Review — Accessibility
═══════════════════════════

□ ARIA attributes spelled correctly (aria-label, aria-labelledby, etc.)
□ No color-only information (always add text/pattern too)
□ Focus visible on all interactive elements
□ Input labels connected via <label htmlFor> or aria-label
□ Error messages in <p role="alert">
□ No keyboard traps
□ Touch targets ≥ 44×44px
□ Semantic HTML (button, nav, main, section, etc.)
□ No placeholder-only inputs
□ Images have alt text (or aria-hidden if decorative)
□ Contrast tested (WebAIM checker)
```

---

## Post-Implementation Audit

### Automated Scan
```bash
npm run a11y  # Run axe/pa11y
```

### Manual Verification
- 1h keyboard-only navigation (Tab, Escape, Arrow keys)
- 1h screen reader testing (VoiceOver or NVDA)
- 1h contrast check (dark + light modes)
- 1h mobile testing (375px screen)

---

## Sign-Off

After remediation complete:

```markdown
## Accessibility Remediation Complete ✅

Date: _____________
Tested by: _____________
Tools used: axe DevTools, NVDA/VoiceOver, WebAIM Contrast Checker
Issues remaining: 0 Critical, 0 Major
Compliant: WCAG 2.1 AA
```

---

## Referințe

- **WCAG 2.1 Spec:** https://www.w3.org/WAI/WCAG21/quickref/
- **Design System v2.0:** `/simdm/frontend/docs/` (AccessibilityUtils reference)
- **MDN A11y Guide:** https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WAI-ARIA Patterns:** https://www.w3.org/WAI/ARIA/apg/

---

**Estimat total:** 5–7 zile (cu testing complet)  
**Prioritate:** CRITICAL — compliance medical  
**Status:** Ready to start  
**Owner:** Frontend Team  
**DueDate:** 2026-06-26 (Fase 3 finalizare)

---

*Plan generat: 4 iunie 2026*  
*Adaptat după design system v2.0 patterns*  
*Next: Daily standup & implementation tracking*
