# Ghid de Contribuție — Dezvoltare SIMDM

**Versiune:** 1.0
**Audiență:** Developeri Faza 2+
**Actualizat:** 2026-05-29

---

## Cum contribui

**SIMDM** se construiește incremental în faze. Fiecare fază urmează un flux de lucru strict pentru a menține calitatea codului, accesibilitatea și standardele de documentare.

---

## Fluxul de lucru: Feature → PR → Merge

### 1. Înainte de a începe

**Citește mai întâi:**
- [CLAUDE.md](../CLAUDE.md) — Context proiect și reguli
- [SPEC.md](../SPEC.md) — Specificația fazei curente
- [docs/1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md) — Design tokens și reguli WCAG
- [docs/2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md) — Tipare de implementare

**Înțelege:**
- Aplicație cu un singur utilizator (fără RBAC)
- Temă închisă (accent cyan, suprafațe gri)
- Accesibilitate WCAG 2.1 AA **obligatorie**
- Text UI în română + cod în engleză
- Funcționează doar pe Localhost/LAN (fără cloud)

---

### 2. Creează branch de feature

```bash
# Întotdeauna branchez din main
git checkout main
git pull origin main

# Creează branch de feature (nume descriptiv)
git checkout -b feature/inventar-devices
# sau
git checkout -b fix/login-contrast-issue
# sau
git checkout -b docs/update-accessibility-guide
```

**Convenție de denumire branch-uri:**
- `feature/modul-descriere` — Funcționalitate nouă (lista dispozitive Faza 2)
- `fix/descriere-bug` — Rezolvare bug (focus ring lipsă)
- `docs/descriere` — Documentație
- `refactor/descriere` — Refactorizare cod (fără schimbare de comportament)
- `test/descriere` — Adăugare teste

---

### 3. Implementează funcționalitatea

**Backend (dacă e necesar):**
```bash
cd backend

# Instalează dependențe DOAR dacă e necesar
npm install pachet-nou

# Fă modificările
# Ai editat schema.prisma? Rulează întotdeauna:
npx prisma migrate dev --name descriere_modificare
npx prisma generate

# Testează endpoint-ul în Postman/Thunder Client
npm run dev  # Port 3001
```

**Frontend (majoritatea lucrului):**
```bash
cd frontend

# Fă modificările în componente/pagini
npm run dev  # Port 5173

# Testează în browser la localhost:5173
```

---

### 4. Checklist accesibilitate și testare

**ÎNAINTE de commit:**

```
Calitate cod
- [ ] Niciun console.log() în codul de producție
- [ ] Niciun import nefolosit
- [ ] Nume de variabile descriptive
- [ ] Funcțiile sunt documentate (dacă sunt complexe)

Accesibilitate (WCAG 2.1 AA)
- [ ] Toate <input> au <label htmlFor> asociat
- [ ] Toate <label> au htmlFor + id pe input identic
- [ ] Focus ring vizibil (clasa .focusable)
- [ ] Butoane/inputuri ≥ 44px înălțime (py-3 sau min-h-[44px])
- [ ] Mesaje eroare: role="alert" aria-live="assertive"
- [ ] Niciun buton fără etichetă (folosește aria-label dacă e nevoie)
- [ ] Culoarea nu e singura sursă de informație (text + icoană + culoare)

Testare
- [ ] Navigare cu tastatură funcționează (Tab/Shift+Tab/Enter)
- [ ] Formularele validează la submit
- [ ] Mesajele de eroare apar și se șterg la modificare
- [ ] Stările de încărcare funcționează (spinner + dezactivat)
- [ ] Niciun link rupt
- [ ] Responsiv la 1024px (minimum)

Stilizare
- [ ] Doar clase Tailwind (fără fișiere CSS separate)
- [ ] Folosește token-urile de design din docs/1-DESIGN-AND-ACCESSIBILITY.md
- [ ] Spațiere/dimensionare consistentă
- [ ] Temă închisă (fundal gray-950, accent cyan-400)
```

---

### 5. Formatul mesajelor de commit

```bash
git commit -m "feat: add device list with filtering and sorting

- Implement GET /api/devices endpoint
- Add DataTable component with sort + pagination
- WCAG AA compliant (keyboard nav, focus ring, ARIA)
- Filter by status and section

Fixes #42"
```

**Format:**
```
<tip>(<domeniu>): <subiect>

<corp>

<footer>
```

- **Tip:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Domeniu:** `backend`, `frontend`, `docs`, sau modul specific
- **Subiect:** ~50 caractere, mod imperativ ("add" nu "added")
- **Corp:** Ce, de ce, cum (mai multe rânduri OK)
- **Footer:** `Fixes #123` dacă închide un issue

**Exemple:**
```
feat(frontend): add device card component with accessibility

- Create reusable Card component in src/components/
- Support title, subtitle, action button
- 44px touch target, focus ring, semantic HTML
- Used in inventar list and detail pages

Fixes #18
```

```
fix(frontend): improve input contrast from gray-500 to gray-400

WCAG AA minimum is 4.5:1. Gray-500 was 3.7:1 on gray-900.
Fixes accessibility issue found in audit.
```

```
docs: consolidate .md files, remove redundancy

- Merge AUDIT + DESIGN + COMPONENT docs into docs/ folder
- Translate all documentation to Romanian
- Remove 400 lines of duplicate code examples
```

---

### 6. Push și creare Pull Request

```bash
# Push branch de feature
git push origin feature/inventar-devices

# GitHub: Crează PR cu template-ul de mai jos
```

**Template PR** (creează în `.github/pull_request_template.md`):

```markdown
## Descriere
Scurtă descriere a ce face acest PR.

## Tip de modificare
- [ ] Funcționalitate nouă (Faza 2+)
- [ ] Rezolvare bug
- [ ] Documentație
- [ ] Refactorizare (fără schimbare de comportament)
- [ ] Îmbunătățire performanță

## Issue asociat
Fixes #[număr issue]

## Testare
- [ ] Testat pe localhost:5173
- [ ] Fără erori în consolă
- [ ] Navigare cu tastatură funcționează
- [ ] Responsiv (1024px+)
- [ ] Accesibilitate (Lighthouse ≥ 95)

## Checklist accesibilitate
- [ ] Toate inputurile au label-uri + htmlFor
- [ ] Focus ring vizibil
- [ ] Ținte de atingere ≥ 44px
- [ ] Erori anunțate (role="alert")
- [ ] Niciun status indicat doar prin culoare
- [ ] Testat cu NVDA/Narrator

## Design și calitate cod
- [ ] Respectă sistemul de design SIMDM (culori, spațiere)
- [ ] Folosește .focusable pentru elemente interactive
- [ ] Doar clase Tailwind (fără CSS separat)
- [ ] Nume descriptive funcții/variabile
- [ ] Niciun console.log() rămas

## Modificări bază de date (dacă e cazul)
- [ ] Schema actualizată în schema.prisma
- [ ] Migrație creată: npx prisma migrate dev
- [ ] Date seed actualizate dacă e necesar
- [ ] Testat cu bază de date proaspătă

## Screenshot-uri (dacă e modificare UI)
[Adaugă screenshot-uri]

## Note pentru reviewer
[Context, decizii, lucruri de știut]
```

**Titlu PR:** Identic cu subiectul commit-ului
```
feat(frontend): add device list with filtering and sorting
```

---

### 7. Code review și feedback

**PR-ul tău va fi revizuit pentru:**

1. **Corectitudine**
   - Funcționează conform intenției?
   - Sunt edge case-uri ratate?
   - Poate strica funcționalitățile existente?

2. **Accesibilitate (WCAG 2.1 AA)**
   - Toate elementele interactive sunt accesibile cu tastatură?
   - Erorile sunt anunțate screen reader-urilor?
   - Țintele de atingere sunt de minimum 44x44px?

3. **Calitate cod**
   - Codul e lizibil? (nume descriptive, fără funcții imbricate inutil)
   - Probleme de performanță?
   - Respectă convențiile proiectului?

4. **Consistență**
   - Respectă sistemul de design (culori, spațiere)?
   - Folosește tiparele stabilite?

---

### 8. Adresează feedback-ul

**Când reviewer-ul cere modificări:**

```bash
# Fă modificările local
# Commit cu referință la feedback
git commit -m "refactor: improve focus ring visibility per review

Feedback: Ring was too subtle on dark backgrounds.
Changed ring-offset from gray-950 to more visible offset."

# Push din nou (fără force push pe branch-uri partajate)
git push origin feature/inventar-devices
```

**Important:** Nu face force push pe branch-uri partajate. Adaugă pur și simplu commit-uri noi.

---

### 9. Merge în main

După aprobare:

```bash
# GitHub: Squash & merge (preferat pentru istoric curat)
# SAU: Rebase & merge (păstrează toate commit-urile)
# Evită: Create merge commit (înfundă istoricul)
```

**După merge:**
```bash
# Actualizează main local
git checkout main
git pull origin main

# Șterge branch-ul local
git branch -d feature/inventar-devices

# Șterge pe remote (GitHub șterge automat după merge)
git push origin --delete feature/inventar-devices
```

---

## Fluxuri frecvente

### Adăugarea unei componente noi

**Locație:** `frontend/src/components/NumeComponenta.jsx`

**Template:**
```jsx
import React from 'react';

export default function NumeComponenta({
  id,
  label,
  error,
  disabled = false,
  children,
  ...props
}) {
  return (
    <div className="...">
      {/* HTML semantic */}
      {/* Conformitate WCAG 2.1 AA */}
      {/* Temă închisă (gray-950 fundal, cyan-400 accent) */}
    </div>
  );
}
```

**Pași:**
1. Adaugă componenta în `src/components/`
2. Documentează în [1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md)
3. Include exemple în descrierea PR-ului
4. Testează accesibilitatea înainte de a trimite PR

### Adăugarea unei pagini noi

**Locație:** `frontend/src/pages/NumePagina.jsx`

**Template:**
```jsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export default function NumePagina() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resursa'],
    queryFn: () => api.get('/api/resursa').then(r => r.data),
  });

  useEffect(() => {
    document.title = 'SIMDM — Nume Pagină';
  }, []);

  if (isLoading) return <div role="status">Se încarcă…</div>;
  if (error) return <div role="alert">Eroare: {error.message}</div>;

  return (
    <main className="...">
      {/* Conținut */}
    </main>
  );
}
```

### Modificarea schemei bazei de date

**CRITIC:** Coordonează întotdeauna modificările de schemă.

1. **Editează** `backend/prisma/schema.prisma`
2. **Rulează:** `npx prisma migrate dev --name descriere_modificare`
3. **Verifică:** Fișierul de migrație creat în `backend/prisma/migrations/`
4. **Actualizează:** `backend/prisma/seed.js` dacă datele trebuie modificate
5. **Testează:** `npx prisma db push` pe baza de date proaspătă
6. **Include:** Fișierul de migrație în commit

---

## Testare înainte de PR

### Testare frontend

```bash
cd frontend
npm run dev

# Verifică fiecare componentă/pagină:
1. Aspect vizual (respectă design-ul)
2. Navigare cu tastatură (Tab, Enter, Escape)
3. Validare formular (erori apar/dispar)
4. Stări de încărcare (spinner, butoane dezactivate)
5. Responsiv (redimensionare la 1024px, mobil)
```

### Testare accesibilitate

```bash
# Lighthouse (Chrome DevTools)
F12 → Lighthouse → Accessibility → Analyze
Țintă: ≥ 95 puncte

# axe DevTools (extensie Chrome)
1. Instalează din Chrome Web Store
2. Click iconița axe
3. Scanează pagina
4. Verifică: 0 erori critice + serioase

# Tastatură singură
1. Deconectează mouse-ul
2. Tab prin toate elementele interactive
3. Enter/Space pe butoane
4. Escape pentru a închide modale
5. Verifică focus mereu vizibil

# Screen Reader (NVDA — gratuit)
1. Descarcă: https://www.nvaccess.org
2. Start: Win + Ctrl + Enter
3. Navighează formularul
4. Verifică: Erori anunțate, label-uri citite, butoane etichetate
```

### Testare backend (dacă e cazul)

```bash
# Testare API (Postman / Thunder Client)
1. GET /api/health → { "status": "ok" }
2. POST /api/resursa → Verifică răspunsul
3. Cazuri de eroare → răspunsuri 400, 401, 404, 500
4. Necesită auth? → Verifică jwt check

# Baza de date
pgAdmin sau Prisma Studio:
npx prisma studio
→ Verifică că datele au fost inserate/actualizate corect
```

---

## Ce să faci și ce să nu faci

### Fă

- Branchez din `main`
- Scrie mesaje de commit descriptive
- Testează accesibilitatea înainte de PR
- Folosește token-urile de design (culori, spațiere)
- Respectă convențiile de denumire (camelCase JS, PascalCase React)
- Validează input-ul server-side
- Tratează erorile elegant
- Actualizează documentația dacă e nevoie

### Nu face

- Nu commit-a fișiere `.env`
- Nu folosi `console.log()` în codul de producție
- Nu hardcoda culori (folosește token-uri Tailwind)
- Nu face force push pe branch-uri partajate
- Nu sări peste testarea accesibilității
- Nu adăuga logică RBAC sau multi-user (aplicație cu un singur utilizator)
- Nu folosi framework-uri UI externe (doar Tailwind)
- Nu deploya în cloud (localhost/LAN)

---

## Ajutor

| Întrebare | Răspuns |
|-----------|---------|
| Unde găsesc token-urile de design? | [docs/1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md) — secțiunea Token-uri de design |
| Cum adaug o componentă reutilizabilă? | [docs/2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md) — Implementare componente |
| Care sunt regulile proiectului? | [CLAUDE.md](../CLAUDE.md) — secțiunea Reguli importante |
| Care e specificația fazei curente? | [SPEC.md](../SPEC.md) — verifică limitele fazei |

---

**Istoric versiuni:**
- v1.0 — 2026-05-29: Ghid contribuție inițial (framework Faza 2+)

**Pasul următor:** Faza 2 începe cu modulul Inventar DM. Citește [SPEC.md](../SPEC.md) pentru detalii.
