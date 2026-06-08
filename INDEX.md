# Index Documentație — SIMDM

**Ultima actualizare:** 2026-06-08
**Status:** Faza 1-2 complete + auditate & remediate ✅ | Faza 3 în lucru 🔧 | Documentație consolidată

> SIMDM propriu pentru **medicina privată** — alternativă locală la SIMDM-ul național AMDM, conform Ghidului bioinginerului (Ordin MS 889/2024).

---

## Pornire rapidă

| Fișier | Scop | Pentru cine |
|--------|------|-------------|
| [GETTING-STARTED.md](GETTING-STARTED.md) | Instalare + pornire (Docker / local) | Dev nou, bioinginer |
| [README.md](README.md) | Overview proiect + status complet | Toată lumea |
| [CLAUDE.md](CLAUDE.md) | Instrucțiuni + reguli de cod (inclusiv reguli securitate din audit) | AI + dev |

---

## Specificație & planuri

| Fișier | Conținut | Cine citește |
|--------|----------|--------------|
| [SPEC.md](SPEC.md) | Stivă tech, schema DB, faze, Faza 3 overview (§15) | Dev, arhitecți, PM |
| [tasks/PLAN-FAZA3-DETALIAT.md](tasks/PLAN-FAZA3-DETALIAT.md) | **Plan pas-cu-pas Faza 3** (5 module, schema, API, PDF-uri, teste, DoD) | Dev, PM |
| [tasks/todo.md](tasks/todo.md) | Checklist live de progres per fază | Dev |

---

## Documentație tehnică

| Fișier | Conținut | Cine citește |
|--------|----------|--------------|
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | **Design + accesibilitate (consolidat)**: token-uri, componente, WCAG AA, light/dark | Frontend |
| [docs/2-DEVELOPER-GUIDE.md](docs/2-DEVELOPER-GUIDE.md) | Ghid frontend + backend: structură, tipare, checklist calitate | Backend + frontend |
| [docs/3-AUDIT-LOG.md](docs/3-AUDIT-LOG.md) | Documentația funcției de audit-log (compliance) | Dev, referință |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Reguli contribuții: commit format, workflow, PR | Contributori |
| [docs/ANTIVIRUS-SETUP.md](docs/ANTIVIRUS-SETUP.md) | Validare fișiere: magic bytes + ClamAV | DevOps |
| [docs/DOCKER-OPTIMIZATION.md](docs/DOCKER-OPTIMIZATION.md) | Docker: WSL + resource limits | DevOps |
| [docs/MOBILE_WORKFLOW_GUIDE.md](docs/MOBILE_WORKFLOW_GUIDE.md) | Workflow-uri mobile pe teren + breakpoints | Bioinginer (teren) |

---

## Referință normativă

| Resursă | Conținut |
|---------|----------|
| `Ghidul bioinginerului.pdf` | Ordin MS 889/2024 — sursa normativă (formulare Nr. 1-12, proceduri MDM Nr. 1-10) |

---

## Note despre curățenia documentației (2026-06-08)

- **Consolidat:** 8 documente de design (DESIGN_HANDOFF_SPECS, 1-DESIGN-AND-ACCESSIBILITY, COMPONENT_LIBRARY, ACCESSIBILITY_GUIDE, LIGHT_MODE_GUIDE, DESIGN_SYSTEM_SIMDM, CONTRAST_TESTING, SHADCN_SETUP) → un singur **docs/DESIGN-SYSTEM.md**.
- **Șterse:** 3 fișiere de audit (probleme rezolvate), duplicat `CONTRIBUTING.md` (root), `tasks/plan.md` (superseded de PLAN-FAZA3-DETALIAT.md).
- **Curățat:** 4 worktree-uri git vechi + artefacte Playwright scoase din tracking.
