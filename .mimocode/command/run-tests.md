---
description: "Run SIMDM test suites — backend Vitest, frontend Vitest, or both"
---

# Run Tests

Run the appropriate test suite for the SIMDM project.

## Usage

```
/run-tests              # both backend + frontend
/run-tests backend      # backend only (Vitest)
/run-tests frontend     # frontend only (Vitest)
/run-tests coverage     # backend with coverage report
```

## Procedure

### Both (default)
```bash
cd 'c:\Users\janea\simdm\backend' && npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 50
cd 'c:\Users\janea\simdm\frontend' && npm run test 2>&1 | tail -20
```

### Backend only
```bash
cd 'c:\Users\janea\simdm\backend' && npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 150
```

### Frontend only
```bash
cd 'c:\Users\janea\simdm\frontend' && npm run test 2>&1 | tail -50
```

### Coverage
```bash
cd 'c:\Users\janea\simdm' && npm run test:coverage 2>&1 | grep -A 5 "Coverage summary"
```

## Notes

- Backend: Vitest + Prisma (tests hit real PostgreSQL via Docker)
- Frontend: Vitest + React Testing Library
- E2E (Playwright): requires running servers — not included in default run
- Target coverage: ≥95% per PLAN-FAZA3-DETALIAT.md §0
