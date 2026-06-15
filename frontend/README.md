# Frontend SIMDM — React 19 + Vite + Tailwind

**Versiune:** 3.0 (Claude.ai editorial theme)
**Status:** ✅ Faza 1-4 Complete | **Data:** 2026-06-13

---

## Structură

```
frontend/
├── src/
│   ├── pages/              # 16 pagini (Login, Dashboard, Inventar, Mentenanță...)
│   ├── components/         # 14 componente reutilizabile
│   │   ├── ui/             # 9 Shadcn/UI primitives
│   │   └── modals/         # 3 modals (Triage, Repair, TicketDetails)
│   ├── hooks/              # Custom React hooks
│   ├── api/                # Axios + service calls
│   ├── schemas/            # Zod validation schemas
│   ├── context/            # React Context (theme, auth)
│   ├── design-system.css   # Token-uri CSS (cream default)
│   ├── design-system-animations.css  # Animații + reduced-motion
│   ├── index.css           # Clase utilitare + Shadcn bridge
│   ├── tokens.json         # Token-uri JSON pentru JS
│   ├── App.jsx             # Router
│   └── main.jsx            # Entry point
├── e2e/                    # Playwright E2E tests
├── vite.config.js          # Vite config (proxy /api → backend)
├── package.json
└── vitest.config.js        # Vitest config
```

---

## Design System

**Sursa de adevăr:** [`DESIGN.md`](../DESIGN.md) la rădăcina proiectului.

- **Canvas:** Cream (#faf9f5) — warm, deliberat nu alb pur
- **Accent:** Coral (#cc785c) — doar pe CTA-uri primare
- **Display:** Cormorant Garamond serif (weight 400, negative tracking)
- **Body:** Inter sans (weight 400-500)
- **Dark mode:** `[data-theme="dark"]` — complet funcțional

**Fișiere CSS:**
- `design-system.css` — Token-uri + heading styles + print + high contrast
- `design-system-animations.css` — Skeleton shimmer, toast, modal, reduced-motion
- `index.css` — Clase utilitare (btn-primary, input-base, card-base, focusable)

---

## Componente UI

### Noi (Faza 3)
- `Skeleton.jsx` — Loading placeholder cu shimmer
- `EmptyState.jsx` — Placeholder date goale
- `ErrorState.jsx` — Eroare + retry
- `Toast.jsx` — Notificări (success/error/warning/info)
- `Spinner.jsx` — Loading inline
- `KeyboardShortcuts.jsx` — Ctrl+K/N/M// + help overlay

### Shadcn/UI
- `Button`, `Input`, `Card`, `Dialog`, `Select`, `Table`, `Badge`, `Tabs`, `Tooltip`

---

## Development

```bash
npm install
npm run dev           # Vite server — http://localhost:5173
npm run build         # Build producție → dist/
npm run lint          # ESLint check
npm run test          # Vitest unit tests
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E
```

---

## API Integration

Toate apelurile API prin `src/api/axios.js`:
- JWT interceptor (auto-refresh pe 401)
- Proxy `/api` → `localhost:3001`

---

## Accesibilitate

**Standard:** WCAG 2.2 AA
- SkipLink, focus ring coral, ARIA attributes
- Skeleton screens (nu spinners)
- Empty states pe fiecare pagină
- `prefers-reduced-motion` respectat
- Print styles pentru formulare medicale

Vezi [`docs/ACCESSIBILITY-CHECKLIST.md`](../docs/ACCESSIBILITY-CHECKLIST.md)

---

## Testing

| Tip | Comandă | Coverage |
|-----|---------|----------|
| Unit/Integration | `npm run test` | ≥91% |
| E2E | `npm run test:e2e` | 15 scenarios |
| Accessibility | `npm run test:a11y` | axe-core |

---

**Design system:** [`DESIGN.md`](../DESIGN.md) · **Ghid dev:** [`docs/2-DEVELOPER-GUIDE.md`](../docs/2-DEVELOPER-GUIDE.md) · **a11y:** [`docs/ACCESSIBILITY-CHECKLIST.md`](../docs/ACCESSIBILITY-CHECKLIST.md)
