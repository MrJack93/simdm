# 🧩 Component Library — SIMDM

**Status:** Phase 1 Foundation  
**Last Updated:** 2026-05-28  
**Maintained by:** Design Team + Frontend

---

## 📑 Components Overview

| Component | Status | Location | Accessible | Notes |
|-----------|--------|----------|-----------|--------|
| Button | ✅ Pattern Ready | `btn-primary`, `btn-secondary`, `btn-danger` | WCAG AA | 44px min, focus ring |
| Input | ✅ Pattern Ready | `FormInput.jsx` | WCAG AA | Label + error handling |
| Card | ✅ Pattern Ready | `.card-base` | WCAG AA | Hover state |
| Alert | ✅ Pattern Ready | `.alert-error`, `.alert-success` | WCAG AA | role="alert" or "status" |
| Table | ✅ Design Ready | Phase 2 | WCAG AA | scope="col", aria-sort |
| Modal | ⏳ Phase 2 | — | WCAG AA | Focus trap, escape key |
| Select/Dropdown | ⏳ Phase 2 | — | WCAG AA | Custom implementation |
| Form Grid | ⏳ Phase 2 | — | WCAG AA | Responsive layout |

---

## 🔵 Button Variants

### Primary Button
**Use:** Main actions (Submit, Save, Confirm)

```jsx
<button className="btn-primary">
  Conectare
</button>

// With icon (left)
<button className="btn-primary flex items-center gap-2">
  <IconDownload className="w-4 h-4" aria-hidden="true" />
  Descarcă
</button>

// Loading state
<button className="btn-primary" disabled aria-busy={true}>
  <svg className="animate-spin h-4 w-4" aria-hidden="true">...</svg>
  Se procesează…
</button>

// Full width
<button className="btn-primary w-full">
  Conectare
</button>
```

**Styling:**
```css
.btn-primary {
  bg-cyan-500;
  hover:bg-cyan-400;
  text-black;
  font-bold;
  min-h-44px;
  focus-visible:ring-2 ring-cyan-400;
}
```

---

### Secondary Button
**Use:** Alternative actions, Cancel, Cancel Confirmation

```jsx
<button className="btn-secondary">
  Anulare
</button>

// Ghost variant (minimal)
<button className="text-cyan-400 hover:text-cyan-300 focusable">
  Link-button
</button>
```

---

### Danger Button
**Use:** Delete, Destructive Actions

```jsx
<button className="btn-danger">
  Ștergere Permanentă
</button>

// In modal/confirmation context
<div className="flex gap-3">
  <button className="btn-secondary flex-1">Anulare</button>
  <button className="btn-danger flex-1">Ștergere</button>
</div>
```

---

## 📝 Input Components

### Text Input with Label & Error

```jsx
import FormInput from '@/components/FormInput';

<FormInput
  id="username"
  label="Utilizator"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  autoComplete="username"
  autoFocus
  placeholder="ex: inginer.dm"
  error={errors.username}
  required
/>
```

**Props:**
- `id` (required) — Used for label association
- `label` — Visible label text
- `type` — "text", "email", "password", "number", etc.
- `value` — Input value
- `onChange` — Change handler
- `error` — Error message (shows below input)
- `autoComplete` — "username", "current-password", "email", etc.
- `autoFocus` — Focus on mount
- `disabled` — Disabled state
- `required` — HTML required attribute
- `placeholder` — Hint text

**Rendering:**
```
┌─ Label (gray-400) ──────────────┐
│ Utilizator *                    │
├─────────────────────────────────┤
│ [input field — cyan border focus] │
└─────────────────────────────────┘
Error message (red, role="alert")
```

---

### Password Input

```jsx
<FormInput
  id="password"
  label="Parolă"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"
  error={errors.password}
/>
```

---

### Search Input

```jsx
<FormInput
  id="search"
  label="Căutare"
  type="text"
  placeholder="Caută după DM..."
  value={searchQuery}
  onChange={(e) => handleSearch(e.target.value)}
/>
```

---

## 🎨 Card Component

### Basic Card

```jsx
<Card title="DM-001" subtitle="Electrocardio">
  <p>Status: <strong className="text-green-400">Funcțional</strong></p>
  <p className="text-gray-400 text-sm mt-2">Ultima mentenanță: 2026-04-15</p>
</Card>
```

### Card with Action Button

```jsx
<Card
  title="Dispozitiv #42"
  subtitle="Stetoscop Digital"
  action={<Button variant="secondary" size="sm">Editare</Button>}
>
  <dl className="space-y-2 text-sm">
    <div>
      <dt className="text-gray-400">Status:</dt>
      <dd className="text-cyan-400">Funcțional</dd>
    </div>
    <div>
      <dt className="text-gray-400">Clasa Risc:</dt>
      <dd className="text-gray-100">IIa</dd>
    </div>
  </dl>
</Card>
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {devices.map(device => (
    <Card key={device.id} title={device.name}>
      <p className="text-gray-400">{device.section}</p>
    </Card>
  ))}
</div>
```

---

## 🚨 Alert Components

### Error Alert

```jsx
{error && (
  <div role="alert" aria-live="assertive" className="alert-error">
    ❌ Eroare: {error}
  </div>
)}
```

### Success Alert

```jsx
{success && (
  <div role="status" aria-live="polite" className="alert-success">
    ✓ {success}
  </div>
)}
```

### Info Alert

```jsx
<div role="status" aria-live="polite" className="alert-info">
  ℹ️ Informație: Faza 1 completă
</div>
```

### Warning Alert

```jsx
<div role="status" aria-live="polite" className="bg-amber-950/30 border border-amber-600 px-4 py-3 rounded-lg text-amber-400 text-sm">
  ⚠️ Avertisment: Mentenanță scadență în 7 zile
</div>
```

---

## 📊 Table Component (Phase 2+)

### Basic Table Structure

```jsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-gray-600">
        <th scope="col" className="px-4 py-3 text-left font-bold text-cyan-400">
          Număr Inventar
        </th>
        <th scope="col" className="px-4 py-3 text-left font-bold text-cyan-400">
          Denumire
        </th>
        <th scope="col" className="px-4 py-3 text-left font-bold text-cyan-400">
          Status
        </th>
        <th scope="col" className="px-4 py-3 text-left font-bold text-cyan-400">
          Acțiuni
        </th>
      </tr>
    </thead>
    <tbody>
      {devices.map((device) => (
        <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-800/50">
          <td className="px-4 py-3 text-gray-100">{device.inventoryNumber}</td>
          <td className="px-4 py-3 text-gray-400">{device.name}</td>
          <td className="px-4 py-3">
            <StatusBadge status={device.status} />
          </td>
          <td className="px-4 py-3">
            <Button variant="secondary" size="sm">Editare</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Status Badge (Reusable)

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

---

## 🔒 Modal / Dialog (Phase 2+)

### Confirmation Modal

```jsx
{showConfirmDelete && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="bg-gray-900 rounded-xl px-6 py-6 max-w-md w-full mx-4"
    >
      <h2 id="modal-title" className="text-xl font-bold text-cyan-400 mb-4">
        Confirmă ștergere
      </h2>
      <p className="text-gray-400 mb-6">
        Ești sigur? Această acțiune nu poate fi anulată.
      </p>
      <div className="flex gap-3">
        <button
          className="btn-secondary flex-1"
          onClick={() => setShowConfirmDelete(false)}
        >
          Anulare
        </button>
        <button
          className="btn-danger flex-1"
          onClick={handleDelete}
        >
          Ștergere
        </button>
      </div>
    </div>
  </div>
)}
```

**Accessibility Requirements:**
- ✅ `role="dialog" aria-modal="true"`
- ✅ `aria-labelledby="modal-title"`
- ✅ Focus trap (Tab stays within modal)
- ✅ Escape key closes
- ✅ Focus returns to trigger button on close

---

## 🔤 Form Layout Examples

### Single Column Form

```jsx
<form className="space-y-6">
  <FormInput
    id="name"
    label="Denumire Dispozitiv"
    value={name}
    onChange={(e) => setName(e.target.value)}
    error={errors.name}
    required
  />
  
  <FormInput
    id="serial"
    label="Număr Serial"
    value={serial}
    onChange={(e) => setSerial(e.target.value)}
  />

  <div className="flex gap-3 pt-4">
    <button className="btn-secondary flex-1">Anulare</button>
    <button className="btn-primary flex-1">Salvare</button>
  </div>
</form>
```

### Two Column Form (Phase 2+)

```jsx
<form className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <FormInput
    id="name"
    label="Denumire"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
  />
  
  <FormInput
    id="serial"
    label="Număr Serial"
    value={serial}
    onChange={(e) => setSerial(e.target.value)}
  />

  {/* Full width section */}
  <div className="md:col-span-2">
    <FormInput
      id="description"
      label="Descriere"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
  </div>

  {/* Buttons full width */}
  <div className="md:col-span-2 flex gap-3">
    <button className="btn-secondary flex-1">Anulare</button>
    <button className="btn-primary flex-1">Salvare</button>
  </div>
</form>
```

---

## 🎯 Spacing Rules

| Context | Classes | Value |
|---------|---------|-------|
| Form fields | `mb-4` | 16px |
| Between sections | `gap-6` | 24px |
| Padding cards | `px-6 py-6` | 24px |
| Padding buttons | `px-4 py-3` | 16px (height: 44px) |
| Gap between inline items | `gap-2` | 8px |

---

## 🔄 Common Patterns

### Loading Data

```jsx
import { useQuery } from '@tanstack/react-query';

function DeviceList() {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/api/devices'),
  });

  if (isLoading) {
    return <div role="status" className="alert-info">Se încarcă...</div>;
  }

  if (error) {
    return <div role="alert" className="alert-error">Eroare: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      {devices?.map(device => (
        <Card key={device.id} title={device.name} />
      ))}
    </div>
  );
}
```

### Form Submission with Validation

```jsx
const [formData, setFormData] = useState({ name: '', serial: '' });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});

  // Validate
  if (!formData.name.trim()) {
    setErrors({ name: 'Denumirea este necesară' });
    return;
  }

  try {
    setLoading(true);
    await api.post('/api/devices', formData);
    // Success
  } catch (err) {
    setErrors({
      submit: err.response?.data?.error || 'Eroare necunoscută',
    });
  } finally {
    setLoading(false);
  }
};

<form onSubmit={handleSubmit} className="space-y-6">
  {errors.submit && <div role="alert" className="alert-error">{errors.submit}</div>}
  <FormInput id="name" label="Denumire" error={errors.name} ... />
  <button className="btn-primary w-full" disabled={loading} aria-busy={loading}>
    {loading ? 'Se salvează…' : 'Salvare'}
  </button>
</form>
```

---

## 📋 Checklist: Adding New Component

- [ ] Implemented in JSX with proper semantic HTML
- [ ] All interactive elements have labels (`<label>` for inputs, `aria-label` for icons)
- [ ] Focus ring with `.focusable` class or manual `focus-visible`
- [ ] Minimum touch target: 44px
- [ ] Error/status messages have `role="alert"` or `role="status"`
- [ ] Tested keyboard navigation (Tab, Enter, Escape)
- [ ] Tested with screen reader (NVDA/Narrator)
- [ ] Contrast check (WebAIM Contrast Checker)
- [ ] Added to `COMPONENT_LIBRARY.md` with examples
- [ ] Used consistently across codebase

---

**Contributing?** Follow WCAG 2.1 AA. Test with:
- ✅ Keyboard (Tab, Enter, Escape)
- ✅ Screen reader (NVDA)
- ✅ Lighthouse (≥95)
- ✅ axe DevTools (0 errors)
