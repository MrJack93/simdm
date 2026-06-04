# Bibliotecă Componente SIMDM — Referință Completă

**Versiune:** 3.1
**Actualizat:** 2026-06-05
**Status:** Gata pentru producție (Conform WCAG 2.1 AA)

---

## Cuprins

1. [Componenta Button](#componenta-button)
2. [Componenta Input](#componenta-input)
3. [Componenta Card](#componenta-card)
4. [Componente Badge](#componente-badge)
5. [Componenta Form (DeviceForm)](#componenta-form)
6. [Componente Navigare](#componente-navigare)
7. [Componente Utilitare](#componente-utilitare)
8. [Referință Token-uri Design](#referință-token-uri-design)

---

## Componenta Button

**Fișier:** `frontend/src/components/Button.jsx`

### Descriere

Componentă buton reutilizabilă cu mai multe variante, mărimi și stări. Complet accesibil de la tastatură cu gestionare corectă a focus-ului.

### Props

| Prop | Tip | Default | Descriere |
|------|-----|---------|-----------|
| `variant` | `'primary'` \| `'secondary'` \| `'danger'` | `'primary'` | Varianta vizuală |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Dimensiunea butonului |
| `disabled` | `boolean` | `false` | Dezactivează butonul |
| `loading` | `boolean` | `false` | Afișează spinner de încărcare |
| `type` | `'button'` \| `'submit'` \| `'reset'` | `'button'` | Atribut HTML type |
| `children` | `ReactNode` | — | Text / conținut buton |
| `onClick` | `function` | — | Handler click |
| `className` | `string` | `''` | Clase CSS suplimentare |
| `aria-label` | `string` | — | Etichetă accesibilă (obligatorie pentru butoane icon-only) |

### Variante

#### Buton primar (implicit)
```jsx
<Button variant="primary">Adaugă dispozitiv</Button>
```
**Stilizare:**
- Fundal: `--color-accent`
- Text: `--color-bg-primary`
- Hover: Ridicare umbră + întunecarea culorii
- Dezactivat: Opacitate 60%

#### Buton secundar
```jsx
<Button variant="secondary">Anulare</Button>
```
**Stilizare:**
- Fundal: `--color-bg-tertiary`
- Border: 1px `--color-border`
- Text: `--color-text-primary`
- Hover: Fundal `--color-bg-secondary`

#### Buton pericol
```jsx
<Button variant="danger">Ștergere</Button>
```
**Stilizare:**
- Fundal: `--color-error`
- Text: alb
- Hover: Roșu mai închis (`--color-error-hover`)
- Utilizat pentru: acțiuni distructive / ștergere

### Mărimi

| Mărime | Înălțime | Utilizare |
|--------|---------|-----------|
| `sm` | 36px | Acțiuni inline, compacte |
| `md` | 44px (țintă atingere) | Implicit, formulare |
| `lg` | 52px | CTA-uri principale |

### Stări

```jsx
{/* Stare normală */}
<Button>Salvează</Button>

{/* Dezactivat */}
<Button disabled>Salvează</Button>

{/* În curs de încărcare */}
<Button loading>Se salvează...</Button>

{/* Icon-only — necesită aria-label */}
<Button variant="secondary" size="sm" aria-label="Editare dispozitiv">
  <Edit2 size={16} />
</Button>
```

### Accesibilitate (WCAG 2.1 AA)

- ✅ Focusabil cu tastatura (navigare Tab)
- ✅ Focus ring vizibil (`:focus-visible`)
- ✅ Element semantic `<button>`
- ✅ `aria-label` pe butoane icon-only
- ✅ `aria-busy` în stare de încărcare
- ✅ Țintă atingere ≥44px
- ✅ Raport contrast ≥4.5:1

### Exemple

**Buton submit în formular**
```jsx
<Button type="submit" variant="primary" loading={isLoading}>
  {isLoading ? 'Se salvează...' : 'Salvează modificări'}
</Button>
```

**Acțiune ștergere**
```jsx
<Button
  variant="danger"
  size="sm"
  onClick={() => deleteDevice(id)}
  aria-label="Ștergere dispozitiv"
>
  <Trash2 size={16} />
</Button>
```

---

## Componenta Input

**Fișier:** `frontend/src/components/Input.jsx`

### Descriere

Input de formular accesibil cu label integrat, gestionare erori și feedback de validare.

### Props

| Prop | Tip | Default | Descriere |
|------|-----|---------|-----------|
| `label` | `string` | — | Eticheta inputului |
| `type` | `string` | `'text'` | Tipul HTML al inputului |
| `placeholder` | `string` | `''` | Text placeholder |
| `value` | `string` | `''` | Valoarea curentă |
| `onChange` | `function` | — | Handler modificare |
| `error` | `string` | `null` | Mesaj de eroare |
| `helpText` | `string` | — | Text ajutător sub input |
| `required` | `boolean` | `false` | Marchează ca obligatoriu |
| `disabled` | `boolean` | `false` | Dezactivează inputul |
| `autoComplete` | `string` | — | Atribut HTML autocomplete |

### Exemple

**Input text simplu**
```jsx
<Input
  label="Denumire dispozitiv"
  placeholder="Ex: Defibrilator extern"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

**Câmp obligatoriu cu eroare**
```jsx
<Input
  label="Număr inventar"
  required
  error={errors.inventoryNumber?.message}
  {...register('inventoryNumber')}
/>
```

**Cu text ajutător**
```jsx
<Input
  label="Parolă nouă"
  type="password"
  helpText="Minimum 8 caractere"
  {...register('newPassword')}
/>
```

### Stări

| Stare | Aspect | Declanșat de |
|-------|--------|-------------|
| Normal | Border gri | Implicit |
| Focus | Border accent, ring | Tab / Click |
| Eroare | Border roșu | Validare eșuată |
| Dezactivat | Opacitate 60% | `disabled={true}` |
| Placeholder | Culoare secundară | Fără valoare |

### Accesibilitate

- ✅ `<label>` conectat via `htmlFor`
- ✅ `aria-invalid={hasError}`
- ✅ `aria-describedby` pe textul de eroare / ajutor
- ✅ `role="alert"` pe mesajul de eroare
- ✅ Contrast placeholder ≥6.9:1
- ✅ Focus ring vizibil
- ✅ Înălțime 44px (țintă atingere)

---

## Componenta Card

**Fișier:** `frontend/src/components/Card.jsx`

### Descriere

Componentă container pentru gruparea conținutului înrudit. Folosită în Dashboard, Inventar și alte pagini.

### Props

| Prop | Tip | Default | Descriere |
|------|-----|---------|-----------|
| `children` | `ReactNode` | — | Conținut card |
| `className` | `string` | `''` | Clase CSS suplimentare |
| `onClick` | `function` | — | Handler click (pentru carduri clicabile) |
| `isLoading` | `boolean` | `false` | Afișează skeleton loading |

### Stilizare

- **Fundal:** `--color-bg-secondary`
- **Border:** 1px `--color-border`
- **Rotunjire:** `--radius-lg` (14px)
- **Padding:** `--card-padding` (24px)
- **Hover:** Ridicare umbră

### Exemple

**Card simplu**
```jsx
<Card>
  <h3>Dispozitive funcționale</h3>
  <p>Total: {functionalCount}</p>
</Card>
```

**Card cu stare de încărcare**
```jsx
<Card isLoading={isLoading}>
  <div className="flex justify-between items-center">
    <span>Dispozitive:</span>
    <span className="text-2xl font-bold">{totalDevices}</span>
  </div>
</Card>
```

**Card clicabil**
```jsx
<Card onClick={() => navigate(`/devices/${id}/edit`)}>
  <p className="font-bold">{deviceName}</p>
  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{status}</p>
</Card>
```

### Responsiv

- Mobil: Lățime completă
- Tabletă+: Container `max-width: 90%`
- Desktop: Parte din grid (2–3 coloane)

---

## Componente Badge

**Fișier:** `frontend/src/components/StatusBadge.jsx`

### Descriere

Afișează informații despre status și urgență cu icoană + text (accesibil, nu doar culoare).

### Status Badge — Dispozitive

**Props:**

| Prop | Tip | Default | Opțiuni |
|------|-----|---------|---------|
| `status` | `string` | — | `FUNCTIONAL`, `IN_REPARATIE`, `DEFECT`, `CASAT`, `IMPRUMUTAT`, `REZERVA` |
| `size` | `string` | `'md'` | `'sm'`, `'md'`, `'lg'` |

**Afișare:**

| Status | Simbol | Culoare |
|--------|--------|---------|
| FUNCTIONAL | ✓ Funcțional | Verde `#34d399` |
| IN_REPARATIE | ⟳ În reparație | Galben `#fbbf24` |
| DEFECT | ✗ Defect | Roșu `#f87171` |
| CASAT | − Casat | Gri `#6b7280` |
| IMPRUMUTAT | → Împrumutat | Albastru `#60a5fa` |
| REZERVA | ◻ Rezervă | Violet `#a78bfa` |

**Regulă:** Afișează întotdeauna **simbol + text + culoare** — niciodată culoarea singură (WCAG 1.4.1).

### Urgency Badge — Consumabile

**Niveluri:**

| Nivel | Culoare | Descriere |
|-------|---------|-----------|
| `CRITIC` | Roșu | Stoc epuizat sau critic |
| `URGENT` | Portocaliu | Stoc foarte scăzut |
| `REDUS` | Galben | Stoc redus |
| `OK` | Verde | Stoc normal |
| `DEPLIN` | Gri | Stoc deplin |

### Exemple

```jsx
<StatusBadge status="FUNCTIONAL" />
<StatusBadge status="DEFECT" size="lg" />
<StatusBadge status="IN_REPARATIE" size="sm" />
```

---

## Componenta Form

**Fișier:** `frontend/src/pages/DeviceForm.jsx`

### Descriere

Formular multi-pas pentru crearea/editarea dispozitivelor medicale cu validare, urmărire progres și istoric modificări.

### Arhitectură

```
Formular (3 pași)
├── Pasul 1: Informații de bază (Denumire, Model, Producător)
├── Pasul 2: Specificații tehnice (Categorie, Status, Serie, Clasă risc)
└── Pasul 3: Detalii (Locație, URL manual, Note)

Secțiune suplimentară (doar mod editare):
└── DeviceTimeline — Istoricul modificărilor din Jurnal Audit
```

### Validare (Zod)

```javascript
// Fiecare pas are validare de schemă:
Pasul1Schema = {
  name: string, minim 3 caractere (obligatoriu),
  model: string (opțional),
  manufacturer: string (opțional)
}

Pasul2Schema = {
  category: enum (obligatoriu),
  status: enum (obligatoriu),
  serialNumber: string (opțional)
}

Pasul3Schema = {
  location: string (opțional),
  manualUrl: format URL (opțional),
  notes: string (opțional)
}
```

### Gestionare erori

- Feedback validare în timp real
- Mesaje de eroare sub fiecare câmp
- Formularul nu poate avansa dacă validarea pasului eșuează
- Butonul submit dezactivat până când câmpurile obligatorii sunt valide

### Accesibilitate

- ✅ Indicator pas (1 din 3)
- ✅ Structură formular semantică
- ✅ Navigare tastatură între câmpuri
- ✅ `aria-invalid` + `aria-describedby` pe erori
- ✅ Gestionare focus la schimbarea pasului
- ✅ Istoric modificări în mod editare (DeviceTimeline)

---

## Componente Navigare

### ViewToggle

**Scop:** Comutare între vizualizările Tabel / Carduri

```jsx
// Variante active în InventoryPageV2:
// - Tabel (implicit)
// - Carduri (DeviceCard grid)
```

**Accesibilitate:**
- Grup de butoane cu `aria-label="Schimbă vizualizarea"`
- Butonul activ: evidențiat cu culoarea accent
- Tastatura: Tab + Enter pentru selectare

### Paginare

**Props:**
```javascript
{
  currentPage: number,
  totalPages: number,
  onPrevious: () => void,
  onNext: () => void,
  isFirstPage: boolean,
  isLastPage: boolean
}
```

**Redare:**
```
← Pagina 1 din 3 →
```

---

## Componente Utilitare

### Skeleton Loading

**Utilizare:**
```jsx
{isLoading && <div className="skeleton skeleton-row" />}
```

**Clase disponibile:**
- `.skeleton` — Animație pulsare
- `.skeleton-card` — Skeleton card complet
- `.skeleton-row` — Skeleton rând tabel
- `.skeleton-text` — Skeleton text inline

**Animație:**
- Ciclu pulsare de 2 secunde
- Respectă `prefers-reduced-motion`

### Loading Spinner

**Utilizare:**
```jsx
{loading && <div className="loading-spinner loading-spinner-sm" />}
```

**Mărimi:**
- `loading-spinner-sm` — 16px
- `loading-spinner-md` — 24px (implicit)
- `loading-spinner-lg` — 32px

### SkipLink

**Fișier:** `frontend/src/components/SkipLink.jsx`

Permite utilizatorilor de tastatură să sară direct la conținutul principal.

```jsx
<SkipLink />
// → Randează: "Sari la conținut" (vizibil la focus, ascuns altfel)
// → Leagă la <main id="main">
```

### DeviceTimeline

**Fișier:** `frontend/src/components/DeviceTimeline.jsx`

Afișează istoricul modificărilor unui dispozitiv din jurnalul de audit.

```jsx
<DeviceTimeline deviceId={id} />
// → Fetches GET /api/audit-logs?entity=devices&entityId={id}
// → Timeline vertical cu acțiuni, timestamp și modificări
```

---

## Referință Token-uri Design

### Culori

#### Culori semantice
```css
--color-accent:    #ff9b6a  (dark) / #b84621  (light)
--color-success:   #34d399
--color-error:     #f87171
--color-warning:   #fbbf24
--color-info:      #60a5fa
```

#### Culori text
```css
--color-text-primary:    #f0f0f0  (dark) / #111418  (light)
--color-text-secondary:  #8a9199  (dark) / #5c6370  (light)
--color-text-tertiary:   #7a8290
--color-disabled-text:   #9da3ae  (dark) / #5c6370  (light)
--color-placeholder:     #a0a9b1
```

#### Culori fundal
```css
--color-bg-primary:    #0c0f10  (dark) / #f4f5f7  (light)
--color-bg-secondary:  #141718  (dark) / #ffffff   (light)
--color-bg-tertiary:   #1c2022  (dark) / #eef0f2   (light)
--color-bg-elevated:   #222628  (dark) / #ffffff   (light)
```

#### Culori border
```css
--color-border:        #2a2f33  (dark) / #e2e5e9  (light)
--color-border-subtle: #1e2225  (dark) / #eef0f2  (light)
```

### Tipografie

```css
--font-family-base:   'Plus Jakarta Sans', sans-serif
--font-family-mono:   'JetBrains Mono', monospace

--font-size-display:  3rem     (48px)
--font-size-h1:       2rem     (32px)
--font-size-h2:       1.5rem   (24px)
--font-size-h3:       1.125rem (18px)
--font-size-base:     0.9375rem (15px)
--font-size-sm:       0.8125rem (13px)
--font-size-xs:       0.6875rem (11px)

--font-weight-regular:   400
--font-weight-medium:    500
--font-weight-semibold:  600
--font-weight-bold:      700
--font-weight-extrabold: 800
```

### Spațiere (grilă 8px)

```css
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

### Dimensiuni icoane

```css
--icon-size-xs: 12px  (inline, minimal)
--icon-size-sm: 16px  (badge-uri, UI mic)
--icon-size-md: 20px  (implicit, elemente UI)
--icon-size-lg: 24px  (proeminent, butoane)
--icon-size-xl: 32px  (mare, secțiuni hero)
```

### Rotunjire borduri

```css
--radius-sm:   6px     (badge-uri mici)
--radius-md:   10px    (inputuri, butoane)
--radius-lg:   14px    (carduri)
--radius-xl:   20px    (modale)
--radius-2xl:  28px    (containere mari)
--radius-full: 9999px  (cercuri, badge-uri pill)
```

### Umbre

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.2)    (subtil)
--shadow-sm: 0 2px 8px rgba(0,0,0,0.15)   (mic)
--shadow-md: 0 4px 16px rgba(0,0,0,0.2)   (implicit)
--shadow-lg: 0 8px 32px rgba(0,0,0,0.25)  (ridicat)
--shadow-xl: 0 16px 48px rgba(0,0,0,0.3)  (modal)

--shadow-glow-accent:  0 0 24px rgba(255,155,106,0.15)
--shadow-glow-success: 0 0 16px rgba(52,211,153,0.2)
--shadow-glow-error:   0 0 16px rgba(248,113,113,0.2)
```

### Tranziții

```css
--transition-fast:   0.15s cubic-bezier(0.16,1,0.3,1)
--transition-normal: 0.3s  cubic-bezier(0.16,1,0.3,1)
--transition-slow:   0.5s  cubic-bezier(0.16,1,0.3,1)
--ease-spring: cubic-bezier(0.34,1.56,0.64,1)
```

### Token-uri componente

```css
--btn-height:    44px  (țintă atingere)
--btn-height-sm: 36px
--btn-height-lg: 52px
--btn-radius:    var(--radius-md)

--input-height:  44px  (țintă atingere)
--input-radius:  var(--radius-md)

--card-radius:   var(--radius-lg)
--card-padding:  var(--space-6)

--modal-radius:  var(--radius-xl)

--focus-ring: 0 0 0 2px var(--color-bg-primary),
              0 0 0 4px var(--color-accent)
```

---

## Bune practici

### Utilizarea componentelor

**DA:**
- Folosește componente semantice (Button, Input, Card, StatusBadge)
- Utilizează token-uri de design pentru consistență
- Adaugă `aria-label` la butoane icon-only
- Gestionează stările de încărcare vizual
- Oferă feedback de eroare inline

**NU:**
- Harcodezi culori (folosește token-uri `--color-*`)
- Harcodezi dimensiuni (folosește `--space-*`, `--icon-size-*`)
- Creezi stiluri personalizate pentru butoane
- Ignori atributele de accesibilitate
- Ascunzi mesajele de eroare

### Design responsiv

- **Mobile-first:** Începe cu mobilul, adaugă breakpoints `md:`, `lg:`
- **Ținte atingere:** Minimum 44px (butoane, inputuri)
- **Tipografie:** Se scalează cu viewport-ul
- **Layout:** Folosește CSS Grid / Flexbox

### Dark/Light Mode

- Culorile se schimbă automat prin variabile CSS
- Nu este nevoie de randare condiționată
- Testează ambele moduri înainte de livrare

### Checklist accesibilitate

- [ ] Contrast culori ≥4.5:1 (text normal), ≥3:1 (text mare)
- [ ] Navigare tastatură funcțională (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus ring vizibil pe toate elementele interactive
- [ ] Label ARIA pe butoane icon-only
- [ ] Mesaje eroare legate la inputuri (`aria-describedby`)
- [ ] Label-uri formulare conectate (`htmlFor`)
- [ ] Fără capturi focus
- [ ] Ținte atingere ≥44px

---

## Depanare

### Butonul nu afișează spinner

```jsx
// Greșit
<Button loading={isLoading}>Salvează</Button>

// Corect
<Button loading={isLoading}>
  {isLoading ? 'Se salvează...' : 'Salvează'}
</Button>
```

### Inputul afișează eroare dar fără label

```jsx
// Lipsă label
<Input error="Câmp obligatoriu" value={value} />

// Corect
<Input label="Denumire" error="Câmp obligatoriu" value={value} />
```

### Cardul nu este responsiv pe mobil

```jsx
// Folosește breakpoints Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
</div>
```

---

## Istoric versiuni

| Versiune | Data | Modificări |
|----------|------|------------|
| 3.1 | 2026-06-05 | Traducere completă în română, adăugare SkipLink și DeviceTimeline |
| 3.0 | 2026-06-04 | Token-uri dimensiuni icoane, refactor stare dezactivată |
| 2.5 | 2026-06-02 | Formular multi-pas, consolidare 3 pași |
| 2.0 | 2026-06-01 | Dark/light mode, conformitate WCAG 2.1 AA |
| 1.0 | 2026-05-29 | Bibliotecă componente inițială |

---

**Status:** ✅ GATA PRODUCȚIE — Ultimul audit 2026-06-05
