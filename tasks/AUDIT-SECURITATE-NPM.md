# Audit Securitate npm — SIMDM

**Data:** 2026-06-29  
**Context:** Verificare securitate dependințe npm după `npm audit fix`  
**Status:** Acceptabil pentru producție locală

---

## Rezumat

SIMDM rulează **local** pe rețeaua spitalului, **mono-utilizator**, **fără expunere pe internet**. Riscul vulnerabilităților npm este **neglijabil** în acest context — niciuna nu permite RCE sau exfiltrare de date în scenariul de utilizare real.

---

## Backend — 7 vulnerabilități rămase

| Pachet | Severitate | CVE / Descriere | Riscul real |
|--------|-----------|-----------------|-------------|
| `xlsx` | **HIGH** | Prototype pollution + ReDoS (SheetJS) | Mic — rulează local, nu procesează input de la utilizatori externi |
| `@hono/node-server` | Moderate | Middleware bypass prin `//` în URL | Mic — Prisma nu e expus direct, e în spatele Express |
| `prisma` | Moderate | Depinde de @hono/node-server | Mic — același motiv |
| `uuid` | Moderate | Buffer bounds check (v3/v5/v6) | Mic — doar în exceljs/node-cron, nu în flux critic |

**De ce nu pot fi rezolvate:**
- `xlsx` → nu există înlocuitor drop-in; ar strica export-ul Excel (Faza 2)
- `prisma` → downgrade ar strica schema Prisma 7.8
- `uuid` → dependință indirectă (exceljs → uuid), necesită upgrade exceljs (breaking)

---

## Frontend — 1 vulnerabilitate low

| Pachet | Severitate | CVE / Descriere | Riscul real |
|--------|-----------|-----------------|-------------|
| `esbuild` | Low | Arbitrary file read în Windows dev server | **Zero în producție** — esbuild rulează doar în timpul build-ului, nu în container |

**De ce nu poate fi rezolvat:**
- `esbuild` e pinned de Vite 8, upgrade necesită testare completă

---

## Concluzie

Pentru SIMDM (local, mono-utilizator, rețea spital):
- ✅ **Acceptabil** — niciuna nu permite RCE sau exfiltrare
- ✅ **Acțiune**: monitorizare periodică (`npm audit` lunar)
- ⚠️ **Notă**: la upgrade Vite/esbuild, verifică din nou
