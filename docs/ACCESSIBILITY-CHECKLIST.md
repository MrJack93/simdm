# Checklist Accesibilitate — SIMDM

**Standard:** WCAG 2.2 Level AA · **Actualizat:** 2026-06-13

> Checklist complet pentru verificarea accesibilității la fiecare PR.
> Bază normativă: `DESIGN.md` §8 Do's and Don'ts + §9 Responsive.

---

## 1. Contrast & Culoare

- [ ] Text normal ≥ 4.5:1 contrast pe fundal
- [ ] Text mare (≥18px bold sau ≥24px) ≥ 3:1 contrast
- [ ] UI elements (borders, icons) ≥ 3:1 contrast
- [ ] Culoarea NU e singura metodă de indicare (badge-urile au text + icoană)
- [ ] Focus ring coral (#cc785c) vizibil pe toate fundalurile
- [ ] Status colors (success/warning/error) au contrast ≥ 4.5:1

## 2. Navigare Tastatură

- [ ] Toate elementele interactive sunt accesibile via Tab
- [ ] Ordinea de tab logică (sus → jos, stânga → dreapta)
- [ ] Fără `tabIndex` negativ pe controale interactive
- [ ] Escape închide modale și dropdown-uri
- [ ] Enter/Space activează butoane și link-uri
- [ ] Arrow keys navighează în interiorul tab-urilor și listelor

## 3. Focus Vizibil

- [ ] Focus ring coral pe toate butoanele (`.focusable`)
- [ ] Focus ring coral pe toate input-urile
- [ ] Focus ring coral pe link-uri
- [ ] Focus ring vizibil pe elementele Shadcn (Button, Input, Select, Dialog)
- [ ] Fără `outline: none` fără înlocuire

## 4. ARIA & Semantic HTML

- [ ] `<label>` asociat fiecărui `<input>` (atribut `for`)
- [ ] `role="status"` pe loading indicators
- [ ] `role="alert"` pe mesaje de eroare
- [ ] `role="dialog"` pe modale + `aria-modal="true"`
- [ ] `aria-label` pe butoane cu doar icoană
- [ ] `aria-invalid` + `aria-describedby` pe câmpuri cu eroare
- [ ] `aria-busy` pe butoane în timpul submit-ului
- [ ] Heading-uri ierarhice (h1 → h2 → h3, fără skip)
- [ ] `scope="col"` pe `<th>` din tabele

## 5. Conținut

- [ ] SkipLink prezent la începutul paginii
- [ ] `alt` text pe imagini informative
- [ ] `aria-hidden="true"` pe icoane decorative
- [ ] Mesaje de eroare clare și descriptive
- [ ] Empty states pe fiecare pagină
- [ ] Skeleton screens în loc de "Se încarcă..."

## 6. Responsive & Touch

- [ ] Touch targets ≥ 40×40px pe mobil
- [ ] Conținutul încăpe în viewport pe mobil (fără horizontal scroll)
- [ ] Font size mobil ≥ 14px
- [ ] Modalele au `max-h-[90vh] overflow-y-auto`
- [ ] Tabelele au `overflow-x-auto` pe mobil

## 7. Motion & Animation

- [ ] `prefers-reduced-motion: reduce` respectat (toate animațiile oprite)
- [ ] Skeleton devine static fără animație la reduced-motion
- [ ] Fără animații auto-play fără user interaction
- [ ] Transiții ≤ 300ms (nu blochează workflow-ul)

## 8. Print

- [ ] `@media print` ascunde nav, sidebar, butoane
- [ ] Tabelele păstrează formatul la print
- [ ] Culoarea textului e neagră pe fundal alb la print

---

## Rulează

```bash
cd frontend
npm run test              # include teste accesibilitate
npm run test:a11y         # axe-core accessibility tests
```

**Verificare manuală:**
1. Navigare doar tastatură (Tab/Shift+Tab/Enter/Esc)
2. NVDA screen reader (Windows)
3. DevTools → Lighthouse → Accessibility ≥ 95
4. DevTools → Accessibility → Contrast checker
