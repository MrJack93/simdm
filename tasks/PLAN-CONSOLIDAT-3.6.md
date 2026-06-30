# PLAN CONSOLIDAT — Faza 3.6: Remediere Completă Calendar Mentenanță

**Sursă:** Dublu-audit (MiMo Code + alte modele AI) — 2026-06-16  
**Status:** 🟡 PROPUS — în așteptarea aprobării umane  
**Task-uri totale:** 19 (12 din plan.md + 7 noi din auditul MiMo)  
**Durată estimată:** 8-10 zile (o persoană) / 4-5 zile (2 persoane paralel)

---

## Diferențe față de plan.md inițial

Planul inițial (12 task-uri) acoperă: Year View bug, oră mentenanță, Day/Week View, i18n, DESIGN.md, sidebar mobil, sync mini-calendar,Vacations cleanup, accesibilitate, cod mort, PDF cleanup.

**Task-uri NOI adăugate din auditul MiMo (7):**

| # | Task | Prioritate | Sursă |
|---|------|-----------|-------|
| T13 | Modal Escape key + click-outside | 🟠 M | M4, M5 |
| T14 | Cleanup `setTimeout` (memory leak) | 🟠 M | M7 |
| T15 | Stabilizează `CURRENT_YEAR` și `today` | 🟡 A | M1, A2 |
| T16 | Elimină `CalendarSlot` (dead code) | 🟢 B | M9 |
| T17 | Fix `has-events` rgba pentru dark mode | 🟢 B | A7, A8 |
| T18 | Separă `CreatePlanModal` în fișier propriu | 🟢 B | A1 |
| T19 | Log eroare reală în catch PDF | 🟢 B | M2 |

---

## Graf de dependențe complet

```
T1 (Year View fix)                    ─ independent
T2 (oră mentenanță: schema + UI)      ─ independent
    ├── T3 (Day View ora reală)        ─ dependent de T2
    └── T4 (Week View ora reală)       ─ dependent de T2
T5 (i18n RO completă)                 ─ independent (verificare vizuală mai relevantă după T2-T4)
T6 (DESIGN.md heading-uri)            ─ independent
T7 (sidebar drawer mobil)             ─ independent
T8 (sync mini-calendar)               ─ independent
T9 (elimină Vacations)                ─ dependent de T5 (nu traduci text ce se șterge)
T10 (aria-pressed/aria-label)         ─ dependent de T3,T4
T11 (șterge CalendarToolBar)          ─ independent
T12 (cleanup toSafePdfText)           ─ independent
T13 (Modal Escape + click-outside)    ─ independent
T14 (cleanup setTimeout)              ─ independent
T15 (stabilize CURRENT_YEAR + today)  ─ independent
T16 (elimină CalendarSlot)            ─ independent
T17 (fix has-events dark mode)        ─ independent
T18 (separă CreatePlanModal)          ─ independent
T19 (log eroare catch PDF)            ─ independent
```

**Ordine de implementare:**
```
Runda 1 (paralel): T1, T2, T6, T11, T12, T13, T14, T15, T16, T17, T18, T19
Runda 2 (dependent de T2): T3, T4
Runda 3 (paralel): T5, T7, T8
Runda 4 (dependent de T5): T9
Runda 5 (dependent de T3,T4): T10
Checkpoint final
```

---

## FAZA 1: Fix Critic + Fundația Orei de Mentenanță

### T1: Fix bug Year View — keying greșit `occurrencesByDate`

**Problema:** `CalendarYearView.jsx:122` accesează `occurrencesByDate[month]` (0-11), dar obiectul e cheiat pe dată ISO (`"2026-06-15"`). Year View e mereu gol.

**Soluție:** Filtrăm `occurrencesByDate` după luna fiecărei chei ISO.

**Fișiere:**
- `frontend/src/components/ui/calendar-year-view.jsx` — schimbă `occurrences={occurrencesByDate[month] || []}` în filtrare după lună
- `frontend/src/__tests__/pages/MaintenanceCalendarPage.yearview.test.jsx` (nou)

**Acceptance criteria:**
- [ ] `YearMonthCard` primește ocurențele corecte pentru luna sa
- [ ] Niciun regres în Month/Week/Day view
- [ ] Test: plan cu ocurențe în mai multe luni → Year View afișează corect

**Scop:** S | **Risc:** Mic

---

### T2: Oră de mentenanță — generare + reprogramare

**Problema:** `getScheduledDate()` generează mereu ora 00:00. Day/Week View citesc `occ.scheduledTime` (câmp fantomă ce nu există).

**Soluție:** Planul capătă `preferredTime` (default 09:00). Generate și reschedule folosesc `datetime-local`.

**Fișiere:**
- `backend/src/routes/maintenancePlans.js` — adaugă `preferredTime` în Zod schema, modifică `getScheduledDate()`
- `backend/src/__tests__/maintenancePlans.test.js`
- `frontend/src/pages/MaintenanceCalendarPage.jsx` — `CreatePlanModal` + reschedule forms → `datetime-local`
- `frontend/src/api/maintenancePlans.js` (dacă payload-ul se schimbă)

**Acceptance criteria:**
- [ ] `CreatePlanModal` are câmp "Ora preferată" (default 09:00, `<input type="time">`)
- [ ] `POST /generate` acceptă `preferredTime` (opțional, `HH:MM`, Zod regex)
- [ ] Apariții generate au `scheduledDate` cu ora reală (nu 00:00)
- [ ] Reschedule folosește `datetime-local` (drawer + inline)
- [ ] Test backend: generate cu `preferredTime: "14:30"` → `getHours() === 14`
- [ ] Test backend: reschedule cu datetime → păstrează ora exactă
- [ ] PDF Formular 5 nu crapă (nu afișează ora, doar luna)

**Scop:** M | **Risc:** Mediu (schimbare de business logic)

---

### T3 & T4: Day View și Week View — ora reală

**Problema:** `CalendarDayView` și `CalendarWeekView` derivă `startHour`/`startMin` din `occ.scheduledTime` (inexistent). Totul cade la 09:00.

**Soluție:** Citește ora direct din `new Date(occ.rescheduledTo || occ.scheduledDate)`. Clamp dacă e în afara ferestrei 08:00-18:00.

**Fișiere:**
- `frontend/src/components/ui/calendar-day-view.jsx`
- `frontend/src/components/ui/calendar-week-view.jsx`
- Teste noi pentru ambele

**Acceptance criteria:**
- [ ] Evenimentele apar la ora reală din `scheduledDate`
- [ ] Ora în afara 08:00-18:00 → clamp (nu dispar silențios)
- [ ] Test: ora 14:00 → poziționat la slotul 14, nu la 09
- [ ] Test: ora 07:00 → clamp la primul slot

**Dependență:** T2 | **Scop:** M | **Risc:** Mic

---

## FAZA 2: Conformitate CLAUDE.md / DESIGN.md

### T5: Traducere completă în română

**Fișiere:**
- `calendar-sidebar.jsx`: "Today"→"Astăzi", "Tomorrow"→"Mâine", "No upcoming events"→"Nicio programare viitoare"
- `calendar-day-view.jsx`: "Select a day..."→"Selectați o zi...", "event(s)"→"eveniment(e)"
- `calendar-week-view.jsx`: "Select a week..."→"Selectați o săptămână...", "Week:"→"Săptămâna:"
- `calendar-year-view.jsx`: "Year"→"Anul", "Total events"→"Total evenimente", "Upcoming Events"→"Evenimente programate", "+N more"→"+N mai multe"

**Verificare:**
- [ ] `rg "Today|Tomorrow|Select a|Week:|Total events|Upcoming|more\b" frontend/src/components/ui/calendar-*.jsx` → 0 rezultate
- [ ] Teste existente actualizate pentru text RO

**Scop:** S | **Risc:** Mic

---

### T6: Fix DESIGN.md — font-weight și font-family pe heading-uri

**Problema:** `.calendar-day-title`, `.calendar-week-title`, `.calendar-year-title` au `font-weight: 600` (regula cere 400) și font-serif lipsă.

**Fișiere:**
- `calendar-day.css` — `.calendar-day-title`: `font-weight: 400` + `font-family: var(--font-family-heading)`
- `calendar-week.css` — `.calendar-week-title`: la fel
- `calendar-year.css` — `.calendar-year-title`: la fel

**Scop:** XS | **Risc:** Mic

---

## FAZA 3: UX, Responsive, Accesibilitate

### T7: Sidebar accesibil pe mobil (drawer)

**Problema:** Pe mobil, sidebar-ul nu se randează deloc, fără trigger vizibil.

**Soluție:** Buton în toolbar (vizibil doar pe mobil) → `<Drawer>` cu conținutul `CalendarSidebar`.

**Fișiere:**
- `MaintenanceCalendarPage.jsx` — adaugă buton trigger + Drawer wrapper
- Test nou (mock `useMediaQuery` → false)

**Acceptance criteria:**
- [ ] Mobil: buton în toolbar → drawer cu mini-calendar + Astăzi/Mâine
- [ ] Desktop: sidebar fix neschimbat
- [ ] Drawer se închide la selectarea unei zile

**Scop:** S-M | **Risc:** Mic

---

### T8: Sincronizare mini-calendar sidebar ↔ luna principală

**Problema:** `MiniCalendar` are state propriu `sidebarMonth`, independent de `currentMonth`/`selectedYear`.

**Soluție:** Controlled: sidebar primește luna curentă ca prop, raportează schimbările prin callback.

**Fișiere:**
- `calendar-sidebar.jsx` — `MiniCalendar` devine controlled
- `MaintenanceCalendarPage.jsx` — pas luna curentă + callback

**Acceptance criteria:**
- [ ] Navigare din sidebar schimbă și luna principală
- [ ] Navigare din toolbar actualizează mini-calendarul
- [ ] Nicio buclă infinită de re-render

**Scop:** S | **Risc:** Mediu (bidirecțional sync)

---

### T9: Elimină secțiunea "Vacations" (feature fantomă)

**Problema:** `vacationEvents` e hardcoded `[]`, fără sursă de date. Secțiunea mereu goală induce în eroare.

**Fișiere:**
- `calendar-sidebar.jsx` — elimină `vacationEvents` prop + secțiunea "Vacations"
- `MaintenanceCalendarPage.jsx` — elimină calculul/trecerea `vacationEvents`
- `calendar-sidebar.css` — cleanup opțional

**Dependență:** T5 (nu traduci text ce se șterge) | **Scop:** XS | **Risc:** Mic

---

## FAZA 4: Accesibilitate + Cleanup

### T10: Accesibilitate — aria-pressed + aria-label

**Fișiere:**
- `MaintenanceCalendarPage.jsx` — view selector: `aria-pressed={currentView === view}`
- `calendar-day-view.jsx` — `.timeline-event`: `aria-label` descriptiv cu oră
- `calendar-week-view.jsx` — `.week-event`: `aria-label` descriptiv cu oră

**Dependență:** T3, T4 | **Scop:** S | **Risc:** Mic

---

### T11: Șterge cod mort `CalendarToolBar`/`CalendarViewToggle`

**Fișiere:**
- `MaintenanceCalendarPage.jsx` — elimină import
- `calendar-toolbar.jsx` — ȘTERS (verifică grep înainte)

**Verificare:** `rg "CalendarToolBar|CalendarViewToggle" frontend/src` → 0 rezultate | `npm run build` OK

**Scop:** XS | **Risc:** Mic

---

### T12: Backend — cleanup `toSafePdfText`

Funcția e no-op. Eliminare sau redenumire în `withFallback`.

**Fișiere:** `backend/src/routes/maintenancePlans.js`

**Scop:** XS | **Risc:** Mic

---

### T13 (NOU): Modal Escape key + click-outside-to-close

**Problema:** `CreatePlanModal` (linia 802) nu se închide la Escape sau click pe backdrop.

**Soluție:** 
- `useEffect` pentru Escape key listener
- onClick pe backdrop (`div.fixed.inset-0`) să apeleze `onClose`

**Fișiere:** `MaintenanceCalendarPage.jsx`

**Acceptance criteria:**
- [ ] Tasta Escape închide modalul
- [ ] Click pe backdrop (zona întunecată) închide modalul
- [ ] Focus trap: Tab rămâne în modal cât e deschis

**Scop:** XS | **Risc:** Mic

---

### T14 (NOU): Cleanup `setTimeout` (memory leak)

**Problema:** `MaintenanceCalendarPage.jsx:173,185` — `setTimeout` fără cleanup când componenta se demontează.

**Soluție:** `useEffect` cu cleanup return `clearTimeout`.

```jsx
useEffect(() => {
  if (successMsg) {
    const timer = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(timer);
  }
}, [successMsg]);
```

**Fișiere:** `MaintenanceCalendarPage.jsx`

**Scop:** XS | **Risc:** Mic

---

### T15 (NOU): Stabilizează `CURRENT_YEAR` și `today`

**Probleme:**
1. `CURRENT_YEAR` (linia 82) e constantă module-level — nu se actualizează la midnight
2. `today` (linia 280) e `new Date()` creat la fiecare render — `useMemo` pe `todayEvents`/`tomorrowEvents` se re-calculă mereu

**Soluție:**
```jsx
// CURRENT_YEAR → calculat o dată la mount
const [currentYear] = useState(() => new Date().getFullYear());

// today → stabilizat cu useRef
const todayRef = useRef(new Date());
const today = todayRef.current;
```

**Fișiere:** `MaintenanceCalendarPage.jsx`

**Scop:** XS | **Risc:** Mic

---

### T16 (NOU): Elimină `CalendarSlot` (dead code)

**Problema:** `CalendarSlot` e exportată din `calendar-slot.jsx` dar niciodată importată în pagină.

**Soluție:** Elimină exportul `CalendarSlot` (păstrează `CalendarEventIndicator`).

**Fișiere:** `calendar-slot.jsx`

**Scop:** XS | **Risc:** Mic

---

### T17 (NOU): Fix `has-events` rgba pentru dark mode

**Probleme:**
- `calendar-day.css:116`: `rgba(0, 0, 0, 0.02)` — hardcoded
- `calendar-week.css:158`: `rgba(0, 0, 0, 0.02)` — hardcoded

**Soluție:** Folosește token CSS sau variabile:
```css
.timeline-hour-cell.has-events {
  background-color: var(--color-bg-secondary);
  opacity: 0.5;
}
```
Sau reguli separate pentru dark mode (deja există pattern-ul în fișiere).

**Fișiere:** `calendar-day.css`, `calendar-week.css`

**Scop:** XS | **Risc:** Mic

---

### T18 (NOU): Separă `CreatePlanModal` în fișier propriu

**Problema:** `MaintenanceCalendarPage.jsx` are 900 linii. Modalul de creare (124 linii) e independent.

**Soluție:** Extrage `CreatePlanModal` în `frontend/src/components/CreatePlanModal.jsx`.

**Fișiere:**
- `frontend/src/components/CreatePlanModal.jsx` (nou)
- `MaintenanceCalendarPage.jsx` — import componentă

**Scop:** S | **Risc:** Mic

---

### T19 (NOU): Log eroare reală în catch PDF

**Problema:** `MaintenanceCalendarPage.jsx:218` — `catch` fără parametru, nu se loghează eroarea.

**Soluție:**
```jsx
} catch (error) {
  console.error('PDF download error:', error);
  setPdfError('Nu există planuri pentru acest an sau eroare la generare.');
}
```

**Fișiere:** `MaintenanceCalendarPage.jsx`

**Scop:** XS | **Risc:** Mic

---

## Checkpoint Final

- [ ] Toate cele 19 task-uri complete
- [ ] `npm test` (backend + frontend) 100% verde
- [ ] `npm run build` (frontend) fără erori
- [ ] Verificare manuală E2E: creează plan cu oră → Month/Week/Day/Year → reschedule cu oră nouă → PDF
- [ ] Niciun text EN vizibil în UI
- [ ] Heading-urile respectă DESIGN.md (serif, weight 400)
- [ ] Modal închide la Escape + click-outside
- [ ] Dark mode funcțional peste tot

---

## Riscuri și Mitigări

| Risc | Impact | Mitigare |
|------|--------|----------|
| `preferredTime` afectează Formular 5 PDF | Mediu | PDF nu afișează ora — verificare explicită |
| Sync bidirecțional sidebar↔principal (T8) | Mediu | State controlat unidirecțional |
| ștergere `CalendarToolBar` ratează referință | Mic | Grep + build înainte de commit |
| `datetime-local` input diferit cross-browser | Mic | Testare în Chrome + Firefox + Safari |
| Separare `CreatePlanModal` (T18) | Mic | Doar mutare fișier, fără schimbare logică |

---

## Open Questions (de la plan.md inițial)

1. **Vacations:** Eliminare completă (recomandat) sau placeholder "În dezvoltare"?
2. **Ora implicită 09:00:** E potrivită sau preferi 08:00 (început program)?
3. **Focus trap pe modal (T13):** Implementăm complet sau doar Escape + click-outside?

---

**Creat:** 2026-06-16  
**Bază:** plan.md (12 task-uri) + audit MiMo (7 task-uri noi)  
**Aprobare necesară:** Da — înainte de orice implementare
