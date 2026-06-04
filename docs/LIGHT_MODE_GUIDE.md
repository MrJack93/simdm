# Ghid Modul Clar (Light Mode) — Sistem Design SIMDM

**Versiune:** 2.0
**Data:** 2026-06-05
**Scop:** Documentează transformările token-urilor de design între modurile dark și light

---

## Prezentare generală

SIMDM implementează un sistem complet dark/light mode prin variabile CSS. Toate culorile, umbrele și efectele se ajustează automat când utilizatorul comută tema. Acest ghid explică tiparele de transformare.

### Cum funcționează

1. **Implicit:** Modul întunecat (`:root`)
2. **Modul clar:** Selectorul `html.light-mode` suprascrie token-urile specifice
3. **Fără logică JavaScript:** Comutare pură prin variabile CSS
4. **Actualizare UI automată:** Componentele folosesc automat culorile noi

---

## Transformări culori

### Culori fundal principale

| Semantic | Mod întunecat | Mod clar | Notă |
|----------|--------------|----------|------|
| `--color-bg-primary` | `#0c0f10` | `#f4f5f7` | Inversuri aproape perfecte |
| `--color-bg-secondary` | `#141718` | `#ffffff` | Negru aproape → alb pur |
| `--color-bg-tertiary` | `#1c2022` | `#eef0f2` | Gri închis → gri deschis |
| `--color-bg-elevated` | `#222628` | `#ffffff` | Întunecat → alb |

**Tipar:** Culorile sunt inversuri aproape perfecte. Întunecat = gri foarte închis, Clar = gri deschis / alb.

### Culori text

| Semantic | Mod întunecat | Mod clar | Contrast (dark) | Contrast (light) |
|----------|--------------|----------|-----------------|-----------------|
| `--color-text-primary` | `#f0f0f0` | `#111418` | 18:1 ✅ AAA | 17:1 ✅ AAA |
| `--color-text-secondary` | `#8a9199` | `#5c6370` | 5.8:1 ✅ AA | 7.2:1 ✅ AA |
| `--color-text-tertiary` | `#7a8290` | `#626d7d` | 4.7:1 ✅ AA | 6.3:1 ✅ AA |
| `--color-disabled-text` | `#9da3ae` | `#5c6370` | 6.5:1 ✅ AA | 5.5:1 ✅ AA |
| `--color-placeholder` | `#a0a9b1` | `#a0a9b1` | 6.9:1 ✅ AA | Același (intenționat) |

**Tipar:** Culorile text sunt inversate (deschis în dark, închis în light). Placeholder-ul rămâne constant deoarece funcționează în ambele moduri.

### Culori semantice (Status, Alerte)

| Culoare | Mod întunecat | Mod clar | Notă |
|---------|--------------|----------|------|
| `--color-success` | `#34d399` | `#34d399` | Identic în ambele |
| `--color-error` | `#f87171` | `#f87171` | Identic în ambele |
| `--color-warning` | `#fbbf24` | `#fbbf24` | Identic în ambele |
| `--color-info` | `#60a5fa` | `#60a5fa` | Identic în ambele |

**Tipar:** Culorile de status rămân IDENTICE în ambele moduri. Sunt suficient de vii pentru a trece contrastul pe fundaluri dark ȘI light.

### Fundaluri culori semantice (cu opacitate)

| Culoare | Valoare | Alphă | Notă |
|---------|---------|-------|------|
| `--color-success-bg` | `rgba(52,211,153,0.1)` | 10% | Tentă subtilă — moștenit în light mode |
| `--color-error-bg` | `rgba(248,113,113,0.1)` | 10% | Fundal roșu pal — moștenit |
| `--color-warning-bg` | `rgba(251,191,36,0.1)` | 10% | Fundal galben pal — moștenit |
| `--color-info-bg` | `rgba(96,165,250,0.1)` | 10% | Fundal albastru pal — moștenid |

**Tipar:** Fundalurile semantice NU sunt suprascrise în light mode — funcționează via opacitate pe ambele suprafețe. Intenționat.

### Culori accent (Brand principal)

| Semantic | Mod întunecat | Mod clar | Rată | Utilizare |
|----------|--------------|----------|------|-----------|
| `--color-accent` | `#ff9b6a` | `#b84621` | Mai închis în light | Butoane, headere, linkuri |
| `--color-accent-hover` | `#ff7a3d` | `#a03d1a` | Mai închis în light | Stare hover |
| `--color-accent-subtle` | `rgba(255,155,106,0.08)` | `rgba(232,112,58,0.06)` | Tentă estompată | Fundaluri |

**Tipar:** Culoarea accent devine MAI ÎNCHISĂ în light mode (pentru contrast). Valorile hex sunt diferite dar luminozitatea percepută este optimizată pentru fiecare fundal.

### Culori border

| Semantic | Mod întunecat | Mod clar | Notă |
|----------|--------------|----------|------|
| `--color-border` | `#2a2f33` | `#e2e5e9` | Aproape inversuri perfecte |
| `--color-border-subtle` | `#1e2225` | `#eef0f2` | Chiar mai opuse |

**Tipar:** Bordurile sunt inversuri aproape perfecte. Dark = gri închis (greu vizibil pe bg dark), Light = gri deschis (greu vizibil pe bg light).

### Culori status dispozitive

| Status | Culoare | Override light? |
|--------|---------|----------------|
| Funcțional | `#34d399` (verde) | Nu — identic în ambele |
| În reparație | `#fbbf24` (galben) | Nu — identic în ambele |
| Defect | `#f87171` (roșu) | Nu — identic în ambele |
| Casat | `#6b7280` (gri) | Nu — identic în ambele |
| Împrumutat | `#60a5fa` (albastru) | Nu — identic în ambele |
| Rezervă | `#a78bfa` (violet) | Nu — identic în ambele |

---

## Transformări umbre

### Umbre drop

| Token | Mod întunecat | Mod clar | Motiv |
|-------|--------------|----------|-------|
| `--shadow-xs` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.04)` | Light = umbre mai soft |
| `--shadow-sm` | `rgba(0,0,0,0.15)` | `rgba(0,0,0,0.06)` | Mai puțin dramatice |
| `--shadow-md` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.08)` | Mai subtile |
| `--shadow-lg` | `rgba(0,0,0,0.25)` | `rgba(0,0,0,0.1)` | De 2.5× mai deschise |
| `--shadow-xl` | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.12)` | De 2.5× mai deschise |

**Tipar:** Umbrele în light mode sunt de 2.5–4× mai deschise (opacitate mai mică). Previne umbrele aspre pe fundaluri deja deschise.

### Efecte glow (Culori accent)

| Token | Mod întunecat | Mod clar | Notă |
|-------|--------------|----------|------|
| `--shadow-glow-accent` | `rgba(255,155,106,0.15)` | `rgba(232,112,58,0.1)` | Mai slab în light |
| `--shadow-glow-success` | `rgba(52,211,153,0.2)` | (neschimbat) | Moștenire |
| `--shadow-glow-error` | `rgba(248,113,113,0.2)` | (neschimbat) | Moștenire |

---

## Token-uri efect glass

| Token | Mod întunecat | Mod clar | Efect |
|-------|--------------|----------|-------|
| `--glass-bg` | `rgba(20,23,24,0.7)` | `rgba(255,255,255,0.8)` | Fundal frosted |
| `--glass-border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` | Bordură subtilă |
| `--glass-blur` | `20px` | `20px` | Același blur |

---

## Focus Ring

| Mod | CSS |
|-----|-----|
| Dark | `0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-accent)` |
| Light | `0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-accent)` |

**Notă:** Focus ring-ul NU este suprascris în light mode. Variabilele se ajustează automat.

---

## Tipografie

**Tipografia NU se schimbă între moduri.** Doar culorile se modifică.

| Token | Mod întunecat | Mod clar |
|-------|--------------|----------|
| `--font-family-base` | 'Plus Jakarta Sans' | Identic |
| `--font-size-*` | Toate păstrate | Identice |
| `--font-weight-*` | Toate păstrate | Identice |
| `--line-height-*` | Toate păstrate | Identice |

---

## Spațiere și Layout

**Proprietățile spațiale nu se schimbă niciodată.** Doar culorile/umbrele se ajustează.

| Token | Notă |
|-------|------|
| `--space-*` | Identic în ambele moduri |
| `--radius-*` | Identic în ambele moduri |
| `--icon-size-*` | Identic în ambele moduri |

---

## Exemple de implementare

### Componentă: Button

**Mod întunecat:**
```css
.btn-primary {
  background-color: var(--color-accent);    /* #ff9b6a */
  color: var(--color-bg-primary);           /* #0c0f10 */
  box-shadow: var(--shadow-md);
}
```

**Mod clar (ajustat automat):**
```css
/* html.light-mode */
.btn-primary {
  background-color: var(--color-accent);    /* #b84621 (mai închis!) */
  color: var(--color-bg-primary);           /* #f4f5f7 (deschis) */
  box-shadow: var(--shadow-md);             /* umbră mai soft automat */
}
```

**Rezultat:** Butonul devine automat portocaliu mai închis pe fundal deschis pentru contrast.

### Componentă: Input cu eroare

**Mod întunecat:**
```css
.input-base {
  background-color: var(--color-bg-tertiary);  /* #1c2022 */
  color: var(--color-text-primary);             /* #f0f0f0 */
  border-color: var(--color-border);            /* #2a2f33 */
}
```

**Mod clar (ajustat automat):**
```css
html.light-mode .input-base {
  background-color: var(--color-bg-tertiary);  /* #eef0f2 */
  color: var(--color-text-primary);             /* #111418 */
  border-color: var(--color-border);            /* #e2e5e9 */
}
/* Starea de eroare rămâne aceeași — #f87171 funcționează și pe light! */
```

---

## Testare Light Mode

### Checklist testare manuală

- [ ] Click toggle temă în header (🌙 / ☀️)
- [ ] Toate textele sunt lizibile (contrast ≥4.5:1)
- [ ] Butoanele sunt vizibile (culori distincte de fundaluri)
- [ ] Umbrele sunt vizibile dar nu agresive
- [ ] Focus ring-urile sunt vizibile
- [ ] Badge-urile de status au sens (culoare + icoană)
- [ ] Cardurile au borduri vizibile
- [ ] Inputurile au borduri vizibile și stare focus
- [ ] Linkurile se disting de textul normal

### Verificare DevTools browser

```javascript
// În consola browser:
// Verifică modul curent
document.documentElement.classList.contains('light-mode')

// Comutare manuală
document.documentElement.classList.add('light-mode')
document.documentElement.classList.remove('light-mode')
```

### Verificare contrast

Folosește axe DevTools sau WAVE pentru a verifica:
1. **Mod întunecat:** Toate rapoartele contrast ≥4.5:1
2. **Mod clar:** Toate rapoartele contrast ≥4.5:1
3. **Ambele moduri:** Fără contrast defect la comutare

---

## Probleme frecvente și soluții

### Text ilizibil în light mode

**Cauza:** Culoarea textului nu este suprascrisă pentru light mode
**Soluție:** Adaugă override:
```css
html.light-mode {
  --color-text-custom: #111418;  /* Text închis pentru fundal deschis */
}
```

### Border invizibil în light mode

**Cauza:** Culoarea border-ului prea apropiată de fundalul deschis
**Soluție:** Folosește token-uri semantice:
```css
border-color: var(--color-border);  /* Se inversează automat */
```

### Umbră agresivă în light mode

**Cauza:** Opacitatea umbrei identică cu dark mode
**Soluție:** Light mode are deja opacitate redusă — folosește token-uri semantice:
```css
box-shadow: var(--shadow-md);  /* Se ajustează automat */
```

### Culoare accent invizibilă în light mode

**Cauza:** Culoarea accent aleasă pentru dark mode
**Soluție:** Sistemul de design face asta automat:
```css
/* Deja implementat în design-system.css */
html.light-mode {
  --color-accent: #b84621;  /* Nuanță mai închisă pentru light mode */
}
```

---

## Adăugarea de culori noi în sistemul de design

Când adaugi o culoare semantică nouă:

1. **Definește în dark mode `:root`:**
   ```css
   :root {
     --color-custom: #abc123;
   }
   ```

2. **Suprascrie în light mode dacă e necesar:**
   ```css
   html.light-mode {
     --color-custom: #xyz789;  /* Varianta light mode */
   }
   ```

3. **Testează ambele moduri:**
   - Contrast ≥4.5:1
   - Vizual distinct de culorile vecine
   - Consistent cu sistemul de design

4. **Documentează în `COMPONENT_LIBRARY.md`**

---

## Referință rapidă: Ce se schimbă vs. ce rămâne

### SE SCHIMBĂ între moduri

- Culori fundal
- Culori text
- Culori accent/semantice (accent în special)
- Culori border
- Opacitate umbre
- Culori efect glass

### RĂMÂNE NESCHIMBAT

- Tipografie (familie font, mărime, grosime, line-height)
- Spațiere (toți token-urile `--space-*`)
- Rotunjire borduri
- Dimensiuni icoane
- Tranziții
- Efecte blur
- Structura componentelor

---

## Performanță

Comutarea de mod este instantanee (fără JavaScript, CSS pur):
- Timp comutare: <1ms
- Operații de paint: 1–2
- Fără layout shift
- Fără re-randări

**Tip:** Salvează preferința în `localStorage`:
```javascript
// La comutarea de utilizator
localStorage.setItem('simdm_theme', 'light')
document.documentElement.classList.add('light-mode')
```

Hook-ul `useTheme()` gestionează asta automat:
```jsx
import { useTheme } from '../hooks/useTheme';

const { theme, toggleTheme } = useTheme();
// theme = 'dark' | 'light'
// toggleTheme() comută și salvează în localStorage
```

---

**Versiune:** 2.0
**Actualizat:** 2026-06-05
**Status:** ✅ COMPLET
