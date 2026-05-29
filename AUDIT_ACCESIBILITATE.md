# Audit Accesibilitate SIMDM (Faza 1) — WCAG 2.1 AA

**Standard:** WCAG 2.1 Nivel AA  
**Data:** 2026-05-28  
**Domeniu:** Frontend complet — `index.html`, `App.jsx`, `pages/Login.jsx`, paletă Tailwind și temă globală  
**Auditor:** Automată (Claude) + Analiză statică de cod + Calcul contrast

> Faza 1 conține doar pagina de autentificare și un dashboard placeholder. Recomandările de aici sunt fundația accesibilității pentru fazele 2-8. Dacă le rezolvi acum, le moștenești rezolvate în toate modulele următoare.

---

## 🎯 Status General

| Categorie | Status | Acțiune |
|-----------|--------|--------|
| **Accesibilitate** | ⚠️ Critică | 8 probleme critice, 8 majore, 4 minore |
| **Contrast culori** | ✅ Bun | Paletă cyan pe gri se comportă bine |
| **Semantică HTML** | ❌ Lipsă | Label-uri neasociate, fără landmark-uri |
| **Tastatură** | ⚠️ Parțial | Focus invizibil, lipsesc skip link-uri |

## Rezumat Executiv

| Categorie | Critice | Majore | Minore | Total |
|-----------|---------|--------|--------|-------|
| **Perceptibil** | 2 | 3 | 2 | 7 |
| **Operabil** | 2 | 2 | 1 | 5 |
| **Inteligibil** | 2 | 2 | 1 | 5 |
| **Robust** | 2 | 1 | 0 | 3 |
| **TOTAL** | **8** | **8** | **4** | **20** |

**Concluzie generală:**  
Tema vizuală (cyan pe gri închis) oferă contrast bun pentru text mare, **dar structura semantică HTML și suportul pentru tehnologii asistive lipsesc complet**. 

### Top 3 priorități (Faza 1):

1. **Asociază `label` cu `input` prin `htmlFor`/`id`** pe pagina de autentificare
2. **Schimbă `<html lang="en">` în `<html lang="ro">`** și seteaza `<title>` corect
3. **Anunță erori și stări de încărcare** cu `role="alert"` și `aria-live`

Estimare: **30-40 minute** pentru top 3, care rezolvă ~70% din probleme.

---

## 1️⃣ Perceptibil (Perceivable)

| # | Problema | WCAG | Severitate | Recomandare |
|---|----------|------|------------|-------------|
| P1 | Borderul inputurilor `border-gray-700` (#374151) pe fundal `bg-gray-800` (#1f2937) are contrast ~1.5:1. Granita inputului este aproape invizibila. | 1.4.11 Non-text Contrast | Critic | Foloseste `border-gray-600` (#4b5563) sau `border-gray-500` — atinge >=3:1 fata de fundalul cardului. |
| P2 | Indicatorul de focus inlocuieste borderul `gray-700` cu `cyan-500` la aceeasi grosime (1px). Schimbarea este greu de observat si nu respecta cei 2px ai SC 2.4.7 in practica. | 1.4.11 + 2.4.7 | Critic | Foloseste `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900` pe TOATE elementele interactive. |
| P3 | Textul `text-gray-500` (#6b7280) pe `bg-gray-900` (#111827) — subtitlu "Sistem Management Dispozitive Medicale" — are contrast ~3.7:1, sub minimul de 4.5:1 pentru text normal. | 1.4.3 | Majoră | Înlocuiește cu `text-gray-400` (#9ca3af) — ridică la ~6.7:1. |
| P4 | `disabled:opacity-50` pe butonul "Conectare" scade luminanța textului negru sub un fundal cyan deja deschis; în stare disabled poate să scadă sub 4.5:1 și pierde focusabilitate. | 1.4.3 | Majoră | Folosește o stare disabled cu culoare separată (`bg-cyan-500/40` + `text-gray-300`) și păstrează focus; eventual înlocuiește cu spinner inline cu `aria-busy="true"`. |
| P5 | `index.html` lipsesc `<meta name="theme-color">` și `<meta name="description">`. Lipsește și pictograma touch-icon pentru iOS. | 1.3.1 | Majoră | Adaugă `<meta name="theme-color" content="#030712">` (potrivit cu fundalul) și descriere scurtă în limba română. |
| P6 | Emoji ✅ în mesajul "Faza 1 completă ✅" este anunțat de cititoare de ecran ca "white heavy check mark" (engleză). Mesaj inconsistent în limba română. | 1.1.1 | Minoră | Înlocuiește cu icoană SVG cu `aria-hidden="true"` și păstrează textul descriptiv. |
| P7 | Favicon moștenit din scaffold Vite nu reprezintă SIMDM. | 1.3.1 | Minoră | Creează favicon SVG simplu cu monograma "S" cyan pe gray-950, în temă. |

### Verificare contrast culori (palet SIMDM)

| Element | Fundal | Foreground | Ratio calculat | Cerinta | Pass |
|---------|--------|------------|----------------|---------|------|
| Heading "SIMDM" cyan-400 | gray-900 #111827 | #22d3ee | ~9.8:1 | 4.5:1 (text mare 3:1) | ✅ |
| Subtitlu gray-500 | gray-900 | #6b7280 | ~3.7:1 | 4.5:1 | ❌ |
| Label "Username/Parola" gray-400 | gray-900 | #9ca3af | ~6.8:1 | 4.5:1 | ✅ |
| Text input white | gray-800 | #ffffff | ~13.6:1 | 4.5:1 | ✅ |
| Placeholder default Tailwind | gray-800 | #9ca3af | ~5.5:1 | 4.5:1 | ✅ |
| Eroare red-400 | gray-900 | #f87171 | ~5.6:1 | 4.5:1 | ✅ |
| Buton "Conectare" black pe cyan-500 | cyan-500 #06b6d4 | #000000 | ~8.9:1 | 4.5:1 | ✅ |
| Buton hover cyan-400 | cyan-400 | #000000 | ~12.3:1 | 4.5:1 | ✅ |
| Border input gray-700 | gray-800 card | #374151 | ~1.5:1 | 3:1 (UI) | ❌ |
| Border card gray-800 | gray-950 | #1f2937 | ~1.4:1 | nu obligatoriu (decorativ) | ⚠️ |
| Logout: white pe red-600 | red-600 #dc2626 | #ffffff | ~5.5:1 | 4.5:1 | ✅ |
| Loading text gray-400 | gray-950 | #9ca3af | ~7.8:1 | 4.5:1 | ✅ |
| "Bine ai venit" white | gray-900 | #ffffff | ~17.7:1 | 4.5:1 | ✅ |
| Username highlight cyan-400 | gray-900 | #22d3ee | ~9.8:1 | 4.5:1 | ✅ |

---

## 2️⃣ Operabil (Operable)

| # | Problema | WCAG | Severitate | Recomandare |
|---|----------|------|------------|-------------|
| O1 | `focus:outline-none` elimină indicatorul de focus nativ, iar înlocuirea (schimbare border 1px) este insuficientă. Utilizatorul cu tastatură nu vede unde se află. | 2.4.7 | Critică | Păstrează `outline` nativ sau adaugă `focus-visible:ring-2 ring-offset-2`. Niciodată `outline:none` fără înlocuitor vizibil. |
| O2 | Ținta de atingere a inputurilor și butoanelor (py-2.5 = înălțime efectivă ~38-40px) este sub minimul WCAG de 44x44 px. Pe tabletă în spital — esențial. | 2.5.5 | Critică | Treci la `py-3` (48px) sau seteaza `min-h-[44px]` pe inputuri și butoane. |
| O3 | Lipseste `autofocus` pe primul input din autentificare. Utilizatorul cu tastatură trebuie să apese Tab până la el. | 2.4.3 | Majoră | Adaugă `autoFocus` pe input Username (ridică și UX). |
| O4 | Nu există `skip link` ("Sări la conținut") pentru tastatură — fundamental pentru când vor exista navigări în fazele 2+. | 2.4.1 Bypass Blocks | Majoră | Adaugă un `<a href="#main" class="sr-only focus:not-sr-only ...">Sări la conținut</a>` la începutul `<body>`. |
| O5 | Butonul "Logout" este etichetă neclară pentru utilizatorii non-vorbitori de engleză. | 2.4.6 | Minoră | Schimbă în "Deconectare" (consistență cu restul interfeței în limba română). |

---

## 3️⃣ Inteligibil (Understandable)

| # | Problema | WCAG | Severitate | Recomandare |
|---|----------|------|------------|-------------|
| U1 | `<html lang="en">` deși interfața este 100% în limba română. Cititoare de ecran vor pronunța cuvinte în limba română cu reguli engleze. | 3.1.1 Language of Page | Critică | Schimbă în `<html lang="ro">`. |
| U2 | Mesajul de eroare "Username sau parolă incorectă" nu este asociat cu input și nu este anunțat de cititor (lipsesc `role="alert"` / `aria-live`). Utilizator orb nu află că a eșuat. | 3.3.1 Error Identification | Critică | Pune `role="alert" aria-live="assertive"` pe `<p>` cu mesajul. Bonus: leagă eroare de inputuri prin `aria-describedby`. |
| U3 | Textul interfeței amestecă diacritice și non-diacritice ("Se încarcă", "Parolă" cu diacritice, vs "incarcare" fără). Inconsistent — confundă și cititoarele de ecran. | 3.1.5 | Majoră | Decide o convenție unică. Recomandare: folosește diacritice consistente ("Se încarcă", "Parolă", "Username sau parolă incorectă"). |
| U4 | Lipsește `<title>` corect — pagina apare ca "frontend" în tab browser și în cititor. | 2.4.2 | Majoră | Schimbă în `<title>SIMDM — Sistem Informațional Management Dispozitive Medicale</title>` în `index.html` și seteaza titluri dinamice per pagină cu `document.title = ...`. |
| U5 | Placeholder-ul "inginer" sugerează valoare exemplu — utilizatori o pot lua drept etichetă. | 3.3.2 | Minoră | Elimină placeholder sau pune text mai clar ("ex: inginer.dm") + păstrează label. |

---

## 4️⃣ Robust (Robust)

| # | Problema | WCAG | Severitate | Recomandare |
|---|----------|------|------------|-------------|
| R1 | `<label>` nu este asociat cu `<input>` (lipsesc `htmlFor`/`id`). Click pe label NU focusează input, iar tehnologii asistive nu văd numele. | 1.3.1 + 4.1.2 | Critică | Adaugă `id="username"` pe input + `htmlFor="username"` pe label (idem pentru parolă). |
| R2 | Lipsesc landmark-uri semantice: nu există `<main>`, `<header>`, `<nav>`. Cititoarele nu pot naviga structura paginii. | 1.3.1 + 4.1.2 | Critică | Învelește conținutul Dashboard în `<main id="main">` și bara de sus în `<header>`. |
| R3 | Inputurile nu au atributele `autoComplete="username"` / `autoComplete="current-password"`. Manager-ele de parole și tehnologii asistive nu înțeleg semantica. | 4.1.2 | Majoră | Adaugă atributele corespunzătoare. Beneficiu și pentru UX (autofill). |

---

## 5️⃣ Navigare cu Tastatură (Testabilitate)

| Element | Ordinea Tab | Enter/Space | Escape | Observații |
|---------|-------------|-------------|--------|-----------|
| Input Username | 1 | Trimite formularul | - | OK, dar fără focus vizibil clar |
| Input Parolă | 2 | Trimite formularul | - | OK, fără focus vizibil clar |
| Buton Conectare | 3 | Submit | - | OK, dar focus invizibil pe fundal cyan |
| Buton Deconectare (Dashboard) | 1 | Activează | - | Singurul element interactiv post-login |

**Probleme identificate:**
- Niciun element nu are inel de focus vizibil clar (vezi O1)
- Nu există `skip link` (vezi O4)
- Niciun keyboard trap întâlnit (corect — formularul nu este modal)

---

## 6️⃣ Cititoare de Ecran (Analiză Statică)

| Element | Cum este Anunțat Acum | Problemă | Remediere |
|---------|----------------------|----------|-----------|
| Input Username | "edit text, blank" (fără nume) | Label neasociat (R1) | `htmlFor`/`id` |
| Input Parolă | "edit, password, blank" | Lipsește numele "Parolă" | `htmlFor`/`id` |
| Eroare autentificare | NU este anunțată | 3.3.1 / U2 | `role="alert"` |
| Loading "Se încarcă..." | NU este anunțat | Lipsește `aria-live` | `<div role="status" aria-live="polite">` |
| "Faza 1 completă ✅" | "...white heavy check mark" în engleză | P6 | Icoană SVG cu `aria-hidden` |
| Dashboard "Bine ai venit, X" | Anunțat ca text normal | OK, dar lipsește structura main/heading | R2 |
| Buton "Deconectare" | "Button, logout" | Anterior în engleză | O5 |

---

## 7️⃣ Zoom & Responsive

Toate elementele folosesc unități relative (rem prin Tailwind), deci zoom 200% nu rupe layout. Containerul `max-w-sm` (24rem) rămâne utilizabil la 200%. Nu există breakpoint-uri mobile testate încă — recomandare pentru Faza 2: testează la 320px lățime și la zoom 400%.

---

## 8️⃣ Reparații Prioritare — Quick Wins

Aceste 10 modificări rezolvă ~70% din probleme în **30-40 minute**:

1. ✅ `index.html`: `lang="en"` → `lang="ro"`
2. ✅ `index.html`: `<title>frontend</title>` → `<title>SIMDM — Sistem Informațional Management Dispozitive Medicale</title>`
3. ✅ `Login.jsx`: Adaugă `id="username"` + `htmlFor="username"` (idem parolă)
4. ✅ `Login.jsx`: Adaugă `autoComplete="username"` și `autoComplete="current-password"`
5. ✅ `Login.jsx`: Adaugă eroare cu `role="alert" aria-live="assertive"`
6. ✅ `Login.jsx`: Schimbă `text-gray-500` (subtitlu) în `text-gray-400`
7. ✅ `Login.jsx`: Schimbă `border-gray-700` în `border-gray-600`
8. ✅ Înlocuiește `focus:outline-none focus:border-cyan-500` cu `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`
9. ✅ `App.jsx`: "Logout" → "Deconectare"; "Se incarca..." → "Se încarcă..." cu `<div role="status" aria-live="polite">`
10. ✅ `App.jsx`: Învelește conținutul în `<main id="main">` + adaugă skip link în `index.html`

---

## 9️⃣ Cod Recomandat — Probleme Critice

### `index.html`
```html
<!doctype html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#030712" />
    <meta name="description" content="SIMDM — Sistem Informational de Management al Dispozitivelor Medicale" />
    <title>SIMDM — Sistem Management Dispozitive Medicale</title>
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-cyan-500 focus:text-black focus:px-4 focus:py-2 focus:rounded">
      Sări la conținut
    </a>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `Login.jsx` — Diferențe Cheie
```jsx
{/* Subtitlu - contrast repariert */}
<p className="text-gray-400 text-center text-sm mb-8">
  Sistem Informațional Management Dispozitive Medicale
</p>

{/* Label asociat cu input */}
<label htmlFor="username" className="text-gray-400 text-sm mb-1 block">
  Utilizator
</label>
<input
  id="username"
  name="username"
  type="text"
  autoComplete="username"
  autoFocus
  required
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? "login-error" : undefined}
  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3
             text-white min-h-[44px]
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-cyan-400 focus-visible:ring-offset-2
             focus-visible:ring-offset-gray-900 transition"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  disabled={loading}
/>

{/* Label pentru parolă */}
<label htmlFor="password" className="text-gray-400 text-sm mb-1 block mt-4">
  Parolă
</label>
<input
  id="password"
  name="password"
  type="password"
  autoComplete="current-password"
  required
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? "login-error" : undefined}
  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3
             text-white min-h-[44px]
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-cyan-400 focus-visible:ring-offset-2
             focus-visible:ring-offset-gray-900 transition"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  disabled={loading}
/>

{/* Eroare anunțată cu role="alert" */}
{error && (
  <p id="login-error" role="alert" aria-live="assertive" className="text-red-400 text-sm text-center mt-4">
    {error}
  </p>
)}

{/* Buton submit cu dimensiuni accesibile */}
<button
  type="submit"
  disabled={loading}
  aria-busy={loading}
  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold
             min-h-[44px] py-3 rounded-lg transition mt-6
             focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-cyan-400 focus-visible:ring-offset-2
             focus-visible:ring-offset-gray-900
             disabled:bg-cyan-500/50 disabled:text-gray-800 disabled:cursor-not-allowed"
>
  {loading ? "Se conectează…" : "Conectare"}
</button>
```

### `App.jsx` — Structură Semantică
```jsx
{/* Loading state cu anunț accesibil */}
{isLoading && (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center"
       role="status" aria-live="polite" aria-label="Se încarcă">
    <div className="text-gray-400 text-lg">Se încarcă...</div>
  </div>
)}

{/* Dashboard cu landmark-uri semantice */}
<div className="min-h-screen bg-gray-950 text-gray-100">
  {/* Header cu element <header> semantic */}
  <header className="container mx-auto p-8 flex justify-between items-center">
    <h1 className="text-3xl font-bold text-cyan-400">SIMDM</h1>
    <button
      onClick={handleLogout}
      aria-label="Deconectare din SIMDM"
      className="bg-red-600 hover:bg-red-700 text-white font-bold
                 min-h-[44px] py-2 px-4 rounded-lg
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-red-400 focus-visible:ring-offset-2
                 focus-visible:ring-offset-gray-950"
    >
      Deconectare
    </button>
  </header>
  
  {/* Main landmark cu ID pentru skip link */}
  <main id="main" className="container mx-auto px-8 pb-8">
    <h2 className="text-2xl font-bold text-cyan-400 mb-6">Bine ai venit, {user?.username}</h2>
    {/* Conținut Dashboard */}
  </main>
</div>
```

---

## 🔟 Recomandări pentru Fazele 2-8

Documentează acum în `CLAUDE.md` următoarele reguli — toate modulele viitoare le vor moșteni:

### Reguli de Bază Accesibilitate

1. **Toți label-ii sunt asociați** prin `htmlFor` + `id` — niciun input fără nume accesibil
2. **Focus vizibil obligatoriu**: clasă utilă comună `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`. Creează-o ca preset `focusable` în Tailwind și aplico pe orice element interactiv
3. **Ținte de atingere minimum 44px** — toate butoanele și inputurile au `min-h-[44px]` sau `py-3`
4. **Mesajele de feedback** (succes/eroare) folosesc `role="alert"` (erori) sau `role="status"` (succes/loading)

### Componente Complexe (Faza 2+)

5. **Tabele de inventar** (Faza 2):
   - Uso `<th scope="col">` pentru header-uri coloane
   - Adaugă `aria-sort` când există sortare
   - Paginare cu `aria-label="Paginare DM"`
   - Rânduri selectable cu `role="checkbox" aria-checked`

6. **Modaluri/Dialoguri**:
   - Folosește `role="dialog" aria-modal="true"`
   - Focus trap (Tab nu iese din modal)
   - ESC închide modal
   - Focus revine la element trigger

7. **Icoane decorative vs. funcționale**:
   - SVG pur decorative: `aria-hidden="true"`
   - Icoane cu sens (status DM: funcțional/defect/casat): `aria-label="Status: Defect"`

8. **Culoare NU este singura sursă de informație** (WCAG 1.4.1):
   - Un DM "defect" trebuie marcat ȘI cu text ȘI cu icoană, nu doar roșu
   - Folosește simboluri + culoare + text

### Limba și Meta-date

9. **Limba**: Toate paginile primesc `document.title` clar în limba română, cu diacritice
   ```jsx
   useEffect(() => {
     document.title = "SIMDM — Inventar Dispozitive Medicale";
   }, []);
   ```

10. **PDF-uri generate** (Formulare MDM):
    - Adaugă structuri PDF tagged (titluri, tabele cu header-uri)
    - Altfel rămân inaccesibile pentru cititoare de ecran
    - Folosește librărie ca `pdfkit` sau `jsPDF` cu suport structured tagging

---

## ⏱️ Testare Manuală Recomandată

### 1. **Navigare cu Tastatură** (Fără Maus)
- Deconectează mouse-ul (ou dezactivează în setări)
- Parcurge autentificare + dashboard cu **Tab** / **Shift+Tab** / **Enter**
- Verifică că focus vizibil este clar la fiecare oprire
- Testează că erori sunt anunțate cu voce (dacă cititorul de ecran e activ)

### 2. **Cititoare de Ecran** (Windows)
- **NVDA** (gratuit, https://www.nvaccess.org/) sau **Narrator** (inclus în Windows)
- Ascultă cum este anunțat fiecare element
- Verifică că eroarea de autentificare este anunțată cu `role="alert"`
- Verifică că butoanele au etichete în limba română

### 3. **Zoom 200%** (Chrome: Ctrl + Shift + +)
- Layout trebuie să rămână utilizabil fără scroll orizontal
- Text trebuie să rămână clar citibil
- Butoanele trebuie să rămână atingibile

### 4. **Lighthouse Accessibility** (Chrome DevTools)
- Deschide DevTools (F12)
- Mergi la tab **Lighthouse**
- Rulează audit pe `localhost:5173`
- Target: **95+ puncte** după reparații

### 5. **axe DevTools** (Extensie Chrome Gratuită)
- https://www.deque.com/axe/devtools/
- Rulează scan pe pagina de autentificare și dashboard
- Target: **zero erori critice**

---

## 📋 Anexa — Fișiere Analizate

- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/App.css` (moștenire scaffolding Vite — recomandare: șterge dacă nu se folosește)
- `frontend/src/index.css`
- `frontend/src/api/axios.js`
- `frontend/src/pages/Login.jsx`

**Notă:** Codul nu conține încă componente complexe (modale, tabele, formulare mari, navigări). Când acestea se adaugă în Faza 2, refă auditul.

---

## 🎨 Design System Foundation — Modern Design Checklist

Următoarele trebuie documentate și implementate pentru a crea o bază de design modern și accesibil:

### Culori (Tokens)
```js
// design-tokens.js - Documentează în CLAUDE.md
export const colors = {
  primary: 'cyan-400', // #22d3ee
  secondary: 'gray-400', // #9ca3af
  background: 'gray-950', // #030712
  surface: 'gray-900', // #111827
  cardBg: 'gray-800', // #1f2937
  border: 'gray-600', // #4b5563
  error: 'red-400', // #f87171
  success: 'green-400', // #4ade80
  text: {
    primary: 'white', // #ffffff
    secondary: 'gray-400', // #9ca3af
    muted: 'gray-500', // #6b7280
  }
}
```

### Tipografie
- **Heading 1** (h1): 48px / 3xl, bold, cyan-400
- **Heading 2** (h2): 32px / 2xl, bold, cyan-400
- **Body**: 16px / base, text-gray-100
- **Small**: 14px / sm, text-gray-400
- **Label**: 14px / sm, text-gray-400

### Componente Reutilizabile
1. **Button** — 4 variante: primary, secondary, danger, ghost
2. **Input** — text, password, cu label și support erori
3. **Card** — container standard
4. **Alert** — pentru erori, success, info
5. **Modal** — dialog accesibil
6. **Table** — cu header scoped și sortare

### Spacing Scale
- xs: 2px, sm: 4px, md: 8px, lg: 16px, xl: 24px, 2xl: 32px

Implement aceste în viitoarele faze pentru a menține design system consistent!
