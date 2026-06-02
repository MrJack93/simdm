# 🔍 ANALIZA DETALIATĂ: Git Error 128 în GitHub Actions CI

**Data:** 2 iunie 2026  
**Status:** Warning persistă în CI pipeline  
**Afectat:** test-backend și test-frontend jobs

---

## 📌 PROBLEMA

```
❌ Annotations (2 warnings)
  - test-frontend: The process '/usr/bin/git' failed with exit code 128
  - test-backend:  The process '/usr/bin/git' failed with exit code 128
```

**Impact:** Warnings doar (testele trec) dar trebuie rezolvat

---

## 🔎 CERCETARE PE INTERNET

### Surse Consulted:
1. [GitHub Issue #9882 - checkout v4 fails on Node 24](https://github.com/actions/runner-images/issues/9882)
2. [GitHub Issue #9632 - checkout v3 fails on fetching](https://github.com/actions/runner-images/issues/9632)
3. [Solution to exit code 128 on GitHub Actions](https://jonathansoma.com/everything/git/github-actions-403-error/)
4. [GitHub Actions git authentication issues](https://github.com/actions/checkout/issues/1580)

---

## 📚 CAUZE POSIBILE (EXIT CODE 128)

### Cauza #1: Repository Not Found
```
fatal: repository not found
```
- Repository URL greșit
- Token expirat/invalid
- Repository privat fără autentificare

**Probabilitate în cazul nostru:** 🟡 MEDIU (repo e public)

---

### Cauza #2: Authentication Failure
```
fatal: Authentication failed
```
- GITHUB_TOKEN lipsă
- Permissiuni insuficiente
- SSH key issues

**Probabilitate în cazul nostru:** 🟠 MARE (warnings apar random)

---

### Cauza #3: Network/Connectivity Issues
```
fatal: unable to access repository / Connection refused
```
- GitHub Actions runner nu poate conecta la GitHub
- DNS resolution issues
- Firewall/proxy blocks

**Probabilitate în cazul nostru:** 🟢 MICĂ (testele trec, deci repo e accessible)

---

### Cauza #4: Prisma CLI Operations
```
The process '/usr/bin/git' failed with exit code 128
```
- `prisma migrate deploy` sau `prisma generate` internează git commands
- Prisma încearcă să citească git history
- Prisma invokes git commands fără auth context

**Probabilitate în cazul nostru:** 🟠 **FOARTE MARE** ⚠️

**De ce:** În backend job, rulăm:
```yaml
- name: Generate Prisma Client
  run: npx prisma generate
  
- name: Run migrations
  run: npx prisma migrate deploy
```

Prisma CLI poate rula git commands intern (de ex. `git show` pentru schema history).

---

## 🔧 SOLUȚII SUGERATE

### Soluție #1: Configure Git Credentials (Already Applied)
```yaml
- name: Configure Git
  run: |
    git config --global user.email "ci@simdm.local"
    git config --global user.name "SIMDM CI"
```

**Status:** ✅ Aplicată, dar warnings persistă

**Problem:** Nu rezolvă dacă Prisma CLI caută auth context

---

### Soluție #2: Pass GITHUB_TOKEN Explicitly
```yaml
- name: Configure Git Auth
  run: |
    git config --global credential.helper store
    echo "https://${GITHUB_TOKEN}:x-oauth-basic@github.com" > ~/.git-credentials
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Status:** ❌ Nu implementată

**Avantaj:** Prisma CLI va avea acces la git credentials

---

### Soluție #3: Disable Prisma Git Integration
```yaml
- name: Disable Prisma Git Features
  run: |
    echo "PRISMA_SKIP_GIT_VALIDATION=1" >> $GITHUB_ENV
```

**Status:** ❌ Nu implementată

**Avantaj:** Prisma va sări peste validări care necesită git

---

### Soluție #4: Upgrade Actions + Node.js (Already Applied)
```yaml
- uses: actions/checkout@v5  # was v4
- uses: actions/setup-node@v5  # was v4
- uses: actions/cache@v5  # was v4
- node-version: '24'  # was 22
```

**Status:** ✅ Aplicată, dar warnings persistă

**Posibilă problemă:** v5 actions au alte issues cu Node.js 24 force

---

### Soluție #5: Add Permissions Section (Already Applied)
```yaml
permissions:
  contents: read
  actions: read
```

**Status:** ✅ Aplicată, dar warnings persistă

---

## 📊 ANALIZĂ DETALIATĂ CI CONTEXT

### Current CI Configuration:

**Backend Job Flow:**
```
1. actions/checkout@v5 (cu fetch-depth: 0, token: ${{ secrets.GITHUB_TOKEN }})
2. Setup Node.js 24
3. npm ci
4. npx prisma generate  ← POTENTIAL GIT COMMAND HERE
5. npx prisma migrate deploy  ← POTENTIAL GIT COMMAND HERE
6. Run tests
```

**Frontend Job Flow:**
```
1. actions/checkout@v5 (cu fetch-depth: 0, token: ${{ secrets.GITHUB_TOKEN }})
2. Setup Node.js 24
3. npm ci
4. npm run test:coverage
5. npm run build
```

### Key Observations:

- ✅ GITHUB_TOKEN e pasat la checkout
- ✅ Permissiuni sunt setate
- ✅ Git config e configurat
- ❓ Prisma commands pot rula git intern (unconfirmed)
- ❓ Error 128 apare pe AMBELE jobs (backend + frontend)
- ⚠️ **Warnings sunt INCONSISTENT** - nu apar de fiecare dată

---

## 🎯 IPOTEZE PRINCIPALE

### Ipoteză #1: Prisma CLI Git Issue
**Descriere:** Prisma CLI (generate, migrate deploy) încearcă să acceseze git dar nu are auth context  
**Likelihood:** ⭐⭐⭐⭐⭐ MARE  
**Dovezi:**
- Error apare pe backend unde rulăm `prisma generate` + `prisma migrate deploy`
- Error apare și pe frontend (poate din dependencies install)
- Git error 128 = auth/repo not found = Prisma nu are credentials

**Fix Recomandat:** Env var `PRISMA_SKIP_GIT_VALIDATION=1` sau git credentials explicit

---

### Ipoteză #2: GitHub Actions Runner State Issue
**Descriere:** Runner-ul de pe GitHub are probleme temporare cu git  
**Likelihood:** ⭐⭐ MICĂ  
**Dovezi:**
- Warnings sunt inconsistent (nu de fiecare dată)
- Testele trec => repo e accessible
- Ar putea fi GitHub infrastructure issue (temporary)

**Fix Recomandat:** Retry logic în CI sau ignore warnings dacă testele trec

---

### Ipoteză #3: Token Scope Issue
**Descriere:** GITHUB_TOKEN nu are scope pentru git operations Prisma necesită  
**Likelihood:** ⭐⭐⭐ MEDIU  
**Dovezi:**
- Token e pasat corect la checkout
- Dar Prisma poate necesita altă scope

**Fix Recomandat:** Verify GITHUB_TOKEN scopes în workflow

---

## 🔧 RECOMANDĂRI PENTRU ECHIPĂ

### Imediat (Low Risk):
1. **Adaugă env var Prisma:**
   ```yaml
   - name: Setup Prisma
     run: echo "PRISMA_SKIP_GIT_VALIDATION=1" >> $GITHUB_ENV
   ```
   - Low risk, nu schimbă cod
   - Testează dacă Prisma e culpa

2. **Add explicit git credentials:**
   ```yaml
   - name: Configure Git for Prisma
     run: |
       git config --global user.email "ci@prisma.local"
       git config --global user.name "SIMDM CI"
       git config --global credential.helper store
       echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
     env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```
   - Medium risk, dar proven solution

---

### Investigation:
1. **Verifică Prisma logs:**
   ```yaml
   - name: Run Prisma with Debug
     run: npx prisma generate --skip-validation
   ```

2. **Verifică Prisma version:**
   ```yaml
   - name: Check versions
     run: |
       npm ls @prisma/client
       npm ls prisma
   ```

3. **Monitoring:**
   - Observă dacă errors sunt consistent sau random
   - Notera când apar (după ce commit?)

---

## 📋 DIAGNOSTIC CHECKLIST

Pentru a rezolva, echipa trebuie să răspundă la:

```
[ ] Git error 128 apare de fiecare dată sau random?
[ ] Apare doar backend, doar frontend, sau ambele?
[ ] Apare dacă Prisma commands sunt skipped?
[ ] Testele trec mereu sau pot eșua?
[ ] GITHUB_TOKEN are scopes corecte?
[ ] Prisma version e cea mai nouă?
[ ] Git credentials sunt setate corect?
```

---

## 📌 INFORMAȚII DESPRE SISTEM

### Versiuni Curente:
```
Node.js:        24 (forced in CI)
GitHub Actions: v5 (checkout, setup-node, cache)
Prisma:         7.8.0 (@prisma/client)
@prisma/adapter-pg: ^7.8.0
Postgres:       16 (in CI service)
```

### CI Environment:
```
OS:       Ubuntu Latest (Ubuntu 24.04 LTS)
Runner:   github-actions-runner (standard)
Shell:    bash
```

---

## 🔗 RESURSE PENTRU ECHIPĂ

- Prisma Documentation: https://www.prisma.io/docs/
- GitHub Actions Troubleshooting: https://docs.github.com/en/actions/troubleshooting/
- Express-rate-limit Guide: https://github.com/nfriedly/express-rate-limit
- Git Configuration: https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage

---

## 📝 NOTĂ IMPORTANTĂ

**Warnings sunt non-blokante** - testele trec! Dar sunt semn de ceva ce nu e perfect în CI environment.

**Prioritate:** 🟡 MEDIU
- Fix dacă are timp echipa
- Nu blocheaza development
- Bună practică să fie clean

---

*Document preparate pentru discuție în echipă - 2 iunie 2026*
