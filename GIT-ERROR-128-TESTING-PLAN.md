# 🧪 PLAN DE TESTARE — GIT ERROR 128

**Scop:** Identifica cauza exactă și verifica soluția propusă

---

## FAZA 1: DIAGNOZĂ (Before Any Changes)

### Test 1.1: Monitorizare Warnings
**Task:** Observă dacă error apare consistent sau random

```
Rulați CI pipeline 5 de ori și notați:
- [ ] Run 1: Error apare? DA / NU
- [ ] Run 2: Error apare? DA / NU
- [ ] Run 3: Error apare? DA / NU
- [ ] Run 4: Error apare? DA / NU
- [ ] Run 5: Error apare? DA / NU

Pattern: Consistent / Random / Only in specific job
```

---

### Test 1.2: Verifică Git Commands în Prisma
**Task:** Identifică ce git commands rulează Prisma

```bash
# În CI, adaugă debug logging:
- name: Debug Prisma Commands
  run: |
    echo "=== Prisma Generate Debug ==="
    GIT_TRACE=1 npx prisma generate 2>&1 | grep -i git || echo "No git commands"
    
    echo "=== Prisma Migrate Debug ==="
    GIT_TRACE=1 npx prisma migrate deploy 2>&1 | grep -i git || echo "No git commands"
```

**Expected Output:**
- Dacă vede `git` commands → Prisma definitiv apelează git
- Dacă NU vede nimic → Error vine din altundeva

---

### Test 1.3: Verifică GITHUB_TOKEN Scopes
**Task:** Confirma că token are scopes corecte

```bash
# Rulează manual:
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Ar trebui să returneze user info (nu 401 Unauthorized)
```

---

## FAZA 2: IMPLEMENTARE SOLUȚII (Test One at a Time)

### Soluție #1: PRISMA_SKIP_GIT_VALIDATION
**Descriere:** Spune Prisma să nu valideze git

**Modifică CI.yml:**
```yaml
- name: Generate Prisma Client
  working-directory: backend
  run: npx prisma generate
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/test_db
    PRISMA_SKIP_GIT_VALIDATION: 1  # ADD THIS
```

**Verifica:** 
- [ ] Error 128 dispare?
- [ ] Testele trec?
- [ ] Prisma functionality e la fel?

**Expected:** ✅ Error dispare, testele trec normal

---

### Soluție #2: Git Credentials Explicit
**Descriere:** Configura git credentials pentru Prisma

**Adaugă în CI înainte de Prisma:**
```yaml
- name: Setup Git for Prisma
  run: |
    git config --global user.email "ci@simdm.local"
    git config --global user.name "SIMDM CI"
    git config --global credential.helper store
    echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Verifica:**
- [ ] Error 128 dispare?
- [ ] Testele trec?

**Expected:** ✅ Error dispare, testele trec normal

---

### Soluție #3: Upgrade Prisma Version
**Descriere:** Prisma 7.8.0 poate avea bug - testează versiune mai nouă

**Modifică backend/package.json:**
```json
{
  "@prisma/client": "^7.9.0",  // was 7.8.0
  "prisma": "^7.9.0"            // was 7.8.0
}
```

**Workflow:**
```bash
cd backend
npm install
npm run test
```

**Verifica:**
- [ ] npm install successful?
- [ ] Tests run and pass?
- [ ] Error 128 pe CI?

---

## FAZA 3: VALIDARE (After Soluție Selected)

### Validation 1: Run CI Multiple Times
```
[ ] Run #1: PASS / FAIL
[ ] Run #2: PASS / FAIL
[ ] Run #3: PASS / FAIL
[ ] Run #4: PASS / FAIL
[ ] Run #5: PASS / FAIL

Result: Consistent / Intermittent
```

---

### Validation 2: Compare Before/After
```
BEFORE FIX:
- Warnings count: ___
- Error 128 rate: __% (X out of 5 runs)
- Tests passing: YES / NO

AFTER FIX:
- Warnings count: ___
- Error 128 rate: __% (X out of 5 runs)
- Tests passing: YES / NO

Improvement: ✅ YES / ❌ NO
```

---

### Validation 3: Check Dependencies
```yaml
- name: Verify Versions
  run: |
    echo "=== Git Version ==="
    git --version
    
    echo "=== Node Version ==="
    node --version
    
    echo "=== Prisma Version ==="
    npx prisma --version
    
    echo "=== @prisma/client ==="
    npm ls @prisma/client
```

---

## FAZA 4: DOCUMENTARE

### Outcome Documentation:
```
PROBLEMA IDENTIFICATĂ:
- [ ] Prisma CLI git issue
- [ ] GitHub Actions bug
- [ ] Token scope issue
- [ ] Other: ___________

SOLUȚIE APLICATĂ:
- [ ] PRISMA_SKIP_GIT_VALIDATION
- [ ] Git credentials
- [ ] Prisma upgrade
- [ ] Other: ___________

REZULTAT FINAL:
- Errors eliminated? [ ] YES [ ] NO
- Test suite healthy? [ ] YES [ ] NO
- Performance impact? [ ] NONE [ ] MINIMAL [ ] SIGNIFICANT

RECOMANDARE:
[ ] Merge soluție
[ ] Reject și investigate mai departe
[ ] Ignore warnings (non-blokante)
```

---

## CHECKLIST PENTRU ECHIPĂ

```
PRE-TESTING:
[ ] Citit GIT-ERROR-128-ANALYSIS.md
[ ] Înțeles ipoteza principală (Prisma CLI)
[ ] Agreed pe soluție de testat

TESTING:
[ ] Faza 1: Diagnoză completă
[ ] Faza 2: Soluție implementată
[ ] Faza 3: Validare pe 5 runs
[ ] Faza 4: Documentare rezultate

POST-TESTING:
[ ] Discuție echipă pe rezultate
[ ] Decizie: merge / reject / investigate
[ ] Actualizare CI.yml final
[ ] Commit cu explicații în message
```

---

**Timp estimat:** 2-4 ore (depending on findings)

---

*Plan preparal pentru echipă - 2 iunie 2026*
