# Contributing Guide — SIMDM Development

**Version:** 1.0  
**Target Audience:** Phase 2+ Developers  
**Last Updated:** 2026-05-29

---

## 🎯 How to Contribute

**SIMDM** is built incrementally in phases. Each phase follows a strict workflow to maintain code quality, accessibility, and documentation standards.

---

## 📋 Workflow: Feature → PR → Merge

### 1. Before You Start

**Read These First:**
- ✅ [CLAUDE.md](../CLAUDE.md) — Project context & rules
- ✅ [SPEC.md](../SPEC.md) — Current phase spec
- ✅ [docs/1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md) — Design tokens & WCAG rules
- ✅ [docs/2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md) — Implementation patterns

**Understand:**
- Single-user application (no RBAC)
- Dark theme (cyan accent, gray surface)
- WCAG 2.1 AA accessibility **mandatory**
- Romanian UI text + English code
- LocalHost/LAN only (no cloud deploy)

---

### 2. Create Feature Branch

```bash
# Always branch from main
git checkout main
git pull origin main

# Create feature branch (descriptive name)
git checkout -b feature/inventar-devices
# or
git checkout -b fix/login-contrast-issue
# or
git checkout -b docs/update-accessibility-guide
```

**Branch Naming:**
- `feature/module-description` — New feature (Faza 2 devices list)
- `fix/bug-description` — Bug fix (missing focus ring)
- `docs/description` — Documentation
- `refactor/description` — Code refactor (no behavior change)
- `test/description` — Test additions

---

### 3. Implement Feature

**Backend (if needed):**
```bash
cd backend

# Install new dependencies ONLY if necessary
npm install some-package

# Make changes
# Edit schema.prisma? → Always:
npx prisma migrate dev --name descriptive_change_name
npx prisma generate

# Test endpoint in Postman/Thunder Client
npm run dev  # Port 3001
```

**Frontend (most work):**
```bash
cd frontend

# Make changes to components/pages
npm run dev  # Port 5173

# Test in browser at localhost:5173
```

**Code Quality Checks:**
```bash
# From root or respective folder
npm run lint        # If configured
npm run format      # If configured
```

---

### 4. Accessibility & Testing Checklist

**BEFORE committing:**

```markdown
## Code Quality
- [ ] No `console.log()` in production code
- [ ] No unused imports
- [ ] Meaningful variable names
- [ ] Functions are documented (if complex)

## Accessibility (WCAG 2.1 AA)
- [ ] All `<input>` have associated `<label htmlFor>`
- [ ] All `<label>` have matching `htmlFor` + input `id`
- [ ] Focus ring visible (`.focusable` class)
- [ ] Buttons/inputs ≥44px height (`py-3` or `min-h-[44px]`)
- [ ] Error messages: `role="alert" aria-live="assertive"`
- [ ] No unlabeled buttons (use `aria-label` if needed)
- [ ] Color is not only source of info (text + icon + color)

## Testing
- [ ] Keyboard navigation works (Tab/Shift+Tab/Enter)
- [ ] Forms validate on submit
- [ ] Error messages appear and clear on change
- [ ] Loading states work (spinner + disabled)
- [ ] No broken links
- [ ] Responsive to 1024px (at minimum)

## Styling
- [ ] Only Tailwind classes (no separate CSS files)
- [ ] Uses design tokens from `1-DESIGN-AND-ACCESSIBILITY.md`
- [ ] Consistent spacing/sizing
- [ ] Dark theme (gray-950 background, cyan-400 accent)
```

---

### 5. Commit Message Format

```bash
git commit -m "feat: add device list with filtering and sorting

- Implement GET /api/devices endpoint
- Add DataTable component with sort + pagination
- WCAG AA compliant (keyboard nav, focus ring, ARIA)
- Filter by status and section

Fixes #42"
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Type:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope:** `backend`, `frontend`, `docs`, or specific module
- **Subject:** ~50 chars, imperative mood ("add" not "added")
- **Body:** What, why, how (multiple lines OK)
- **Footer:** `Fixes #123` if closes an issue

**Examples:**
```
feat(frontend): add device card component with accessibility

- Create reusable Card component in src/components/
- Support title, subtitle, action button
- 44px touch target, focus ring, semantic HTML
- Used in inventar list and detail pages

Fixes #18

---

fix(frontend): improve input contrast from gray-500 to gray-400

WCAG AA minimum is 4.5:1. Gray-500 was 3.7:1 on gray-900.

Fixes accessibility issue found in audit.

---

docs: consolidate .md files, remove redundancy

- Merge AUDIT + DESIGN + COMPONENT docs
- Create docs/ folder structure
- Remove 400 lines of duplicate code examples
```

---

### 6. Push & Create Pull Request

```bash
# Push feature branch
git push origin feature/inventar-devices

# GitHub: Create PR with template below
```

**PR Template** (create in `.github/pull_request_template.md`):

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature (Faza 2+)
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor (no behavior change)
- [ ] Performance improvement

## Related Issue
Fixes #[issue number]

## Testing
- [ ] Tested on localhost:5173
- [ ] No console errors
- [ ] Keyboard navigation works
- [ ] Responsive (1024px+)
- [ ] Accessibility (Lighthouse ≥95)

## Accessibility Checklist
- [ ] All inputs have labels + htmlFor
- [ ] Focus ring visible
- [ ] Touch targets ≥44px
- [ ] Errors announced (role="alert")
- [ ] No color-only status indicators
- [ ] Tested with NVDA/Narrator

## Design & Code Quality
- [ ] Follows SIMDM design system (colors, spacing)
- [ ] Uses `.focusable` for interactive elements
- [ ] Tailwind classes only (no separate CSS)
- [ ] Meaningful function/variable names
- [ ] No console.log() left

## Database Changes (if any)
- [ ] Schema updated in `schema.prisma`
- [ ] Migration created: `npx prisma migrate dev`
- [ ] Seed data updated if needed
- [ ] Tested with fresh DB

## Screenshots (if UI change)
[Paste screenshots of new feature]

## Notes for Reviewer
[Any gotchas, decisions, or helpful context]

---

Generated with SIMDM Contributing Guide
```

**PR Title:** Same as commit subject
```
feat(frontend): add device list with filtering and sorting
```

---

### 7. Code Review & Feedback

**Your PR will be reviewed for:**

1. **Correctness**
   - Does it work as intended?
   - Are there edge cases missed?
   - Will it break existing features?

2. **Accessibility (WCAG 2.1 AA)**
   - Are all interactive elements keyboard-accessible?
   - Do errors get announced to screen readers?
   - Are touch targets 44x44px minimum?

3. **Code Quality**
   - Is code readable? (meaningful names, no nested functions)
   - Any performance issues?
   - Follow project conventions?

4. **Consistency**
   - Matches design system (colors, spacing)?
   - Uses established patterns?

---

### 8. Address Feedback

**When reviewer requests changes:**

```bash
# Make changes locally
# Commit with reference to feedback
git commit -m "refactor: improve focus ring visibility per review

Feedback: Ring was too subtle on dark backgrounds.
Changed ring-offset from gray-950 to more visible offset."

# Push again (no force push to shared branch)
git push origin feature/inventar-devices
```

**Note:** Don't force push to shared branches. Simply push new commits.

---

### 9. Merge to Main

Once approved:

```bash
# GitHub: Squash & merge (preferred for clean history)
# Or: Rebase & merge (keeps all commits)
# Avoid: Create merge commit (clutters history)
```

**After merge:**
```bash
# Update your local main
git checkout main
git pull origin main

# Delete feature branch locally
git branch -d feature/inventar-devices

# Delete on remote (GitHub auto-deletes after merge)
git push origin --delete feature/inventar-devices
```

---

## 📋 Common Workflows

### Adding a New Component

**Location:** `frontend/src/components/ComponentName.jsx`

**Template:**
```jsx
// Component with accessibility built in
import React from 'react';

/**
 * ComponentName - Brief description
 * 
 * Accessibility:
 * - Keyboard navigable (Tab, Enter)
 * - Focus ring visible
 * - Labels associated with inputs
 * - Errors announced with role="alert"
 */
export default function ComponentName({
  // Props with defaults
  id,
  label,
  error,
  disabled = false,
  children,
  ...props
}) {
  return (
    <div className="...">
      {/* Semantic HTML */}
      {/* WCAG 2.1 AA compliant */}
      {/* Dark theme (gray-950 bg, cyan-400 accent) */}
    </div>
  );
}
```

**Then:**
1. Add component to `src/components/`
2. Document in [1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md)
3. Include examples in PR description
4. Test accessibility before submitting PR

### Adding a New Page

**Location:** `frontend/src/pages/PageName.jsx`

**Template:**
```jsx
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export default function PageName() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resource'],
    queryFn: () => api.get('/api/resource').then(r => r.data),
  });

  useEffect(() => {
    document.title = 'SIMDM — Page Name';
  }, []);

  if (isLoading) return <div role="status">Se încarcă…</div>;
  if (error) return <div role="alert">Eroare: {error.message}</div>;

  return (
    <main className="...">
      {/* Content */}
    </main>
  );
}
```

### Modifying Database Schema

**CRITICAL:** Always coordinate schema changes.

1. **Edit** `backend/prisma/schema.prisma`
2. **Run:** `npx prisma migrate dev --name descriptive_name`
3. **Check:** Migration file created in `backend/prisma/migrations/`
4. **Update:** `backend/prisma/seed.js` if data needs changes
5. **Test:** `npx prisma db push` on fresh database
6. **Include:** Migration file in git commit

---

## 🧪 Testing Before PR

### Frontend Testing

```bash
# Run dev server
cd frontend
npm run dev

# Check each component/page:
1. Visual appearance (matches design)
2. Keyboard navigation (Tab, Enter, Escape)
3. Form validation (errors appear/clear)
4. Loading states (spinner, disabled buttons)
5. Responsive (resize to 1024px, mobile)
```

### Accessibility Testing

```bash
# Lighthouse (Chrome DevTools)
F12 → Lighthouse → Accessibility → Analyze
Target: ≥95 points

# axe DevTools (Chrome Extension)
1. Install from Chrome Web Store
2. Click axe icon
3. Scan page
4. Check: 0 critical + serious errors

# Keyboard-only
1. Disconnect mouse
2. Tab through all interactive elements
3. Enter/Space on buttons
4. Escape to close modals
5. Verify focus always visible

# Screen Reader (NVDA — Free)
1. Download: https://www.nvaccess.org
2. Start: Win + Ctrl + Enter
3. Navigate form
4. Verify: Errors announced, labels read, buttons named
```

### Backend Testing (if applicable)

```bash
# API Testing (Postman / Thunder Client)
1. GET /api/health → { "status": "ok" }
2. POST /api/resource → Verify response
3. Error cases → 400, 401, 404, 500 responses
4. Auth required? → Verify jwt check

# Database
pgAdmin or Prisma Studio:
npx prisma studio
→ Verify data was inserted/updated correctly
```

---

## 🚫 Dos & Don'ts

### ✅ DO

- ✅ Branch from `main`
- ✅ Write descriptive commit messages
- ✅ Test accessibility before PR
- ✅ Use design tokens (colors, spacing)
- ✅ Follow naming conventions (camelCase JS, PascalCase React)
- ✅ Validate input server-side
- ✅ Handle errors gracefully
- ✅ Update documentation if needed

### ❌ DON'T

- ❌ Commit `.env` files
- ❌ Use `console.log()` in production code
- ❌ Hardcode colors (use Tailwind tokens)
- ❌ Force push to shared branches
- ❌ Skip accessibility testing
- ❌ Add RBAC or multi-user logic (single-user app)
- ❌ Use external UI frameworks (only Tailwind)
- ❌ Deploy to cloud (localhost/LAN only)

---

## 🆘 Need Help?

**Question:** What file defines design tokens?  
**Answer:** [docs/1-DESIGN-AND-ACCESSIBILITY.md](./1-DESIGN-AND-ACCESSIBILITY.md) — Design Tokens section

**Question:** How do I add a reusable component?  
**Answer:** [docs/2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md) — Component Implementation

**Question:** What are project rules?  
**Answer:** [CLAUDE.md](../CLAUDE.md) — Read "Reguli importante pentru Claude Code"

**Question:** What's the current phase spec?  
**Answer:** [SPEC.md](../SPEC.md) — Check phase boundaries

---

## 📞 Questions About This Guide?

- **Documentation unclear?** Open an issue with "[docs]" label
- **Workflow confusing?** Ask in PR comment or team chat
- **Example needed?** Reference similar recent PR

---

**Version History:**
- v1.0 — 2026-05-29: Initial contributing guide (Phase 2+ framework)

**Next Step:** Phase 2 (Faza 2) will start with Inventar DM module. Read [SPEC.md](../SPEC.md) for details.

Good luck! 🚀
