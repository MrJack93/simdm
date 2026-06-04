# Ghid Workflow Mobile — SIMDM

**Audiență:** Bioinginer medical care lucrează pe teren (salon, bloc operator, depozit)  
**Versiune:** 1.0 | **Data:** 2026-06-05

---

## Contexte de Utilizare Mobile

### 1. Verificare rapidă status dispozitiv (30 sec)
Scenariul: Ești la patul pacientului și vrei să verifici statusul unui DM.

**Workflow:**
1. Deschide SIMDM pe telefon → http://spital-local:5173
2. `Inventar` → search după nume sau nr. inventar
3. View implicit: **Table** (funcționează bine și pe telefon)
4. Status vizibil imediat prin badge colorat

**Sfat:** Folosește căutarea text — mai rapid decât scroll pe lista completă.

---

### 2. Verificare stoc consumabile (1 min)
Scenariul: Ești în depozit și verifici ce trebuie comandat.

**Workflow:**
1. `Consumabile` → filtrează după "Urgență: URGENT sau CRITIC"
2. Vizualizezi bara procentuală de stoc direct în tabel
3. Stocul critic este evidențiat cu fundal roșu ușor

**Sfat:** Sortează după "% Stoc" pentru a vedea cel mai critic stoc primul.

---

### 3. Adăugare stoc la sosirea livrării (2 min)
Scenariul: A sosit livrarea și trebuie să actualizezi stocul.

**Workflow:**
1. `Consumabile` → găsește consumabilul
2. Apasă butonul `+` (coloana Acțiuni)
3. Introdu cantitatea adăugată → `Adaugă`
4. Toast de confirmare apare imediat

---

### 4. Raportare incident pe teren (3 min)
Scenariul: Ai observat o defecțiune sau incident în salon.

**Workflow:**
1. `Incidente` → `Raportează Incident`
2. Completează: dispozitiv, dată/oră, descriere, severitate
3. Bifează "Pacient afectat" dacă e cazul
4. Apasă `Raportează` → incident înregistrat cu timestamp

**Important:** Raportează IMEDIAT — sistemul salvează ora exactă.

---

### 5. Înregistrare mentenanță după execuție (3 min)
Scenariul: Tocmai ai terminat mentenanța preventivă.

**Workflow:**
1. `Mentenanță` → `Adaugă Înregistrare`
2. Selectează dispozitivul, tipul (Preventivă/Corectivă)
3. Data execuției = azi (câmpul se poate completa rapid)
4. Descriere minimă + salvare

---

## Breakpoints Responsive

| Ecran | Comportament |
|-------|-------------|
| < 768px (mobile) | Meniu hamburger, coloane tabel reduse, butoane full-width |
| 768–1024px (tabletă) | Nav desktop vizibil, layout hybrid |
| > 1024px (desktop) | Layout complet, toate coloanele vizibile |

---

## Touch Target Guidelines

Toate butoanele interactive respectă minimum **44×44px** (WCAG 2.5.5):
- Butoanele de acțiune (Edit, Delete, +Stock): `p-1.5` = ~36px → înlocuiți cu `p-2` pe mobile dacă e nevoie
- Butoanele principale (`btn-primary`, `btn-secondary`): `py-2 px-4` = ≥44px ✓
- Select-uri și input-uri: `input-base` include `py-2` = ≥44px ✓

---

## Known Limitations Mobile (Planned Future)

| Feature | Status | Motivație |
|---------|--------|-----------|
| **PWA (offline)** | ⏳ Planned | Necesită Service Worker + IndexedDB + sync complex |
| **Barcode scanning** | ⏳ Planned | Necesită cameră API + integrare backend |
| **Push notifications** | ⏳ Planned | Necesită PWA sau notificări native |
| **Optimizare forme mobile** | ⏳ Planned | Forme complexe (DeviceForm 3-step) greu de completat pe mobile |

---

## Probleme Frecvente Mobile

**Problema:** Tabelul iese din ecran  
**Soluție:** Tabelele au `overflow-x-auto` — scroll orizontal funcționează cu swipe.

**Problema:** Modalele sunt prea mari  
**Soluție:** Toate modalele au `max-h-[90vh] overflow-y-auto` — scroll vertical în modal.

**Problema:** Meniul nu se închide  
**Soluție:** Click pe orice link din meniu sau apasă Escape — meniul se închide automat.

---

*Ghid creat: 2026-06-05 | SIMDM v2.4*
