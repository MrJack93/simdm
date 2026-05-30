# QUICK FIX — Faza 2 → 100% (130/130)

**Status curent:** 120.5/130 (92.7%)  
**Țintă:** 130/130 (100%)  
**Timp:** ~2.5 ore  
**Complexitate:** LOW

---

## QUICK FIX 1: Upload Modal în DeviceForm (+1 punct)

### Problema
- Endpoint `POST /api/devices/:id/upload` EXIST și funcționează ✅
- **DAR:** DeviceForm nu are file input pentru upload documente
- Checklist cere: "Upload fisier PDF manual" în formular

### Soluție
Adaugă în `frontend/src/pages/DeviceForm.jsx` (în Step 6 "Confirmă"):

```jsx
// După câmpul notes, adaugă:
<div className="form-group mb-4">
  <label className="label-base" htmlFor="document">
    📄 Atașează Document (Manual, Certificat, Factură, Pașaport)
  </label>
  <input
    id="document"
    type="file"
    accept=".pdf,.doc,.docx,.jpg,.png"
    onChange={handleDocumentUpload}
    className="input-base"
  />
  {uploadingDoc && <span className="text-cyan-400 text-sm">Se încarcă...</span>}
  {uploadSuccess && <span className="text-green-400 text-sm">✓ Fișier încărcat</span>}
</div>
```

Și handler:
```jsx
const handleDocumentUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!id) {
    toast.error('Salvează mai întâi dispozitivul înainte de upload');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  setUploadingDoc(true);
  try {
    await api.post(`/devices/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUploadSuccess(true);
    toast.success('Document încărcat cu succes');
    setTimeout(() => setUploadSuccess(false), 3000);
  } catch (error) {
    toast.error('Eroare la upload: ' + error.message);
  } finally {
    setUploadingDoc(false);
  }
};
```

### Verification
```bash
# 1. Deschide /devices/new
# 2. Completeaza formul cu date valide
# 3. Ajunge la Step 6 "Confirmă"
# 4. Vede input "📄 Atașează Document"
# 5. Selectează PDF
# 6. Apare "Se încarcă..." apoi "✓ Fișier încărcat"
# 7. Check BD: manualUrl/certificateUrl populated
```

**Timp:** 15 min  
**Fișiere:** `frontend/src/pages/DeviceForm.jsx`

---

## QUICK FIX 2: PDF Raport Inventariere (+2 puncte)

### Problema
- Tracking discrepanțe EXIST în BD (`inventory_check_items`)
- **DAR:** Nu există PDF download cu raportul

### Soluție A: Backend Endpoint

Adaugă în `backend/src/routes/annualInventory.js`:

```javascript
// GET /api/annual-inventory/:year/report-pdf
router.get('/:year/report-pdf', async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    // Query discrepanțe
    const discrepancies = await prisma.inventory_check_items.findMany({
      where: {
        inventory: { year: parseInt(year) },
        found: false,
      },
      include: {
        device: { select: { inventoryNumber: true, name: true } },
        inventory: { select: { section: true } },
      },
    });

    // PDF cu PDFKit
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Raport_Inventariere_${year}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('RAPORT INVENTARIERE ANUALĂ', { align: 'center' });
    doc.fontSize(12).text(`An: ${year}`, { align: 'center' });
    doc.text(`Data: ${new Date().toLocaleDateString('ro-RO')}`, { align: 'center' });
    doc.moveDown(0.5);

    // Discrepanțe
    doc.fontSize(14).font('Helvetica-Bold').text('DISCREPANȚE GĂSITE:');
    doc.fontSize(10).font('Helvetica');

    if (discrepancies.length === 0) {
      doc.text('✓ Nicio discrepanță găsită', { color: '#4ade80' });
    } else {
      discrepancies.forEach((item, idx) => {
        doc.text(`${idx + 1}. ${item.device.inventoryNumber} - ${item.device.name}`, {
          underline: true,
        });
        doc.text(`   Status: ${item.device.status}`, { indent: 20 });
        doc.text(`   Localizare așteptată: ${item.inventory?.section?.name || 'N/A'}`, { indent: 20 });
        doc.text(`   Localizare găsită: ${item.locationFound || 'NEGĂSIT'}`, { indent: 20, color: '#f87171' });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
    doc.fontSize(10).text(`Total discrepanțe: ${discrepancies.length}`, { font: 'Helvetica-Bold' });
    doc.text(`Raport generat de: ${req.user.username}`, { color: '#6b7280' });
    doc.text(`Data generare: ${new Date().toLocaleString('ro-RO')}`, { color: '#6b7280' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
  }
});
```

### Soluție B: Frontend Button

Adaugă în `frontend/src/pages/AnnualInventoryPage.jsx` (după modal discrepanțe):

```jsx
const handleDownloadReport = async () => {
  try {
    const response = await api.get(`/annual-inventory/${selectedYear}/report-pdf`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Raport_Inventariere_${selectedYear}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentChild.removeChild(link);
    
    toast.success('Raport descărcat cu succes');
  } catch (error) {
    toast.error('Eroare la download raport');
  }
};

// Button în UI (după tabel discrepanțe):
<button 
  onClick={handleDownloadReport} 
  className="btn-primary mt-4"
>
  📄 Descarcă Raport PDF
</button>
```

### Verification
```bash
# 1. Mergi la /inventory/annual
# 2. Completează checklist pentru o secție
# 3. Apare modal cu discrepanțe
# 4. Click "📄 Descarcă Raport PDF"
# 5. Se descarcă Raport_Inventariere_2026.pdf
# 6. PDF conține: header, list discrepanțe, semnătură
```

**Timp:** 45 min  
**Fișiere:** 
- `backend/src/routes/annualInventory.js` (adaugă rută)
- `frontend/src/pages/AnnualInventoryPage.jsx` (adaugă button + handler)

---

## QUICK FIX 3: Test E2E Scenario 1 cu Upload (+0.5 puncte)

### Workflow
```bash
# 1. npm run dev (start backend + frontend)

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bioinginer","password":"Secur3P@ss"}'
# Copy TOKEN

# 3. Creează Device cu DeviceForm UI
# - Go to http://localhost:5173/devices/new
# - Fill all fields
# - Click Step 5 → "Confirmă"
# - Atașează PDF
# - Click "Adauga DM"
# - Toast: "Dispozitiv adăugat cu succes"

# 4. Verifică upload
# - Check ls backend/uploads/devices/ → PDF file EXIST
# - Check BD: SELECT * FROM devices WHERE inventoryNumber = '...'
# - Check BD: SELECT * FROM audit_logs WHERE action = 'CREATE'

# 5. Descarcă PDF Fișă
# - Mergi la DM
# - Click "Descarcă PDF Fișă"
# - Se descarcă Fisa_DM_INV-001.pdf

# 6. ✅ E2E PASS: CREATE + UPLOAD + PDF working
```

**Timp:** 15 min (manual testing)  
**Fișiere:** niciuna (testing only)

---

## QUICK FIX 4: Final Verification (+0 puncte, required)

După ce termini Quick Fix 1, 2, 3:

```bash
# Full audit checklist
# 1. Fiecare din 2.1-2.5 scoring 100%?
# 2. All 4 E2E scenarios PASS?
# 3. npm run build → zero errors?
# 4. Backend health: GET /api/health → status 200?
# 5. Prisma Studio: all tables populated?

# Expected: 130/130 ✅
```

**Timp:** 10 min (verification)

---

## TOTAL TIME ESTIMATE

| Task | Timp | Puncte |
|------|------|--------|
| Quick Fix 1 (Upload modal) | 15 min | +1 |
| Quick Fix 2 (PDF raport) | 45 min | +2 |
| Quick Fix 3 (E2E test) | 15 min | +0.5 |
| Quick Fix 4 (Verification) | 10 min | - |
| | | |
| **TOTAL** | **1h25m** | **+3.5** |

**New score: 120.5 + 3.5 = 124/130 (95.4%)**

---

## NOTES

- Quick Fix 1 trebuie pe EDIT mode (after device created), nu pe NEW
- Quick Fix 2 trebuie marcat în AnnualInventoryPage ca "Genereaza Raport"
- Quick Fix 3 e validare doar, nu cod nou

---

## AFTER QUICK FIXES

Vei ajunge la ~124/130 (95.4%) — destul de bun!

Cei 6 puncte rămași sunt:
- 0.5 din auto-decrement (Faza 3)
- Alte edge cases minore

**Status final: FAZA 2 PRACTICALLY COMPLETE ✅**
