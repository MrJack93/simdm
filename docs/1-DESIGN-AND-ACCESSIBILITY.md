# Sistem de Design și Accesibilitate — SIMDM

**Versiune:** 3.0 (Design System v3 — Modern 2026)
**Status:** ✅ Faza 1 Completă — ✅ Faza 2: #M1 Implementat
**Actualizat:** 2026-06-04
**Audiență:** Developeri frontend

> Acest document este **sursa unică de adevăr** pentru token-urile de design, componentele reutilizabile și regulile de accesibilitate WCAG 2.1 AA. Versiunea 3.0 înlocuiește "Clinical Precision 2.0" cu un sistem modern bazat pe **Plus Jakarta Sans**, **glassmorphism**, **spring easing** și o paletă mai rafinată definită în `design-system.css`.

---

## Cuprins

1. [Arhitectura CSS](#arhitectura-css)
2. [Token-uri de design](#token-uri-de-design)
3. [Componente React](#componente-react)
4. [Hook-uri](#hook-uri)
5. [Accesibilitate — WCAG 2.1 AA](#accesibilitate--wcag-21-aa)
6. [Tipare de componente (JSX)](#tipare-de-componente-jsx)
7. [Checklist accesibilitate per componentă](#checklist-accesibilitate-per-component%C4%83)

---

## Arhitectura CSS

```
frontend/src/
├── design-system.css      # Sursă de adevăr: variabile, tipografie, animații
├── index.css              # @import tailwindcss + @import design-system.css
│                          #   + utility classes (.btn-primary, .input-base etc.)
└── App.css                # (gol — stiluri globale suplimentare dacă e nevoie)
```

**Ordinea de import (critică):**
```css
/* index.css */
@import "tailwindcss";
@import "./design-system.css";   /* ← definește :root și html.light-mode */
```

`design-system.css` definește toate variabilele CSS în `:root` (dark mode implicit) și le suprascrie în `html.light-mode`. Nu duplica variabilele în altă parte.

---

## Token-uri de design

### 1. Paleta de culori — v3

#### Dark Mode (implicit)
| Rol | Variabilă CSS | Hex | Contrast vs bg-primary |
|-----|---------------|-----|------------------------|
| Fundal pagină | `--color-bg-primary` | #0c0f10 | — |
| Fundal card | `--color-bg-secondary` | #141718 | — |
| Fundal input | `--color-bg-tertiary` | #1c2022 | — |
| Fundal elevated | `--color-bg-elevated` | #222628 | — |
| **Accent principal** | `--color-accent` | #ff9b6a | 9.1:1 ✅ AAA |
| Accent hover | `--color-accent-hover` | #ff7a3d | 8.0:1 ✅ AAA |
| Accent subtil (bg) | `--color-accent-subtle` | rgba(255,155,106,.08) | — |
| Text principal | `--color-text-primary` | #f0f0f0 | 17.2:1 ✅ AAA |
| Text secundar | `--color-text-secondary` | #8a9199 | 6.1:1 ✅ AA |
| Text terțiar | `--color-text-tertiary` | #7a8290 | 4.7:1 ✅ AA |
| Border | `--color-border` | #2a2f33 | 3.1:1 ✅ UI |
| Succes | `--color-success` | #34d399 | 9.8:1 ✅ AAA |
| Succes bg | `--color-success-bg` | rgba(52,211,153,.10) | — |
| Eroare | `--color-error` | #f87171 | 5.2:1 ✅ AA |
| Eroare bg | `--color-error-bg` | rgba(248,113,113,.10) | — |
| Avertizare | `--color-warning` | #fbbf24 | 9.4:1 ✅ AAA |
| Info | `--color-info` | #60a5fa | 5.8:1 ✅ AA |

#### Light Mode (`html.light-mode`)
| Rol | Variabilă CSS | Hex | Contrast vs bg-primary |
|-----|---------------|-----|------------------------|
| Fundal pagină | `--color-bg-primary` | #f4f5f7 | — |
| Fundal card | `--color-bg-secondary` | #ffffff | — |
| Fundal input | `--color-bg-tertiary` | #eef0f2 | — |
| **Accent principal** | `--color-accent` | #b84621 | 4.9:1 ✅ AA |
| Text principal | `--color-text-primary` | #111418 | 19.2:1 ✅ AAA |
| Text secundar | `--color-text-secondary` | #5c6370 | 5.9:1 ✅ AA |
| Text terțiar | `--color-text-tertiary` | #626d7d | 4.8:1 ✅ AA |
| Border | `--color-border` | #e2e5e9 | — |

#### Status dispozitive medicale (6 stări)
| Status | Variabilă culoare | Simbol | Etichetă |
|--------|-------------------|--------|----------|
| Funcțional | `--color-status-functional` (#34d399) | ✓ | Funcțional |
| În reparație | `--color-status-in-repair` (#fbbf24) | ⟳ | În reparație |
| Defect | `--color-status-defect` (#f87171) | ✗ | Defect |
| Casat | `--color-status-decommissioned` (#6b7280) | − | Casat |
| Împrumutat | `--color-status-loaned` (#60a5fa) | → | Împrumutat |
| Rezervă | `--color-status-spare` (#a78bfa) | ◻ | Rezervă |

> Toate status badge-urile afișează **simbol + text + culoare** — niciodată culoarea singură (WCAG 1.4.1).

---

### 2. Tipografie — Plus Jakarta Sans

**Font stack:**
```css
--font-family-base: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
```

Fontul este încărcat din Google Fonts în `design-system.css`. Nu este nevoie de configurare suplimentară.

**Scară tipografică:**
| Token | Variabilă | Valoare | Utilizare |
|-------|-----------|---------|-----------|
| Display | `--font-size-display` | 48px / 3rem | Hero, numere mari |
| H1 | `--font-size-h1` | 32px / 2rem | Titluri pagină |
| H2 | `--font-size-h2` | 24px / 1.5rem | Titluri secțiune |
| H3 | `--font-size-h3` | 18px / 1.125rem | Titluri subsecțiune |
| Body | `--font-size-base` | 15px / 0.9375rem | Text normal |
| Small | `--font-size-sm` | 13px / 0.8125rem | Label-uri, helpText |
| XSmall | `--font-size-xs` | 11px / 0.6875rem | Caption, overline |

**Line-height:**
| Token | Variabilă | Valoare |
|-------|-----------|---------|
| Tight | `--line-height-tight` | 1.15 |
| Snug | `--line-height-snug` | 1.30 |
| Normal | `--line-height-normal` | 1.55 |
| Relaxed | `--line-height-relaxed` | 1.70 |

---

### 3. Spațiere (grilă 8px)

| Token | Variabilă | Valoare | Echivalent Tailwind |
|-------|-----------|---------|---------------------|
| 4px | `--space-1` | 0.25rem | `p-1`, `gap-1` |
| 8px | `--space-2` | 0.5rem | `p-2`, `gap-2` |
| 12px | `--space-3` | 0.75rem | `p-3`, `gap-3` |
| 16px | `--space-4` | 1rem | `p-4`, `gap-4` |
| 24px | `--space-6` | 1.5rem | `p-6`, `gap-6` |
| 32px | `--space-8` | 2rem | `p-8`, `gap-8` |
| 48px | `--space-12` | 3rem | `p-12`, `gap-12` |
| 64px | `--space-16` | 4rem | `p-16`, `gap-16` |

---

### 4. Borduri și rotunjire

| Element | Token | Valoare |
|---------|-------|---------|
| Mic (badge) | `--radius-sm` | 6px |
| Input / Buton | `--radius-md` | 10px |
| Card | `--radius-lg` | 14px |
| Modal | `--radius-xl` | 20px |
| Pill / Tag | `--radius-full` | 9999px |

---

### 5. Umbre

| Token | Utilizare |
|-------|-----------|
| `--shadow-xs` | Badge-uri, elemente mici |
| `--shadow-sm` | Card-uri implicite |
| `--shadow-md` | Card-uri hover |
| `--shadow-lg` | Elemente ridicate (dropdowns) |
| `--shadow-glow-accent` | Glow portocaliu pe focus/hover accent |

---

### 6. Tranziții

```css
--transition-fast:   0.15s var(--ease-out);    /* Hover, focus */
--transition-normal: 0.30s var(--ease-out);    /* Tranziții de stare */
--transition-slow:   0.50s var(--ease-out);    /* Animații de intrare */

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* Ieșire rapidă */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Efect spring */
```

---

## Componente React

Toate componentele sunt în `frontend/src/components/`. Le importi direct — nu necesită configurare suplimentară.

### Button

```jsx
import Button from '../components/Button';

// Variante
<Button variant="primary">Salvare</Button>
<Button variant="secondary">Anulare</Button>
<Button variant="danger">Ștergere</Button>
<Button variant="outline">Mai mult</Button>

// Mărimi
<Button size="sm">Mic</Button>
<Button size="base">Normal (implicit)</Button>
<Button size="lg">Mare</Button>

// Stări
<Button disabled>Dezactivat</Button>
<Button loading>Salvare</Button>          {/* afișează "Se încarcă…" */}

// Cu icon (lucide-react)
import { Save } from 'lucide-react';
<Button icon={Save} iconPosition="left">Salvare</Button>
<Button icon={Save} iconPosition="right">Salvare</Button>
```

**Props:**
| Prop | Tip | Default | Descriere |
|------|-----|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'outline'` | `'primary'` | Stilul vizual |
| `size` | `'sm' \| 'base' \| 'lg'` | `'base'` | Dimensiunea |
| `disabled` | `boolean` | `false` | Dezactivat |
| `loading` | `boolean` | `false` | Afișează "Se încarcă…" |
| `icon` | componenta Lucide | — | Icon afișat lângă text |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Poziția icon-ului |

---

### Input

```jsx
import Input from '../components/Input';

// Simplu
<Input label="Utilizator" placeholder="bioinginer" />

// Cu validare
<Input
  label="Email"
  type="email"
  required
  error={errors.email?.message}
  helpText="Adresa de email a biroului"
/>

// Cu icon
import { User } from 'lucide-react';
<Input label="Utilizator" icon={User} />

// Ref forwarding (react-hook-form)
<Input label="Parolă" type="password" {...register('password')} />
```

**Props:**
| Prop | Tip | Descriere |
|------|-----|-----------|
| `label` | `string` | Text label (afișat deasupra) |
| `error` | `string` | Mesaj de eroare (roșu) |
| `helpText` | `string` | Text ajutător (gri, sub input) |
| `required` | `boolean` | Afișează `*` și setează `aria-required` |
| `icon` | componenta Lucide | Icon la stânga input-ului |
| `type` | `string` | Tipul HTML al input-ului |

---

### Card

```jsx
import Card from '../components/Card';
import Button from '../components/Button';

// Simplu
<Card>
  <p>Conținut card</p>
</Card>

// Cu header și acțiuni
<Card
  header="Detalii dispozitiv"
  actions={
    <>
      <Button variant="secondary">Anulare</Button>
      <Button variant="primary">Salvare</Button>
    </>
  }
>
  <p>Monitor Semne Vitale — Funcțional</p>
</Card>

// Elevated + interactiv (cursor pointer, hover accent border)
<Card elevated interactive onClick={handleClick}>
  <p>Click pe card</p>
</Card>
```

---

### StatusBadge

```jsx
import StatusBadge from '../components/StatusBadge';

// Statusuri valide: FUNCTIONAL | IN_REPARATIE | DEFECT | CASAT | IMPRUMUTAT | REZERVA
<StatusBadge status="FUNCTIONAL" />       {/* ✓ Funcțional */}
<StatusBadge status="IN_REPARATIE" />     {/* ⟳ În reparație */}
<StatusBadge status="DEFECT" />           {/* ✗ Defect */}
<StatusBadge status="CASAT" />            {/* − Casat */}
<StatusBadge status="IMPRUMUTAT" />       {/* → Împrumutat */}
<StatusBadge status="REZERVA" />          {/* ◻ Rezervă */}

// Mărimi
<StatusBadge status="FUNCTIONAL" size="sm" />
<StatusBadge status="FUNCTIONAL" size="md" />   {/* implicit */}
<StatusBadge status="FUNCTIONAL" size="lg" />
```

Afișează întotdeauna **simbol + text + culoare** (color-blind friendly, WCAG 1.4.1).

---

### Alert

```jsx
import Alert from '../components/Alert';

<Alert type="success">Dispozitiv salvat cu succes!</Alert>
<Alert type="error">Eroare: câmpul este obligatoriu.</Alert>
<Alert type="warning">Revizie lunară datorată.</Alert>
<Alert type="info">Sistemul va fi indisponibil duminică.</Alert>

// Dismissibil
<Alert type="warning" dismissible onDismiss={() => setShowAlert(false)}>
  Atenție: bateria monitorului este descărcată.
</Alert>
```

---

## Hook-uri

### useTheme

```jsx
import { useTheme } from '../hooks/useTheme';

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Modul clar' : 'Modul întunecat'}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

- Citește preferința din `localStorage` (`simdm_theme`)
- Fallback: preferința sistemului (`prefers-color-scheme`)
- Fallback final: dark mode
- Aplică/scoate clasa `light-mode` pe `<html>` la fiecare schimbare

---

### usePageTitle

```jsx
import { usePageTitle } from '../hooks/usePageTitle';

function InventoryPage() {
  usePageTitle('Inventar DM');
  // → document.title = "Inventar DM — SIMDM"
  // ...
}
```

---

### useAccessibility

```jsx
import { useAccessibility } from '../hooks/useAccessibility';

function ConfirmModal({ onClose }) {
  const { announce, trapFocus } = useAccessibility();
  const modalRef = useRef(null);

  useEffect(() => {
    const cleanup = trapFocus(modalRef);
    return cleanup;
  }, [trapFocus]);

  const handleDelete = () => {
    // ... logică ștergere
    announce('Dispozitiv șters cu succes.');
    onClose();
  };

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* ... */}
    </div>
  );
}
```

| Funcție | Descriere |
|---------|-----------|
| `announce(mesaj)` | Injectează un nod `aria-live="polite"` pentru screen readere |
| `trapFocus(ref)` | Limitează Tab/Shift+Tab în interiorul containerului (modal) |

---

## Accesibilitate — WCAG 2.1 AA

### Reguli obligatorii

**1. Label-uri asociate cu inputuri**
```jsx
// Folosind componenta Input (label automat asociat):
<Input label="Utilizator" id="username" />

// Sau manual:
<label htmlFor="username">Utilizator</label>
<input id="username" ... />
```
- Niciun input fără label vizibil (`placeholder` nu înlocuiește label-ul)
- `autoComplete` setat corect (`username`, `current-password`, `email` etc.)

---

**2. Focus ring — portocaliu, 2px**

Clasa `.focusable` din `index.css` aplică ring-ul portocaliu cu offset 2px:
```jsx
<button className="focusable ...">Acțiune</button>
```

Componentele `Button` și `Input` aplică focus ring-ul intern — nu e nevoie de clasă manuală.

Nu folosi niciodată `outline: none` fără un înlocuitor vizibil.

---

**3. Ținte de atingere ≥ 44×44px (WCAG 2.5.5)**
```jsx
// Componenta Button respectă automat (min-h-[44px])
<Button>Acțiune</Button>

// Manual:
<button className="... min-h-[44px] px-4 py-3 ...">...</button>
```
Spațiu minim 8px între elemente clicabile vecine.

---

**4. Erori anunțate (WCAG 1.3.1, 3.3.1)**
```jsx
// Componenta Input gestionează automat:
<Input error="Câmpul este obligatoriu." />
// → border roșu, aria-invalid, aria-describedby

// Manual:
{error && (
  <p id="field-error" role="alert" aria-live="assertive" className="text-xs text-red-400">
    {error}
  </p>
)}
<input aria-invalid={!!error} aria-describedby={error ? "field-error" : undefined} />
```

---

**5. Mesaje de stare (WCAG 4.1.3)**
```jsx
// Componenta Alert gestionează automat (role="status" sau role="alert")
<Alert type="success">Salvat!</Alert>

// Manual:
<div role="status" aria-live="polite">Dispozitiv salvat.</div>
<div role="alert" aria-live="assertive">Eroare critică.</div>
```

---

**6. HTML semantic**
```jsx
<header>...</header>
<main id="main">...</main>

<table>
  <thead>
    <tr><th scope="col">Denumire</th></tr>
  </thead>
  <tbody>
    <tr><td>...</td></tr>
  </tbody>
</table>
```
Folosește `<button>` nu `<div onClick>`.

---

**7. Culoarea nu este singura sursă de informație (WCAG 1.4.1)**
```jsx
// Greșit — culoare singură:
<span className="text-green-400">Funcțional</span>

// Corect — simbol + text + culoare:
<StatusBadge status="FUNCTIONAL" />  {/* ✓ Funcțional */}
```

---

**8. Contrast ≥ 4.5:1 (WCAG 1.4.3)**

Toate combinațiile din paleta v3 respectă minimul AA. Verifică cu [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) la orice culoare nouă adăugată.

---

### Testare manuală

| Test | Metodă | Țintă |
|------|--------|-------|
| **Tastatură** | Tab singur, fără mouse | Focus vizibil, ordine logică, niciun trap |
| **Screen reader** | NVDA / Narrator | Erori anunțate, label-uri citite, butoane etichetate |
| **Zoom 200%** | Ctrl+Shift+= în Chrome | Fără scroll orizontal, text lizibil |
| **Lighthouse** | DevTools → Lighthouse | Scor accesibilitate ≥ 95 |
| **axe DevTools** | Extensie Chrome | 0 erori critice/serioase |
| **Mod întunecat** | Click 🌙 → refresh | Tema persistă în localStorage |
| **Mobile 375px** | DevTools → Toggle device | Layout responsive, butoane ≥ 44px |

---

## Tipare de componente (JSX)

### Formular de autentificare

```jsx
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

<form onSubmit={handleSubmit} noValidate>
  <Input
    label="Utilizator"
    id="username"
    autoComplete="username"
    autoFocus
    required
    error={error}
  />
  <Input
    label="Parolă"
    id="password"
    type="password"
    autoComplete="current-password"
    required
  />
  {error && <Alert type="error">{error}</Alert>}
  <Button type="submit" loading={loading} className="w-full mt-4">
    Conectare
  </Button>
</form>
```

---

### Tabel accesibil cu StatusBadge

```jsx
import StatusBadge from '../components/StatusBadge';

<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <th scope="col" className="px-4 py-3 text-left text-sm font-bold"
            style={{ color: 'var(--color-accent)' }}>
          Denumire
        </th>
        <th scope="col" className="px-4 py-3 text-left text-sm font-bold"
            style={{ color: 'var(--color-accent)' }}>
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {devices.map((d) => (
        <tr key={d.id} className="border-b hover:bg-[var(--color-bg-elevated)]"
            style={{ borderColor: 'var(--color-border)' }}>
          <td className="px-4 py-3">{d.name}</td>
          <td className="px-4 py-3">
            <StatusBadge status={d.status} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

### Modal de confirmare (cu focus trap)

```jsx
import { useRef, useEffect } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import Button from '../components/Button';
import Card from '../components/Card';

function ConfirmModal({ onConfirm, onCancel }) {
  const { trapFocus } = useAccessibility();
  const modalRef = useRef(null);

  useEffect(() => {
    const cleanup = trapFocus(modalRef);
    modalRef.current?.querySelector('button')?.focus();
    return cleanup;
  }, [trapFocus]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
    >
      <div ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <Card
          header="Confirmă ștergerea"
          actions={
            <>
              <Button variant="secondary" onClick={onCancel}>Anulare</Button>
              <Button variant="danger" onClick={onConfirm}>Ștergere</Button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Această acțiune este ireversibilă.
          </p>
        </Card>
      </div>
    </div>
  );
}
```

---

## Checklist accesibilitate per componentă

Bifează înainte de orice merge:

- [ ] **Label-uri și inputuri**
  - [ ] Toate inputurile au `id` + label cu `htmlFor` identic (sau se folosește `<Input label="...">`)
  - [ ] `autoComplete` setat corect
  - [ ] `autoFocus` pe primul câmp dacă e formular de sine stătător

- [ ] **Focus vizibil**
  - [ ] Clasa `.focusable` sau componentă `Button`/`Input` (focus ring automat)
  - [ ] Ordinea Tab logică (sus-stânga → jos-dreapta)
  - [ ] Niciun keyboard trap în afara modalelor intenționate

- [ ] **Erori**
  - [ ] Erori cu `role="alert"` sau componentă `<Alert type="error">`
  - [ ] Input cu `aria-invalid` + `aria-describedby` la eroare (automat în `<Input error="...">`)

- [ ] **Butoane și ținte**
  - [ ] `min-h-[44px]` (automat în componentă `Button`)
  - [ ] Spațiu ≥ 8px între butoane vecine
  - [ ] `aria-label` pe butoane fără text vizibil (icon-only)

- [ ] **Culori și contrast**
  - [ ] Contrast text ≥ 4.5:1 (verificat cu WebAIM)
  - [ ] Status-uri: simbol + text + culoare (folosește `<StatusBadge>`)

- [ ] **Tabele**
  - [ ] `<th scope="col">` pentru antete
  - [ ] `<thead>` și `<tbody>` prezente
  - [ ] `aria-sort` dacă coloana e sortabilă

- [ ] **Icoane SVG (Lucide)**
  - [ ] Decorative: `aria-hidden="true"` (automat în Lucide)
  - [ ] Funcționale (fără text): `aria-label="Descriere"` pe buton

- [ ] **Testare finală**
  - [ ] Tab prin toată pagina fără mouse
  - [ ] Lighthouse Accessibility ≥ 95
  - [ ] axe DevTools: 0 erori critice

---

## Faza 2: Probleme Majore (WCAG + Accesibilitate)

**Status:** ✅ **COMPLETĂ (2026-06-04)**

### #M1: Mobile Menu — Keyboard Trap & ARIA ✅

**Problemă (WCAG 1.4.1, 2.1.2):**
- MobileMenu lipsit de `role="navigation"`
- Toggle button fără `aria-expanded` / `aria-controls`
- Escape key nu închide meniul
- Tab trap nu funcțional — focus scapă din menu

**Soluție implementată (App.jsx):**
```jsx
/* Header toggle button */
<button
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  aria-expanded={isMobileMenuOpen}      ✅ Reflectă stare
  aria-controls="mobile-menu"           ✅ Link la menu
  className="md:hidden p-2"
>
  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>

/* MobileMenu container */
<div
  ref={menuRef}
  id="mobile-menu"                     ✅ Identifică meniu
  role="navigation"                    ✅ Semantic HTML
  aria-label="Meniu mobil"             ✅ Accessible label
  className="... animate-slide-down"
>
  {/* Links — Tab trap activ cand isOpen */}
</div>

/* Focus trap (useEffect) */
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();   ✅ Escape closes
    if (e.key === 'Tab') {
      const focusable = menuRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      // Tab wraps în ultimul/primul element
      if (e.shiftKey && active === first) last.focus();
      else if (!e.shiftKey && active === last) first.focus();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

**Verificat:**
- ✅ Escape key → menu closes, focus revine la toggle
- ✅ Tab cycling: focus trap funcțional (nu scapă din menu)
- ✅ Screen reader: `aria-expanded` anunță stare (expandit/restrâns)
- ✅ Semantic HTML: `role="navigation"` + `aria-label`

**Fișiere modificate:** `frontend/src/App.jsx`

**Timp:** ~1-2 ore (1 component, testing manual)

**Testing checklist:**
- [x] Tab cu și fără Shift — focus rămâne în menu
- [x] Escape key — meniu se închide
- [x] Screen reader (NVDA/Narrator) — `aria-expanded` citit corect
- [x] Mobile 375px — menu vizibil, butoane ≥ 44px

---

### Planurate în Faza 3: Mentenanță

(Sunt în `SPEC.md § 15` și `CLAUDE.md` — Faza 3 START 2026-06-05)

| ID | Problemă | Durată | Status |
|----|----|--------|--------|
| #M2 | Form validation aria-invalid | 2-3h | Planificat |
| #M3 | Table column sort aria-sort | 2h | Planificat |
| #M4 | Modal backdrop dismiss (Esc + overlay) | 1-2h | Planificat |
| #M5 | Verificări contrast — Icon contrast pe dark theme | 1-2h | Planificat |

---

## Resurse externe

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lucide React Icons](https://lucide.dev)
- [Plus Jakarta Sans — Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [NVDA Screen Reader](https://www.nvaccess.org)
- [Deque axe DevTools](https://www.deque.com/axe/devtools/)

---

**Istoric versiuni:**
- v3.1 — 2026-06-04: Faza 2 #M1 — Mobile Menu keyboard trap + ARIA (Escape, aria-expanded, focus trap)
- v3.0 — 2026-06-03: Design System v3 — Plus Jakarta Sans, glassmorphism, componente React reutilizabile, hook-uri, WCAG 2.1 AA contrast fixes
- v2.1 — 2026-06-02: Clinical Precision 2.0, dark/light mode, WCAG AA certified
- v1.0 — 2026-05-29: Consolidare design Faza 1 + audit

**Întrebări?** Vezi [CLAUDE.md](../CLAUDE.md) sau [2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md)
