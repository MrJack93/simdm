---
name: audit-fix
description: "Systematically audit and fix issues from AUDIT-FAZA3-REMEDIERE.md — one section at a time, verify, commit"
---

# Skill: Audit-Driven Remediation

Systematically work through `tasks/AUDIT-FAZA3-REMEDIERE.md` sections: audit, fix, verify, commit — one issue at a time.

## When to use

- User selects a section from the audit document and asks to fix it
- User says "pas cu pas remediază" / "punct cu punct" / "one by one"
- Continuing remediation after context compaction

## Procedure

### 1. Read the selected section

Read the user's selection or the next unfixed section from `tasks/AUDIT-FAZA3-REMEDIERE.md`.

### 2. Audit the current code state

Before writing any fix:

- **Read the referenced file(s)** and line numbers from the audit section
- **Verify the claimed problem** — confirm the bug/missing feature actually exists in the current code
- **Check if already fixed** — sometimes prior context already fixed it; grep for the fix pattern
- If already fixed → mark `[x]` in the audit doc, skip to next

### 3. Implement the fix

Follow the audit section's `**Fix obligator**` steps exactly. Common patterns:

| Problem type | Typical fix |
|---|---|
| Missing Prisma field | Add to schema → `npx prisma migrate dev` → `npx prisma generate` |
| Hardcoded string | Read from `process.env` with fallback |
| Missing endpoint | Add route in `backend/src/routes/<resource>.js` |
| PDF missing field | Update PDFKit rendering in the formular handler |
| Frontend missing input | Add form field + Zod validation |
| FK constraint | Add `onDelete: Cascade` or appropriate constraint |

### 4. Verify the fix

- If backend route: run the contrast/test verification or smoke test
- If schema change: confirm migration applied cleanly
- If PDF change: note that manual PDF inspection is needed

### 5. Commit

Follow the project's commit convention:
```
type: description (#issue-id)

- Detail 1
- Detail 2

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `fix:`, `feat:`, `docs:`, `refactor:`

### 6. Update audit document

Mark the section as fixed in `tasks/AUDIT-FAZA3-REMEDIERE.md`:
- Change `❌` to `✅` or `[ ]` to `[x]`
- Add commit hash if available

### 7. Report and offer next section

Report what was done, then ask if the user wants to continue with the next issue.

## Key files

- `tasks/AUDIT-FAZA3-REMEDIERE.md` — source of truth for issues
- `tasks/PLAN-FAZA3-DETALIAT.md` — implementation plan with schema/endpoint specs
- `backend/prisma/schema/schema.prisma` — database schema (SURSA DE ADEVĂR)
- `backend/src/routes/` — API endpoints
- `frontend/src/pages/` — React pages

## Rules (from CLAUDE.md §0)

- `req.user.sub` for user ID (NOT `req.user.id`)
- Validate IDs with Zod → 400 at invalid, not 500
- Use `prisma.$transaction([...])` for atomic operations
- Audit log at every CREATE/UPDATE/DELETE
- User messages in Romanian, code in English
