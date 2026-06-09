# 🧪 FAZA 3 — GHID TESTARE COMPLETĂ

## Overview

Faza 3 conține **158 teste** organizate în 3 niveluri:
- **Backend Tests** (66) — Vitest + Supertest
- **Frontend Tests** (62) — Vitest + React Testing Library
- **E2E Tests** (30) — Playwright

**Target:** ≥95% code coverage

---

## 1. Setup Dependințe

```bash
# Backend
cd backend
npm install vitest supertest @testing-library/react --save-dev

# Frontend
cd ../frontend
npm install vitest @testing-library/react @testing-library/user-event --save-dev

# E2E (Playwright)
cd ..
npm install --save-dev @playwright/test
```

---

## 2. Backend Tests — npm test (Backend)

### 2.1 Rulează TOATE testele backend

```bash
cd backend
npm test
```

### 2.2 Rulează test specific

```bash
# Notifications (cron jobs)
npm test -- notifications.test.js

# Repair tickets
npm test -- repairTickets.test.js

# Maintenance plans
npm test -- maintenancePlans.test.js

# Verifications
npm test -- verifications.test.js

# Service contracts
npm test -- serviceContracts.test.js
```

### 2.3 Rulează cu coverage report

```bash
npm test -- --coverage
```

### 2.4 Watch mode (auto-rerun pe change)

```bash
npm test -- --watch
```

---

## 3. Frontend Tests — npm run test:frontend

### 3.1 Rulează TOATE testele frontend

```bash
cd frontend
npm run test
```

### 3.2 Rulează test specific

```bash
npm test -- MaintenanceCalendarPage.test.jsx
npm test -- RepairTicketsPage.test.jsx
npm test -- VerificationsPage.test.jsx
npm test -- ServiceContractsPage.test.jsx
npm test -- MppExecutionForm.test.jsx
```

### 3.3 Coverage report

```bash
npm test -- --coverage
```

### 3.4 UI mode (Vitest dashboard)

```bash
npm test -- --ui
```

---

## 4. E2E Tests — npm run test:e2e

### 4.1 Rulează TOATE scenariile E2E

```bash
npx playwright test
```

### 4.2 Rulează test specific

```bash
# Authentication
npx playwright test auth.spec.js

# Maintenance
npx playwright test maintenance.spec.js

# Repair tickets
npx playwright test repairTickets.spec.js

# Verifications
npx playwright test verifications.spec.js

# Service contracts
npx playwright test serviceContracts.spec.js
```

### 4.3 Headed mode (vizualizare browser)

```bash
npx playwright test --headed
```

### 4.4 Debug mode (step through)

```bash
npx playwright test --debug
```

### 4.5 UI mode (Playwright Inspector)

```bash
npx playwright test --ui
```

---

## 5. Executare Completă (Toate testele)

### 5.1 Secvențial (recomanded pentru CI)

```bash
cd backend
npm test

cd ../frontend
npm test

cd ..
npx playwright test
```

### 5.2 Script npm (dacă sunt configurate)

```bash
npm run test:all
```

---

## 6. Coverage Report — ≥95%

### 6.1 Backend coverage

```bash
cd backend
npm test -- --coverage

# Expect: Lines: 95%+, Functions: 95%+, Branches: 90%+
```

### 6.2 Frontend coverage

```bash
cd frontend
npm test -- --coverage

# Expect: Lines: 95%+, Functions: 95%+
```

### 6.3 Combined report

```bash
# After running both, merge reports:
npx nyc report --reporter=text
```

---

## 7. Test Structure

### 7.1 Backend Tests

```
backend/src/__tests__/
├── notifications.test.js          ← CRON JOBS (NEW)
├── maintenancePlans.test.js
├── mppExecutions.test.js
├── repairTickets.test.js
├── verifications.test.js
├── serviceContracts.test.js
└── setup.js                        ← Global setup
```

**Exemple teste:**
- ✅ checkVerificationExpiry() — alerte 60/30/7 zile
- ✅ checkContractExpiry() — alerte 30 zile
- ✅ checkMaintenanceDue() — SCADENT/DEPASIT
- ✅ checkRepairTickets() — critice >7 zile
- ✅ generateComplianceSummary() — raport zilnic
- ✅ startCronJobs() — pornire task

### 7.2 Frontend Tests

```
frontend/src/__tests__/
├── MaintenanceCalendarPage.test.jsx
├── RepairTicketsPage.test.jsx
├── VerificationsPage.test.jsx
├── ServiceContractsPage.test.jsx
└── MppExecutionForm.test.jsx
```

**Exemple teste:**
- ✅ Randare calendar, navigare luni
- ✅ Creare plan mentenanță
- ✅ Kanban board cu 5 coloane
- ✅ Schimbare status cu state machine
- ✅ Upload certificat + raport conformitate
- ✅ Rating furnizor + cost analysis
- ✅ Semnătură digitală

### 7.3 E2E Tests (Playwright)

```
frontend/src/__tests__/e2e/
├── auth.spec.js
├── maintenance.spec.js
├── repairTickets.spec.js
├── verifications.spec.js
├── serviceContracts.spec.js
└── playwright.config.js
```

**Scenarii:**
1. **auth.spec.js** — Login/Logout/Erori
2. **maintenance.spec.js** — Calendar → Create Plan → Verify
3. **repairTickets.spec.js** — Kanban → Create → Triage → Repair → PDF
4. **verifications.spec.js** — Upload → Compliance
5. **serviceContracts.spec.js** — Create → Rate → Analysis

---

## 8. Mock Data & Setup

### 8.1 Backend — Test Database

```bash
# Use test database from .env.test
TEST_DB_URL=postgresql://test:test@localhost:5432/simdm_test

# Auto-seeded by setup.js before tests
```

### 8.2 Frontend — Mock API

```javascript
// Fiecaretest używa vi.mock() pentru API calls
vi.mock('../api/maintenancePlans', () => ({...}));
vi.mock('../api/devices', () => ({...}));
```

### 8.3 E2E — Real Database + Server

```bash
# Backend server runs on http://localhost:3001
# Frontend on http://localhost:3000
# Tests hit real endpoints
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions (exemplu)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      
      - name: Backend Tests
        run: cd backend && npm test
      
      - name: Frontend Tests
        run: cd frontend && npm test
      
      - name: E2E Tests
        run: npx playwright test
```

---

## 10. Troubleshooting

### 10.1 Tests Nu Rulează

```bash
# Ensure dependencies installed
npm install

# Clear cache
npm run test -- --clearCache

# Run with verbose output
npm test -- --reporter=verbose
```

### 10.2 E2E Tests Timeout

```bash
# Increase timeout in playwright.config.js
use: {
  timeout: 30000,  // 30 seconds
}
```

### 10.3 Database Connection Errors

```bash
# Ensure test database is running
docker-compose up -d postgres

# Check connection
psql postgresql://test:test@localhost:5432/simdm_test
```

### 10.4 Coverage > 95% Not Met

```bash
# Find uncovered lines
npm test -- --coverage --reporter=lcov

# Open HTML report
open coverage/index.html
```

---

## 11. Test Checklist

- [ ] Backend tests run: `npm test` (backend)
- [ ] Frontend tests run: `npm test` (frontend)
- [ ] E2E tests run: `npx playwright test`
- [ ] Coverage ≥95% backend
- [ ] Coverage ≥95% frontend
- [ ] All E2E scenarios pass
- [ ] No flaky tests
- [ ] No console errors
- [ ] Database cleanup after tests
- [ ] CI/CD pipeline green

---

## 12. Performance Benchmarks

| Test Suite | Count | Time |
|------------|-------|------|
| Backend | 66 | ~30s |
| Frontend | 62 | ~20s |
| E2E | 30 | ~60s |
| **Total** | **158** | **~110s** |

---

## 13. Integrare în CLAUDE.md

Rulează înainte de fiecare commit:

```bash
# All tests must pass
npm run test:all

# Coverage must be ≥95%
npm test -- --coverage
```

---

**Status:** ✅ GATA PENTRU PRODUCTION
