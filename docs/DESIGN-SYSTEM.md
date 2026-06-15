# Sistem de Design & Accesibilitate — SIMDM

**Versiune:** 3.0 (Claude.ai editorial theme) · **Actualizat:** 2026-06-13 · **Standard:** WCAG 2.2 AA
**Stivă UI:** React 19 + Tailwind 4 + Shadcn/UI · Temă medicală cream/coral

> **Sursa de adevăr pentru design este [`DESIGN.md`](../DESIGN.md) la rădăcina proiectului.**
> Acest document detaliază implementarea tehnică CSS a token-urilor definite în DESIGN.md.

---

## 1. Arhitectura CSS

| Fișier | Rol |
|---|---|
| `DESIGN.md` | **Sursa de adevăr** — token-uri YAML + descrieri componente pentru AI agents |
| `frontend/src/design-system.css` | Token-uri CSS (`:root` cream + `[data-theme="dark"]`), tipografie serif, umbre minimale |
| `frontend/src/design-system-animations.css` | Animații: shimmer skeleton, toast slide-in, modal scale, reduced-motion |
| `frontend/src/index.css` | Clase utilitare (btn-primary, input-base, card-base, focusable) + Shadcn bridge |
| `frontend/src/tokens.json` | Token-uri JSON pentru consum JS (36 culori, 3 font families, 8 spacing, 7 radius) |

---

## 2. Token-uri CSS (din DESIGN.md)

### 2.1 Culori — Cream Mode (default `:root`)

```
--color-bg-primary:     #faf9f5    (canvas)
--color-bg-secondary:   #efe9de    (surface-card)
--color-bg-tertiary:    #f5f0e8    (surface-soft)
--color-bg-elevated:    #e8e0d2    (surface-cream-strong)
--color-accent:         #cc785c    (coral primar)
--color-accent-hover:   #a9583e    (coral hover)
--color-text-primary:   #141413    (ink)
--color-text-secondary: #6c6a64    (muted)
--color-text-tertiary:  #8e8b82    (muted-soft)
--color-border:         #e6dfd8    (hairline)
```

### 2.2 Dark Mode (`[data-theme="dark"]`)

```
--color-bg-primary:     #181715    (surface-dark)
--color-bg-secondary:   #1f1e1b
--color-text-primary:   #faf9f5    (on-dark)
--color-accent:         #cc785c    (același coral)
--color-border:         #3a3835
```

### 2.3 Tipografie

```
--font-family-heading: 'Cormorant Garamond', serif   (display)
--font-family-base:    'Inter', sans-serif            (body)
--font-family-mono:    'JetBrains Mono', monospace    (code)
```

**Reguli:** Display serif weight 400 (never bold), negative letter-spacing, body sans weight 400-500.

### 2.4 Clase Utilitare

| Clasă | Utilizare |
|-------|-----------|
| `.btn-primary` | Coral bg, white text, h-40px, active scale(0.97) |
| `.btn-secondary` | Cream bg + hairline border |
| `.btn-danger` | Error bg, white text |
| `.input-base` | Cream bg + hairline border, focus coral ring |
| `.card-base` | Surface-card bg + hairline border, rounded-xl |
| `.label-base` | Muted text, font-medium |
| `.focusable` | Coral focus ring + offset |
| `.alert-error/success/info` | Cream bg + colored border |
| `.skeleton` | Shimmer animation pe cream-bg |

---

## 3. Accesibilitate — WCAG 2.2 AA

- **Contrast** ≥ 4.5:1 text normal, ≥ 3:1 text mare/UI
- **Tastatură:** toată funcționalitatea accesibilă fără mouse
- **Focus vizibil:** coral ring pe toate elementele interactive
- **ARIA:** `role="status"`, `role="alert"`, `role="dialog"`, `aria-label`
- **Semantic HTML:** heading-uri ierarhice, `<label>` asociat input-urilor
- **SkipLink** la începutul paginii
- **Touch targets** ≥ 40×40px pe mobil
- **Reduced motion:** `prefers-reduced-motion: reduce` — oprește toate animațiile
- **High contrast:** `prefers-contrast: more` — crește borders
- **Forced colors:** `forced-colors: active` — Windows High Contrast Mode

---

## 4. Componente UI

### Noi (create în Faza 3)
- `Skeleton.jsx` — Loading placeholder cu shimmer
- `EmptyState.jsx` — Placeholder date goale
- `ErrorState.jsx` — Eroare de server + retry
- `Toast.jsx` — Notificări (success/error/warning/info)
- `Spinner.jsx` — Loading inline
- `KeyboardShortcuts.jsx` — Ctrl+K/N/M// + help overlay

### Actualizate (Faza 3)
- `StatusBadge.jsx` — 6 statusuri medicale cu culori + simboluri
- `Alert.jsx` — Cream bg + colored left border
- `DeleteConfirmDialog.jsx` — Modal cream + coral delete
- `ErrorBoundary.jsx` — Cream bg, error state complet
- `SkipLink.jsx` — Coral bg, accessible
- `ProtectedRoute.jsx` — Skeleton loading
- `DeviceTimeline.jsx` — Cream bg, timeline items

### Shadcn/UI (actualizate Faza 3)
- `button.jsx`, `input.jsx`, `card.jsx`, `dialog.jsx`, `select.jsx`, `table.jsx`

### Modals (actualizate Faza 3)
- `TriageModal.jsx`, `TicketDetailsModal.jsx`, `RepairModal.jsx`

---

## 5. Testare & a11y

```bash
cd frontend
npm run test              # include teste RTL pe accesibilitate
npm run test:coverage     # coverage report
```

**Verificare manuală:**
- Navigare doar tastatură (Tab/Shift+Tab/Enter/Esc/Arrows)
- Screen reader: NVDA (Windows)
- Contrast: DevTools → Accessibility → Contrast

---

## Documente conexe

- [`DESIGN.md`](../DESIGN.md) — Sursa de adevăr (token-uri YAML + descrieri)
- [`MOBILE_WORKFLOW_GUIDE.md`](MOBILE_WORKFLOW_GUIDE.md) — Flux teren
- [`2-DEVELOPER-GUIDE.md`](2-DEVELOPER-GUIDE.md) — Frontend patterns
- [`ACCESSIBILITY-CHECKLIST.md`](ACCESSIBILITY-CHECKLIST.md) — Checklist WCAG 2.2
