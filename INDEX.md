# Index Documentație — SIMDM

**Ultima actualizare:** 2026-06-29
**Status:** ✅ **Faza 1-8 COMPLETATE** — SIMDM Production Ready

> SIMDM propriu pentru **medicina privată** — alternativă locală la SIMDM-ul național AMDM, conform Ghidului bioinginerului (Ordin MS 889/2024).

---

## Pornire rapidă

| Fișier | Scop | Pentru cine |
|--------|------|-------------|
| [`GETTING-STARTED.md`](GETTING-STARTED.md) | Instalare + pornire (Docker / local) | Dev nou, bioinginer |
| [`README.md`](README.md) | Overview proiect + status complet | Toată lumea |
| [`CLAUDE.md`](CLAUDE.md) | Instrucțiuni + reguli de cod + design rules | AI + dev |

---

## Design System

| Fișier | Scop | Conținut |
|--------|------|----------|
| [`DESIGN.md`](DESIGN.md) | **Sursa de adevăr** | Token-uri YAML, tipografie, componente, layout, responsive — format AI-agent-friendly |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Implementare tehnică | CSS tokens, clase utilitare, accesibilitate, component list |
| [`docs/ACCESSIBILITY-CHECKLIST.md`](docs/ACCESSIBILITY-CHECKLIST.md) | Checklist WCAG 2.2 | 8 categorii, 40+ items de verificat |

---

## Specificație & planuri

| Fișier | Conținut | Cine citește |
|--------|----------|--------------|
| [`SPEC.md`](SPEC.md) | Stivă tech, schema DB, faze, Faza 3 overview | Dev, arhitecți, PM |
| [`tasks/PLAN-FAZA3-DETALIAT.md`](tasks/PLAN-FAZA3-DETALIAT.md) | Plan pas-cu-pas Faza 3 (5 module) | Dev, PM |
| [`tasks/todo.md`](tasks/todo.md) | Checklist live per fază | Dev |

---

## Documentație tehnică

| Fișier | Conținut | Cine citește |
|--------|----------|--------------|
| [`docs/2-DEVELOPER-GUIDE.md`](docs/2-DEVELOPER-GUIDE.md) | Frontend + Backend patterns, testing, Docker | Backend + frontend |
| [`docs/TESTING.md`](docs/TESTING.md) | Ghid testare complet (1033+ backend, 127+ frontend) | Dev |
| [`docs/3-AUDIT-LOG.md`](docs/3-AUDIT-LOG.md) | Snapshot audit accesibilitate Faza 1-2 | Dev, referință |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Reguli contribuții: commit format, workflow, PR | Contributori |
| [`docs/ANTIVIRUS-SETUP.md`](docs/ANTIVIRUS-SETUP.md) | Validare fișiere: magic bytes + ClamAV (25MB) | DevOps |
| [`docs/DOCKER-OPTIMIZATION.md`](docs/DOCKER-OPTIMIZATION.md) | Docker: WSL + resource limits | DevOps |
| [`docs/MOBILE_WORKFLOW_GUIDE.md`](docs/MOBILE_WORKFLOW_GUIDE.md) | Workflow-uri mobile pe teren | Bioinginer (teren) |
| [`docs/IMPORT-DATE-REALE.md`](docs/IMPORT-DATE-REALE.md) | Import inventar real (format XLSX/CSV) | Bioinginer, dev |
| [`docs/GO-LIVE-CHECKLIST.md`](docs/GO-LIVE-CHECKLIST.md) | Checklist deploy producție | DevOps, PM |
| [`frontend/README.md`](frontend/README.md) | Structură frontend, design system, testing | Frontend dev |

---

## Referință normativă

| Resursă | Conținut |
|---------|----------|
| `Ghidul bioinginerului.pdf` | Ordin MS 889/2024 — sursa normativă (formulare Nr. 1-12, proceduri MDM Nr. 1-10) |
