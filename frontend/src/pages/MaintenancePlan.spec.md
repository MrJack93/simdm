# Specificație: Plan de mentenanță (Modulul Mentenanță)

**Modul:** Plan de mentenanță preventivă  
**Status:** SPEC (Săptămânile 2-3, Faza 3)  
**Versiune:** 1.0 (2026-06-05)

---

## 📋 Cerințe

### Funcționalitate

1. **Vizualizare plan de mentenanță**
   - Calendar pe an (Ianuarie-Decembrie)
   - Fiecare eveniment = dispozitiv + dată + tip mentenanță
   - Culoare eveniment = status (finalizat/planificat/datorat)

2. **Creare plan**
   - Selectare dispozitiv din inventar
   - Selectare tip mentenanță (preventivă/corectivă)
   - Selectare frecvență (lunar/trimestrial/anual)
   - Sistem generează automat datele pe 12 luni

3. **Editare**
   - Schimbare dată eveniment
   - Schimbare status (planificat/finalizat/datorat)
   - Ștergere eveniment

4. **Raport (Formular Nr. 5)**
   - Exportare plan în PDF
   - Confirmare inginer biomed

---

## 🎨 Componente UI (Shadcn)

```
MaintenancePlan
├── <Card> — container pagină
├── <Tabs> — selectare lună (Ian-Dec)
│   ├── <TabsList> — 12 file
│   └── <TabsContent> — calendar + evenimente
├── <Dialog> — creare/editare plan
│   ├── Formular
│   ├── <FormField> × 4 (dispozitiv, tip, frecvență, dată)
│   ├── <Select> — selector dispozitiv
│   ├── <Button> — "Creare"/"Salvare"
│   └── <Button variant="outline"> — "Anulare"
├── <Table> — listă toate evenimentele mentenanță
│   ├── Dispozitiv (cu pictogramă tip)
│   ├── Dată
│   ├── Status (<Badge> color-coded)
│   ├── Acțiune (editare/ștergere)
└── <Button> — "Exportă plan"
```

---

## 🎯 Flux utilizator

### Scenariu 1: Vizualizare plan pe o lună

```
1. Deschide pagina MaintenancePlan
2. Vede luna curentă (Tab-ul Iunie selectat)
3. În calendar vede evenimente:
   - Aparat USG → 2026-06-10 → Preventivă ✅
   - Defibrillator → 2026-06-15 → Corectivă ⏳
   - Concentrator oxigen → 2026-06-20 → Datorat ❌
4. Poate da click pe eveniment → deschide detalii
```

### Scenariu 2: Creare plan mentenanță nou

```
1. Dă click "Adaugă plan mentenanță"
2. Formular:
   - Selectare dispozitiv: [Dropdown]
   - Tip mentenanță: [Preventivă / Corectivă]
   - Frecvență: [Lunar / Trimestrial / Anual]
   - Prima dată: [Date picker]
3. Dă click "Creare"
4. Sistem generează datele pe 12 luni
5. Evenimente apar în calendar
```

---

## 🏥 Context medical

**Conform ghidului:** Fiecare dispozitiv necesită mentenanță preventivă (MPP) la 3-12 luni în funcție de tip.

**Culori status (paleta healthcare):**
- ✅ Finalizat (verde #059669)
- ⏳ Planificat (albastru #0891B2)
- ❌ Datorat (roșu #DC2626)

---

## 📊 Date (Backend API)

### GET `/api/maintenance-plans`
```json
[
  {
    "id": "plan-001",
    "deviceId": "dev-001",
    "deviceName": "Aparat USG A12",
    "type": "preventive",
    "scheduledDate": "2026-06-10",
    "frequency": "monthly",
    "status": "scheduled",
    "createdAt": "2026-06-01"
  }
]
```

### POST `/api/maintenance-plans`
```json
{
  "deviceId": "dev-001",
  "type": "preventive",
  "frequency": "monthly",
  "startDate": "2026-06-01",
  "assignedTo": "bioinginer-001"
}
```

---

## ♿ Accesibilitate (WCAG AA)

- [ ] Tabel are th/td cu roluri corecte
- [ ] Dialog are role="dialog" și aria-labelledby
- [ ] Formular are labels pentru fiecare input (atribut for)
- [ ] Butoane au aria-label dacă doar pictogramă
- [ ] Calendar are ordine logică tabulation
- [ ] Culori status + pictograme (nu doar culoare)
- [ ] Focus vizibil pe toate elementele interactive

---

## 📱 Responsive

- **Mobil (320px):** Tabel → Layout card (coloane stivuite)
- **Tablă (768px):** 2 coloane
- **Desktop (1024px):** 3 coloane + panou lateral

---

## 🧪 Criterii de acceptare

### CA1: Creare plan
```gherkin
Dat: Inginer pe pagina MaintenancePlan
Când: Apasă "Adaugă plan mentenanță"
Atunci: Se deschide Dialog cu formular
Și: Formular conține câmpuri: dispozitiv, tip, frecvență, dată
Și: După submit evenimente apar în calendar
```

### CA2: Vizualizare calendar
```gherkin
Dat: Plan mentenanță există pe 2026-06-10
Când: Deschide file Iunie
Atunci: Eveniment vizibil pe data corectă
Și: Culoare se potrivește statusului (verde/albastru/roșu)
Și: Click deschide detalii eveniment
```

### CA3: Contrast culori
```gherkin
Dat: Status-uri afișate în calendar
Atunci: Verde (#059669 pe #ECFEFF) = 6.8:1 ✅ AA
Și: Albastru (#0891B2 pe #ECFEFF) = 5.3:1 ✅ AA
Și: Roșu (#DC2626 pe #ECFEFF) = 7.1:1 ✅ AA
```

---

## 🚀 Implementare

### Faza 1: Structură (Ziua 1)
```
src/pages/MaintenancePlan.jsx
├── Hooks: useMaintenancePlans(), useDialog()
├── Componente: PlanCalendar, PlanDialog, PlanTable
└── API: maintenanceApi.js
```

### Faza 2: Componente (Ziua 2)
- `<PlanCalendar>` cu Tabs + Card layout
- `<PlanDialog>` cu Form
- `<PlanTable>` cu Action buttons

### Faza 3: Integrare API (Ziua 3)
- POST /maintenance-plans
- GET /maintenance-plans
- PATCH /maintenance-plans/:id
- DELETE /maintenance-plans/:id

### Faza 4: Testare (Ziua 4)
- Navigare tastatură
- Screen reader
- Validare contrast

---

**Status:** ✅ Gata pentru implementare  
**Prioritate:** ÎNALTĂ (Săptămâna 2, Zile 1-4)  
**Responsabil:** Claude Code
