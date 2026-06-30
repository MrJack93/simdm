# Import Date Reale — SIMDM

Ghid pentru încărcarea inventarului real al clinicii în SIMDM.

---

## Formatul fișierului

**Endpoint:** `POST /api/annual-inventory/import-fixed-assets`
**Format:** Excel (.xlsx) sau CSV
**Coloane obligatorii:**

| Coloană | Descriere | Tip | Obligatoriu |
|---------|-----------|-----|-------------|
| `Cod` | Cod CND al dispozitivului | text | Da |
| `Denumire` | Numele dispozitivului medical | text | Da |
| `Valoare` | Valoare de achiziție (MDL) | număr | Nu |
| `DataInchidere` | Data achiziției / punerii în funcțiune | dată | Nu |

**Notă:** Rândurile fără `Cod` sau `Denumire` sunt ignorate (skip silențios).

---

## Pași de import

### 1. Pregătirea fișierului

1. Exportă inventarul din programul de contabilitate (Excel/CSV)
2. Asigură-te că ai coloanele: `Cod`, `Denumire`, `Valoare`, `DataInchidere`
3. Coloanele suplimentare sunt ignorate (doar cele 4 sunt citite)
4. Salvează ca `.xlsx` sau `.csv` (UTF-8 pentru diacritice)

### 2. Upload din interfață

1. Navighează la **Inventariere anuală** (`/inventory/annual`)
2. Click pe **„Import Fixed Assets"** (sau butonul de import)
3. Selectează fișierul `.xlsx` / `.csv`
4. Confirmă importul

### 3. Verificare

După import, verifică:
- [ ] DM apar în lista de inventar (`/inventory`)
- [ ] Câmpurile `acquisitionValue` și `acquisitionDate` sunt populate
- [ ] Statusul implicit al DM-urilor importate este `FUNCTIONAL`
- [ ] Codurile CND sunt corecte (verifică 2-3 cazuri)
- [ ] Nu există duplicate (importul face upsert pe `cndCode`)

---

## Comportament import

| Situație | Comportament |
|----------|-------------|
| DM cu `cndCode` existent | **Update** — actualizează `acquisitionValue` și `acquisitionDate` |
| DM cu `cndCode` nou | **Create** — creează DM cu status `FUNCTIONAL`, `sectionId=1` (default) |
| Rând fără `Cod` | Skip (ignorat silențios) |
| Rând fără `Denumire` | Skip (ignorat silențios) |
| `Valoare` invalidă | Setează `null` |
| `DataInchidere` invalidă | Setează `null` |

---

## Exemplu de fișier

| Cod | Denumire | Valoare | DataInchidere |
|-----|----------|---------|---------------|
| 1001 | Monitor Semne Vitale | 45000 | 2023-06-15 |
| 1002 | Defibrilator | 12000 | 2023-08-20 |
| 1003 | ECG 12 Canale | 8500 | 2024-01-10 |

---

## Importuri suplimentare

### Consumabile (CSV)

Format: `Nume, Model, Producător, Cantitate, CantitateMinima, DataExpirare, Locație`

### Secții (CSV)

Format: `Nume, Cod, Etaj`

---

**Data:** 2026-06-29
**Versiune:** 1.0
