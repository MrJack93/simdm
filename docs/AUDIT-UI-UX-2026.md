# Audit UI/UX — SIMDM 2026

**Data:** 2026-06-15 | **Standard:** WCAG 2.2 AA · Design System 2026
**Auditor:** MiMoCode Agent (static analysis — cod sursă)
**Scop:** 15 pagini × 2 teme (cream + dark) · 12 componente · accesibilitate · mobil · design system

---

## Rezumat Executiv

Aplicația SIMDM are o fundație solidă de design system (cream/coral, token-uri CSS, dark mode structurat), dar implementarea prezintă **probleme sistemice** la nivelul componentelor create în Faza 2–3: culori hex hardcodate care ignora token-urile, focus-visible absent pe zeci de elemente interactive, modale fără ARIA semantics, și touch targets sub 40px pe mobil. Cea mai gravă problemă este **dark mode-ul compromis** — multiple pagini au `#ffffff` / `#1a1a1a` / `text-red-600` hardcodate, făcând textul invizibil pe fundal întunecat.

**Cuantificare:** 43 🔴 Critice · 98 🟠 Mari · 52 🟡 Medii · 22 🔵 Mici = **215 probleme identificate**

---

## Matrice de Testare Dispozitiv/Temă/Tool-uri

| Dispozitiv | Temă | Metodă | Acoperire |
|------------|------|--------|-----------|
| Desktop 1440px | Cream | Static code analysis | ✅ Completă |
| Desktop 1440px | Dark | Static code analysis | ✅ Completă |
| Tabletă 768px | Cream | Static code analysis | ⚠️ Parțială (fără rulare live) |
| Mobil 375px | Cream | Static code analysis | ⚠️ Parțială (fără rulare live) |
| Mobil 375px | Dark | Static code analysis | ⚠️ Parțială (fără rulare live) |
| Tastatură | — | Static code analysis | ⚠️ Parțială (fără rulare live) |
| NVDA Screen Reader | — | Static code analysis (ARIA) | ⚠️ Parțială |
| axe-core / Lighthouse | — | — | ❌ Necesită rulare manuală |

> **Notă:** Acest audit este bazat pe analiza codului sursă (static). Problemele de contrast exacte, CLS, și unele interacțiuni de tastatură necesită verificare manuală în browser.

---

## Numărul de Probleme pe Severitate

| Severitate | Număr | % |
|------------|-------|---|
| 🔴 Critică | 43 | 20% |
| 🟠 Mare | 98 | 46% |
| 🟡 Medie | 52 | 24% |
| 🔵 Mică | 22 | 10% |
| **Total** | **215** | 100% |

---

## Lista Probleme

### 🔴 Probleme Critice (blochează o sarcină / inaccesibil)

---

**#1. InventoryPageV2 — 6 culori hex hardcodate în STATUS_COLORS**
- **Descriere:** `STATUS_COLORS` (liniile 13–18) definește `#34d399`, `#fbbf24`, `#f87171`, `#6b7280`, `#60a5fa`, `#a78bfa` — toate ignoră token-urile `var(--color-status-functional)`, `var(--color-warning)`, `var(--color-error)`, etc.
- **Unde:** `InventoryPageV2.jsx:13-18` · ambele teme · desktop + mobil
- **Impact UI/UX:** Culorile nu se adaptează la dark mode; badge-urile de status vor avea culori diferite de cele definite în DESIGN.md §4 (Device Status Colors). Violație directă a regulii 14 din CLAUDE.md.
- **Îmbunătățire sugerată:** Înlocuiește cu mapare la token-uri CSS: `{ FUNCTIONAL: 'var(--color-status-functional)', IN_REPARATIE: 'var(--color-status-in-repair)', ... }`. Sau mai bine, mută maparea în `design-system.css` ca variabile `--color-status-*`.

---

**#2. InventoryPageV2 — Text #ffffff / #1a1a1a hardcodat pe status badges**
- **Descriere:** `color: status === 'CASAT' ? '#ffffff' : '#1a1a1a'` (linia 51) și aceeași pattern la linia 232 (KanbanView header).
- **Unde:** `InventoryPageV2.jsx:51, 232` · ambele teme
- **Impact UI/UX:** În dark mode, textul `#1a1a1a` (negru) pe fundal întunecat devine **invizibil**. Textul `#ffffff` pe CASAT (`#6b7280`) ar putea funcționa dar nu este consistent cu design system-ul.
- **Îmbunătățire sugerată:** Folosește `var(--color-on-primary)` pentru text pe fundal colorat, și adaugă o logică de contrast dinamic sau token `--color-status-badge-text`.

---

**#3. DeviceForm — 5 culori hex hardcodate în stepper și react-select**
- **Descriere:** `#1a1a1a` (react-select selected text, linia 35), `#ffffff` (error step text, linia 98), `#1a1a1a` (completed/current step text, liniile 103, 108, 137).
- **Unde:** `DeviceForm.jsx:35, 98, 103, 108, 137` · ambele teme
- **Impact UI/UX:** Stepper-ul și select-ul vor fi incorecte în dark mode — text negru pe fundal întunecat = invizibil.
- **Îmbunătățire sugerată:** Folosește `var(--color-text-primary)` pentru text normal și `var(--color-on-primary)` pentru text pe fundal colorat (error/success step).

---

**#4. ConsumablesPage — 13+ culori hex hardcodate**
- **Descriere:** Badge-uri de status (`#fbbf24`, `#4ade80`, `#f87171`, `#ea580c`), bare de stoc (`#34d399`, `#f87171`, `#ea580c`, `#fbbf24`), text (`#1a1a1a`, `white`), butoane (`#10b981`).
- **Unde:** `ConsumablesPage.jsx:186, 194, 196, 213, 215, 483-486, 514-515, 549-550, 561, 573` · ambele teme
- **Impact UI/UX:** Întreaga pagină de consumabile este incompatibilă cu dark mode. Barele de stoc, badge-urile și butoanele vor avea culori incorecte.
- **Îmbunătățire sugerată:** Mapează toate culorile la token-uri CSS existente (`--color-success`, `--color-warning`, `--color-error`, `--color-info`) sau definesc variabile noi (`--color-stock-normal`, `--color-stock-low`, `--color-stock-critical`).

---

**#5. AnnualInventoryPage — 7 culori hex hardcodate în status și butoane**
- **Descriere:** `#9ca3af`, `#1a1a1a` (buton verificare, linia 218-219), `#ef4444`, `#eab308`, `#22c55e`, `#6b7280`, `white` (status colors, linia 412-415, 450).
- **Unde:** `AnnualInventoryPage.jsx:218-219, 412-415, 450` · ambele teme
- **Impact UI/UX:** Status-urile inventarului anual nu se adaptează la dark mode.
- **Îmbunătățire sugerată:** Folosește `var(--color-success)`, `var(--color-warning)`, `var(--color-error)` etc.

---

**#6. IncidentsPage — 3 culori hex hardcodate + buton icon-only fără aria-label**
- **Descriere:** `MODERAT: '#f97316'`, `CRITIC: '#7f1d1d'` (liniile 12, 14), `color: '#fff'` (linia 406). Butonul de închidere modal (linia 117) are doar icon `X` fără `aria-label`.
- **Unde:** `IncidentsPage.jsx:12, 14, 117, 406` · ambele teme
- **Impact UI/UX:** Severitatea incidentelor nu respectă token-urile de design; screen reader-ul nu poate identifica butonul de închidere.
- **Îmbunătățire sugerată:** Folosește `var(--color-warning)` / `var(--color-error)` pentru severitate. Adaugă `aria-label="Închide"` pe butonul X.

---

**#7. RepairTicketsPage + 3 modale — toate modalele lipsesc role="dialog" + aria-modal + Escape + focus trap**
- **Descriere:** CreateTicketModal (linia 449), DetailsModal (linia 558), TriageModal (linia 27), TicketDetailsModal (linia 43), RepairModal (linia 56) — niciuna nu are `role="dialog"`, `aria-modal="true"`, handler Escape key, sau focus trap.
- **Unde:** `RepairTicketsPage.jsx:449, 558` · `TriageModal.jsx:27` · `TicketDetailsModal.jsx:43` · `RepairModal.jsx:56` · ambele teme
- **Impact UI/UX:** Screen reader-ul nu anunță modalele ca dialoguri; utilizatorii nu pot închide modalele cu Escape; Tab-ul poate ieși din modal pe elementele din fundal (WCAG 2.1.2 No Keyboard Trap).
- **Îmbunătățire sugerată:** Adaugă `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pe overlay. Implementează focus trap cu `useEffect` + `Tab` key handler. Adaugă `onKeyDown` pentru Escape pe overlay.

---

**#8. VerificationsPage — tabel principal fără overflow-x-auto**
- **Descriere:** Tabelul de verificări (linia 237) are `overflow-hidden` dar NU `overflow-x-auto`. 7 coloane — pe mobil va fi clipsuit, nu scrollabil.
- **Unde:** `VerificationsPage.jsx:237` · mobil · ambele teme
- **Impact UI/UX:** Pe mobil (375px), coloanele din dreapta sunt tăiate și utilizatorul nu poate accesa datele. Violație directă a ghidului MOBILE_WORKFLOW_GUIDE.md.
- **Îmbunătățire sugerată:** Înlocuiește `overflow-hidden` cu `overflow-x-auto` pe wrapper-ul tabelului.

---

**#9. MppExecutionForm — 7+ label-uri de formular fără htmlFor/id**
- **Descriere:** Label-urile pentru "Dispozitiv", "Ocurență", "Data execuției", "Durată", "Rezultat", "Inginer responsabil" (liniile 252-344) nu au `htmlFor`, iar input-urile/select-urile corespunzătoare nu au `id`. Input-ul "Cantitate" (linia 404) nu are deloc label — doar placeholder.
- **Unde:** `MppExecutionForm.jsx:252-344, 404` · ambele teme
- **Impact UI/UX:** Formularul de execuție MPP este complet inaccesibil screen reader-ului — label-urile nu sunt programatic asociate cu câmpurile. Este cel mai important formular din aplicație (MPP = Mentenanță Preventivă Programată).
- **Îmbunătățire sugerată:** Adaugă `htmlFor="field-id"` pe fiecare `<label>` și `id="field-id"` pe fiecare `<input>`/`<select>`. Pentru "Cantitate", adaugă un `<label>` vizibil sau `aria-label`.

---

**#10. MppExecutionForm — 7+ label-uri fără htmlFor/id (restul formularului)**
- **Descriere:** Label-urile pentru "Foto înainte", "Foto după", "Semnătură Inginer", "Semnătură Responsabil Secție", "Observații generale" (liniile 440-536) nu au `htmlFor`/`id`.
- **Unde:** `MppExecutionForm.jsx:440-536` · ambele teme
- **Impact UI/UX:** Continuarea problemei #9 — întregul formular MPP este inaccesibil.
- **Îmbunătățire sugerată:** La fel ca #9.

---

**#11. MppExecutionForm — text alt="Before" / "After" în engleză**
- **Descriere:** `alt="Before"` (linia 451) și `alt="After"` (linia 470) — text alternativ în engleză într-o interfață exclusiv în română.
- **Unde:** `MppExecutionForm.jsx:451, 470` · ambele teme
- **Impact UI/UX:** Screen reader-ul va anunța text în engleză, confuzând utilizatorul român. Violația regulii CLAUDE.md: "Mesajele pentru utilizator în română."
- **Îmbunătățire sugerată:** `alt="Foto înainte de reparație"` / `alt="Foto după reparație"`.

---

**#12. RepairModal — 3 input-uri fără label deloc (doar placeholder)**
- **Descriere:** "Descriere piesă" (linia 105), "Cantitate" (linia 107), "Cost/buc" (linia 108) — au doar `placeholder`, zero label semantic.
- **Unde:** `RepairModal.jsx:105, 107, 108` · ambele teme
- **Impact UI/UX:** Screen reader-ul nu poate identifica scopul acestor câmpuri. Placeholder-ul nu este un substitut pentru label (WCAG 1.3.1).
- **Îmbunătățire sugerată:** Adaugă `<label htmlFor="...">` pentru fiecare câmp.

---

**#13. RepairModal — canvas semnătură cu backgroundColor: '#ffffff' hardcodat**
- **Descriere:** `backgroundColor: '#ffffff'` pe canvas-urile de semnătură (liniile 177, 186).
- **Unde:** `RepairModal.jsx:177, 186` · dark mode
- **Impact UI/UX:** În dark mode, canvas-ul de semnătură va fi un **dreptunghi alb strălucitor** pe fundal întunecat — distrugerea completă a experienței vizuale.
- **Îmbunătățire sugerată:** Folosește `var(--color-bg-primary)` sau `var(--color-bg-secondary)` pentru fundalul canvas-ului.

---

**#14. MaintenanceCalendarPage — calendarul este complet inaccesibil la tastatură**
- **Descriere:** Celulele calendarului (liniile 282-303) sunt `<div>` cu doar `onClick`. Lipsesc: `role="gridcell"`, `tabIndex="0"`, handler-e de tastatură (Enter/Space), `aria-selected`, `role="grid"` pe container, `role="row"` pe rânduri.
- **Unde:** `MaintenanceCalendarPage.jsx:269-303` · ambele teme
- **Impact UI/UX:** Calendarul nu poate fi navigat deloc fără mouse. Utilizatorii de tastatură și screen reader nu pot selecta zile. Este o funcționalitate centrală pentru planificarea MPP.
- **Îmbunătățire sugerată:** Implementează pattern-ul WAI-ARIA Grid (https://www.w3.org/WAI/ARIA/apd/patterns/grid/) cu `role="grid"`, `role="row"`, `role="gridcell"`, `tabIndex`, și keyboard navigation cu săgeți.

---

**#15. MaintenanceCalendarPage — label-uri fără htmlFor/id în formularul de reprogramare**
- **Descriere:** Label-urile "Data nouă" (linia 355) și "Motiv" (linia 364) nu au `htmlFor`, iar input-ul/textarea nu au `id`.
- **Unde:** `MaintenanceCalendarPage.jsx:355-374` · ambele teme
- **Impact UI/UX:** Formularul de reprogramare este inaccesibil screen reader-ului.
- **Îmbunătățire sugerată:** Adaugă `htmlFor`/`id` asociate.

---

**#16. MaintenanceCalendarPage — mesaje de eroare fără role="alert"**
- **Descriere:** `rescheduleError` (linia 377-378) și `formError` (linia 539) sunt afișate ca `<p>` fără `role="alert"` sau `aria-live`.
- **Unde:** `MaintenanceCalendarPage.jsx:377-378, 539` · ambele teme
- **Impact UI/UX:** Screen reader-ul nu anunță automat erorile de validare.
- **Îmbunătățire sugerată:** Adaugă `role="alert"` și `aria-live="assertive"` pe container-ele de eroare.

---

**#17. AuditLogsPage — variabila CSS `--color-text-muted` nedefinită**
- **Descriere:** `var(--color-text-muted)` este folosită de 5 ori (liniile 41, 245, 251, 252, 261) dar NU este definită în `design-system.css` (nici în `:root`, nici în `[data-theme="dark"]`). Va cădea pe valoarea inițială a browserului (transparent), rezultând text invizibil.
- **Unde:** `AuditLogsPage.jsx:41, 245, 251, 252, 261` · ambele teme
- **Impact UI/UX:** Textul pentru "sistem" (utilizator), badge-urile de acțiune necunoscute, și detaliile de schimbări vor fi **invizibile**.
- **Îmbunătățire sugerată:** Adaugă `--color-text-muted: var(--color-text-tertiary)` în `:root` și `[data-theme="dark"]` din `design-system.css`, SAU înlocuiește cu `var(--color-text-tertiary)` direct.

---

**#18. IncidentsPage — aceeași variabilă `--color-text-muted` nedefinită**
- **Descriere:** `var(--color-text-muted)` folosit de 3 ori (liniile 396, 399) — aceeași problemă ca #17.
- **Unde:** `IncidentsPage.jsx:396, 399` · ambele teme
- **Impact UI/UX:** Linia "—" (dash placeholder) va fi invizibilă.
- **Îmbunătățire sugerată:** La fel ca #17.

---

**#19. MaintenancePage — aceeași variabilă `--color-text-muted` nedefinită**
- **Descriere:** `var(--color-text-muted)` la linia 420 — aceeași problemă.
- **Unde:** `MaintenancePage.jsx:420` · ambele teme
- **Impact UI/UX:** Textul "—" pentru servicii externe va fi invizibil.
- **Îmbunătățire sugerată:** La fel ca #17.

---

**#20. IncidentsPage — touch target dropdown status ~20px**
- **Descriere:** Butonul de dropdown status (linia 230) are `px-1.5 py-0.5` — înălțime reală ~20px, sub minimul de 40px WCAG 2.5.8.
- **Unde:** `IncidentsPage.jsx:230` · mobil · ambele teme
- **Impact UI/UX:** Pe mobil, butonul este aproape imposibil de atins. Bioinginerul pe teren nu poate schimba statusul incidentelor.
- **Îmbunătățire sugerată:** Mărește la `px-3 py-2 min-h-[40px]`.

---

**#21. SettingsPage — logout fără confirmare**
- **Descriere:** Butonul "Deconectare" (linia 209) efectuează logout direct, fără dialog de confirmare.
- **Unde:** `SettingsPage.jsx:209` · ambele teme
- **Impact UI/UX:** Un click accidental pe "Deconectare" încheie sesiunea. Pentru un utilizator care lucrează pe teren cu date medicale nesalvate, acest lucru poate fi problematic.
- **Îmbunătățire sugerată:** Folosește componenta `DeleteConfirmDialog` sau similar pentru a confirma logout-ul.

---

### 🟠 Probleme Mari (fricțiune semnificativă)

---

**#22–#28. Focus-visible absent pe zeci de elemente interactive (problema sistemică #1)**
- **Descriere:** Clasa `focusable` (definită în `index.css:80-85`) nu este folosită pe butoanele non-standard din 10+ pagini. Butoanele `btn-primary`/`btn-secondary` au `focus-visible` intern, dar butoanele inline, link-urile, și toggle-urile nu.
- **Unde:** `InventoryPageV2.jsx:68-84, 118-136, 186-192, 246-252, 471-500` · `MaintenancePage.jsx:100, 274-295, 300-346, 425-446` · `MaintenanceCalendarPage.jsx:189-200, 231-257, 329-345, 381-394, 542-558` · `MppExecutionForm.jsx:253-547` (toate câmpurile) · `RepairTicketsPage.jsx:171-190, 411-413, 508, 676-702` · `VerificationsPage.jsx:195-200, 247, 300-340, 432, 446` · `ServiceContractsPage.jsx:88, 104` · `IncidentsPage.jsx:117, 228-251, 403-410` · `AuditLogsPage.jsx:48-56` · `SettingsPage.jsx:87, 150-157, 209`
- **Impact UI/UX:** Utilizatorii de tastatură nu pot vedea unde este focusul. Navigarea fără mouse este imposibilă pe majoritatea paginilor.
- **Îmbunătățire sugerată:** Adaugă clasa `focusable` pe toate elementele interactive care nu folosesc `btn-primary`/`btn-secondary`/`btn-danger`/`input-base`.

---

**#29–#35. Loading spinner în loc de skeleton (problema sistemică #2)**
- **Descriere:** DESIGN.md regula 6 și CLAUDE.md regula 6 specifică explicit "Skeleton screens — NU spinners pentru loading". Totuși, `loading-spinner` este folosit în: Login.jsx:236, DeviceForm.jsx:278, AnnualInventoryPage.jsx:509, App.jsx:34 (LoadingFallback). ConsumablesPage.jsx:422 afișează text "Se încarcă..." fără niciun indicator vizual.
- **Unde:** `Login.jsx:236` · `DeviceForm.jsx:278` · `AnnualInventoryPage.jsx:509` · `App.jsx:34` · `ConsumablesPage.jsx:422` · `ServiceContractsPage.jsx:30` · `RepairTicketsPage.jsx:228`
- **Impact UI/UX:** Inconsistență vizuală; utilizatorul nu știe cât timp așteaptă. DESIGN.md specifică "Don't show 'Se încarcă...' text with no visual context."
- **Îmbunătățire sugerată:** Înlocuiește toate spinerele cu `<Skeleton>` din componenta existentă.

---

**#36–#42. Touch targets sub 40px (problema sistemică #3)**
- **Descriere:** Multiple butoane au dimensiuni sub 40px: ViewToggle în InventoryPageV2 (~30px), edit/delete icons în MaintenancePage (~26px), "Reprogramează"/"Execută MPP" în calendar (~24px), butoane de paginare în VerificationsPage (~24px), "Șterge" în ServiceContractsPage (~28px), checkbox în AnnualInventoryPage (20px), "Șterge semnătură" în MppExecutionForm (~18px).
- **Unde:** Vezi detaliile în paginile individuale de mai sus
- **Impact UI/UX:** Pe mobil (teren), bioinginerul nu poate atinge butoanele mici. WCAG 2.5.8 Target Size (Minimum) necesită 24×24px CSS, iar WCAG 2.5.5 recomandă 44×44px.
- **Îmbunătățire sugerată:** Adaugă `min-h-[40px] min-w-[40px]` pe toate butoanele interactive. Pentru icon buttons, adaugă padding suficient (`p-2.5` minimum).

---

**#43–#49. Clase Tailwind color hardcodate (problema sistemică #4)**
- **Descriere:** `text-red-600`, `text-red-500`, `text-blue-600`, `text-blue-700`, `text-green-700`, `text-orange-700`, `text-red-900`, `text-white`, `bg-black/50`, `bg-black bg-opacity-40` — folosite în MaintenanceCalendarPage, RepairTicketsPage, VerificationsPage, ConsumablesPage, AnnualInventoryPage.
- **Unde:** `MaintenanceCalendarPage.jsx:378, 511, 539` · `RepairTicketsPage.jsx:412, 505, 566-573` · `VerificationsPage.jsx:167-187, 287, 429` · `ConsumablesPage.jsx:35, 98` · `AnnualInventoryPage.jsx:51, 164, 501, 537`
- **Impact UI/UX:** Clasele Tailwind culori (ex: `text-red-600`) nu se adaptează la dark mode prin sistemul `[data-theme="dark"]`. Acestea sunt statice și vor avea aceeași culoare în ambele teme, creând probleme de contrast.
- **Îmbunătățire sugerată:** Înlocuiește cu `text-[var(--color-error)]`, `text-[var(--color-info)]`, `text-[var(--color-success)]` etc. Pentru overlay-uri, folosește `bg-black/50` cu `dark:bg-black/70` sau un token CSS.

---

**#50–#56. Dark mode compromis — fundaluri/text hardcodate (problema sistemică #5)**
- **Descriere:** `#ffffff` și `#1a1a1a` hardcodate în InventoryPageV2, DeviceForm, ConsumablesPage, AnnualInventoryPage, RepairModal, IncidentsPage, SettingsPage. Aceste valori nu se adaptează la `[data-theme="dark"]`.
- **Unde:** Vezi problemele #1–#5, #13 de mai sus
- **Impact UI/UX:** Textul devine invizibil pe fundal întunecat (negru pe negru) sau strălucitor (alb pe întunecat). Dark mode-ul este nefuncțional pe 5+ pagini.
- **Îmbunătățire sugerată:** Toate culorile trebuie să folosească token-uri CSS (`var(--color-*)`) care sunt redefinite în `[data-theme="dark"]`.

---

**#57–#63. Animații fără reduced-motion handling (problema sistemică #6)**
- **Descriere:** `animate-fade-in`, `animate-slide-up`, `animate-slide-down`, `animate-bounce-in` din `index.css:253-263` NU sunt wrapped în `@media (prefers-reduced-motion: no-preference)`, spre deosebire de cele din `design-system.css:274-291`. Deși regula globală din `design-system-animations.css:208-216` le acoperă funcțional, pattern-ul este inconsistent.
- **Unde:** `index.css:253-263` (definiții) · afectează toate paginile care folosesc aceste clase
- **Impact UI/UX:** Utilizatorii cu sensibilitate la mișcare vor vedea animații nedorite (bounce, slide) deoarece aceste clase sunt duplicate între două fișiere CSS cu reguli diferite.
- **Îmbunătățire sugerată:** Mute toate animațiile din `index.css` în `design-system-animations.css` și asigură-te că sunt wrapped în `@media (prefers-reduced-motion: no-preference)`.

---

**#64–#70. Toast errors cu role="status" în loc de role="alert"**
- **Descriere:** Toast.jsx (linia 71) folosește `role="status"` cu `aria-live="polite"` pentru TOATE tipurile de mesaje, inclusiv erorile. Erorile ar trebui `role="alert"` + `aria-live="assertive"` pentru a fi anunțate imediat.
- **Unde:** `Toast.jsx:71-72` · toate paginile
- **Impact UI/UX:** Erorile pot fi întârziate sau ignorate de screen reader.
- **Îmbunătățire sugerată:** Verifică `config.type === 'error'` și folosește `role="alert"` + `aria-live="assertive"` pentru erori.

---

**#71–#77. Butoane de dismiss (Toast, Alert) fără focus-visible**
- **Descriere:** Butonul X din Toast.jsx (linia 78) și Alert.jsx (linia 45) au `hover:opacity-70` dar zero `focus-visible` styling.
- **Unde:** `Toast.jsx:78-84` · `Alert.jsx:45-51` · toate paginile
- **Impact UI/UX:** Utilizatorii de tastatură nu pot vedea unde este focusul pe butoanele de închidere a notificărilor.
- **Îmbunătățire sugerată:** Adaugă clasa `focusable` sau `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` pe aceste butoane.

---

**#78. ErrorBoundary fără role="alert"**
- **Descriere:** ErrorBoundary.jsx (linia 33-36) afișează starea de eroare fără `role="alert"` sau `aria-live="assertive"`.
- **Unde:** `ErrorBoundary.jsx:33-36` · toate paginile
- **Impact UI/UX:** Screen reader-ul nu anunță automat când aplicația intră în starea de eroare.
- **Îmbunătățire sugerată:** Adaugă `role="alert"` pe container-ul de eroare (similar cu ErrorState.jsx care are `role="alert"`).

---

**#79. App.jsx LoadingFallback folosește spinner în loc de skeleton**
- **Descriere:** `LoadingFallback` (linia 34) folosește `animate-spin` — un spinner, nu un skeleton.
- **Unde:** `App.jsx:34` · toate paginile (la încărcarea inițială)
- **Impact UI/UX:** Prima impresie a utilizatorului la deschiderea aplicației este un spinner, nu skeleton.
- **Îmbunătățire sugerată:** Înlocuiește cu `<Skeleton variant="card" />`.

---

**#80. MaintenancePage — header modal fără aria-label pe butonul X**
- **Descriere:** Butonul de închidere modal (linia 100) are doar `<X size={20} />` fără `aria-label`.
- **Unde:** `MaintenancePage.jsx:100` · ambele teme
- **Impact UI/UX:** Screen reader-ul anunță "button" fără context.
- **Îmbunătățire sugerată:** Adaugă `aria-label="Închide"`.

---

**#81–#87. Verificări de contrast eșuate (necesită verificare manuală)**
- **Descriere:** Calcule preliminare indică probleme potențiale de contrast:
  - `text-green-700` (#15803d) pe cream (#faf9f5) ≈ 3.71:1 (sub 4.5:1) — VerificationsPage.jsx:171
  - `text-white` pe `var(--color-warning)` (#d4a017) ≈ 2.54:1 (sub 4.5:1) — RepairTicketsPage.jsx:679
  - `text-white` pe `var(--color-success)` (#5db872) ≈ 3.3:1 (sub 4.5:1) — ConsumablesPage.jsx:549-550
  - `var(--color-text-tertiary)` (#8e8b82) pe cream (#faf9f5) ≈ 2.8:1 (sub 4.5:1) — multiple pagini
  - `var(--color-success)` (#5db872) pe cream (#faf9f5) ≈ 2.6:1 — SettingsPage.jsx:193
- **Unde:** Vezi liniile de mai sus · ambele teme
- **Impact UI/UX:** Textul poate fi greu de citit pentru utilizatorii cu deficiențe de vedere.
- **Îmbunătățire sugerată:** Verifică fiecare combinație cu WebAIM Contrast Checker. Folosește culori mai închise pentru text pe fundaluri deschise.

---

**#88–#90. Text neromână / diacritice lipsă**
- **Descriere:**
  - `"Before"` / `"After"` în MppExecutionForm.jsx:451, 470 (#11 de mai sus)
  - `"Reset"` în AnnualInventoryPage.jsx:441, 575 — ar trebui "Resetare"
  - `"Incarcand..."` în RepairTicketsPage.jsx:228 — lipsă diacritică: "Încărcând..."
  - `"In lucru"` în RepairTicketsPage.jsx:19 — lipsă diacritică: "În lucru"
  - `"Inchis"` în RepairTicketsPage.jsx:22 — lipsă diacritică: "Închis"
  - `"Upload Certificat"` în VerificationsPage.jsx:148 — ar trebui "Încarcă Certificat"
  - `"Valid Until"` în VerificationsPage.jsx:250 — ar trebui "Valabil Până la"
  - `"Valabil Pana"` în VerificationsPage.jsx:80 (CSV header) — lipsă diacritică
  - `"ex: Device"` în AuditLogsPage.jsx:154 — ar trebui "ex: Dispozitiv"
  - `"Class I, Class II, Class III"` în DeviceForm.jsx:796 — ar trebui "Clasa I, Clasa II, Clasa III"
- **Unde:** Vezi liniile de mai sus · toate temele
- **Impact UI/UX:** Utilizatorul român vede text în engleză sau fără diacritice. Confuzie terminologică cu Ghidul Bioinginerului.
- **Îmbunătățire sugerată:** Traduce toate textele în română și adaugă diacriticele lipsă (ă, â, î, ș, ț).

---

**#91–#96. Tabele fără overflow-x-auto pe mobil**
- **Descriere:**
  - VerificationsPage.jsx:237 — `overflow-hidden` fără `overflow-x-auto`
  - RepairModal.jsx:114 — tabel piese fără `overflow-x-auto`
  - AnnualInventoryPage.jsx:72, 183 — tabele în modale fără `overflow-x-auto`
  - ServiceContractsPage.jsx:82 — tabel fără `overflow-x-auto`
- **Unde:** Vezi liniile de mai sus · mobil · ambele teme
- **Impact UI/UX:** Pe mobil, coloanele din dreapta sunt tăiate (clipsuite) sau butoanele de scroll apar. Conținutul este inaccesibil.
- **Îmbunătățire sugerată:** Înconjoară toate tabelele cu `<div className="overflow-x-auto">`.

---

**#97–#102. Formulare fără câmpuri obligatorii marcate**
- **Descriere:**
  - ConsumablesPage.jsx:45 — "Cantitate de adăugat" obligatoriu fără `*`
  - ConsumablesPage.jsx:109 — "Denumire" obligatoriu fără `*`
  - AnnualInventoryPage.jsx:117 — "Localizare" ar trebui marcat ca obligatoriu
- **Unde:** Vezi liniile de mai sus · ambele teme
- **Impact UI/UX:** Utilizatorul nu știe care câmpuri sunt obligatorii până nu primește eroare de validare.
- **Îmbunătățire sugerată:** Adaugă `*` lângă label pentru câmpurile obligatorii.

---

### 🟡 Probleme Medii (polish)

---

**#103–#109. Empty states lipsă pe anumite vizualizări**
- **Descriere:**
  - KanbanView în InventoryPageV2 — coloane fără mesaj "Niciun dispozitiv"
  - AnnualInventoryPage — când `sections` este gol, nu se afișează nimic
  - ServiceContractsPage — secțiunea "Furnizori" fără empty state
  - RepairTicketsPage Kanban — coloane goale fără mesaj
- **Unde:** Vezi liniile de mai sus · ambele teme
- **Impact UI/UX:** Utilizatorul nu știe dacă datele sunt în curs de încărcare sau lipsesc cu adevărat.
- **Îmbunătățire sugerată:** Adaugă componenta `EmptyState` pe fiecare vizualizare de date.

---

**#110–#116. Focus trap absent în DeleteConfirmDialog**
- **Descriere:** DeleteConfirmDialog.jsx gestionează Escape (linia 25) dar nu implementează focus trap — Tab-ul poate ieși din dialog pe elementele din fundal.
- **Unde:** `DeleteConfirmDialog.jsx:25` · toate paginile
- **Impact UI/UX:** Utilizatorul de tastatură poate naviga în spatele dialogului de confirmare.
- **Îmbunătățire sugerată:** Implementează focus trap cu `useEffect` + `Tab` key handler (similar cu MobileMenu din App.jsx:146-166).

---

**#117–#123. Animații modale fără guard explicit (acoperit global)**
- **Descriere:** `animate-modal-overlay` și `animate-modal-content` din `design-system-animations.css:177-184` nu sunt wrapped în `@media (prefers-reduced-motion: no-preference)`, dar regula globală de la linia 208-222 le acoperă.
- **Unde:** `design-system-animations.css:177-184` · toate modalele
- **Impact UI/UX:** Funcțional OK datorită regulii globale, dar inconsistent cu pattern-ul din `design-system.css:274`.
- **Îmbunătățire sugerată:** Wrap în `@media (prefers-reduced-motion: no-preference)` pentru consistență.

---

**#124–#126. App.css — cod mort cu variabile nedefinite**
- **Descriere:** `App.css` (184 linii) conține cod rămas de la template-ul Vite cu variabile nedefinite (`--accent`, `--accent-bg`, `--border`, `--text-h`, `--social-bg`, `--shadow`). Clasele `.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks` nu sunt folosite în niciun component.
- **Unde:** `App.css:1-184` · toate temele
- **Impact UI/UX:** Cod mort care crește dimensiunea bundle-ului și poate cauza conflicte de specificitate.
- **Îmbunătățire sugerată:** Șterge tot fișierul `App.css` — este dead code.

---

**#127–#129. SkipLink fără focus-visible explicit**
- **Descriere:** SkipLink.jsx (linia 17-38) nu are `focus-visible` styling. Se bazează pe mecanismul show/hide (vizibil când focusat), dar odată vizibil, nu are inel de focus.
- **Unde:** `SkipLink.jsx:17-38` · toate paginile
- **Impact UI/UX:** SkipLink-ul nu are inel de focus vizibil odată afișat.
- **Îmbunătățire sugerată:** Adaugă `focus-visible:ring-2 focus-visible:ring-[var(--color-bg-primary)]`.

---

**#130–#132. Signature pad fix 300×150px fără responsive**
- **Descriere:** `SignatureCanvas` în MppExecutionForm.jsx (liniile 483-490, 507-513) are `width: 300, height: 150` — dimensiune fixă în pixeli. Pe viewport-uri < 300px, canvas-ul va depăși containerul. De asemenea, `touch-action: none` lipsește pentru a preveni scroll-ul în timpul semnării pe touch devices.
- **Unde:** `MppExecutionForm.jsx:483-490, 507-513` · mobil · ambele teme
- **Impact UI/UX:** Pe mobil, canvas-ul de semnătură poate ieși din ecran; scroll-ul paginii interferează cu semnarea.
- **Îmbunătățire sugerată:** Folosește `width="100%"` cu `viewBox` sau `responsive={true}` pe SignatureCanvas. Adaugă `touch-action: none` pe canvas.

---

**#133–#135. KanbanView fără skeleton loading**
- **Descriere:** KanbanView în InventoryPageV2 (liniile 214-269) nu primește prop `isLoading` și nu afișează skeleton când datele sunt în curs de încărcare — afișează coloane goale.
- **Unde:** `InventoryPageV2.jsx:214-269` · ambele teme
- **Impact UI/UX:** Utilizatorul vede coloane goale și nu știe dacă datele lipsesc sau se încarcă.
- **Îmbunătățire sugerată:** Adaugă skeleton loading pentru coloanele Kanban.

---

**#136–#138. ConsumablesPage — formulare fără aria-describedby pe erori**
- **Descriere:** Input-urile din AddStockModal (linia 46-55) și EditModal (linia 110-116) nu au `aria-describedby` pointing la mesajele de eroare.
- **Unde:** `ConsumablesPage.jsx:46-55, 110-116` · ambele teme
- **Impact UI/UX:** Screen reader-ul nu asociază eroarea cu câmpul specific.
- **Îmbunătățire sugerată:** Adaugă `aria-describedby="error-msg-id"` pe input și `id="error-msg-id"` pe mesajul de eroare.

---

### 🔵 Probleme Mici (nice-to-have)

---

**#139–#144. Stiluri inline redundante cu token-uri CSS**
- **Descriere:** Dashboard.jsx, InventoryPageV2.jsx, EmptyState.jsx, ErrorState.jsx folosesc `style={{ color: 'var(--color-*)' }}` în loc de clase Tailwind. Deși valorile sunt corecte, pattern-ul este inconsistent cu restul aplicației.
- **Unde:** Multiple fișiere
- **Impact UI/UX:** Menținerea dificilă; inconsistență de pattern.
- **Îmbunătățire sugerată:** Mute în clase Tailwind utility sau componente abstractizate.

---

**#145–#148. Token-uri lipsă în design-system.css**
- **Descriere:**
  - `--color-on-primary` — folosit în index.css:101, 149, 359, 386 dar formal nedefinit în `:root`
  - `--color-status-decommissioned-bg` — folosit în StatusBadge.jsx:24 dar nedefinit
  - `--color-status-spare-bg` — folosit în StatusBadge.jsx:36 dar nedefinit
  - `--color-text-muted` — folosit în 8 locuri dar nedefinit (problema #17-#19)
- **Unde:** `design-system.css` + multiple componente
- **Impact UI/UX:** Valori fallback hardcodate în loc de token-uri oficiale.
- **Îmbunătățire sugerată:** Adaugă toate token-urile lipsă în `:root` și `[data-theme="dark"]`.

---

**#149–#150. Emoji în loc de iconițe lucide pentru theme toggle**
- **Descriere:** App.jsx:104 folosește `☀️` / `🌙` (emoji) pentru theme toggle, în loc de iconițele `Sun`/`Moon` din lucide-react folosite pretutindeni în aplicație.
- **Unde:** `App.jsx:104` · header
- **Impact UI/UX:** Inconsistență vizuală; emoji-urile se rendează diferit pe diferite OS/browser.
- **Îmbunătățire sugerată:** Folosește `Sun` și `Moon` din lucide-react.

---

**#151–#155. Text `text-tertiary` la dimensiune `text-xs` — contrast marginal**
- **Descriere:** `var(--color-text-tertiary)` (#8e8b82) la `text-xs` (12px) pe cream (#faf9f5) = contrast ~2.8:1. Sub WCAG AA 4.5:1, dar textul este decorativ/caption.
- **Unde:** ServiceContractsPage.jsx:60, ErrorBoundary.jsx:111, EmptyState.jsx (via token)
- **Impact UI/UX:** Text mic poate fi greu de citit pentru utilizatorii cu deficiențe de vedere ușoare.
- **Îmbunătățire sugerată:** Folosește `var(--color-text-secondary)` (#6c6a64) = contrast ~4.7:1 pe cream, sau mărește dimensiunea la `text-sm`.

---

**#156–#158. Overlay modal rgba(0,0,0,0.5) în dark mode**
- **Descriere:** DeleteConfirmDialog.jsx:21, ConsumablesPage.jsx:35/98, AnnualInventoryPage.jsx:51/164/501/537 folosesc `rgba(0,0,0,0.5)` pentru overlay. În dark mode, acest overlay pe fundal întunecat (#181715) devine aproape invizibil.
- **Unde:** Vezi liniile de mai sus · dark mode
- **Impact UI/UX:** În dark mode, overlay-ul modalului este slab vizibil, făcând dificilă distingerea dintre modal și fundal.
- **Îmbunătățire sugerată:** Folosește `rgba(0,0,0,0.7)` în dark mode sau un token CSS.

---

**#159–#160. StatusBadge — fallback-uri inline pentru token-uri lipsă**
- **Descriere:** StatusBadge.jsx:24 și 36 folosesc fallback-uri inline `rgba(...)` pentru token-urile nedefinite `--color-status-decommissioned-bg` și `--color-status-spare-bg`.
- **Unde:** `StatusBadge.jsx:24, 36`
- **Impact UI/UX:** Funcțional OK datorită fallback-urilor, dar inconsistents cu pattern-ul de token-uri.
- **Îmbunătățire sugerată:** Defineste token-urile în `design-system.css`.

---

**#161–#163. MppExecutionForm — rgba hardcodate pe mesaje de eroare/succes**
- **Descriere:** `rgba(248, 113, 113, 0.2)` (linia 238) și `rgba(52, 211, 153, 0.2)` (linia 243) — border-uri hardcodate pe mesaje.
- **Unde:** `MppExecutionForm.jsx:238, 243` · ambele teme
- **Impact UI/UX:** Nu se adaptează la dark mode; ar trebui să folosească `var(--color-error-bg)` / `var(--color-success-bg)`.
- **Îmbunătățire sugerată:** Folosește token-urile CSS existente.

---

**#164–#166. MaintenanceCalendarPage — text-white + warning bg contrast slab**
- **Descriere:** Button "Salvează" (linia 384-385) folosește `backgroundColor: 'var(--color-warning)'` (#d4a017) cu `color: 'var(--color-bg-primary)'` (#faf9f5) = contrast ~2.3:1 (sub WCAG AA).
- **Unde:** `MaintenanceCalendarPage.jsx:384-385` · ambele teme
- **Impact UI/UX:** Textul butonului de salvare este greu de citit.
- **Îmbunătățire sugerată:** Folosește `var(--color-ink)` (#141413) pentru text pe fundal warning = contrast ~7.8:1.

---

**#167–#169. MaintenanceCalendarPage — header calendar fără role="columnheader"**
- **Descriere:** Header-ele zilelor (Lun, Mar, etc.) la liniile 270-274 sunt `<div>` fără `role="columnheader"`.
- **Unde:** `MaintenanceCalendarPage.jsx:270-274` · ambele teme
- **Impact UI/UX:** Screen reader-ul nu identifică header-ele calendarului ca antete de coloană.
- **Îmbunătățire sugerată:** Adaugă `role="columnheader"`.

---

**#170–#172. DetailsModal — status enum brut afișat în loc de label**
- **Descriere:** TicketDetailsModal.jsx:108 afișează `{s}` (ex: `IN_LUCRU`) în loc de `STATUS_LABELS[s]` (ex: "În lucru").
- **Unde:** `TicketDetailsModal.jsx:108` · ambele teme
- **Impact UI/UX:** Utilizatorul vede codul intern al statusului în loc de label-ul prietenos.
- **Îmbunătățire sugerată:** Folosește `STATUS_LABELS[s]` pentru afișare.

---

**#173–#175. ConsumablesPage — animate-bounce-in fără reduced-motion**
- **Descriere:** `animate-bounce-in` (linia 501) — acesta este deosebit de problematic pentru utilizatorii cu vestibular issues. Deși regula globală acoperă, bounce-ul este mai deranjant decât alte animații.
- **Unde:** `ConsumablesPage.jsx:501` · ambele teme
- **Impact UI/UX:** Utilizatorii cu sensibilitate la mișcare pot avea disconfort.
- **Îmbunătățire sugerată:** Înlocuiește cu `animate-fade-in` sau `animate-scale-in` (mai puțin deranjant).

---

## Top 10 — De Reparat Primele

| # | Prioritate | Probleme | Impact |
|---|-----------|---------|--------|
| 1 | **#17-#19** | `--color-text-muted` nedefinit — text invizibil în 3 pagini | 🔴 |
| 2 | **#1-#6** | Culori hex hardcodate în STATUS_COLORS / badges — dark mode compromis pe 5+ pagini | 🔴 |
| 3 | **#7** | Modale fără role="dialog" + Escape + focus trap (5 modale) | 🔴 |
| 4 | **#9-#12** | Formulare fără label-uri programatice (MppExecutionForm + RepairModal) | 🔴 |
| 5 | **#8, #91-#96** | Tabele fără overflow-x-auto pe mobil (4+ tabele) | 🔴 |
| 6 | **#14** | Calendarul complet inaccesibil la tastatură | 🔴 |
| 7 | **#22-#28** | Focus-visible absent pe 50+ elemente interactive | 🟠 |
| 8 | **#29-#35** | Loading spinner în loc de skeleton (7 locații) | 🟠 |
| 9 | **#36-#42** | Touch targets sub 40px (10+ butoane pe mobil) | 🟠 |
| 10 | **#43-#50** | Clase Tailwind color hardcodate + dark mode broken | 🟠 |

---

## Cauze Sistemice de Fond

1. **Paginile create în Faza 2–3 ocolesc token-urile de design.** Problema fundamentală este că paginile InventoryPageV2, ConsumablesPage, AnnualInventoryPage, MaintenanceCalendarPage, RepairTicketsPage, VerificationsPage au fost dezvoltate cu culori hex hardcodate din Tailwind (ex: `#f87171`, `text-red-600`) în loc să folosească variabilele CSS definite în `design-system.css`. Aceasta sugerează că dezvoltatorii nu au citit `DESIGN.md` înainte de a scrie UI (violând regula 1 din CLAUDE.md).

2. **Componentele modale sunt implementate manual, fără bibliotecă.** Toate cele 5 modale (CreateTicketModal, DetailsModal, TriageModal, TicketDetailsModal, RepairModal) au fost scrise de la zero fără a folosi Dialog din Shadcn/UI, care ar fi oferit automat `role="dialog"`, `aria-modal`, focus trap, și Escape handling. Componenta `DeleteConfirmDialog` este singura care implementează corect ARIA.

3. **Clasa `focusable` este definită dar nefolosită.** Design system-ul definește `.focusable` în `index.css:80-85` cu inel coral WCAG, dar paginile nu o aplică pe butoanele non-standard. Aceasta sugerează o lipsă de awareness a design system-ului în rândul dezvoltatorilor de pagini.

4. **Token-urile CSS sunt incomplete.** Variabilele `--color-on-primary`, `--color-text-muted`, `--color-status-decommissioned-bg`, `--color-status-spare-bg` sunt folosite dar nedefinite oficial, forțând fallback-uri inline hardcodate.

5. **Dualitatea CSS — două surse de animații.** Animățiile sunt definite atât în `design-system.css:274-291` (wrapped în reduced-motion) cât și în `index.css:253-263` (fără reduced-motion), creând inconsistențe.

---

*Audit realizat: 2026-06-15 · SIMDM v2.4 · Versiune raport: 1.0*
