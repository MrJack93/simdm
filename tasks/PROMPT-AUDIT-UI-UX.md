# Prompt — Audit UI/UX SIMDM (best practices 2026)

> Copiază blocul de mai jos în CLI/agent. Rulează auditul pe aplicația SIMDM (frontend React 19 + Tailwind 4 + Shadcn, temă cream/coral cu dark mode, UI în română, folosită de bioinginer inclusiv pe teren/mobil).

---

## PROMPT

Ești un auditor senior UI/UX. Efectuează un **audit UI/UX profund, la standard 2026**, al aplicației web SIMDM (management de dispozitive medicale pentru o clinică privată; un singur utilizator — bioinginerul; interfață în română; React 19 + Tailwind 4 + Shadcn/UI; temă cream/coral cu dark mode prin `[data-theme="dark"]`; rulează pe localhost/LAN; folosită pe desktop ȘI pe mobil, pe teren).

### Context & surse de adevăr (citește mai întâi)
- Token-uri & reguli de design: `DESIGN.md` (rădăcină) + `docs/DESIGN-SYSTEM.md` + `frontend/src/design-system.css` + `frontend/src/tokens.json`.
- Țintă accesibilitate: WCAG 2.2 AA — vezi `docs/ACCESSIBILITY-CHECKLIST.md`.
- Fluxuri mobile pe teren: `docs/MOBILE_WORKFLOW_GUIDE.md`.
- Pagini de auditat (fiecare, ÎN AMBELE moduri — light/cream ȘI dark): Login, Dashboard, InventoryPageV2, DeviceForm, ConsumablesPage, AnnualInventoryPage, MaintenancePage, MaintenanceCalendarPage, MppExecutionForm, RepairTicketsPage (+ TriageModal/TicketDetailsModal/RepairModal), VerificationsPage, ServiceContractsPage, IncidentsPage, AuditLogsPage, SettingsPage.

### Cum îl rulezi (tool-urile automate prind doar ~30% — fă și treceri manuale)
1. Pornește aplicația (`docker-compose up` sau backend+frontend `npm run dev`), loghează-te și parcurge fiecare pagină de mai sus.
2. **Trecere vizuală** la desktop (1440px), tabletă (768px), mobil (375px) — și repetă în dark mode.
3. **Trecere doar cu tastatura** (Tab/Shift+Tab/Enter/Esc/Săgeți) — fără mouse.
4. **Trecere cu screen reader** (NVDA) pe cele 3 fluxuri principale: adaugă dispozitiv → generează plan MPP → execută MPP.
5. **Verificări automate**: rulează axe-core / Lighthouse (accesibilitate + performanță) per pagină; folosește WebAIM contrast checker pe perechile semnalate.
6. Verifică fiecare problemă față de token-urile de design — orice culoare/spațiere hardcodată care ocolește `var(--…)` este o problemă.

### Ce să inspectezi (scop)
**A. Layout & claritate vizuală**
- Elemente suprapuse (un element randat peste altul, coliziuni de z-index, modale/toast-uri care acoperă controale).
- Spațiere & ritm: padding/margin insuficient între containere, carduri, câmpuri de formular; spații inconsistente față de token-urile de spacing; tabele înghesuite pe mobil.
- Aliniere, ierarhie vizuală, densitate; trunchiere/overflow al textelor lungi în română & al diacriticelor.

**B. Interacțiune & stări**
- Stări de hover: culori de hover lipsă/inconsistente pe butoane, link-uri, rânduri de tabel, elemente de meniu; hover care nu folosește `--color-accent-hover`.
- Toate stările interactive prezente și distincte: default / hover / focus / active / disabled / loading.
- Vizibilitatea focus-ului (inel coral) pe FIECARE element interactiv; ordine logică de tab; fără capcane de tastatură; Esc închide modalele.
- Feedback: loading-ul folosește skeleton-uri (nu spinner-e) unde e specificat; toast-uri de succes/eroare; optimist vs blocant.

**C. Consistență & design system**
- Conformitate cu token-urile: semnalează hex hardcodat (`#…`) și clase Tailwind de culoare hardcodate; trebuie să folosească `var(--color-*)`.
- Heading-uri serif (Cormorant) pe h1–h3; body Inter; variante consistente de button/input/card.
- **Paritate dark mode**: fiecare pagină complet lizibilă în dark mode — semnalează în special fundaluri fixe `#ffffff` și text închis fix (`#1a1a1a`/`#141413`) care nu se adaptează.

**D. Accesibilitate (WCAG 2.2 AA — Perceptibil/Operabil/Inteligibil/Robust)**
- Contrast ≥ 4.5:1 (text) / 3:1 (text mare & componente UI), în AMBELE teme.
- HTML semantic, ordinea heading-urilor, `<label>` pentru fiecare input, roluri ARIA (`status`/`alert`/`dialog`), text alternativ.
- Mărime țintă ≥ 24×24 px CSS (WCAG 2.2) / 44px touch pe mobil; reduced-motion respectat; mod forced-colors utilizabil.
- Formulare: identificare clară a erorilor, mesaje inline, indicarea câmpurilor obligatorii, recuperare după eroare.

**E. Navigare & conținut**
- Găsibilitate, navigare consistentă, breadcrumbs/stare activă; empty states pe fiecare vedere cu date; titluri clare de pagină.
- Claritatea microcopy-ului în română; terminologie consistentă cu Ghidul (MPP, MC, verificare, casare); fără texte netraduse.

**F. Mobil / responsive (utilizare pe teren)**
- Fără scroll orizontal; tabele → carduri pe ecrane mici; ținte de atingere; acțiuni principale accesibile; calendar & pad de semnătură utilizabile pe touch.

**G. Performanță & robustețe (cu impact pe UX)**
- Deplasări de layout (CLS) din conținut încărcat târziu; liste/tabele mari lente; imagini base64 mari; sclipiri de conținut nestilizat/temă greșită la încărcare.

**H. Dark patterns / încredere (2026)**
- Fără fluxuri înșelătoare, fără acțiuni distructive accidentale fără confirmare (ștergeri/casare trebuie confirmate), fără stări disabled derutante.

### Severitate & prioritizare
Evaluează fiecare problemă: 🔴 Critică (blochează o sarcină / inaccesibil) · 🟠 Mare (fricțiune semnificativă) · 🟡 Medie (polish) · 🔵 Mică (nice-to-have). Sortează raportul după severitate. Notează pagina + fișierul componentei exact (ex. `frontend/src/pages/ConsumablesPage.jsx:512`) și dacă apare în light, dark sau ambele.

### Format de output
Începe cu: un rezumat executiv de 3 rânduri + un tabel cu numărul de probleme pe severitate + matricea dispozitiv/temă/tool-uri pe care chiar le-ai testat. Apoi o listă numerotată; pentru FIECARE problemă:

1. **Descrierea problemei:** [ce anume e greșit — fii specific, numește pagina/componenta/linia]
2. **Unde:** [pagină · componentă:linie · light/dark/ambele · viewport]
3. **Impact asupra UI/UX:** [de ce dăunează utilizatorului / ce heuristică sau criteriu WCAG încalcă]
4. **Îmbunătățire sugerată:** [fix concret folosind token-urile noastre + best practice; include token-ul sau modificarea de cod]

Încheie cu: o listă prioritizată „de reparat primele" (top 10) și eventualele cauze sistemice de fond (ex. „paginile din Faza 2 ocolesc token-urile").

### Reguli
- Fii temeinic și specific; prioritizează feedback acționabil, nu sfaturi generice.
- Referă token-urile și convențiile noastre (`CLAUDE.md`, `DESIGN.md`) în fiecare fix.
- Nu inventa probleme — raportează doar ce ai observat efectiv; marchează orice nu poate fi verificat fără browser ca „necesită verificare manuală".
- NU modifica cod în această trecere — produ doar raportul de audit (salvează ca `docs/AUDIT-UI-UX-2026.md`).

---
