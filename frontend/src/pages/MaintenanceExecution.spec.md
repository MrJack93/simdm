# Specificație: Execuție Mentenanță Preventivă (Modul 2)

**Modul:** Execuție MPP (Mentenanță Preventivă Planificată)  
**Status:** SPEC (Săptămânile 2-3, Faza 3, Zile 5-7)  
**Versiune:** 1.0 (2026-06-05)

---

## 📋 Cerințe

### Funcționalitate

1. **Selectare și inițiere execuție**
   - Din calendarul planificării, selectez un eveniment MPP
   - Sistem arată detalii dispozitiv
   - Buton "Execută mentenanță" deschide dialog

2. **Formular execuție**
   - Dispozitiv (read-only din plan)
   - Data execuție (auto-completat cu data de azi)
   - Inginer responsabil (dropdown)
   - Rezultat inspecție (textarea descriere)
   - Piese înlocuite (optional, lista)
   - Observații tehnice (textarea)

3. **Semnătură digitală**
   - Canvas pentru desenare semnătură
   - Buton "Curățare" pentru a rescrie
   - Validare: semnătură obligatorie
   - Salvare semnătură în format Base64

4. **Salvare și PDF**
   - Salvare date în baza de date
   - Generare automat Formular Nr. 6
   - Export PDF cu semnătură digitală
   - Email notificare inginer

---

## 🎨 Componente UI (Shadcn)

```
MaintenanceExecution
├── <Card> — Informații dispozitiv
│   ├── Nume dispozitiv
│   ├── Seria
│   ├── Data planificată
│   └── <Button> — Execută mentenanță
├── <Dialog> — Dialog execuție
│   ├── <Form> cu câmpuri:
│   │   ├── <Select> — Inginer responsabil
│   │   ├── <Input type="date"> — Data execuție
│   │   ├── <Textarea> — Rezultat inspecție
│   │   ├── <Input> — Piese înlocuite
│   │   └── <Textarea> — Observații
│   ├── <Canvas> — Semnătură digitală
│   │   ├── "Desenează semnătură"
│   │   └── <Button> — Curățare
│   ├── <Button> — Salvare & Generare PDF
│   └── <Button> — Anulare
└── <Table> — Istoric execuții (completate)
    ├── Data execuție
    ├── Inginer
    ├── Rezultat
    ├── Status (Finalizat ✅)
    └── Acțiune (Vizualizare PDF)
```

---

## 🎯 Flux utilizator

### Scenariu 1: Executare MPP planificată

```
1. Deschide Plan de mentenanță
2. Vezi eveniment: "Aparat USG - 2026-06-10 - Planificat ⏳"
3. Apasă pe eveniment
4. Se deschide Card cu detalii dispozitiv
5. Apasă buton "Execută mentenanță"
6. Se deschide Dialog cu formular
```

### Scenariu 2: Completare formular execuție

```
1. Selectare inginer: "Ion Popescu"
2. Data execuție: 2026-06-10 (auto-completat)
3. Rezultat: "Aparatul funcționează corect, măsurători în limitele normale"
4. Piese: "Filtru de aer - înlocuit"
5. Observații: "Curățare contacte, verificare calibrare"
6. Semnează pe canvas
7. Apasă "Salvare & Generare PDF"
```

### Scenariu 3: Generare PDF și notificare

```
1. System salvează în baza de date
2. Generează Formular Nr. 6 în PDF
3. Semnătură digitală se încorporează în PDF
4. Trimite email inginerului + Șef departament
5. Afișează mesaj de succes
6. Evenimentul în calendar se schimbă la "Finalizat ✅"
```

---

## 🏥 Context medical

**Formular Nr. 6:** Raport execuție mentenanță - standard conform Ghidului Bioinginerului

**Semnatari:**
- Inginer executant (semnătură digitală)
- Șef departament (semnătură digitală - optional, apoi)

**Piese Înlocuite:** 
- Filtru
- Baterii
- Conectori
- Lubrifiant
- Alte (specificare)

---

## 📊 Date (Backend API)

### GET `/api/maintenance-plans/:id`
```json
{
  "id": "plan-001",
  "deviceId": "dev-001",
  "deviceName": "Aparat USG A12",
  "deviceSerialNumber": "USG-2024-001",
  "type": "preventive",
  "scheduledDate": "2026-06-10",
  "status": "scheduled"
}
```

### POST `/api/maintenance-executions`
```json
{
  "maintenancePlanId": "plan-001",
  "deviceId": "dev-001",
  "engineer": "engineer-001",
  "executionDate": "2026-06-10",
  "inspectionResult": "Aparatul funcționează corect...",
  "partiesReplaced": ["filtru", "baterii"],
  "technicalNotes": "Curățare contacte, verificare calibrare",
  "signature": "data:image/png;base64,iVBOR...",
  "status": "completed"
}
```

### POST `/api/reports/formular-6/:executionId`
```json
{
  "format": "pdf",
  "includeSignature": true,
  "language": "ro"
}
```

---

## ♿ Accesibilitate (WCAG AA)

- [ ] Dialog are role="dialog" și aria-labelledby
- [ ] Canvas semnătură are aria-label descriptiv
- [ ] Buton "Curățare" semnătură are aria-label
- [ ] Etichete formular conectate cu input (atribut for)
- [ ] Validare: erori cu role="alert"
- [ ] Culori nu singura metodă de feedback (culoare + text)
- [ ] Focus vizibil pe toate elementele interactive
- [ ] Tastatura: Tab, Shift+Tab, Enter, Escape funcționează

---

## 📱 Responsive

- **Mobil (320px):** Canvas semnătură 100% lățime, formular stivuit
- **Tablă (768px):** Formular pe stânga, semnătură pe dreapta
- **Desktop (1024px):** Layout 2 coloane cu toolbar

---

## 🧪 Criterii de acceptare

### CA1: Dialog execuție
```gherkin
Dat: Plan mentenanță planificat
Când: Apasă "Execută mentenanță"
Atunci: Se deschide Dialog cu formular gol
Și: Data execuție este auto-completată cu data de azi
Și: Inginerul selectat este din dropdown
```

### CA2: Semnătură digitală
```gherkin
Dat: Dialog execuție deschis
Când: Desenez o linie pe canvas
Atunci: Linia apare pe canvas în timp real
Și: Pot apasa "Curățare" pentru a rescrie
Și: Semnătura nu poate fi goală (validare)
```

### CA3: Salvare și PDF
```gherkin
Dat: Formular completat cu semnătură
Când: Apasă "Salvare & Generare PDF"
Atunci: Date se salvează în API
Și: Se generează Formular Nr. 6 PDF
Și: Semnătură digitală e încorporată în PDF
Și: Se trimite email inginerului
```

### CA4: Actualizare status plan
```gherkin
Dat: Execuția salvată cu succes
Când: Revin la Plan mentenanță
Atunci: Evenimentul se schimbă la "Finalizat ✅"
Și: Data execuție se afișează
Și: Apasă puteți descărca PDF-ul execuției
```

---

## 🚀 Implementare

### Faza 1: Structură (Ziua 5)
```
src/pages/MaintenanceExecution.jsx
├── Hooks: useMaintenanceExecution(), useSignature()
├── Componente: ExecutionForm, SignaturePad, ExecutionTable
└── API: maintenanceExecutionApi.js
```

### Faza 2: Componente (Ziua 6)
- `<ExecutionForm>` cu Shadcn Input, Select, Textarea
- `<SignaturePad>` cu react-signature-canvas
- `<ExecutionDialog>` complet funcțional

### Faza 3: PDF & Email (Ziua 7)
- Generare Formular Nr. 6 (jsPDF + html2pdf)
- Semnătură încorporată
- Notificare email
- Actualizare status plan

---

## 📋 Dependințe noi

```bash
npm install react-signature-canvas
npm install jspdf html2pdf
```

---

## 🎨 Design notes

- Semnătură pe fond alb curat (contrast maxim)
- Cursor care se schimbă la "crosshair" pe canvas
- Feedback visual: buton "Curățare" se activează după desenare
- PDF-ul include: date, date, inginer, semnătură, logo spital

---

**Status:** ✅ Gata pentru implementare  
**Prioritate:** ÎNALTĂ (Săptămâna 2, Zile 5-7)  
**Responsabil:** Claude Code  
**Dependență:** Modul 1 (Plan) trebuie terminat
