# SIMDM Component Library — Complete Reference

**Version:** 3.0  
**Last Updated:** Iunie 2026  
**Status:** Production-Ready (WCAG 2.1 AA Compliant)

---

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Card Component](#card-component)
4. [Badge Components](#badge-components)
5. [Form Component](#form-component)
6. [Navigation Components](#navigation-components)
7. [Utility Components](#utility-components)
8. [Design Tokens Reference](#design-tokens-reference)

---

## Button Component

**File:** `frontend/src/components/Button.jsx`

### Description
Reusable button component with multiple variants, sizes, and states. Fully keyboard accessible with proper focus management.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary'` \| `'secondary'` \| `'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable button state |
| `loading` | `boolean` | `false` | Show loading spinner |
| `type` | `'button'` \| `'submit'` \| `'reset'` | `'button'` | HTML type attribute |
| `children` | `ReactNode` | — | Button text/content |
| `onClick` | `function` | — | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `aria-label` | `string` | — | Accessible label (required for icon-only buttons) |

### Variants

#### Primary Button (Default)
```jsx
<Button variant="primary">Adaugă dispozitiv</Button>
```
**Styling:**
- Background: `--color-accent`
- Text: `--color-bg-primary`
- Hover: Shadow lift + color darken
- Disabled: Opacity 60%

#### Secondary Button
```jsx
<Button variant="secondary">Anulează</Button>
```
**Styling:**
- Background: `--color-bg-tertiary`
- Border: 1px `--color-border`
- Text: `--color-text-primary`
- Hover: Background `--color-bg-secondary`

#### Danger Button
```jsx
<Button variant="danger">Ștergere</Button>
```
**Styling:**
- Background: `--color-error`
- Text: White
- Hover: Darker red (`--color-error-hover`)
- Used for: Delete/destructive actions

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 36px | Inline, compact actions |
| `md` | 44px (touch target) | Default, forms |
| `lg` | 52px | Primary CTAs |

### States

```jsx
{/* Idle state */}
<Button>Salvează</Button>

{/* Disabled */}
<Button disabled>Salvează</Button>

{/* Loading */}
<Button loading>Se salvează...</Button>

{/* Icon-only (requires aria-label) */}
<Button variant="secondary" size="sm" aria-label="Editare">
  <Edit2 size={16} />
</Button>
```

### Accessibility (WCAG 2.1 AA)
- ✅ Keyboard focusable (Tab navigation)
- ✅ Focus ring visible (`:focus-visible`)
- ✅ Semantic `<button>` element
- ✅ `aria-label` on icon-only buttons
- ✅ `aria-busy` when loading
- ✅ Touch target ≥44px
- ✅ Contrast ratio ≥4.5:1

### Examples

**Submit Button in Form**
```jsx
<Button type="submit" variant="primary" loading={isLoading}>
  {isLoading ? 'Se salvează...' : 'Salvează modificări'}
</Button>
```

**Delete Action**
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

## Input Component

**File:** `frontend/src/components/Input.jsx`

### Description
Accessible form input with built-in label, error handling, and validation feedback.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Input label |
| `type` | `string` | `'text'` | HTML input type |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | `''` | Current value |
| `onChange` | `function` | — | Change handler |
| `error` | `string` | `null` | Error message |
| `helpText` | `string` | — | Help text below input |
| `required` | `boolean` | `false` | Mark as required |
| `disabled` | `boolean` | `false` | Disable input |
| `autoComplete` | `string` | — | HTML autocomplete attribute |
| `aria-label` | `string` | — | Accessible label |
| `aria-describedby` | `string` | — | Links to help/error text |

### Examples

**Basic Text Input**
```jsx
<Input 
  label="Denumire dispozitiv" 
  placeholder="Ex: Defibrilator externe"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

**Required Field with Error**
```jsx
<Input
  label="Email"
  type="email"
  required
  error={errors.email?.message}
  {...register('email')}
/>
```

**With Help Text**
```jsx
<Input
  label="Parolă nouă"
  type="password"
  helpText="Min 8 caractere"
  {...register('newPassword')}
/>
```

### States

| State | Appearance | Trigger |
|-------|-----------|---------|
| Idle | Border gray | Default |
| Focus | Border accent, ring | Tab/Click |
| Error | Border error (red) | Validation fail |
| Disabled | Opacity 60% | `disabled={true}` |
| Placeholder | Color secondary | No value |

### Accessibility
- ✅ `<label>` connected via `htmlFor`
- ✅ `aria-invalid={hasError}`
- ✅ `aria-describedby` on error/help text
- ✅ `role="alert"` on error message
- ✅ Placeholder color ≥6.9:1 contrast
- ✅ Focus ring visible
- ✅ Height 44px (touch target)

---

## Card Component

**File:** `frontend/src/components/Card.jsx`

### Description
Container component for grouping related content. Used across Dashboard, Inventory, and pages.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Card content |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `function` | — | Click handler (for clickable cards) |
| `isLoading` | `boolean` | `false` | Show skeleton loading |

### Styling

- **Background:** `--color-bg-secondary`
- **Border:** 1px `--color-border`
- **Radius:** `--radius-lg` (14px)
- **Padding:** `--card-padding` (24px)
- **Hover:** Shadow lift, subtle scale

### Examples

**Basic Card**
```jsx
<Card>
  <h3>Dispozitive funcționale</h3>
  <p>Total: {functionalCount}</p>
</Card>
```

**Stat Card with Loading**
```jsx
<Card isLoading={isLoading}>
  <div className="flex justify-between items-center">
    <span>Dispozitive:</span>
    <span className="text-2xl font-bold">
      {isLoading ? <Skeleton /> : totalDevices}
    </span>
  </div>
</Card>
```

**Clickable Card**
```jsx
<Card onClick={() => navigate(`/device/${id}`)}>
  <p className="font-bold">{deviceName}</p>
  <p className="text-sm text-secondary">{status}</p>
</Card>
```

### Responsive
- Mobile: Full width, no side padding
- Tablet+: `max-width: 90%` container
- Desktop: Part of grid (2-3 columns)

---

## Badge Components

**File:** `frontend/src/components/StatusBadge.jsx`

### Description
Display status and urgency information with icon + text (accessible, not color-only).

### Status Badge

**Props**
| Prop | Type | Default | Options |
|------|------|---------|---------|
| `status` | `string` | — | `FUNCTIONAL`, `IN_REPARATIE`, `DEFECT`, `DECOMMISSIONED`, `IMPRUMUTAT`, `SPARE` |
| `size` | `string` | `'md'` | `'sm'`, `'md'`, `'lg'` |

**Display Rules**
- **Icon + Label:** Always shown (not color-only) ✅ WCAG 1.4.1 compliant
- **Color:** Semantically matched to status
- **Example:** ✓ FUNCTIONAL (green) + icon checkmark

### Urgency Badge

**Props**
| Prop | Type | Options | Color |
|------|------|---------|-------|
| `urgency` | `string` | `DEPLIN`, `URGENT`, `CRITIC`, `REDUS`, `OK` | Custom per level |

**Levels**
- 🔴 `CRITIC` — Red, highest priority
- 🟠 `URGENT` — Orange
- 🟡 `REDUS` — Yellow
- 🟢 `OK` — Green
- ⚪ `DEPLIN` — Gray, informational

### Examples

```jsx
<StatusBadge status="FUNCTIONAL" />
<StatusBadge status="DEFECT" size="lg" />
<StatusBadge urgency="CRITIC" />
```

---

## Form Component

**File:** `frontend/src/pages/DeviceForm.jsx`

### Description
Multi-step form for device creation/editing with validation and progress tracking.

### Architecture

```
Form (3 steps)
├── Step 1: Basic Info (Name, Model, Manufacturer)
├── Step 2: Specifications (Category, Status, Serial)
└── Step 3: Details (Location, Manual URL, Notes)
```

### Props (Wrapper Context)

| Prop | Type | Purpose |
|------|------|---------|
| `initialData` | `object` | Pre-fill form (edit mode) |
| `onSubmit` | `function` | Submit handler |
| `isLoading` | `boolean` | Show loading state |

### Validation (Zod)

```javascript
// Each step has schema validation:
Step1Schema = {
  name: required string,
  model: optional string,
  manufacturer: optional string
}

Step2Schema = {
  category: required,
  status: required,
  serialNumber: optional
}

Step3Schema = {
  location: optional,
  manualUrl: optional (URL format),
  notes: optional
}
```

### Error Handling

- Real-time validation feedback
- Error messages below each field
- Form cannot proceed if step validation fails
- Submit button disabled until all required fields valid

### Accessibility
- ✅ Step indicator (1 of 3)
- ✅ Semantic form structure
- ✅ Keyboard navigation between fields
- ✅ `aria-invalid` + `aria-describedby` on errors
- ✅ Focus management on step change

---

## Navigation Components

### ViewToggle

**Purpose:** Switch between Table / Cards / Kanban views

**Props**
```javascript
{
  currentView: 'table' | 'cards' | 'kanban',
  onViewChange: (view) => void,
  aria-label: "Comutare vizualizare"
}
```

**States**
- Active tab: Highlighted with accent color
- Inactive: Subtle background
- Hover: Shadow lift

### Pagination

**Props**
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

**Render**
```jsx
← Pagina 1 din 3 →
```

---

## Utility Components

### Skeleton Loading

**Usage**
```jsx
{isLoading && <div className="skeleton skeleton-row" />}
```

**Classes**
- `.skeleton` — Pulse animation
- `.skeleton-card` — Full card skeleton
- `.skeleton-row` — Table row skeleton
- `.skeleton-text` — Inline text skeleton

**Animation**
- 2-second pulse cycle
- Respects `prefers-reduced-motion`

### Loading Spinner

**Usage**
```jsx
{loading && <div className="loading-spinner loading-spinner-sm" />}
```

**Sizes**
- `loading-spinner-sm` — 16px
- `loading-spinner-md` — 24px (default)
- `loading-spinner-lg` — 32px

---

## Design Tokens Reference

### Colors

#### Semantic Colors
```css
--color-accent:        #ff9b6a  (dark) / #b84621 (light)
--color-success:       #34d399
--color-error:         #f87171
--color-warning:       #fbbf24
--color-info:          #60a5fa
```

#### Text Colors
```css
--color-text-primary:      #f0f0f0  (dark) / #111418 (light)
--color-text-secondary:    #8a9199  (dark) / #5c6370 (light)
--color-text-tertiary:     #7a8290
--color-disabled-text:     #9da3ae  (dark) / #5c6370 (light)
--color-placeholder:       #a0a9b1
```

#### Background Colors
```css
--color-bg-primary:    #0c0f10  (dark) / #f4f5f7 (light)
--color-bg-secondary:  #141718  (dark) / #ffffff (light)
--color-bg-tertiary:   #1c2022  (dark) / #eef0f2 (light)
--color-bg-elevated:   #222628  (dark) / #ffffff (light)
```

#### Border Colors
```css
--color-border:        #2a2f33  (dark) / #e2e5e9 (light)
--color-border-subtle: #1e2225  (dark) / #eef0f2 (light)
```

### Typography

```css
--font-family-base:     'Plus Jakarta Sans', sans-serif
--font-family-mono:     'JetBrains Mono', monospace

--font-size-display:    3rem    (48px)
--font-size-h1:         2rem    (32px)
--font-size-h2:         1.5rem  (24px)
--font-size-h3:         1.125rem (18px)
--font-size-base:       0.9375rem (15px)
--font-size-sm:         0.8125rem (13px)
--font-size-xs:         0.6875rem (11px)

--font-weight-regular:  400
--font-weight-medium:   500
--font-weight-semibold: 600
--font-weight-bold:     700
--font-weight-extrabold: 800
```

### Spacing (8px Grid)

```css
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

### Icon Sizing

```css
--icon-size-xs: 12px   (inline, minimal)
--icon-size-sm: 16px   (badges, small UI)
--icon-size-md: 20px   (default, UI elements)
--icon-size-lg: 24px   (prominent, buttons)
--icon-size-xl: 32px   (large, hero sections)
```

### Border Radius

```css
--radius-sm:  6px    (inputs, buttons)
--radius-md:  10px   (cards, buttons)
--radius-lg:  14px   (cards)
--radius-xl:  20px   (modals)
--radius-2xl: 28px   (large containers)
--radius-full: 9999px (circles, badges)
```

### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.2)    (subtle)
--shadow-sm: 0 2px 8px rgba(0,0,0,0.15)   (small)
--shadow-md: 0 4px 16px rgba(0,0,0,0.2)   (default)
--shadow-lg: 0 8px 32px rgba(0,0,0,0.25)  (elevated)
--shadow-xl: 0 16px 48px rgba(0,0,0,0.3)  (modal)

--shadow-glow-accent: 0 0 24px rgba(255,155,106,0.15)
--shadow-glow-success: 0 0 16px rgba(52,211,153,0.2)
--shadow-glow-error: 0 0 16px rgba(248,113,113,0.2)
```

### Transitions

```css
--transition-fast:   0.15s cubic-bezier(0.16,1,0.3,1)
--transition-normal: 0.3s cubic-bezier(0.16,1,0.3,1)
--transition-slow:   0.5s cubic-bezier(0.16,1,0.3,1)
--ease-spring: cubic-bezier(0.34,1.56,0.64,1)
```

### Component Tokens

```css
--btn-height:       44px (touch target)
--btn-height-sm:    36px
--btn-height-lg:    52px
--btn-radius:       var(--radius-md)

--input-height:     44px (touch target)
--input-radius:     var(--radius-md)

--card-radius:      var(--radius-lg)
--card-padding:     var(--space-6)

--modal-radius:     var(--radius-xl)

--focus-ring: 0 0 0 2px var(--color-bg-primary), 
              0 0 0 4px var(--color-accent)
```

---

## Best Practices

### Using Components

✅ **DO:**
- Use semantic components (Button, Input, Card)
- Leverage design tokens for consistency
- Add `aria-label` to icon-only buttons
- Handle loading states visually
- Provide error feedback inline

❌ **DON'T:**
- Hardcode colors (use `--color-*` tokens)
- Hardcode sizes (use `--space-*`, `--icon-size-*`)
- Create custom button styles
- Ignore accessibility attributes
- Hide error messages

### Responsive Design

- **Mobile-first:** Start with mobile, add `md:`, `lg:` breakpoints
- **Touch targets:** Minimum 44px (buttons, inputs)
- **Typography:** Scale with viewport
- **Layout:** Use CSS Grid / Flexbox

### Dark/Light Mode

- Colors automatically switch via CSS variables
- No conditional rendering needed
- Test both modes before shipping

### Accessibility Checklist

- [ ] Color contrast ≥4.5:1 (normal text), ≥3:1 (large text)
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus ring visible on all interactive elements
- [ ] ARIA labels on icon-only buttons
- [ ] Error messages linked to inputs (`aria-describedby`)
- [ ] Form labels connected (`htmlFor`)
- [ ] No focus traps
- [ ] Touch targets ≥44px

---

## Troubleshooting

### Button not showing spinner

```jsx
// ❌ Wrong
<Button loading={isLoading}>Save</Button>

// ✅ Correct
<Button loading={isLoading}>
  {isLoading ? 'Loading...' : 'Save'}
</Button>
```

### Input showing error but no label

```jsx
// ❌ Missing label
<Input error="Required" value={value} />

// ✅ Add label
<Input label="Name" error="Required" value={value} />
```

### Card not responsive on mobile

```jsx
// ✅ Use Tailwind breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
</div>
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | Iunie 2026 | Icon sizing tokens, disabled state refactor, complete docs |
| 2.5 | Mai 2026 | Multi-step form, 3-step consolidation |
| 2.0 | Aprilie 2026 | Dark/light mode, WCAG 2.1 AA compliance |
| 1.0 | Martie 2026 | Initial component library |

---

**Status:** ✅ PRODUCTION READY — Last audited Iunie 2026

