---
version: 1.0
name: SIMDM Design System
description: A warm-canvas editorial interface for SIMDM — Sistem Informațional de Management al Dispozitivelor Medicale. Tinted cream canvas with serif display headlines, warm coral CTAs, and dark navy product surfaces. Aligned with Claude.ai design language, adapted for medical device management.
---

colors:
  primary: "#cc785c"
  primary-active: "#a9583e"
  primary-disabled: "#e6dfd8"
  ink: "#141413"
  body: "#3d3d3a"
  body-strong: "#252523"
  muted: "#6c6a64"
  muted-soft: "#8e8b82"
  hairline: "#e6dfd8"
  hairline-soft: "#ebe6df"
  canvas: "#faf9f5"
  surface-soft: "#f5f0e8"
  surface-card: "#efe9de"
  surface-cream-strong: "#e8e0d2"
  surface-dark: "#181715"
  surface-dark-elevated: "#252320"
  surface-dark-soft: "#1f1e1b"
  on-primary: "#ffffff"
  on-dark: "#faf9f5"
  on-dark-soft: "#a09d96"
  accent-teal: "#5db8a6"
  accent-amber: "#e8a55a"
  success: "#5db872"
  success-bg: "rgba(93, 184, 114, 0.1)"
  warning: "#d4a017"
  warning-bg: "rgba(212, 160, 23, 0.1)"
  error: "#c64545"
  error-hover: "#a33838"
  error-bg: "rgba(198, 69, 69, 0.1)"
  info: "#5db8a6"
  info-bg: "rgba(93, 184, 166, 0.1)"
  status-functional: "#5db872"
  status-functional-bg: "rgba(93, 184, 114, 0.1)"
  status-in-repair: "#d4a017"
  status-in-repair-bg: "rgba(212, 160, 23, 0.1)"
  status-defect: "#c64545"
  status-defect-bg: "rgba(198, 69, 69, 0.1)"
  status-decommissioned: "#6b7280"
  status-decommissioned-bg: "rgba(107, 114, 128, 0.1)"
  status-loaned: "#5db8a6"
  status-loaned-bg: "rgba(93, 184, 166, 0.1)"
  status-spare: "#a78bfa"
  status-spare-bg: "rgba(167, 139, 250, 0.1)"
  healthcare-primary: "#0891B2"
  healthcare-primary-light: "#22D3EE"
  healthcare-success: "#059669"
  healthcare-success-light: "#10B981"
  healthcare-bg-primary: "#ECFEFF"
  healthcare-bg-secondary: "#F0F9FF"
  healthcare-text-primary: "#164E63"
  healthcare-text-secondary: "#0C4A6E"
  healthcare-border: "#A5F3FC"

typography:
  display-xl:
    fontFamily: "Copernicus, Tiempos Headline, 'Cormorant Garamond', serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.5px
  display-lg:
    fontFamily: "Copernicus, Tiempos Headline, 'Cormorant Garamond', serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1px
  display-md:
    fontFamily: "Copernicus, Tiempos Headline, 'Cormorant Garamond', serif"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-sm:
    fontFamily: "Copernicus, Tiempos Headline, 'Cormorant Garamond', serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.3px
  title-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.5px
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
    states:
      hover: backgroundColor "{colors.primary-active}"
      active: "scale(0.97)"
      focus: "box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.3)"
      disabled: backgroundColor "{colors.primary-disabled}", textColor "{colors.muted}"
      loading: "spinner inline, opacity 0.7"

  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
    border: "1px solid {colors.hairline}"
    states:
      hover: backgroundColor "{colors.surface-card}"
      focus: "box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.3)"
      disabled: textColor "{colors.muted}", opacity 0.5

  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
    states:
      hover: backgroundColor "{colors.error-hover}"
      focus: "box-shadow: 0 0 0 3px rgba(198, 69, 69, 0.3)"
      disabled: textColor "{colors.muted}", opacity 0.5

  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    states:
      hover: backgroundColor "{colors.surface-card}"

  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
    border: "1px solid {colors.hairline}"
    states:
      focus: "border-color: {colors.primary}", "box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.15)"
      error: "border-color: {colors.error}", "box-shadow: 0 0 0 3px rgba(198, 69, 69, 0.15)"
      disabled: opacity 0.5, cursor not-allowed

  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    states:
      hover: "box-shadow: 0 1px 3px rgba(20, 20, 19, 0.08)"

  product-mockup-card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px

  code-window-card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 24px

  status-badge-functional:
    backgroundColor: "{colors.status-functional-bg}"
    textColor: "{colors.status-functional}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "✓"
    label: "Funcțional"

  status-badge-in-repair:
    backgroundColor: "{colors.status-in-repair-bg}"
    textColor: "{colors.status-in-repair}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "⟳"
    label: "În reparație"

  status-badge-defect:
    backgroundColor: "{colors.status-defect-bg}"
    textColor: "{colors.status-defect}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "✗"
    label: "Defect"

  status-badge-decommissioned:
    backgroundColor: "{colors.status-decommissioned-bg}"
    textColor: "{colors.status-decommissioned}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "−"
    label: "Casat"

  status-badge-loaned:
    backgroundColor: "{colors.status-loaned-bg}"
    textColor: "{colors.status-loaned}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "→"
    label: "Împrumutat"

  status-badge-spare:
    backgroundColor: "{colors.status-spare-bg}"
    textColor: "{colors.status-spare}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    symbol: "◻"
    label: "Rezervă"

  badge-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px

  badge-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 12px

  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
    states:
      active: backgroundColor "{colors.surface-card}", textColor "{colors.ink}"

  toast:
    rounded: "{rounded.lg}"
    padding: 16px 20px
    typography: "{typography.body-sm}"
    variants:
      success: backgroundColor "{colors.success-bg}", borderLeft "3px solid {colors.success}"
      error: backgroundColor "{colors.error-bg}", borderLeft "3px solid {colors.error}"
      warning: backgroundColor "{colors.warning-bg}", borderLeft "3px solid {colors.warning}"
      info: backgroundColor "{colors.info-bg}", borderLeft "3px solid {colors.info}"
    animation: "slide-in from right, 0.3s ease-out"
    position: "bottom-right desktop, top-center mobile"
    autoDismiss: "success/info 3s, warning 5s, error manual"

  modal:
    overlay: "rgba(0, 0, 0, 0.5)"
    content:
      backgroundColor: "{colors.surface-card}"
      rounded: "{rounded.lg}"
      padding: 32px
      maxWidth: "480px"
    animation: "fade overlay + scale content, 0.2s ease-out"

  table:
    header:
      backgroundColor: "{colors.surface-soft}"
      typography: "{typography.caption-uppercase}"
      textColor: "{colors.muted}"
    row:
      backgroundColor: "{colors.canvas}"
      borderBottom: "1px solid {colors.hairline}"
    row-alt:
      backgroundColor: "{colors.surface-card}"
    row-hover:
      backgroundColor: "{colors.surface-soft}"

  skeleton:
    backgroundColor: "{colors.surface-card}"
    borderRadius: "{rounded.md}"
    animation: "shimmer 1.5s infinite, linear gradient on cream-bg"

  empty-state:
    icon: "illustration or lucide icon"
    typography: "{typography.title-md}"
    textColor: "{colors.muted}"
    action: "{component.button-primary}"

  error-state:
    icon: "AlertTriangle"
    typography: "{typography.title-md}"
    textColor: "{colors.error}"
    action: "{component.button-primary}"

  top-nav:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
    border: "1px solid {colors.hairline}"

  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px

  callout-card-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 48px

---

## Overview

SIMDM is a warm, editorial interface for medical device management. The base atmosphere is a **tinted cream canvas** (`{colors.canvas}` — #faf9f5) — distinctly warm, deliberately not the cool gray-white that most SaaS products use. Headlines run a **slab-serif display** ("Copernicus" / Tiempos Headline / Cormorant Garamond fallback) at weight 400 with negative letter-spacing, paired with **Inter** humanist body sans. The combination feels like a medical publication, not a tech dashboard.

Brand voltage comes from the **cream + coral pairing** — coral (`{colors.primary}` — #cc785c) is the signature accent, used on primary CTAs, active states, and full-bleed callout cards. The coral is warm, slightly muted, never cyan/blue — a deliberate counter-positioning against typical cool-toned medical software.

The system has three surface modes that alternate page-by-page:
1. **Cream canvas** (`{colors.canvas}`) — default body floor
2. **Light cream cards** (`{colors.surface-card}`) — feature card backgrounds
3. **Dark navy product surfaces** (`{colors.surface-dark}`) — code editors, form previews, terminal mockups, footer

The dark surfaces are where SIMDM shows its product chrome — code blocks, PDF form previews, maintenance checklists, device detail panels. The cream-to-dark contrast is the page's pacing rhythm.

**Key Characteristics:**
- Warm cream canvas (`{colors.canvas}` — #faf9f5) with dark warm-ink text (`{colors.ink}` — #141413). The brand's defining color choice.
- Coral primary CTA (`{colors.primary}` — #cc785c). Used on individual primary buttons and full-bleed coral callout cards.
- Slab-serif display headlines via Copernicus / Tiempos Headline at weight 400 with negative letter-spacing. Pairs with humanist sans body for a literary editorial voice.
- Dark navy product mockup cards (`{colors.surface-dark}` — #181715) carrying code blocks, form previews, device comparison data — the brand shows the product chrome at scale rather than abstract illustrations.
- Light cream feature cards (`{colors.surface-card}` — #efe9de) — slightly darker than canvas, used for content-driven feature explanations.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for content cards, `{rounded.xl}` (16px) for hero containers, `{rounded.pill}` for badges.
- Section rhythm `{spacing.section}` (96px) — generous editorial spacing. Internal card padding stays generous at `{spacing.xl}` (32px).

---

## 1. Visual Theme & Atmosphere

### Mood
Professional, warm, trustworthy. This is a **medical** application — every design decision communicates reliability and care. The editorial feel (serif headlines, cream canvas, generous whitespace) distinguishes SIMDM from typical SaaS dashboards. Users are bioingineri medicali — professionals who value precision and clarity.

### Canvas
The default page floor is `{colors.canvas}` (#faf9f5) — a tinted cream that is warm and deliberately not pure white. Pure white reads as "any other tool"; the warm tint is the brand differentiator. Every page anchors on this canvas.

### Pacing
The visual rhythm alternates between surface modes:
```
cream canvas → cream-card → dark-mockup → cream → coral-callout → dark-footer
```
Never repeat the same surface mode in two consecutive bands. The alternation creates visual interest and signals content hierarchy.

### Brand Voltage
The cream + coral pairing is the brand's signature. Coral (`{colors.primary}` — #cc785c) appears:
- **Scarce** on individual elements (primary CTA buttons, active tab indicators, focus rings)
- **Generous** on full-bleed callout cards (`{component.callout-card-coral}`)

Never use coral as a background for large non-CTA surfaces. The restraint makes the coral moments impactful.

### Dark Surfaces
Dark navy surfaces (`{colors.surface-dark}` — #181715) appear only for product chrome:
- Code editor mockups and terminal panels
- PDF form previews (Formular Nr. 5/6/8/9)
- Maintenance checklist displays
- Footer

The dark surface IS the product-chrome signal. It shows "this is the actual tool" rather than marketing copy about the tool.

---

## 2. Color Palette & Roles

### Brand & Accent
- **Coral / Primary** (`{colors.primary}` — #cc785c): The signature warm coral. Used on every primary CTA background, on full-bleed coral callout cards, on the brand accent moments.
- **Coral Active** (`{colors.primary-active}` — #a9583e): The press / hover-darker variant.
- **Coral Disabled** (`{colors.primary-disabled}` — #e6dfd8): A desaturated cream-tinted disabled state.
- **Accent Teal** (`{colors.accent-teal}` — #5db8a6): Used on secondary product surfaces (status indicators, "active connection" dots).
- **Accent Amber** (`{colors.accent-amber}` — #e8a55a): A small companion warm-tone used on category badges and inline highlights.

### Surface
- **Canvas** (`{colors.canvas}` — #faf9f5): The default page floor. Tinted cream — warm, deliberately not pure white.
- **Surface Soft** (`{colors.surface-soft}` — #f5f0e8): Section dividers, very-soft band backgrounds, table headers.
- **Surface Card** (`{colors.surface-card}` — #efe9de): Feature cards, content cards, table alt-rows, badge-pill backgrounds. One step darker than canvas.
- **Surface Cream Strong** (`{colors.surface-cream-strong}` — #e8e0d2): A strongest-cream variant used on selected category tabs and emphasized section bands.
- **Surface Dark** (`{colors.surface-dark}` — #181715): Code editor mockups, product showcase cards, footer. The dominant dark surface.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #252320): Elevated cards inside dark bands (settings panels in mockups).
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #1f1e1b): Slightly lighter dark, used for code block backgrounds inside larger dark cards.
- **Hairline** (`{colors.hairline}` — #e6dfd8): The 1px border tone on cream surfaces. Borders feel like one elevation step rather than ink lines.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebe6df): Barely-visible divider used inside the same band.

### Text
- **Ink** (`{colors.ink}` — #141413): All headlines and primary text. Warm dark, slightly off-pure-black.
- **Body Strong** (`{colors.body-strong}` — #252523): Emphasized paragraphs, lead text.
- **Body** (`{colors.body}` — #3d3d3a): Default running-text color.
- **Muted** (`{colors.muted}` — #6c6a64): Sub-headings, breadcrumbs, footer-adjacent secondary text, disabled text.
- **Muted Soft** (`{colors.muted-soft}` — #8e8b82): Captions, fine-print, copyright lines, placeholder text.
- **On Primary** (`{colors.on-primary}` — #ffffff): Text on coral buttons.
- **On Dark** (`{colors.on-dark}` — #faf9f5): Cream-tinted white used on dark surfaces (echoes the canvas tone).
- **On Dark Soft** (`{colors.on-dark-soft}` — #a09d96): Footer body text, secondary labels in dark mockups.

### Semantic
- **Success** (`{colors.success}` — #5db872): Green status dots, "available" indicators, FUNCTIONAL status.
- **Warning** (`{colors.warning}` — #d4a017): Warning callouts, IN_REPARATIE status.
- **Error** (`{colors.error}` — #c64545): Validation errors, DEFECT status, destructive actions.
- **Info** (`{colors.info}` — #5db8a6): Informational callouts, IMPRUMUTAT status.
- Each semantic color has a `-bg` variant at alpha 10% for background fills.

### Device Status Colors (Medical)
These 6 statuses map to the `DeviceStatus` enum in the database:
| Status | Color | Bg Alpha | Symbol | Label |
|--------|-------|----------|--------|-------|
| FUNCTIONAL | `#5db872` | 10% | ✓ | Funcțional |
| IN_REPARATIE | `#d4a017` | 10% | ⟳ | În reparație |
| DEFECT | `#c64545` | 10% | ✗ | Defect |
| CASAT | `#6b7280` | 10% | − | Casat |
| IMPRUMUTAT | `#5db8a6` | 10% | → | Împrumutat |
| REZERVA | `#a78bfa` | 10% | ◻ | Rezervă |

### Healthcare Palette
Additional colors for medical context (maintenance forms, clinical data):
- **Healthcare Primary** (`#0891B2`): Cyan calm for medical trust
- **Healthcare Success** (`#059669`): Green health for positive actions
- **Healthcare BG Primary** (`#ECFEFF`): Very light cyan background
- **Healthcare Text Primary** (`#164E63`): Dark cyan for maximum contrast

---

## 3. Typography Rules

### Font Family
The system runs **Copernicus** (or **Tiempos Headline** / **Cormorant Garamond** as substitutes) as the slab-serif display face for headlines, and **Inter** as the humanist sans for body, navigation, and UI labels. **JetBrains Mono** handles code blocks.

The display/body split is editorial:
- Copernicus serif (weight 400, negative tracking) → h1, h2, h3, hero display
- Inter sans (weight 400-500) → body, navigation, buttons, captions, labels
- JetBrains Mono → all code blocks and terminal text

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 400 | 1.05 | -1.5px | Homepage h1 — Copernicus serif |
| `{typography.display-lg}` | 48px | 400 | 1.1 | -1px | Section heads — Copernicus |
| `{typography.display-md}` | 36px | 400 | 1.15 | -0.5px | Sub-section heads — Copernicus |
| `{typography.display-sm}` | 28px | 400 | 1.2 | -0.3px | Pricing tier names, callout headlines — Copernicus |
| `{typography.title-lg}` | 22px | 500 | 1.3 | 0 | Plan size labels — Inter |
| `{typography.title-md}` | 18px | 500 | 1.4 | 0 | Feature card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | Connector tile titles, list labels |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text — Inter |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.caption-uppercase}` | 12px | 500 | 1.4 | 1.5px | Category tags, table headers |
| `{typography.code}` | 14px | 400 | 1.6 | 0 | Code blocks — JetBrains Mono |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Display sizes use weight 400 (regular), **never bold**. Negative letter-spacing (-0.3px to -1.5px) is essential — Copernicus without it reads as off-brand. The serif character is what gives SIMDM its literary, considered voice; switching to a sans-serif display would make it feel like every other medical tool.

Body type stays at weight 400 for paragraphs, weight 500 for labels and emphasized phrases. The sans body is humanist (Inter) — never geometric.

### Fluid Typography
Display sizes use `clamp()` for responsive scaling:
```css
--font-size-display-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);   /* 32px → 64px */
--font-size-display-lg: clamp(1.75rem, 1.25rem + 2vw, 3rem);  /* 28px → 48px */
--font-size-display-md: clamp(1.5rem, 1rem + 1.5vw, 2.25rem); /* 24px → 36px */
--font-size-display-sm: clamp(1.25rem, 1rem + 1vw, 1.75rem);  /* 20px → 28px */
```

### Note on Font Substitutes
If Copernicus / Tiempos Headline is unavailable, **Cormorant Garamond** at weight 500 with -0.02em letter-spacing is the closest open-source approximation. **EB Garamond** is a fallback. For Inter, the font is available on Google Fonts and should be loaded with `font-display: swap`.

---

## 4. Component Stylings

### Buttons

**`button-primary`** — The signature coral CTA. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), type `{typography.button}` (Inter 14px / 500), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px).
- Hover: darken to `{colors.primary-active}` (#a9583e)
- Active: `scale(0.97)` transform
- Focus: 3px coral ring at 30% opacity
- Disabled: `{colors.primary-disabled}` background, `{colors.muted}` text
- Loading: inline spinner, opacity 0.7

**`button-secondary`** — Cream button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border in `{colors.hairline}`, same padding + height + radius as primary.
- Hover: background shifts to `{colors.surface-card}`
- Focus: 3px coral ring
- Disabled: `{colors.muted}` text, opacity 0.5

**`button-danger`** — Destructive action button. Background `{colors.error}`, text white.
- Hover: darken to `{colors.error-hover}`
- Focus: 3px error ring
- Disabled: `{colors.muted}` text, opacity 0.5

**`button-ghost`** — No background, no border. Text `{colors.ink}`.
- Hover: background `{colors.surface-card}`

### Inputs

**`text-input`** — Standard text input. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border in `{colors.hairline}`.
- Focus: border shifts to `{colors.primary}`, 3px coral ring at 15% opacity
- Error: border shifts to `{colors.error}`, 3px error ring at 15% opacity
- Disabled: opacity 0.5, cursor not-allowed

### Cards

**`feature-card`** — Used in feature grids. Background `{colors.surface-card}` (#efe9de), rounded `{rounded.lg}` (12px), internal padding `{spacing.xl}` (32px). Carries a small icon at top, a `{typography.title-md}` headline, and a body description in `{typography.body-md}`.
- Hover: subtle shadow `0 1px 3px rgba(20, 20, 19, 0.08)`

**`product-mockup-card-dark`** — Dark navy card showing actual SIMDM product chrome (form previews, code, maintenance checklists). Background `{colors.surface-dark}`, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Carries text labels in `{colors.on-dark}`.

**`code-window-card`** — Specialized dark card showing code or terminal output. Background `{colors.surface-dark}`, `{colors.surface-dark-soft}` for inner code block, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px).

### Status Badges

6 status badges for medical device states, each with `{rounded.pill}`, caption typography, colored bg at 10% alpha:
- **FUNCTIONAL**: green `#5db872`, symbol ✓
- **IN_REPARATIE**: amber `#d4a017`, symbol ⟳
- **DEFECT**: red `#c64545`, symbol ✗
- **CASAT**: gray `#6b7280`, symbol −
- **IMPRUMUTAT**: teal `#5db8a6`, symbol →
- **REZERVA**: purple `#a78bfa`, symbol ◻

### Badges

**`badge-pill`** — Small pill label. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

**`badge-coral`** — Coral-fill badge for "NEW", "BETA", featured highlights. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.caption-uppercase}` (12px / 500 / 1.5px tracking), rounded `{rounded.pill}`, padding 4px × 12px.

### Tabs

**`category-tab`** + **`category-tab-active`** — Used in sub-nav rows. Inactive: transparent background, `{colors.muted}` text. Active: `{colors.surface-card}` background, `{colors.ink}` text. Padding 8px × 14px, rounded `{rounded.md}`.

### Table

- **Header**: `{colors.surface-soft}` background, `{typography.caption-uppercase}` typography, `{colors.muted}` text
- **Row**: `{colors.canvas}` background, 1px `{colors.hairline}` bottom border
- **Alt Row**: `{colors.surface-card}` background
- **Row Hover**: `{colors.surface-soft}` background

### Toast

Notification system with 4 variants:
- **Success**: `{colors.success-bg}` bg, 3px left border `{colors.success}`, auto-dismiss 3s
- **Error**: `{colors.error-bg}` bg, 3px left border `{colors.error}`, manual dismiss
- **Warning**: `{colors.warning-bg}` bg, 3px left border `{colors.warning}`, auto-dismiss 5s
- **Info**: `{colors.info-bg}` bg, 3px left border `{colors.info}`, auto-dismiss 3s

Position: bottom-right desktop, top-center mobile. Animation: slide-in from right, 0.3s ease-out. Max 3 visible, rest in queue.

### Modal

- **Overlay**: `rgba(0, 0, 0, 0.5)` with fade animation
- **Content**: `{colors.surface-card}` background, `{rounded.lg}` (12px), padding 32px, max-width 480px
- **Animation**: fade overlay + scale content, 0.2s ease-out
- **Close**: X button top-right, Escape key support

### Skeleton

Loading placeholder with animated shimmer effect. Background `{colors.surface-card}` with `{rounded.md}`. Animation: linear gradient shimmer on cream-bg, 1.5s infinite. Used instead of spinners for all loading states.

### Empty State

Placeholder when a page has no data. Contains:
- Illustration or lucide icon (muted color)
- Title in `{typography.title-md}`
- Description in `{typography.body-md}`, muted text
- Action button (`{component.button-primary}`)

### Error State

Placeholder when data loading fails. Contains:
- AlertTriangle icon in `{colors.error}`
- Title in `{typography.title-md}`, error color
- Retry button (`{component.button-primary}`)

### Navigation

**`top-nav`** — Cream card bar pinned to the top. 64px tall, `{colors.surface-card}` background with `{colors.hairline}` border. Carries the SIMDM wordmark at left, primary horizontal menu center-left, right-side cluster with theme toggle and coral CTA button.

**`footer`** — Dark navy footer that closes every page. Background `{colors.surface-dark}`, text `{colors.on-dark-soft}`. 4-column link list at desktop. Vertical padding 64px.

### Callout Cards

**`callout-card-coral`** — Full-bleed coral card for major CTAs. Background `{colors.primary}`, text `{colors.on-primary}`, rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). The coral surface IS the voltage.

**`cta-band-dark`** — Alternative pre-footer band. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding 64px.

---

## 5. Layout Principles

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) — modern-SaaS rhythm.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards; `{spacing.lg}` (24px) for code-window cards and tiles.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) inside coral callout cards; 64px inside the larger dark CTA band.

### Grid & Container
- **Max content width:** ~1200px centered.
- **Editorial body:** Single 12-column grid; hero often uses 6/6 split (h1 left, illustration right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Table grids:** Full-width with horizontal scroll on mobile.

### Whitespace Philosophy
The cream canvas + serif display + generous internal padding create an editorial pacing — SIMDM reads like a long-form medical publication rather than a SaaS template. Whitespace between bands stays uniform at 96px; whitespace inside cards is generous (32px), letting type breathe.

### Print Layout
```css
@media print {
  body { background: white; color: black; }
  nav, sidebar, .no-print { display: none !important; }
  h1, h2, h3 { color: black; break-after: avoid; }
  table { font-size: 10pt; border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 0.5rem; }
  button { display: none !important; }
}
```

---

## 6. Depth & Elevation

### Philosophy
**Color-block first, shadow rare.** Most depth comes from the cream-vs-dark surface contrast. Shadows are minimal — used only for hover-elevated states.

### Elevation Levels

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, sub-nav, occasionally on cards |
| Cream card | `{colors.surface-card}` background — no shadow | Feature cards, content cards |
| Dark surface card | `{colors.surface-dark}` background — no shadow | Code editor mockups, product showcase cards |
| Subtle drop shadow | `0 1px 3px rgba(20, 20, 19, 0.08)` | Hover-elevated states only, rare |

### Hairline System
- `{colors.hairline}` (#e6dfd8) — primary border on cream surfaces
- `{colors.hairline-soft}` (#ebe6df) — barely-visible divider inside same band
- The hairline is the same hex as `{colors.primary-disabled}` — borders feel like one elevation step rather than ink lines

### Decorative Depth
- Code editor mockups carry their own internal depth: syntax-highlighted text, line numbers, status bars
- Some hero illustrations use simple line-art with coral and dark-navy strokes on cream — minimal, hand-drawn-feeling, never photorealistic

---

## 7. Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved for badge accents and tiny dropdowns |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards (feature, pricing, code-window) |
| `{rounded.xl}` | 16px | Hero illustration container, larger components |
| `{rounded.pill}` | 9999px | Badge pills, "NEW" tags, status badges |
| `{rounded.full}` | 50% | Avatar substitutes, icon buttons |

### Photography & Illustrations
SIMDM rarely uses photography. Instead it uses:
- Simple line-art illustrations with coral + dark-navy strokes on cream
- Code/form editor mockups (the dominant "hero" treatment)
- Device status visualizations
- Maintenance timeline graphics

When photography is used (rare — mostly device photos), avatars crop to perfect circles at 40px diameter.

---

## 8. Do's and Don'ts

### Do
- Anchor every page on the cream canvas. Pure white reads as "any other tool"; the warm tint is the brand differentiator.
- Use Copernicus serif for every display headline. Pair with Inter sans body. Negative letter-spacing on display sizes is non-negotiable.
- Reserve `{colors.primary}` (coral) for primary CTAs and full-bleed `{component.callout-card-coral}` moments. Don't paint accent moments coral elsewhere.
- Use `{component.product-mockup-card-dark}` and `{component.code-window-card}` to show actual SIMDM product chrome. Don't paint marketing illustrations when you can show real forms.
- Pair `{component.feature-card}` (cream) with `{component.product-mockup-card-dark}` (navy) in alternating bands. The cream-to-dark rhythm is the brand's pacing mechanism.
- Apply `{spacing.section}` (96px) between major bands.
- Respect `prefers-reduced-motion` — disable all animations when the user requests it.
- Use skeleton screens instead of spinners for loading states.
- Provide empty states for every page that can have zero data.

### Don't
- Don't use cool grays or pure white for canvas. Cream is the brand.
- Don't bold serif display weight. Copernicus at 700 reads as bombastic; the system stays at 400.
- Don't use cool blue or saturated cyan as a brand accent. The coral is the brand voltage.
- Don't put coral everywhere. The coral is scarce on individual elements and generous only on full-bleed coral callout cards.
- Don't use Inter for display headlines. The serif character is the brand voice.
- Don't repeat the same surface mode in two consecutive bands. The pacing alternates.
- Don't add hover state styling beyond what the system already encodes — primary darkens on press; nothing else changes.
- Don't use spinners — use skeleton screens.
- Don't show "Se încarcă..." text with no visual context.

---

## 9. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; hero-illustration-card stacks below content; feature grids 1-up; pricing 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; feature cards 2-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up feature cards; 3-up pricing tiers |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` at minimum 40 × 40px.
- `{component.text-input}` height is 40px.
- Cards with entire card area as tappable; effective tap area >> 44px.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen cream sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — h1 + sub-head + buttons first, then the illustration / mockup card below.
- Feature grids reduce columns rather than scaling cards down.
- Code-window cards retain code legibility at every breakpoint by allowing horizontal scroll within the card rather than wrapping code lines.

### Image Behavior
- Code blocks inside dark mockups stay at fixed font-size; horizontal scroll on mobile rather than wrapping.
- Hero illustrations scale proportionally; line-art strokes thin slightly on mobile.
- Avatar photos in testimonials crop to circles at every breakpoint.

---

## 10. Agent Prompt Guide

Before writing or changing any UI in this project, read `DESIGN.md` at the root. Match the tokens, type scale, spacing, and component patterns defined there. Treat it as the source of truth for visual decisions.

### Quick Color Reference
```
Primary/CTA:    #cc785c (coral)       Canvas:        #faf9f5 (cream)
Surface card:   #efe9de               Surface dark:  #181715
Ink/text:       #141413               Muted:         #6c6a64
Hairline:       #e6dfd8               Hairline soft: #ebe6df
Success:        #5db872               Warning:       #d4a017
Error:          #c64545               Info/Teal:     #5db8a6
```

### Typography Quick Reference
```
Display:  Copernicus/Tiempos serif, weight 400, negative tracking
Body:     Inter sans, weight 400-500
Code:     JetBrains Mono
```

### Spacing Quick Reference
```
Section: 96px    Card padding: 32px    Gap: 24px
Stack: 16px      Inline: 12px          Tight: 8px
```

### Ready-to-Use Prompt
```
Using the SIMDM design system in DESIGN.md, build [PAGE NAME]:
- Cream canvas (#faf9f5) background
- Coral (#cc785c) primary CTA buttons
- Serif display headlines (Copernicus, weight 400)
- Inter body text (weight 400-500)
- Feature cards on #efe9de with 12px radius
- Dark product chrome on #181715 for code/forms
- 96px section spacing, 32px card padding
- Skeleton loading states (no spinners)
- Empty states for zero-data pages
- WCAG 2.1 AA contrast on all text
```

---

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.feature-card}`, `{component.code-window-card}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay Copernicus serif 400 with negative tracking. Body stays Inter 400. The split is unbreakable.
6. Cream + coral + dark navy is the trinity. Don't introduce a fourth surface tone (no purple cards, no green sections).
7. When in doubt about emphasis: bigger Copernicus serif before bolder weight.

---

## Known Gaps

- Copernicus and Tiempos Headline are licensed typefaces and not available as public web fonts. Substitutes (Cormorant Garamond / EB Garamond for serif; Inter for sans) are documented in the typography section.
- Animation and transition timings (page transitions, skeleton shimmer, toast slide-in) are described in prose but not formalized as design tokens — a future improvement.
- Form validation states beyond error border are not fully extracted — a complete form validation UX pass would be needed.
- The actual SIMDM product surface (device forms, maintenance checklists) shares some tokens with the marketing site but adds many product-specific components (chat-like timeline, signature canvas, PDF previews) that are out of scope for this marketing-surface document.
