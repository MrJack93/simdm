# Plan de remediere — Calendar Mentenanță (Faza 3.6)

**Sursă:** Audit complet 2026-06-16 (frontend + backend, pagina `/maintenance/calendar`)
**Status:** 🟡 PROPUS — în așteptarea aprobării umane înainte de implementare
**Legătură:** [tasks/todo.md](todo.md) — secțiunea "Faza 3.6"

---

## Overview

Auditul a identificat 1 bug critic (Year View nu arată niciodată evenimente), o
neconcordanță de arhitectură (Day/Week View desenează un timeline orar pe date
care nu au niciodată oră), violări ale CLAUDE.md (texte în engleză în UI) și
ale DESIGN.md (font-weight greșit pe heading-uri), plus probleme UX/accesibilitate/
cod mort de severitate medie-mică.

Niciuna dintre cele 4 componente noi (Day/Week/Year View, Sidebar) nu are
teste — `MaintenanceCalendarPage.coverage.test.jsx` / `functions2.test.jsx`
acoperă doar Month View, modal, reschedule și PDF. Fiecare task de mai jos
care schimbă comportament include și scrierea testelor lipsă (slicing
vertical — nu se separă "implementare" de "teste").

## Decizie de arhitectură — Day/Week View + ora mentenanței

**Decizie (aprobată de user):** nu eliminăm Day/Week View și nu le simplificăm
la listă — implementăm corect *ora* mentenanței, ca să timeline-ul orar să
aibă sens real.

- `mpp_occurrences.scheduledDate` e deja `DateTime` în Prisma (schema.prisma:314)
  — **nu e nevoie de migrare**. Problema e pur la nivel de business logic:
  `getScheduledDate()` generează mereu ora 00:00 (ziua 15), iar frontend-ul
  citește un câmp fantomă `occ.scheduledTime` care nu a existat niciodată
  (de aceea totul cădea fals la 09:00 implicit în `getEventPosition`).
- Fix: planul de mentenanță capătă o **oră preferată** (editabilă la creare,
  cu default 09:00), folosită la generarea celor 12 apariții. La reprogramare,
  formularul de reschedule trece de la `<input type="date">` la
  `<input type="datetime-local">`, ca utilizatorul să poată alege și ora nouă.
- Day/Week View nu mai citesc `occ.scheduledTime` (inexistent) — citesc ora
  reală din `new Date(occ.rescheduledTo || occ.scheduledDate)`.

## Alte decizii

- **Secțiunea "Vacations"** din sidebar se elimină din UI pentru acest MVP
  (nu există entitate de vacanță în Prisma — feature fantomă, fără sursă de
  date). Dacă se dorește păstrată, e un task separat de adăugat ulterior cu
  schema + UI completă — marcat ca *open question* mai jos, nu se decide
  implicit fără confirmare.
- **`CalendarToolBar`/`CalendarViewToggle`** (cod mort) se șterg — toolbar-ul
  inline din `MaintenanceCalendarPage.jsx` e deja funcțional și singura sursă
  de adevăr.

---

## Graf de dependențe

```
Task 1 (fix keying Year View)
    │  (independent — fix izolat, nu blochează nimic)
    │
Task 2 (oră mentenanță: schema logic + generate + reschedule UI)
    │
    ├── Task 3 (Day View citește ora reală)        ─┐
    └── Task 4 (Week View citește ora reală)        ─┤ depind de Task 2
                                                       │
Task 5 (i18n RO — toate cele 4 componente)            │ independent de 2-4,
Task 6 (DESIGN.md — font-weight/font-family heading)  │ dar verificare vizuală
                                                       │ mai relevantă după 2-4
Task 7 (sidebar drawer mobil)         ─┐
Task 8 (sync mini-calendar ↔ luna principală) ─┤ independente între ele,
Task 9 (elimină secțiunea Vacations)  ─┘ dependente doar de CalendarSidebar existent

Task 10 (aria-pressed + aria-label accesibilitate)   — independent, low-risk
Task 11 (șterge cod mort CalendarToolBar)             — independent, low-risk
Task 12 (backend: toSafePdfText cleanup)              — independent, low-risk
```

Ordinea de implementare urmează graful: **Task 1 → Task 2 → (3,4) → (5,6) → (7,8,9) → (10,11,12)**.
Task-urile din aceeași paranteză pot fi paralelizate de un singur agent (fișiere
disjuncte) dar le tratăm secvențial pentru claritate de review.

---

## Task List

### Faza 1: Fix critic + fundația orei de mentenanță

#### Task 1: Fix bug Year View — keying greșit `occurrencesByDate`

**Descriere:** `CalendarYearView.jsx` indexează `occurrencesByDate[month]`
(0-11), dar `MaintenanceCalendarPage.jsx` construiește obiectul cheiat pe
dată ISO (`"2026-06-15"`). Rezultat: Year View e mereu gol. Fix: filtrăm
`occurrencesByDate` după luna fiecărei chei, în loc să indexăm direct.

**Acceptance criteria:**
- [ ] `YearMonthCard` primește ocurențele corecte pentru luna lui, indiferent de an
- [ ] Anul afișat în Year View reflectă `selectedYear`, nu se scurg ocurențe din alți ani
- [ ] Niciun regres în Month/Week/Day view

**Verificare:**
- [ ] Test nou: `frontend/src/__tests__/pages/MaintenanceCalendarPage.yearview.test.jsx` —
      creează plan cu ocurențe în mai multe luni, comută pe Year, verifică
      că fiecare card de lună arată numărul corect de evenimente
- [ ] `npm test -- --grep "Year"` verde
- [ ] Manual: `npm run dev`, Calendar Mentenanță → View Year → confirmă vizual
      că lunile cu ocurențe arată "Upcoming Events" (va deveni text RO la Task 5)

**Dependencies:** Niciuna

**Fișiere:**
- `frontend/src/components/ui/calendar-year-view.jsx`
- `frontend/src/__tests__/pages/MaintenanceCalendarPage.yearview.test.jsx` (nou)

**Scop:** S (1-2 fișiere)

---

#### Task 2: Oră de mentenanță — generare + reprogramare

**Descriere:** Planul de mentenanță capătă o oră preferată (default `09:00`),
folosită la generarea celor 12 apariții lunare. Formularul de reschedule
(drawer mobil + inline desktop) trece de la input `date` la `datetime-local`,
ca să poată seta și ora nouă la reprogramare.

**Acceptance criteria:**
- [ ] `CreatePlanModal` are un câmp opțional "Ora preferată" (default 09:00,
      `<input type="time">`)
- [ ] `POST /api/maintenance-plans/generate` acceptă `preferredTime` (opțional,
      format `HH:MM`, validat cu Zod regex), folosit în `getScheduledDate`
- [ ] Apariții generate au `scheduledDate` cu ora reală setată (nu 00:00)
- [ ] Reschedule (`PATCH /occurrence/:id/reschedule`) acceptă `newDate` ca
      datetime complet (deja suportat de `z.coerce.date()` — doar UI-ul se
      schimbă la `datetime-local`)
- [ ] Formularele de reschedule (drawer + inline) folosesc `datetime-local`
      și trimit ISO string complet cu oră

**Verificare:**
- [ ] Test backend: `maintenancePlans.test.js` — `generate` cu `preferredTime: "14:30"`
      → ocurențele create au `scheduledDate.getHours() === 14`
- [ ] Test backend: reschedule cu `newDate` incluzând oră → `rescheduledTo`
      păstrează ora exactă
- [ ] Test frontend: reschedule prin UI cu input `datetime-local` → mutația
      trimite ISO cu ora corectă
- [ ] `npm test` (backend + frontend) verde
- [ ] Manual: creează plan cu ora 14:00, verifică în DB/PDF (Formular 5 nu
      afișează ora — doar luna — deci PDF rămâne neschimbat, verifică doar
      că nu crapă generarea)

**Dependencies:** Niciuna (independent de Task 1)

**Fișiere:**
- `backend/src/routes/maintenancePlans.js`
- `backend/src/__tests__/maintenancePlans.test.js`
- `frontend/src/pages/MaintenanceCalendarPage.jsx` (CreatePlanModal + reschedule forms)
- `frontend/src/api/maintenancePlans.js` (dacă payload-ul de generate se schimbă)

**Scop:** M (3-5 fișiere)

---

#### Task 3 & 4: Day View și Week View citesc ora reală

**Descriere:** Elimină dependența pe câmpul fantomă `occ.scheduledTime`.
`CalendarDayView` și `CalendarWeekView` derivă `startHour`/`startMin` direct
din `new Date(occ.rescheduledTo || occ.scheduledDate)`.

**Acceptance criteria:**
- [ ] Evenimentele apar pe poziția orară reală din `scheduledDate`/`rescheduledTo`,
      nu mai cad implicit la 09:00
- [ ] Dacă ora e în afara intervalului 08:00-18:00, evenimentul rămâne vizibil
      (clamp la marginea cea mai apropiată) — nu se pierde silențios
- [ ] `occurrencesForDay` / `occurrencesByDate` (în `MaintenanceCalendarPage.jsx`)
      continuă să funcționeze ca sursă de date, fără schimbare de format

**Verificare:**
- [ ] Test: ocurență cu ora 14:00 → `CalendarDayView` o poziționează la
      slotul orei 14, nu la 09
- [ ] Test: ocurență cu ora 07:00 (înainte de fereastra vizibilă) → clamp la
      primul slot, nu crash/disappear
- [ ] `npm test -- --grep "CalendarDayView|CalendarWeekView"` verde
- [ ] Manual: creează ocurență la o oră specifică (din Task 2), verifică
      poziționarea vizuală în Day și Week View

**Dependencies:** Task 2

**Fișiere:**
- `frontend/src/components/ui/calendar-day-view.jsx`
- `frontend/src/components/ui/calendar-week-view.jsx`
- teste noi pentru ambele (inexistente azi)

**Scop:** M (2 componente + 2 fișiere de test)

---

### ✅ Checkpoint Faza 1

- [ ] `npm test` (backend + frontend) 100% verde
- [ ] Build frontend (`npm run build`) fără erori
- [ ] Year View arată evenimente corecte pe lună
- [ ] Day/Week View poziționează evenimentele la ora reală setată la creare/reprogramare
- [ ] **Review uman înainte de a continua la Faza 2**

---

### Faza 2: Conformitate CLAUDE.md / DESIGN.md

#### Task 5: Traducere completă în română

**Descriere:** Toate stringurile hardcodate în engleză din cele 4 componente
noi se traduc, conform regulii CLAUDE.md "Interfața în română, codul în
engleză".

**Acceptance criteria:**
- [ ] `calendar-sidebar.jsx`: "Today"→"Astăzi", "Tomorrow"→"Mâine",
      "No upcoming events"→"Nicio programare viitoare" (secțiunea Vacations
      se elimină la Task 9, nu se traduce)
- [ ] `calendar-day-view.jsx`: "Select a day to view schedule"→"Selectați o
      zi pentru a vedea programul", "event(s)"→"eveniment(e)"
- [ ] `calendar-week-view.jsx`: "Select a week..."→ echivalent RO, "Week: ..."→"Săptămâna: ..."
- [ ] `calendar-year-view.jsx`: "Year"→"Anul", "Total events"→"Total evenimente",
      "Upcoming Events"→"Evenimente programate", "+N more"→"+N mai multe"
- [ ] Niciun string vizibil utilizatorului în engleză rămas în cele 4 fișiere

**Verificare:**
- [ ] Grep manual: `rg "Today|Tomorrow|Select a|Week:|Total events|Upcoming|more\b" frontend/src/components/ui/calendar-*.jsx` → fără rezultate
- [ ] Teste existente/noi care fac assert pe text RO (actualizate dacă testau text EN)
- [ ] `npm test` verde

**Dependencies:** Niciuna (poate rula în paralel cu Faza 1, dar planificat după pentru claritate de review)

**Fișiere:**
- `frontend/src/components/ui/calendar-sidebar.jsx`
- `frontend/src/components/ui/calendar-day-view.jsx`
- `frontend/src/components/ui/calendar-week-view.jsx`
- `frontend/src/components/ui/calendar-year-view.jsx`

**Scop:** S (4 fișiere, doar text)

---

#### Task 6: Fix DESIGN.md — font-weight și font-family pe heading-uri

**Descriere:** `.calendar-day-title`, `.calendar-week-title`,
`.calendar-year-title` au `font-weight: 600` (regula cere 400) și
`.calendar-year-title` lipsește `font-family: var(--font-family-heading)`.

**Acceptance criteria:**
- [ ] Toate cele 3 clase: `font-weight: 400` + `font-family: var(--font-family-heading)`
- [ ] Vizual: heading-urile celor 3 view-uri afișează fontul serif (Cormorant Garamond),
      consistent cu restul aplicației (ex: titlul "Calendar Mentenanță")

**Verificare:**
- [ ] Build CSS fără erori (`npm run build`)
- [ ] Manual: deschide Day/Week/Year View, compară vizual fontul titlului cu
      `<h1>Calendar Mentenanță</h1>` din pagina principală — trebuie identic ca stil

**Dependencies:** Niciuna

**Fișiere:**
- `frontend/src/styles/calendar-day.css`
- `frontend/src/styles/calendar-week.css`
- `frontend/src/styles/calendar-year.css`

**Scop:** XS (3 fișiere, schimbare CSS minimă)

---

### ✅ Checkpoint Faza 2

- [ ] Niciun text EN vizibil în UI calendar
- [ ] Heading-urile respectă DESIGN.md (font serif, weight 400)
- [ ] `npm test` verde
- [ ] **Review uman înainte de a continua la Faza 3**

---

### Faza 3: UX, responsive, accesibilitate

#### Task 7: Sidebar accesibil pe mobil (drawer)

**Descriere:** Pe mobil, `CalendarSidebar` nu se randă deloc — nu există
niciun trigger vizibil. Adăugăm un buton în toolbar (vizibil doar pe mobil)
care deschide sidebar-ul în `<Drawer>` (componenta deja existentă, folosită
pentru reschedule).

**Acceptance criteria:**
- [ ] Pe mobil (`!isDesktop`), un buton (ex: iconă calendar/listă) în toolbar
      deschide un `<Drawer>` cu conținutul `CalendarSidebar` (mini-calendar +
      Astăzi/Mâine)
- [ ] Pe desktop, comportamentul actual (sidebar fix în stânga) rămâne neschimbat
- [ ] Drawer-ul se închide la selectarea unei zile din mini-calendar

**Verificare:**
- [ ] Test nou: render la `viewport` mobil (mock `useMediaQuery` → false),
      click pe buton trigger → drawer vizibil cu conținut sidebar
- [ ] `npm test -- --grep "sidebar.*mobil|mobile.*sidebar"` verde
- [ ] Manual: DevTools responsive mode (375px), verifică drawer-ul

**Dependencies:** Niciuna (poate rula în paralel cu Faza 1/2)

**Fișiere:**
- `frontend/src/pages/MaintenanceCalendarPage.jsx`
- test nou pentru acest comportament

**Scop:** S-M (1 fișier principal + test)

---

#### Task 8: Sincronizare mini-calendar sidebar ↔ luna principală

**Descriere:** `MiniCalendar` din sidebar are propriul state `sidebarMonth`,
independent de `currentMonth`/`selectedYear` din pagina principală. Se face
*controlled*: sidebar-ul primește luna curentă ca prop și raportează
schimbările prin callback, la fel cum funcționează deja `handleMonthChange`
pe calendarul principal.

**Acceptance criteria:**
- [ ] Navigarea lună-anterioară/următoare din sidebar schimbă și
      `currentMonth`/`selectedYear` din pagina principală (Month View se
      actualizează în consecință)
- [ ] Navigarea din toolbar-ul principal actualizează și luna afișată în
      mini-calendarul din sidebar
- [ ] Nicio buclă infinită de re-render (state derivat din props, nu duplicat)

**Verificare:**
- [ ] Test: schimbă luna din sidebar → verifică că grila Month View reflectă
      noua lună
- [ ] Test: schimbă luna din toolbar → verifică că mini-calendarul sidebar arată noua lună
- [ ] `npm test` verde

**Dependencies:** Niciuna

**Fișiere:**
- `frontend/src/components/ui/calendar-sidebar.jsx`
- `frontend/src/pages/MaintenanceCalendarPage.jsx`

**Scop:** S (2 fișiere)

---

#### Task 9: Elimină secțiunea "Vacations" (feature fantomă)

**Descriere:** `vacationEvents` e hardcodat `[]`, fără sursă de date reală.
Se elimină din `CalendarSidebar` (componentă + props + secțiune CSS) pentru
acest MVP, ca să nu inducă utilizatorul în eroare cu o secțiune mereu goală.

**Acceptance criteria:**
- [ ] `CalendarSidebar` nu mai acceptă/randă `vacationEvents`/secțiunea "Vacations"
- [ ] `MaintenanceCalendarPage.jsx` nu mai calculează/trece `vacationEvents`
- [ ] `isEmpty` check din sidebar nu mai include `vacationEvents.length`

**Verificare:**
- [ ] Teste existente pentru sidebar actualizate (nu mai testează secțiunea Vacations)
- [ ] `npm test` verde
- [ ] Manual: sidebar arată doar Astăzi/Mâine + empty state corect

**Dependencies:** Task 5 (i18n) — de făcut după, ca să nu traducem text care se șterge imediat

**Fișiere:**
- `frontend/src/components/ui/calendar-sidebar.jsx`
- `frontend/src/pages/MaintenanceCalendarPage.jsx`
- `frontend/src/styles/calendar-sidebar.css` (cleanup, opțional)

**Scop:** XS-S (2-3 fișiere, eliminare cod)

---

### ✅ Checkpoint Faza 3

- [ ] Sidebar funcțional și accesibil pe mobil + desktop
- [ ] Mini-calendar sincronizat bidirecțional cu luna principală
- [ ] Nicio secțiune UI fără sursă de date reală
- [ ] `npm test` verde
- [ ] **Review uman înainte de a continua la Faza 4**

---

### Faza 4: Accesibilitate + cleanup cod mort

#### Task 10: Accesibilitate — aria-pressed + aria-label

**Descriere:** View selector (day/week/month/year) nu anunță starea
"selectat" la screen-readere. Evenimentele din Day/Week View (`role="button"`)
au doar `title`, nu `aria-label`.

**Acceptance criteria:**
- [ ] Fiecare buton din view-selector are `aria-pressed={currentView === view}`
- [ ] `.timeline-event` / `.week-event` au `aria-label` descriptiv
      (ex: `"${deviceName} — ${status}, ora ${time}"`), nu doar `title`

**Verificare:**
- [ ] Test: `getByRole('button', { pressed: true })` găsește butonul activ
- [ ] Test: elementele eveniment au `aria-label` non-vid
- [ ] `npm test` verde

**Dependencies:** Task 3 & 4 (ca să existe deja ora reală în label)

**Fișiere:**
- `frontend/src/pages/MaintenanceCalendarPage.jsx`
- `frontend/src/components/ui/calendar-day-view.jsx`
- `frontend/src/components/ui/calendar-week-view.jsx`

**Scop:** S (3 fișiere)

---

#### Task 11: Șterge cod mort `CalendarToolBar`/`CalendarViewToggle`

**Descriere:** Import mort în `MaintenanceCalendarPage.jsx`, niciodată folosit
— toolbar-ul inline e singura sursă de adevăr funcțională.

**Acceptance criteria:**
- [ ] Import-ul `CalendarToolBar` eliminat din `MaintenanceCalendarPage.jsx`
- [ ] `frontend/src/components/ui/calendar-toolbar.jsx` șters (nicio altă
      referință în codebase — verificat cu grep înainte de ștergere)

**Verificare:**
- [ ] `rg "CalendarToolBar|CalendarViewToggle" frontend/src` → fără rezultate
      (în afara fișierului șters)
- [ ] `npm run build` fără erori (nicio referință orfană)
- [ ] `npm test` verde

**Dependencies:** Niciuna

**Fișiere:**
- `frontend/src/pages/MaintenanceCalendarPage.jsx`
- `frontend/src/components/ui/calendar-toolbar.jsx` (șters)

**Scop:** XS

---

#### Task 12: Backend — cleanup `toSafePdfText`

**Descriere:** Funcția e no-op (`return str || ''`), numele e înșelător
(sugerează sanitizare/escaping care nu se mai face — fonturile TTF gestionează
deja diacriticele).

**Acceptance criteria:**
- [ ] Funcția eliminată, apelurile înlocuite cu `str || ''` inline (sau,
      dacă se preferă claritate, redenumită în `withFallback`)
- [ ] Generarea PDF Formular 5 funcționează identic (diacritice intacte)

**Verificare:**
- [ ] Test existent de generare PDF rămâne verde
- [ ] Manual: descarcă Formular 5, verifică diacriticele românești în PDF

**Dependencies:** Niciuna

**Fișiere:**
- `backend/src/routes/maintenancePlans.js`

**Scop:** XS

---

### ✅ Checkpoint Final

- [ ] Toate cele 12 task-uri complete, criteriile de acceptare bifate
- [ ] `npm test` (backend + frontend) 100% verde, fără regresii
- [ ] `npm run build` (frontend) fără erori/warnings noi
- [ ] Verificare manuală end-to-end: creează plan cu oră → vezi în Month/Week/Day/Year → reprogramează cu oră nouă → PDF Formular 5 generat corect
- [ ] Re-audit rapid vizual (screenshot) pentru confirmarea fix-urilor din auditul inițial

---

## Riscuri și mitigări

| Risc | Impact | Mitigare |
|---|---|---|
| Schimbarea `scheduledDate` să includă oră reală afectează alte view-uri/rapoarte care presupun doar dată (ex: Formular 5 PDF, raportul de conformitate) | Mediu | Task 2 verifică explicit generarea PDF după schimbare; grep pe `scheduledDate` în alte rute înainte de merge |
| Sincronizarea bidirecțională sidebar↔principal (Task 8) introduce bucle de re-render | Mic-Mediu | State controlat unidirecțional (sidebar nu mai are state propriu de lună — primește prop + callback) |
| Eliminarea `CalendarToolBar` (Task 11) ratează o referință neobservată | Mic | Grep explicit înainte de ștergere, build trebuie să confirme |

## Open Questions

- **Vacations**: confirmăm definitiv eliminarea (Task 9), sau preferi să
  rămână ca placeholder vizibil ("Funcție în dezvoltare") până se decide
  modelul de date pentru concedii/indisponibilitate bioinginer?
- **Ora implicită (09:00)** pentru planuri fără `preferredTime` — e potrivită,
  sau preferi alt default (ex: 08:00, ora de începere a programului)?
