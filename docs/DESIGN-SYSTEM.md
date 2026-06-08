# Sistem de Design & Accesibilitate — SIMDM

**Versiune:** 2.0 (consolidat) · **Actualizat:** 2026-06-08 · **Standard:** WCAG 2.1 AA
**Stivă UI:** React 19 + Tailwind 4 + Shadcn/UI · Temă medicală dark/light

> Acest document înlocuiește și consolidează vechile fișiere de design (DESIGN_HANDOFF_SPECS, 1-DESIGN-AND-ACCESSIBILITY, COMPONENT_LIBRARY, ACCESSIBILITY_GUIDE, LIGHT_MODE_GUIDE, DESIGN_SYSTEM_SIMDM, CONTRAST_TESTING, SHADCN_SETUP). Este sursa unică de adevăr pentru design.

---

## 1. Arhitectura CSS

Sursa de adevăr pentru stiluri sunt token-urile CSS, NU valori hardcodate în componente.

| Fișier | Rol |
|---|---|
| `frontend/src/design-system.css` | Definirea token-urilor (`:root` dark + `.light` override), tipografie, umbre, glass |
| `frontend/src/design-system-animations.css` | Animații și tranziții reutilizabile |
| `frontend/src/index.css` | Clase utilitare de bază (butoane, inputuri, focus ring) construite pe token-uri |
| `frontend/src/App.css` | Stiluri layout aplicație |

Regulă: orice culoare/spațiere/rază nouă se adaugă ca token în `design-system.css`, apoi se referențiază cu `var(--token)`. Tailwind se folosește doar cu clasele core (fără compilator custom).

---

## 2. Token-uri de design (valori reale din cod)

### 2.1 Culori — temă DARK (`:root`)
```
--color-bg-primary:   #0c0f10    --color-text-primary:   #f0f0f0
--color-bg-secondary: #141718    --color-text-secondary: #8a9199
--color-bg-tertiary:  #1c2022    --color-text-tertiary:  #7a8290
--color-bg-elevated:  #222628    --color-placeholder:    #a0a9b1
--color-accent:       #ff9b6a    --color-border:         #2a2f33
--color-accent-hover: #ff7a3d    --color-border-subtle:  #1e2225
```

### 2.2 Culori — temă LIGHT (`.light`)
```
--color-bg-primary:   #f4f5f7    --color-text-primary:   #111418
--color-bg-secondary: #ffffff    --color-text-secondary: #5c6370
--color-bg-tertiary:  #eef0f2    --color-border:         #e2e5e9
--color-accent:       #b84621    --color-accent-hover:   #a03d1a
```
Accentul se întunecă în light mode (#b84621) pentru a păstra contrastul AA pe fundal deschis.

### 2.3 Semantice & status (mapate pe `enum DeviceStatus`)
```
--color-success: #34d399   → FUNCTIONAL
--color-warning: #fbbf24   → IN_REPARATIE
--color-error:   #f87171   → DEFECT
--color-status-decommissioned: #6b7280 → CASAT
--color-status-loaned: #60a5fa → IMPRUMUTAT
--color-status-spare:  #a78bfa → REZERVA
--color-info:    #60a5fa
```
Fiecare are și o variantă `-bg` cu alpha 10% pentru fundaluri de alertă.

### 2.4 Tipografie
```
--font-family-base/heading: 'Plus Jakarta Sans', system-ui, sans-serif
--font-family-mono:         'Fira Code', 'JetBrains Mono', monospace
--font-size-display: 48px   --font-size-h1: 32px   --font-size-h2: 24px
--font-size-h3: 18px        --font-size-base: 15px --font-size-sm: 13px  --font-size-xs: 11px
weights: 400 / 500 / 600 / 700 / 800
```

### 2.5 Rază, umbre, glass, tranziții
```
--radius-sm:6  -md:10  -lg:14  -xl:20  -2xl:28  -full:9999
--shadow-xs … -xl  + glow accent/success/error
--glass-bg: rgba(20,23,24,0.7)  --glass-border: rgba(255,255,255,0.06)  --glass-blur: 20px
--transition-fast:0.15s  -normal:0.3s  -slow:0.5s  (ease-out)
```

---

## 3. Bibliotecă de componente

Componentele primitive sunt în `frontend/src/components/ui/` (Shadcn) + wrappere proprii în `frontend/src/components/`.

| Componentă | Locație | Note |
|---|---|---|
| Button | `ui/button.jsx` | variante: primary/secondary/destructive/ghost; stări focus+disabled prin token-uri |
| Input / Select | `ui/input.jsx`, `ui/select.jsx` | `aria-invalid`, `aria-describedby` pentru erori |
| Card | `ui/card.jsx` | suprafețe elevate |
| StatusBadge | `components/StatusBadge.jsx` | culoare după `DeviceStatus` |
| Alert / AlertsWidget | `components/Alert.jsx`, `AlertsWidget.jsx` | alerte mentenanță/expirare |
| DeleteConfirmDialog | `components/DeleteConfirmDialog.jsx` | confirmare ștergeri |
| DeviceTimeline | `components/DeviceTimeline.jsx` | istoric DM |
| ErrorBoundary | `components/ErrorBoundary.jsx` | captură erori UI |
| SkipLink | `components/SkipLink.jsx` | sari la conținut (a11y) |
| ProtectedRoute | `components/ProtectedRoute.jsx` | gating auth |

**Shadcn/UI** a fost integrat 2026-06-05 (componente în `ui/`). Adăugarea de componente noi: copiază din shadcn în `ui/`, adaptează la token-urile noastre (nu folosi culori hardcodate shadcn).

---

## 4. Accesibilitate — WCAG 2.1 AA

Cerințe obligatorii (verificate la fiecare PR):

- **Contrast** ≥ 4.5:1 text normal, ≥ 3:1 text mare/UI. Verificat numeric: ≈6:1 dark, ≈5:1 light — **trece**.
- **Tastatură:** toată funcționalitatea accesibilă fără mouse; ordine de tab logică; fără `tabIndex` negativ pe controale interactive.
- **Focus vizibil:** focus ring pe token `--color-accent` cu offset pe fundal.
- **ARIA:** `aria-invalid` + `aria-describedby` pe câmpuri cu eroare; `role="status"` pe loading; `aria-label` pe butoane-iconiță.
- **Semantic HTML:** heading-uri ierarhice, `<label>` asociat fiecărui input, landmark-uri.
- **SkipLink** la începutul paginii.
- **Touch targets** ≥ 44×44px pe mobil.

Checklist pre-commit: contrast OK · navigare doar tastatură OK · screen reader (NVDA) anunță corect · fără erori axe-core.

---

## 5. Light / Dark mode

- Comutare prin clasa `.light` pe rădăcină (hook `useTheme`, persistat în `localStorage` cheia `simdm_theme`).
- Doar token-urile de culoare se schimbă; structura, raza, tipografia rămân.
- Umbrele se atenuează în light mode; glass-ul își schimbă fundalul.
- La adăugarea unei culori noi: definește-o ȘI în `:root` ȘI în `.light`.

---

## 6. Responsive

| Breakpoint | Lățime | Uz |
|---|---|---|
| mobil | < 640px | flux pe teren (1 coloană, target-uri mari) |
| tabletă | 640–1024px | 2 coloane |
| desktop | > 1024px | tabel inventar complet, layout dens |

Pe mobil, inventarul poate comuta pe vizualizare card/Kanban. Vezi `MOBILE_WORKFLOW_GUIDE.md` (păstrat separat — flux de utilizare pe teren).

---

## 7. Testare design & a11y

```bash
# Contrast & axe (în frontend)
npm run test            # include teste RTL pe accesibilitate
# Manual: navigare doar tastatură (Tab/Shift+Tab/Enter/Esc/Arrows)
# Screen reader: NVDA (Windows)
```
Combinațiile de contrast cheie sunt validate numeric (text pe bg-primary/secondary/tertiary, accent pe bg, status colors). La modificarea unei culori, re-verifică contrastul perechilor afectate.

---

**Documente conexe:** [MOBILE_WORKFLOW_GUIDE.md](MOBILE_WORKFLOW_GUIDE.md) (flux teren) · [2-DEVELOPER-GUIDE.md](2-DEVELOPER-GUIDE.md) (frontend patterns).
