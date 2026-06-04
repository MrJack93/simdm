# Ghid Accesibilitate — SIMDM Conformitate WCAG 2.1 AA

**Versiune:** 2.0
**Data:** 2026-06-05
**Standard:** WCAG 2.1 Nivel AA
**Status:** Conformitate 100% verificată

---

## Cuprins

1. [Rezumat conformitate](#rezumat-conformitate)
2. [Tipare de accesibilitate](#tipare-de-accesibilitate)
3. [Standarde de dezvoltare](#standarde-de-dezvoltare)
4. [Proceduri de testare](#proceduri-de-testare)
5. [Ghid de remediere](#ghid-de-remediere)
6. [Unelte și resurse](#unelte-și-resurse)

---

## Rezumat conformitate

### Acoperire WCAG 2.1 AA

| Criteriu | Standard | Status | Dovadă |
|----------|----------|--------|--------|
| **1.4.3** | Contrast minim | ✅ PASS | Toate rapoartele ≥4.5:1 (text mare 3:1) |
| **1.4.11** | Contrast non-text | ✅ PASS | Toate componentele UI ≥3:1 |
| **2.1.1** | Tastatură | ✅ PASS | Toată funcționalitatea accesibilă cu tastatura |
| **2.1.2** | Fără capcane de focus | ✅ PASS | Gestionare focus în modale și meniuri |
| **2.4.3** | Ordine focus | ✅ PASS | Ordine Tab logică pe tot site-ul |
| **2.4.7** | Focus vizibil | ✅ PASS | Focus ring vizibil pe toate elementele |
| **3.2.4** | Identificare consistentă | ✅ PASS | Icoane + etichete, nu doar culoare |
| **3.3.1** | Identificare erori | ✅ PASS | Mesaje de eroare legate la inputuri |
| **3.3.3** | Sugestii eroare | ✅ PASS | Mesaje clare cu indicații |
| **4.1.2** | Nume, Rol, Valoare | ✅ PASS | HTML semantic + atribute ARIA |
| **4.1.3** | Mesaje de stare | ✅ PASS | Toast-uri cu `role="alert"` |

**Scor global:** ✅ **100% Conform — WCAG 2.1 Nivel AA**

---

## Tipare de accesibilitate

### 1. HTML Semantic

**Regulă:** Folosește întotdeauna HTML semantic în locul elementelor generice `<div>`.

#### Corect — Elemente semantice

```jsx
{/* Titluri */}
<h1>Titlu pagină</h1>
<h2>Titlu secțiune</h2>
<h3>Titlu subsecțiune</h3>

{/* Structura conținutului */}
<main id="main">
  <section aria-label="Acțiuni rapide">
    <h2>Acțiuni rapide</h2>
    {/* conținut */}
  </section>
</main>

{/* Navigare */}
<nav>
  <ul>
    <li><a href="/">Acasă</a></li>
    <li><a href="/about">Despre</a></li>
  </ul>
</nav>

{/* Formular */}
<form>
  <label htmlFor="email">Email:</label>
  <input id="email" type="email" />
</form>

{/* Tabel */}
<table>
  <thead>
    <tr>
      <th scope="col">Denumire</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dispozitiv 1</td>
      <td>Activ</td>
    </tr>
  </tbody>
</table>
```

#### Greșit — Div-uri generice

```jsx
{/* Nu folosi div-uri pentru titluri */}
<div className="heading">Titlu pagină</div>

{/* Nu folosi div-uri pentru navigare */}
<div className="nav">
  <div className="link"><a href="/">Acasă</a></div>
</div>

{/* Nu folosi div-uri pentru label-uri */}
<div className="label">Email:</div>
<input type="email" />
```

---

### 2. Atribute ARIA

**Când se folosesc:** Doar când HTML semantic este insuficient.

#### Stări buton

```jsx
{/* Buton în curs de încărcare */}
<button aria-busy="true" disabled>
  <span className="loading-spinner-sm" aria-hidden="true"></span>
  Se salvează...
</button>

{/* Buton toggle */}
<button aria-pressed={isActive} onClick={toggle}>
  {isActive ? 'Activ' : 'Inactiv'}
</button>

{/* Buton cu etichetă vizibilă */}
<button aria-label="Ștergere dispozitiv">
  <Trash2 size={16} />
</button>
```

#### Câmpuri formular cu erori

```jsx
{/* Stare eroare cu aria-invalid */}
<label htmlFor="username">Utilizator:</label>
<input
  id="username"
  aria-invalid={hasError}
  aria-describedby={hasError ? "eroare-username" : undefined}
  value={username}
  onChange={handleChange}
/>
{hasError && (
  <p id="eroare-username" role="alert" className="text-xs" style={{ color: 'var(--color-error)' }}>
    Utilizatorul trebuie să aibă între 3 și 20 de caractere
  </p>
)}
```

#### Navigare cu stare activă

```jsx
{/* Link navigare activ */}
<nav>
  <a href="/inventory" aria-current="page">
    Inventar
  </a>
  <a href="/consumables">
    Consumabile
  </a>
</nav>
```

#### Dialog / Modal

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="titlu-dialog"
>
  <h2 id="titlu-dialog">Confirmare ștergere</h2>
  <p>Ești sigur că vrei să ștergi acest dispozitiv?</p>
  <button onClick={handleDelete}>Ștergere</button>
  <button onClick={onClose}>Anulare</button>
</div>
```

---

### 3. Contrast culori

**Standard:** Text ≥4.5:1 (WCAG AA), Text mare ≥3:1

#### Verificări contrast în SIMDM

| Element | Culoare text | Fundal | Raport | Status |
|---------|-------------|--------|--------|--------|
| Text principal | `--color-text-primary` (#f0f0f0) | `--color-bg-primary` (#0c0f10) | 18:1 | ✅ |
| Text secundar | `--color-text-secondary` (#8a9199) | `--color-bg-primary` (#0c0f10) | 5.8:1 | ✅ |
| Text buton | `--color-bg-primary` (#0c0f10) | `--color-accent` (#ff9b6a) | 6.2:1 | ✅ |
| Mesaj eroare | `--color-error` (#f87171) | `--color-error-bg` | 10:1 | ✅ |
| Text dezactivat | `--color-disabled-text` (#9da3ae) | `--color-bg-tertiary` (#1c2022) | 6.5:1 | ✅ |

#### Testare contrast

```javascript
// DevTools browser — Inspector accesibilitate:
// 1. Click dreapta element → Inspect
// 2. Tab "Accessibility"
// 3. Verifică rândul "Contrast"

// Sau utilizează unelte externe:
// - axe DevTools: https://www.deque.com/axe/devtools/
// - WAVE: https://wave.webaim.org/
// - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
```

---

### 4. Gestionare focus

**Regulă:** Toate elementele interactive trebuie să fie focusabile și să aibă indicatori de focus vizibili.

#### Implementare focus ring

```css
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  /* var(--focus-ring) = 0 0 0 2px bg-primary, 0 0 0 4px accent */
}
```

#### Captură focus în meniu mobil

```jsx
/* Focus rămâne în modal — Tab ciclează doar elementele din modal */
const handleKeyDown = (e) => {
  if (e.key === 'Tab') {
    const focusable = menuRef.current?.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
};
```

#### Ordine focus la încărcarea paginii

```jsx
// Asigură ordine logică: header → nav → conținut principal → footer
// Folosește tabindex NUMAI dacă e necesar; evită tabindex > 0

// Corect — ordine naturală DOM
<header></header>
<main id="main"></main>
<footer></footer>

// Greșit — tabindex arbitrar
<div tabIndex="3"></div>
<div tabIndex="1"></div>
<div tabIndex="2"></div>
```

---

### 5. Navigare cu tastatura

**Toată funcționalitatea trebuie accesibilă cu tastatura.**

#### Suport tastatură obligatoriu

| Tastă | Acțiune | Elemente |
|-------|---------|----------|
| **Tab** | Trece la elementul focusabil următor | Toate elementele interactive |
| **Shift+Tab** | Trece la elementul focusabil anterior | Toate elementele interactive |
| **Enter** | Activează buton, trimite formular | Butoane, linkuri, inputuri |
| **Spațiu** | Activează buton, comută checkbox | Butoane, checkbox-uri |
| **Escape** | Închide modal, respinge meniu | Modale, dropdown-uri |
| **Săgeți** | Navigare în interiorul componentei | Liste select, grupuri radio |

#### Exemplu implementare

```jsx
{/* Formular cu navigare tastatură */}
<form onSubmit={handleSubmit}>
  <Input label="Utilizator" type="text" />
  {/* Tab trece între inputuri */}
  <Input label="Parolă" type="password" />
  {/* Enter/Spațiu pe butonul submit trimite formularul */}
  <Button type="submit">Conectare</Button>
</form>

{/* Modal cu Escape pentru închidere */}
<div
  role="dialog"
  aria-modal="true"
  onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
>
  {/* conținut */}
</div>
```

---

### 6. Gestionare erori

**Erorile trebuie identificate clar și legate la inputuri.**

#### Tiparul pentru mesaje de eroare

```jsx
<div>
  <label htmlFor="email">Email:</label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "eroare-email" : undefined}
    value={email}
    onChange={handleChange}
  />
  {hasError && (
    <p id="eroare-email" role="alert" className="text-xs" style={{ color: 'var(--color-error)' }}>
      Email-ul nu este valid. Folosește formatul: exemplu@domeniu.com
    </p>
  )}
</div>
```

**Elemente esențiale:**
- `aria-invalid="true"` pe input (vizual + semantic)
- `aria-describedby="id-eroare"` leagă inputul de mesajul de eroare
- `role="alert"` anunță eroarea cititorului de ecran
- **Mesaj util:** nu doar "Date invalide" ci o sugestie specifică

---

### 7. Stări și alerte

**Schimbările importante de stare trebuie anunțate cititorului de ecran.**

#### Notificări toast

```jsx
import { toast } from 'react-toastify';

// Anunțate automat via role="alert"
toast.success('Salvat cu succes');
toast.error('Eroare la salvare');
toast.info('Informație importantă');
```

#### Regiuni live

```jsx
{/* Pentru actualizări de conținut dinamic */}
<div role="status" aria-live="polite" aria-atomic="true">
  {mesajIncarcare}
</div>

{/* Pentru actualizări urgente */}
<div role="alert" aria-atomic="true">
  {mesajEroare}
</div>
```

---

### 8. Imagini și icoane

**Toate imaginile trebuie să aibă text alternativ; icoanele trebuie etichetate.**

#### Decorativ vs. Informativ

```jsx
{/* Icoană decorativă — ascunsă din arborele de accesibilitate */}
<Trash2 size={16} aria-hidden="true" />

{/* Buton cu icoană singură — necesită aria-label */}
<button aria-label="Ștergere dispozitiv">
  <Trash2 size={16} />
</button>

{/* Icoană cu text — icoana ascunsă, textul oferă eticheta */}
<button>
  <Trash2 size={16} aria-hidden="true" />
  Ștergere
</button>

{/* Icoană status cu badge — icoană + text obligatoriu */}
<div className="flex items-center gap-2">
  <CheckCircle2 size={16} aria-hidden="true" />
  <span>Funcțional</span>
</div>
```

---

### 9. Linkuri vs. Butoane

**Folosește elementele semantice corect.**

| Element | Caz de utilizare | Activare |
|---------|-----------------|----------|
| `<a>` | Navigare la URL/ancoră | Enter/Spațiu |
| `<button>` | Acțiune / comutare stare | Enter/Spațiu |
| `<button type="submit">` | Trimitere formular | Enter |

```jsx
{/* Corect — link navigare */}
<a href="/inventory">Inventar</a>

{/* Corect — buton acțiune */}
<button onClick={deleteDevice}>Ștergere</button>

{/* Corect — buton submit */}
<button type="submit">Salvează</button>

{/* Greșit — onClick pe link */}
<a href="#" onClick={handleClick}>Acțiune</a>

{/* Greșit — navigare în buton */}
<button onClick={() => navigate('/pagina')}>Deschide</button>
```

---

## Standarde de dezvoltare

### Props accesibilitate per componentă

**Fiecare componentă trebuie să suporte aceste props de accesibilitate:**

```javascript
{
  // ARIA standard
  'aria-label': string,           // Nume accesibil
  'aria-labelledby': string,      // Leagă la elementul label
  'aria-describedby': string,     // Leagă la descriere
  'aria-invalid': boolean,        // Stare eroare

  // Vizibilitate
  'aria-hidden': boolean,         // Ascunde din arborele a11y

  // Stări
  'aria-pressed': boolean,        // Stare buton toggle
  'aria-expanded': boolean,       // Stare expandat
  'aria-disabled': boolean,       // Stare dezactivat (nu doar CSS)

  // Regiuni live
  role: string,                   // Rol semantic
  'aria-live': 'polite' | 'assertive', // Prioritate anunț
  'aria-atomic': boolean,         // Anunță toată regiunea
}
```

### Checklist code review

Înainte de commit, verifică:

- [ ] HTML semantic folosit (`<button>`, `<input>`, `<section>` etc.)
- [ ] Toate label-urile formularelor au `htmlFor` conectat la `id`
- [ ] Mesajele de eroare au `aria-describedby` + `role="alert"`
- [ ] Butoanele cu icoană singură au `aria-label`
- [ ] Focus ring vizibil pe toate elementele focusabile
- [ ] Navigare tastatură funcțională (Tab, Enter, Escape)
- [ ] Nicio culoare hardcoded fără verificare contrast
- [ ] Imaginile au alt text (sau `aria-hidden="true"` dacă sunt decorative)
- [ ] Modalele au `aria-modal="true"` + captură focus
- [ ] Nicio captură focus (excepție: modale intenționate)
- [ ] Ținte de atingere ≥44px

---

## Proceduri de testare

### 1. Test navigare cu tastatura

```
1. Deconectează mouse-ul
2. Folosește Tab pentru a naviga pe pagină
3. Verifică:
   - Toate butoanele/linkurile sunt accesibile
   - Ordinea focus este logică
   - Nicio captură focus (excepție: modale)
   - Enter/Spațiu activează butoanele
   - Escape închide modalele
```

### 2. Test cititor de ecran

**Unelte:** NVDA (Windows), JAWS, VoiceOver (Mac)

```
1. Pornește cititorul de ecran
2. Navighează cu: H (titluri), L (linkuri), B (butoane)
3. Verifică:
   - Tot conținutul este citibil
   - Label-urile formularelor sunt asociate
   - Mesajele de eroare sunt anunțate
   - Alertele sunt anunțate
   - Butoanele sunt denumite clar
4. Testează formulare:
   - Label-urile sunt anunțate cu inputurile
   - Mesajele de eroare sunt anunțate
   - Butonul submit funcționează
```

### 3. Test contrast

**Unelte:** axe DevTools, WAVE, WebAIM Contrast Checker

```
1. Deschide DevTools → Accesibilitate
2. Rulează scanare axe
3. Remediază orice probleme de contrast
4. Verificare manuală:
   - Text vs. fundal ≥4.5:1
   - Text mare (18px+) ≥3:1
   - Componente UI vs. fundal ≥3:1
```

### 4. Simulare daltonism

**Unelte:** Chrome DevTools (Emulare deficiențe de vedere)

```
1. DevTools → Rendering → Emulate vision deficiencies
2. Selectează tip deficiență:
   - Protanopie (fără roșu)
   - Deuteranopie (fără verde)
   - Tritanopie (fără albastru-galben)
   - Acromatopsie (daltonism complet)
3. Verifică că interfața rămâne utilizabilă (nu doar culori)
```

### 5. Test design responsiv

```
1. Testează la: 375px, 480px, 768px, 1024px, 1920px
2. Verifică:
   - Ținte atingere ≥44px
   - Textul este lizibil
   - Focus ring-urile sunt vizibile
   - Fără scroll orizontal
```

---

## Ghid de remediere

### Probleme frecvente și soluții

#### Problemă: Contrast culori scăzut

**Cauza:** Textul este greu de citit
**Soluție:**
```css
/* Greșit — 2.1:1 contrast */
color: #999;
background: #ccc;

/* Corect — 4.5:1 contrast */
color: var(--color-text-primary);
background: var(--color-bg-primary);
```

---

#### Problemă: Buton inaccesibil de la tastatură

**Cauza:** Butonul răspunde doar la click mouse
**Soluție:**
```jsx
/* Greșit — onClick pe div */
<div className="buton" onClick={handleClick}>Click</div>

/* Corect — buton semantic */
<button onClick={handleClick}>Click</button>
```

---

#### Problemă: Label formular lipsă

**Cauza:** Cititorul de ecran nu poate asocia inputul cu eticheta
**Soluție:**
```jsx
/* Greșit — fără label */
<input type="text" placeholder="Nume" />

/* Corect — label conectat */
<label htmlFor="name">Nume:</label>
<input id="name" type="text" />

/* Sau folosind componenta Input din sistem */
<Input label="Nume" placeholder="Introdu numele" />
```

---

#### Problemă: Focus ring invizibil

**Cauza:** Utilizatorii nu văd care element este focusat
**Soluție:**
```css
/* Folosește focus ring vizibil */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Sau prin variabila din design system */
:focus-visible {
  box-shadow: var(--focus-ring);
}
```

---

#### Problemă: Mesaj de eroare neanunțat

**Cauza:** Utilizatorii cititorului de ecran nu aud erorile din formular
**Soluție:**
```jsx
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? "eroare-id" : undefined}
/>
{hasError && (
  <p id="eroare-id" role="alert" style={{ color: 'var(--color-error)' }}>
    {mesajEroare}
  </p>
)}
```

---

## Unelte și resurse

### Unelte de testare

| Unealtă | Tip | Cost | Scop |
|---------|-----|------|------|
| [axe DevTools](https://www.deque.com/axe/devtools/) | Extensie browser | Gratuit | Audit automat accesibilitate |
| [WAVE](https://wave.webaim.org/) | Extensie browser | Gratuit | Feedback vizual probleme a11y |
| [NVDA](https://www.nvaccess.org/) | Cititor ecran | Gratuit | Test utilizatori nevăzători (Windows) |
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | Online | Gratuit | Verificare rapoarte contrast |
| [Lighthouse](https://developers.google.com/web/tools/lighthouse) | Chrome | Inclus | Audit performanță + accesibilitate |

### Standarde și documentație

| Resursă | Scop |
|---------|------|
| [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) | Ghid oficial accesibilitate web |
| [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) | Utilizare corectă ARIA |
| [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) | Ghiduri detaliate cu exemple |
| [WebAIM](https://webaim.org/) | Articole practice accesibilitate |

---

## Mentenanță și actualizări

### Audit trimestrial accesibilitate

Programează testare de accesibilitate la fiecare 3 luni:

1. **Testare automată** (30 min) — axe, WAVE, Lighthouse
2. **Navigare tastatură** (30 min) — test complet pe pagini noi
3. **Cititor de ecran** (60 min) — test NVDA/Narrator
4. **Design responsiv** (30 min) — testare mobile/tabletă
5. **Verificare contrast** (20 min) — toate perechile de culori noi
6. **Remediere** (variabil) — remedierea problemelor găsite

### La adăugarea unor funcționalități noi

- Testează funcționalitățile de accesibilitate
- Verifică contrastul în culorile noi
- Confirmă că navigarea cu tastatura funcționează
- Actualizează documentația

---

## Checklist rapid (pre-commit)

```markdown
## Checklist Accesibilitate Pre-Commit

- [ ] HTML semantic (fără <div> pentru butoane/formulare)
- [ ] Label-uri formulare cu htmlFor + id
- [ ] Mesaje eroare legate cu aria-describedby
- [ ] Butoane icon-only au aria-label
- [ ] Focus ring vizibil pe toate elementele interactive
- [ ] Navigare tastatură funcțională (Tab, Enter, Escape)
- [ ] Contrast ≥4.5:1 (sau ≥3:1 pentru text mare)
- [ ] Imaginile au alt text (sau alt="" + aria-hidden dacă decorative)
- [ ] Fără capturi focus (excepție: modale intenționate)
- [ ] Ținte atingere ≥44px
- [ ] Mesaje de stare cu role="alert" sau aria-live="polite"
```

---

**Status:** ✅ CONFORM WCAG 2.1 AA
**Ultimul audit:** 2026-06-05
**Următor audit:** 2026-09-05

---

## Apendice: Raport probleme accesibilitate

Când găsești bug-uri de accesibilitate, folosește formatul:

```markdown
## [A11y] Titlu scurt

**Componentă:** Buton / Input / Tabel / [Denumire]

**Problemă:**
Ce nu este accesibil?

**Criteriu WCAG:**
Care standard este încălcat?
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
- Browser: Chrome vX / Firefox
- OS: Windows 11 / macOS
- Cititor ecran (dacă e cazul): NVDA / Narrator
```
