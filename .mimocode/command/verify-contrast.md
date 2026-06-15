---
description: "Run WCAG contrast verification script for SIMDM design system"
---

# Verify Contrast

Runs `node scripts/verify-contrast.js` to check all color pairs in `frontend/src/design-system.css` against WCAG 2.1 AA minimum contrast ratios.

## Usage

```
/verify-contrast          # full run, all color pairs
/verify-contrast Tertiary # filter by name (grep pattern)
```

## Procedure

1. Run from project root:
   ```bash
   cd 'c:\Users\janea\simdm' && node scripts/verify-contrast.js
   ```

2. If `$ARGUMENTS` provided, filter output:
   ```bash
   cd 'c:\Users\janea\simdm' && node scripts/verify-contrast.js 2>&1 | grep -i "$ARGUMENTS"
   ```

3. Report: all PASS (✅) or list failures (❌)

## Context

- Script tests Dark mode + Light mode color pairs
- Threshold: 4.5:1 for normal text (AA), 3:1 for large text
- Covers: text-primary, text-secondary, text-tertiary, accent, disabled states, placeholders
- Used heavily during design system + accessibility work (Faza 2-3)
