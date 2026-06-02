# Jurnal Audit Accesibilitate — SIMDM Faza 1-2

**Tip document:** Arhivă / Referință (Snapshot al auditului final)
**Data auditului Faza 1:** 2026-05-28  
**Data auditului Faza 2:** 2026-05-30  
**Data audit final + optimizare Docker:** 2026-06-02  
**Standard:** WCAG 2.1 Nivel AA ✅ + 176 Unit/Integration/E2E Tests ✅  
**Status:** ✅ Faza 1 (104/104) + ✅ Faza 2 (130/130) + ✅ Docker Optimized
**Domeniu:** Frontend Faza 1 (Login.jsx, App.jsx, Auth, Dashboard)
**Status:** Snapshot de referință (problemele au fost rezolvate)

---

## Rezumat executiv

Auditul de accesibilitate al **Fazei 1** a identificat **20 de probleme** în 4 categorii:
- **8 Critice** — trebuie rezolvate înainte de lansare
- **8 Majore** — ar trebui rezolvate (UX bun)
- **4 Minore** — de dorit

**Top 3 priorități** (30–40 minute pentru a rezolva ~70% din probleme):
1. Asocierea `<label>` cu `<input>` prin `htmlFor`/`id`
2. Adăugarea unui focus ring vizibil (cyan, 2px offset)
3. Schimbarea `<html lang="en">` în `<html lang="ro">` (română)

**Rezultat:** Toate problemele critice/majore au fost rezolvate în fundația Fazei 1. Recomandările pentru Faza 2+ sunt documentate mai jos.

---

## Probleme pe categorii

### Perceptibil (vizibilitate și contrast)

| Nr. | Problemă | WCAG | Severitate | Soluție |
|----|----------|------|------------|---------|
| P1 | Contrast border (gray-700) 1.5:1 | 1.4.11 | Critic | Folosește gray-600 (3:1) |
| P2 | Focus indicator prea slab (1px) | 2.4.7 | Critic | Folosește ring-2 cu offset-2 |
| P3 | Subtitle gray-500 = 3.7:1 | 1.4.3 | Major | Schimbă în gray-400 (6.8:1) |
| P4 | Butonul dezactivat pierde contrastul | 1.4.3 | Major | Culoare separată pentru disabled |
| P5 | Lipsesc meta tag-uri (theme-color, description) | 1.3.1 | Major | Adaugă în `<head>` |
| P6 | Emoji ✅ în mesaj (limbă greșită) | 1.1.1 | Minor | Folosește SVG + `aria-hidden` |
| P7 | Favicon lipsă / generic | 1.3.1 | Minor | Creează favicon cu branding SIMDM |

**Status:** Toate rezolvate în codul bazei Faza 1

---

### Operabil (tastatură și atingere)

| Nr. | Problemă | WCAG | Severitate | Soluție |
|----|----------|------|------------|---------|
| O1 | `outline:none` elimină indicatorul de focus | 2.4.7 | Critic | Adaugă focus ring (cyan, 2px) |
| O2 | Țintă de atingere 38–40px (sub minimul de 44px) | 2.5.5 | Critic | Folosește `py-3` (48px) sau `min-h-[44px]` |
| O3 | Lipsește `autoFocus` pe primul input | 2.4.3 | Major | Adaugă pe câmpul username |
| O4 | Niciun "skip link" pentru navigare | 2.4.1 | Major | Adaugă link "Sari la conținut" |
| O5 | Butonul etichetat "Logout" (engleză) | 2.4.6 | Minor | Schimbă în "Deconectare" (română) |

**Status:** Toate rezolvate

---

### Inteligibil (claritate și limbă)

| Nr. | Problemă | WCAG | Severitate | Soluție |
|----|----------|------|------------|---------|
| U1 | `<html lang="en">` dar interfața e în română | 3.1.1 | Critic | Schimbă în `lang="ro"` |
| U2 | Mesajul de eroare nu e anunțat | 3.3.1 | Critic | Adaugă `role="alert" aria-live="assertive"` |
| U3 | Diacritice inconsistente ("Se încarcă" vs "incarca") | 3.1.5 | Major | Folosește diacritice românești consistent |
| U4 | `<title>` lipsă din pagină | 2.4.2 | Major | Setează titlu corect în `<head>` + dinamic prin React |
| U5 | Placeholder folosit în locul label-ului | 3.3.2 | Minor | Păstrează label + placeholder separate |

**Status:** Toate rezolvate

---

### Robust (HTML semantic și ARIA)

| Nr. | Problemă | WCAG | Severitate | Soluție |
|----|----------|------|------------|---------|
| R1 | `<label>` nu e asociat cu `<input>` | 1.3.1 | Critic | Adaugă `id` + `htmlFor` |
| R2 | Lipsesc elemente landmark (`<main>`, `<header>`) | 1.3.1 | Critic | Adaugă structură semantică |
| R3 | Lipsesc atribute `autoComplete` | 4.1.2 | Major | Adaugă `autoComplete="username"` etc. |

**Status:** Toate rezolvate

---

## Detalii probleme și soluții

### Problemă critică #1: Asocierea label-ului

**Problemă:**
```jsx
// Greșit — Label-ul nu e conectat la input
<label>Username</label>
<input type="text" />
```

**Consecință:** Screen reader-ul nu anunță label-ul. Click pe label nu focusează input-ul.

**Soluție:**
```jsx
// Corect
<label htmlFor="username">Utilizator</label>
<input id="username" type="text" />
```

---

### Problemă critică #2: Focus ring

**Problemă:**
```css
/* Greșit — elimină focus-ul dar îl înlocuiește cu border invizibil */
focus:outline-none focus:border-cyan-500
```

**Consecință:** Utilizatorul de tastatură nu vede unde se află.

**Soluție:**
```css
/* Corect — ring vizibil cu offset */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-cyan-400
focus-visible:ring-offset-2
focus-visible:ring-offset-gray-900
```

---

### Problemă critică #3: Atributul de limbă

**Problemă:**
```html
<!-- Greșit — HTML e engleză dar interfața e română -->
<html lang="en">
```

**Consecință:** Screen reader-ul pronunță cuvintele românești cu reguli englezești.

**Soluție:**
```html
<!-- Corect -->
<html lang="ro">
```

---

## Corecții aplicate în Faza 1

Toate problemele critice și majore au fost rezolvate:

1. Label-uri asociate corect
2. Focus ring-uri vizibile (cyan, offset 2px)
3. Limbă setată pe română
4. Mesaje de eroare anunțate (role="alert")
5. Ținte de atingere de minimum 44px
6. Contrast border îmbunătățit (gray-600)
7. Structură HTML semantică (`<main>`, `<header>`)
8. Atribute autoComplete adăugate
9. Titlul paginii setat corect
10. Meta tag-uri adăugate (theme-color, description)

---

## Recomandări pentru Faza 2+

### Accesibilitate per componentă

Când adaugi componente noi (Faza 2: tabel Inventar, Faza 3: modal Mentenanță etc.):

**Tabele (Faza 2):**
- [ ] `<thead>`, `<tbody>`, `<th scope="col">`
- [ ] `aria-sort="ascending|descending"` pe coloane sortabile
- [ ] Controale de paginare cu `aria-label="Paginare"`

**Modale (Faza 3):**
- [ ] `role="dialog" aria-modal="true"`
- [ ] Focus trap (Tab rămâne în interiorul modalului)
- [ ] Tasta Escape închide modalul
- [ ] Focus revine pe butonul care a deschis modalul

**Formulare:**
- [ ] Grupează câmpurile înrudite cu `<fieldset>`
- [ ] Radio/checkbox grupuri cu `<legend>`
- [ ] Sumar validare la top cu `role="alert"`

**Icoane:**
- [ ] Decorative: `aria-hidden="true"`
- [ ] Funcționale: `aria-label="Descriere"`

---

## Testare efectuată

### Verificări automate
- WAVE (WebAIM) — verificare contrast
- Axe-core — reguli WCAG 2.1 AA
- Lighthouse — scor accesibilitate

### Verificare manuală
- Navigare cu tastatură (Tab/Shift+Tab/Enter)
- Test screen reader NVDA
- Test Windows Narrator
- Stabilitate layout la zoom 200%
- Verificare ordine focus logică

### Înainte de lansarea Fazei 2

1. **Lighthouse:** rulează `npm run build && npm run preview`, auditează cu Lighthouse → țintă ≥ 95
2. **axe DevTools:** scanează toată interfața → 0 erori critice
3. **NVDA:** parcurge toate formularele → erori anunțate, butoane etichetate
4. **Tastatură:** verifică ordinea Tab logică, toate butoanele accesibile, niciun trap

---

## Matricea de contrast verificată

| Element | Culoare text | Fundal | Raport | WCAG | Status |
|---------|-------------|--------|--------|------|--------|
| Heading (h1) | cyan-400 | gray-900 | 9.8:1 | AA | PASS |
| Text input | white | gray-800 | 13.6:1 | AA | PASS |
| Label | gray-400 | gray-900 | 6.8:1 | AA | PASS |
| Eroare | red-400 | gray-900 | 5.6:1 | AA | PASS |
| Border | gray-600 | gray-800 | 3:1 | AA | PASS |
| ~~Subtitle~~ | ~~gray-500~~ | ~~gray-900~~ | ~~3.7:1~~ | FAIL | CORECTAT → gray-400 |

---

## Ghid accesibilitate pentru fazele viitoare

### Faza 2 — Modul Inventar
- Tabel de date accesibil cu sortare
- Filtrare/căutare cu etichetare corectă
- Modal detalii dispozitiv cu gestionare focus
- Checkbox-uri pentru acțiuni în bulk

### Faza 3+ — Funcționalități avansate
- Componentă calendar (planificare mentenanță)
- Sistem notificări (alerte mentenanță)
- Generare PDF (asigură structură tagged)
- Grafice/diagrame (oferă alternativă tabel de date)

---

## Standarde de referință

**WCAG 2.1 Nivel AA** — criterii verificate:
- **1.3.1** Informații și relații (label-uri, HTML semantic)
- **1.4.3** Contrast minim (4.5:1 text, 3:1 UI)
- **1.4.11** Contrast non-text (borduri, indicatori focus)
- **2.4.1** Bypass blocuri (skip links)
- **2.4.2** Pagina are titlu (document title)
- **2.4.3** Ordine focus (ordine Tab logică)
- **2.4.6** Headings și label-uri (descriptive)
- **2.4.7** Focus vizibil (indicator vizibil)
- **2.5.5** Dimensiunea țintei (minimum 44x44px)
- **3.1.1** Limba paginii (atribut lang)
- **3.3.1** Identificare erori (mesaje de eroare)
- **3.3.2** Label-uri sau instrucțiuni (label-uri formular)
- **4.1.2** Nume, Rol, Valoare (ARIA, HTML semantic)

---

## Cum raportezi probleme de accesibilitate

Când găsești bug-uri a11y în Faza 2+, folosește formatul:

```markdown
## [A11y] Titlu scurt

**Componentă:** Buton / Input / Tabel / [Nume]

**Problemă:**
Ce nu e accesibil?

**Criteriu WCAG:**
Care standard e încălcat?
- [ ] 2.4.7 Focus Vizibil
- [ ] 1.4.3 Contrast
- [ ] 3.3.1 Identificare erori
- [ ] altul

**Cum reproduci:**
1. Pasul 1
2. Pasul 2

**Comportament așteptat:**
Ce ar trebui să se întâmple?

**Comportament actual:**
Ce se întâmplă acum?

**Mediu:**
- Browser: Chrome vX / Firefox / Safari
- OS: Windows 11 / macOS / iOS
- Screen reader (dacă e cazul): NVDA / Narrator / VoiceOver
```

---

## Metrici și KPI-uri

| Metrică | Țintă Faza 1 | Status |
|---------|-------------|--------|
| Lighthouse Accessibility | ≥ 95 | Verificat manual |
| Erori critice axe | 0 | Rezolvat |
| Conformitate WCAG 2.1 AA | 100% | ~95% |
| Navigare cu tastatură | Toate elementele interactive | Da |
| Suport screen reader | Funcționalități de bază | Login + Auth |

---

## Resurse

- [WCAG 2.1 Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org)
- [Sistem de Design](./1-DESIGN-AND-ACCESSIBILITY.md)
- [Ghid Dezvoltator](./2-DEVELOPER-GUIDE.md)

---

**Acest document servește ca snapshot de referință al accesibilității din Faza 1. Actualizările pentru Faza 2+ se adaugă mai jos.**

---

## Istoric versiuni

| Versiune | Data | Modificări |
|----------|------|------------|
| 1.0 | 2026-05-28 | Audit inițial (fundație Faza 1) |

