# Backlog — Faza 1 & 2: Nice-to-Have (best practices 2026)

**Creat:** 2026-06-29 · **Context:** Conformitatea cu Ghidul (Ordin MS 889/2024) pentru Faza 1 (fundație/auth/infra) și Faza 2 (inventar DM) este **100%** — Fișa DM e acoperită integral de modelul `devices` (inclusiv `electricalSafetyClass`, `financingSource`, `destination`). Acest document listează îmbunătățiri **peste** cerințele normative, conform best practices 2026 pentru o aplicație medicală locală, mono-utilizator, folosită și pe teren (Moldova, RO/RU).

> **Niciunul nu e obligatoriu** pentru go-live. Sunt prioritizate ca **P1 (recomandat)**, **P2 (valoare bună)**, **P3 (opțional)**. Fiecare are: *Ce* · *De ce (best practice)* · *Efort*.

---

## A. Faza 1 — Securitate & Auth

### A1. [P1] Validare strictă a configurației la pornire (fail-fast)
*Ce:* la boot, validează `.env` cu Zod (`zod-env`/`envalid`) — JWT secret prezent + ≥32 caractere, `NODE_ENV` valid, `CLAMAV_ENABLED`, `COOKIE_SECURE=true` dacă `NODE_ENV=production`. Crash imediat cu mesaj clar dacă lipsește/e slab.
*De ce:* previne exact bug-ul C1 din auditul Fazei 1 (secret placeholder) să reapară la deploy; OWASP ASVS V14.
*Efort:* mic (½ zi).

### A2. [P1] Audit-log tamper-evident (hash-chain)
*Ce:* fiecare intrare `audit_logs` include hash-ul intrării anterioare (lanț SHA-256), ca la integritatea documentelor (Faza 5.1). Endpoint de verificare a integrității lanțului.
*De ce:* pista de audit medicală trebuie să fie dovedibil nemodificată; reutilizează patternul de hash deja existent.
*Efort:* mediu (1–2 zile).

### A3. [P2] 2FA opțional (TOTP)
*Ce:* TOTP (Google Authenticator) opțional pentru contul bioinginerului.
*De ce:* defense-in-depth pe date medicale, chiar mono-utilizator; standard 2026.
*Efort:* mediu (2 zile).

### A4. [P2] Politică de parolă + verificare breach
*Ce:* la `change-password`, scor de tărie (zxcvbn) + verificare HaveIBeenPwned (k-anonymity, doar hash-prefix) + reguli minime. (Acum: doar min 8 caractere.)
*De ce:* NIST 800-63B / OWASP — parolele compromise sunt vectorul #1.
*Efort:* mic-mediu (1 zi).

### A5. [P2] Management sesiuni în UI
*Ce:* pagină „Sesiuni active" care listează `refresh_tokens` (dispozitiv, IP, ultima folosire) + buton „Deconectează toate dispozitivele". Datele există deja în tabel.
*De ce:* control utilizator + răspuns rapid la compromitere; best practice 2026.
*Efort:* mic (1 zi).

### A6. [P3] Logging structurat + correlation IDs
*Ce:* înlocuiește `console.log`/`appendFileSync` cu `pino` (niveluri, JSON, fără PII), `X-Request-Id` per cerere.
*De ce:* observabilitate, debugging în producție; `appendFileSync` sincron blochează event-loop-ul (semnalat la auditul Fazei 1, L3).
*Efort:* mic (1 zi).

### A7. [P3] Graceful shutdown + readiness probe
*Ce:* handler `SIGTERM` (drenează conexiunile, `prisma.$disconnect`); `/api/ready` (DB + disc) separat de `/api/health`.
*De ce:* deploy/restart curat sub orchestrator/PM2/Docker.
*Efort:* mic (½ zi).

---

## B. Faza 1 — Infra & DevEx

### B1. [P1] CI pipeline cu gate de coverage
*Ce:* GitHub Actions: lint + `npm test` + coverage ≥90 (gate) + build, pe push/PR. Eșec → blochează merge.
*De ce:* previne regresiile (am văzut în acest proiect mai multe „verde local, dar...") — automatizarea e singura garanție.
*Efort:* mic (1 zi).

### B2. [P2] Scanare dependențe (supply-chain)
*Ce:* `npm audit --audit-level=high` în CI + Dependabot/Renovate pentru update-uri.
*De ce:* vulnerabilități în dependențe = risc real; standard 2026.
*Efort:* mic (½ zi).

### B3. [P2] Documentație API (OpenAPI/Swagger)
*Ce:* spec OpenAPI generat (din rute/Zod) + `/api/docs` (swagger-ui), protejat cu auth.
*De ce:* mentenabilitate, onboarding, contract clar frontend↔backend (peste 20 de rute acum).
*Efort:* mediu (1–2 zile).

### B4. [P3] Hardening container
*Ce:* Dockerfile cu user non-root, imagine de bază minimală (alpine/distroless), `HEALTHCHECK`, `.dockerignore` complet.
*De ce:* suprafață de atac redusă la deploy.
*Efort:* mic (½ zi).

### B5. [P3] Migrare graduală spre TypeScript (sau `tsc --checkJs`)
*Ce:* frontend e `.jsx` + JSDoc; activează `checkJs` în `jsconfig` sau migrează incremental.
*De ce:* siguranță de tipuri — ar fi prins bug-ul de import rupt din Faza 5.1.
*Efort:* mare (incremental).

---

## C. Faza 2 — Model de date DM

### C1. [P1] Câmp `supplier` (Furnizor) pe `devices` ⭐ (remarca reținută)
*Ce:* adaugă `supplier String?` pe `devices` + în formularul de creare/editare + în `fisa-pdf`.
*De ce:* Fișa de mentenanță (Formular Nr. 6) listează „Furnizor". Acum e capturat doar la procurare/recepție — pentru paritate 1:1 cu fișa, ar trebui și pe device.
*Efort:* mic (½ zi — migrare + câmp UI + PDF).

### C2. [P1] UDI + GMDN/UMDNS
*Ce:* `udiDi`/`udiPi` (Unique Device Identification, EU MDR/EUDAMED) + `gmdnCode` (nomenclator internațional, referit de Ghid la vigilență).
*De ce:* trasabilitate conform MDR; aliniere cu EUDAMED și raportarea de vigilență (IMDRF/GMDN). Standard 2026 pentru DM.
*Efort:* mediu (1 zi schema + UI; scanare UDI vezi C5).

### C3. [P2] Fotografie + atașamente multiple pe DM
*Ce:* imagine a dispozitivului + galerie atașamente (peste cele 4 URL-uri fixe: manual/certificat/factură/pașaport) — reutilizează DMS-ul din Faza 5 cu `deviceId`.
*De ce:* identificare vizuală rapidă pe teren; DMS-ul deja suportă legarea la DM.
*Efort:* mic (reutilizare).

### C4. [P2] Concurență optimistă pe editare (lost-update)
*Ce:* PUT/PATCH verifică `updatedAt`/versiune (If-Unmatched) → 409 dacă altcineva a modificat între timp.
*De ce:* integritatea datelor medicale; best practice REST 2026.
*Efort:* mic (½ zi).

### C5. [P1] Etichete QR + scanare pe teren
*Ce:* generare etichetă QR (cu `inventoryNumber`) printabilă per DM; pe mobil, scanare QR → deschide fișa DM.
*De ce:* **cel mai mare câștig pentru bioinginerul pe teren** — identifică instant un DM fizic. Se leagă de `MOBILE_WORKFLOW_GUIDE`.
*Efort:* mediu (1–2 zile; lib QR client-side).

---

## D. Faza 2 — UX & funcționalitate

### D1. [P2] Timeline unificat per DM
*Ce:* pe fișa DM, un singur flux cronologic care agregă: mentenanțe (MPP+corectiv), incidente, verificări, dare în exploatare, casare. (`DeviceTimeline` există — de extins să tragă din toate modulele.)
*De ce:* „povestea" completă a unui DM într-un singur loc — exact ce cere un audit retrospectiv.
*Efort:* mediu (1–2 zile).

### D2. [P2] Diff lizibil al modificărilor (audit)
*Ce:* `audit_logs.changes` stochează before/after; afișează un diff prietenos (câmp → vechi/nou) pe fișa DM / pagina de audit.
*De ce:* transparență — datele există, lipsește doar vizualizarea.
*Efort:* mic-mediu (1 zi).

### D3. [P3] Filtre salvate + căutare full-text
*Ce:* salvarea preset-urilor de filtre; căutare full-text pe mai multe câmpuri (Postgres `tsvector`).
*De ce:* eficiență la parcuri mari de DM.
*Efort:* mediu.

### D4. [P3] PWA / offline pentru teren
*Ce:* service worker + cache read-only al inventarului + coadă de sincronizare pentru acțiuni pe teren (WiFi slab în spital).
*De ce:* utilizarea „pe teren" e un caz de bază al aplicației; offline-first e best practice 2026 pentru mobil.
*Efort:* mare (3–4 zile).

---

## E. Cross-cutting (Faza 1 + 2)

### E1. [P2] i18n (RO + RU)
*Ce:* extrage string-urile hardcodate în `react-i18next`; adaugă RU.
*De ce:* în Moldova, personalul medical e frecvent vorbitor de rusă; multilingv = adopție mai bună.
*Efort:* mare (incremental; valoare mare).

### E2. [P3] Telemetrie de erori (self-hosted)
*Ce:* GlitchTip/Sentry self-hosted pentru erori runtime frontend+backend.
*De ce:* vizibilitate asupra problemelor reale ale utilizatorului, fără cloud terț.
*Efort:* mic-mediu.

---

## Recomandare de prioritizare (dacă se face o „Faza 9 — Polish")
**Val rapid (P1, ~1 săptămână):** C1 (supplier ⭐), C5 (QR scanare teren), A1 (env fail-fast), A2 (audit hash-chain), B1 (CI gate), C2 (UDI/GMDN).
**Apoi (P2):** A4 (parolă breach), A5 (sesiuni UI), D1 (timeline unificat), D2 (diff audit), C3 (foto DM), C4 (concurență), B3 (OpenAPI).
**Strategic (P3, când e timp):** D4 (PWA offline), E1 (i18n RO/RU), B5 (TypeScript), A3 (2FA).

> **De reținut pentru planuri viitoare:** câmpul **`supplier` pe `devices`** (C1) este remarca explicită din auditul Faza 1+2 — de inclus prioritar. UDI/GMDN (C2) și QR pe teren (C5) sunt cele mai valoroase adăugiri „2026" peste normativ.
