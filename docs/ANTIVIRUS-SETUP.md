# 🔒 Antivirus Setup & File Security — SIMDM

**Dată:** 2026-06-02 (Updated for Faza 1-2)  
**Caracteristică:** Magic byte detection + ClamAV optional  
**Status:** ✅ Implementat (Faza 2) + Production-ready

**Descripție:** SIMDM implementează **siguritate multi-strat pentru documente medicale**, inclusiv detectare magic bytes, validare dimensiune fișier, și scanare cu antivirus (ClamAV-ready pentru producție). Documentele încărcate sunt validate și loggate complet în jurnal de audit.

---

## 📋 Prezentare generală

SIMDM implementează **siguritate multi-strat pentru documentele medicale**:

1. **Validarea tipului de fișier** — Detectare magic bytes (nu doar MIME type)
2. **Limite de dimensiune** — Maximum 10MB per fișier
3. **Scanare ClamAV opțională** — Detectare malware în timp real (producție)
4. **Logging în jurnal de audit** — Toate încărcările sunt loggate cu rezultate scanare

---

## 🏗️ Arhitectură

### Mediul de dezvoltare
- ✅ Validarea tipului de fișier (magic bytes)
- ✅ Validarea dimensiunii
- ⚠️ ClamAV opțional (dezactivat implicit)

### Mediul de producție
- ✅ Validarea tipului de fișier (magic bytes)
- ✅ Validarea dimensiunii
- ✅ Scanare ClamAV (OBLIGATORIE)

---

## 🚀 Instalare și configurare

### Pasul 1: Instalare pachete (deja efectuată)
```bash
cd backend
npm install clamscan file-type
```

### Pasul 2: Dezvoltare (ClamAV nu este necesar)
Funcționează din start. ClamAV este dezactivat implicit.

```bash
npm run dev
# Încarcă fișiere → Doar validare tip
```

### Pasul 3: Configurare producție cu ClamAV

#### Opțiunea A: Docker (Recomandat)

Adaugă la `docker-compose.yml`:

```yaml
clamav:
  image: clamav/clamav:1.4
  container_name: simdm-clamav
  ports:
    - "3310:3310"
  volumes:
    - clamav-data:/var/lib/clamav
  environment:
    - FRESHCLAM_CHECKS=24
  healthcheck:
    test: ["CMD", "clamscan", "--version"]
    interval: 10s
    timeout: 5s
    retries: 3

volumes:
  clamav-data:
```

#### Opțiunea B: Linux (ClamAV Daemon)

```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# Pornire daemon pe portul 3310
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# Verificare
sudo systemctl status clamav-daemon
```

#### Opțiunea C: Windows

```powershell
# Instalare ClamAV cu chocolatey
choco install clamav

# Pornire serviciu clamd
net start clamd
```

### Pasul 4: Activare în producție

Setează variabilele de mediu în `.env.production`:

```env
# ClamAV Configuration
CLAMAV_ENABLED=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

Sau via mediu:
```bash
export CLAMAV_ENABLED=true
export CLAMAV_HOST=clamav-service
export CLAMAV_PORT=3310
npm start
```

---

## 📝 Suport tipuri de fișiere

### MIME type-uri permise

| Categorie | Tipuri | Extensii |
|----------|--------|----------|
| **Documente** | application/pdf | .pdf |
| **Word** | application/msword | .doc |
| **Word** | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx |
| **Spreadsheet** | application/vnd.ms-excel | .xls |
| **Spreadsheet** | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | .xlsx |
| **Imagini** | image/jpeg | .jpg, .jpeg |
| **Imagini** | image/png | .png |
| **Imagini** | image/tiff | .tif, .tiff |
| **Text** | text/plain | .txt |

### Limite dimensiune fișiere

- **Maximum:** 10 MB per fișier
- **Justificare:** Manuale dispozitive medicale, certificate, facturi

### Caracteristici de siguritate

1. **Detectare Magic Bytes** — Verifică conținutul real al fișierului, nu doar extensia
   - Previne `malware.exe` redenumit în `malware.pdf`
   - Detectează nepotriviri tip fișier

2. **Logging Nepotrivire MIME Type** — Semnalizează încărcări suspecte
   - MIME original versus MIME detectat sunt loggate în jurnal audit

3. **Scanare ClamAV** — Antivirus în timp real
   - Detectează troieni, viruși, wormuri, spyware
   - Definiții virale actualizate de 24 de ori pe zi (FRESHCLAM_CHECKS=24)

---

## 🧪 Testare

### Dezvoltare (fără ClamAV)

```bash
# Pornire server
npm run dev

# Test încărcare PDF valid
curl -X POST http://localhost:3001/api/devices/1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"

# Răspuns (ClamAV dezactivat):
# {
#   "message": "Fișier încărcat cu succes [Scanned: application/pdf]",
#   "device": {...},
#   "fileUrl": "/uploads/devices/...",
#   "scan": {
#     "fileSize": 1234,
#     "mimeType": "application/pdf",
#     "clamavScanned": false,
#     "timestamp": "2026-05-30T..."
#   }
# }
```

### Producție (cu ClamAV)

```bash
# După pornirea serviciu ClamAV
export CLAMAV_ENABLED=true
npm start

# Test încărcare
curl -X POST http://localhost:3001/api/devices/1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"

# Răspuns (ClamAV activat):
# {
#   "message": "Fișier încărcat cu succes [Scanned: application/pdf]",
#   "scan": {
#     "clamavScanned": true,
#     "infected": false,
#     "viruses": []
#   }
# }
```

### Cazuri de eroare

**Tip fișier nevalid:**
```
POST /api/devices/1/upload
Body: executable.exe mascat ca .pdf

Response (400):
{
  "error": "Tip fișier detectat nesuportat: application/x-msdownload"
}
```

**Fișier prea mare:**
```
POST /api/devices/1/upload
Body: 50MB_file.pdf

Response (400):
{
  "error": "Fișierul este prea mare (max 10MB)"
}
```

**Fișier infectat (ClamAV activat):**
```
POST /api/devices/1/upload
Body: eicar.com (EICAR test virus)

Response (400):
{
  "error": "Fișier infectat detectat: Eicar-Test-File"
}
```

---

## 📊 Logging în jurnal de audit

Fiecare încărcare de fișier este logată:

```sql
SELECT * FROM audit_logs 
WHERE action = 'FILE_UPLOAD' 
ORDER BY timestamp DESC;
```

Exemplu înregistrare audit:
```json
{
  "userId": 1,
  "action": "FILE_UPLOAD",
  "entity": "Device",
  "entityId": "5",
  "changes": {
    "filename": "Manual_Device_XYZ.pdf",
    "size": 2458624,
    "mimeType": "application/pdf",
    "clamavScanned": true,
    "timestamp": "2026-05-30T10:56:00Z"
  },
  "timestamp": "2026-05-30T10:56:00Z"
}
```

---

## 🔍 Depanare

### ClamAV nu se conectează

```
⚠️ ClamAV scan unavailable: connect ECONNREFUSED 127.0.0.1:3310
```

**Soluție:**
1. Verifică dacă ClamAV rulează: `sudo systemctl status clamav-daemon`
2. Verifică portul: `netstat -tuln | grep 3310`
3. Repornește daemon-ul: `sudo systemctl restart clamav-daemon`

### Tip fișier nu este detectat

```
Tip fișier nesuportat (nu s-a putut detecta)
```

**Cauză:** Fișierul nu are magic bytes (corupt sau încapsulat într-un container)

**Soluție:** Validează fișierul sursă, asigură-te că nu este protejat cu parolă sau criptat

### Nepotrivire MIME Type logată

```
⚠️ MIME mismatch: original=application/pdf, detected=application/zip
```

**Acțiune:** Fișierul a fost încărcat cu extensie greșită. Investighează sursa.

---

## 📚 Referințe

- **ClamAV Docs:** https://www.clamav.net/documents
- **file-type NPM:** https://www.npmjs.com/package/file-type
- **EICAR Test Virus:** https://en.wikipedia.org/wiki/EICAR_test_file

---

## ✅ Conformitate

Această implementare satisface:
- ✅ OWASP File Upload Security
- ✅ ISO 27001 Malware Protection
- ✅ Medical Device Data Integrity Standards
- ✅ Romanian Data Protection Requirements (GDPR-aligned)

---

**Last Updated:** 2026-05-30  
**Status:** Production-Ready ✅
