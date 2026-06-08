# Frontend SIMDM — React 19 + Vite + Tailwind

**Versiune:** 2.2  
**Status:** ✅ Faza 1-2 Complete (Login + Inventory module, 91.99% coverage) + Faza 3 Ready  
**Data:** 2026-06-02

---

## 📦 Structură

```
frontend/
├── src/
│   ├── context/          # Authentication context
│   │   ├── AuthProvider.jsx
│   │   └── auth.context.js
│   ├── pages/            # Route pages
│   │   ├── Login.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── components/       # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   ├── DataGrid.jsx
│   │   ├── StatusBadge.jsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── api/
│   │   ├── axios.js      # Axios instance + JWT interceptor
│   │   └── [resources].js # API calls by resource
│   ├── schemas/          # Zod validation schemas (frontend)
│   ├── App.jsx           # Router
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind + globals
├── e2e/                  # Playwright E2E tests
│   ├── *.spec.js
│   └── playwright.config.js
├── vite.config.js        # Vite config (proxy /api → backend)
├── package.json
├── vitest.config.js      # Vitest config
└── README.md             # This file
```

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Build for production
npm run build

# Run tests
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# E2E tests (Playwright)
npm run test:e2e         # Run all
npm run test:e2e:ui      # Interactive UI
```

---

## 🎨 Design System

**Colors & Tokens:**
- **Accent:** Cyan-400 (#22d3ee) — headings, buttons, active states
- **Secondary:** Gray-400 — labels, helpers
- **Background:** Gray-950 — page background
- **Surfaces:** Gray-900, Gray-800, Gray-600
- **Text:** White (#ffffff) — primary, Gray-400 — secondary
- **Status:** Green (FUNCTIONAL), Red (DEFECT), Yellow (IN_REPARATIE), Gray (CASAT)

**Components:**
- StatusBadge (6 statuses with icons)
- DataGrid with sorting/filtering
- DeviceForm (multi-step, Zod validation)
- Forms with error handling
- Modals, Toasts, Alerts
- Dark/Light mode toggle

**Accessibility:** WCAG 2.1 AA certified

See [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md) for full design system.

---

## 🔐 Authentication

1. **Login:** POST \/api/auth/login\ → accessToken + refreshToken (httpOnly)
2. **Auto-refresh:** Axios interceptor → new accessToken on 401
3. **Logout:** POST \/api/auth/logout\ → clear token
4. **Rate limiting:** 5 tries per 15 minutes

See [src/api/axios.js](src/api/axios.js) for interceptor.

---

## 📡 API Integration

All API calls via \src/api/axios.js\:

```javascript
import api from '@/api/axios';

// Devices
const devices = await api.get('/devices', { params: { status: 'FUNCTIONAL' } });
const device = await api.post('/devices', { inventoryNumber, name, ... });

// Export
const csv = await api.get('/devices/export/csv', { responseType: 'blob' });
const pdf = await api.get('/devices/:id/fisa-pdf', { responseType: 'blob' });

// File upload
const formData = new FormData();
formData.append('file', file);
await api.post('/devices/:id/upload', formData);
```

---

## 🧪 Testing

**Unit/Integration (Vitest + React Testing Library):**
- 91.99% coverage (103 tests)
- Target Faza 3: ≥95%

**E2E (Playwright):**
- 15 tests, 5 scenarios
- Login, Device CRUD, Token refresh, Inventory, PDF export

Run:
```bash
npm run test
npm run test:coverage
npm run test:e2e
```

---

## 📚 Resources

- [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md)
- [docs/2-DEVELOPER-GUIDE.md](../docs/2-DEVELOPER-GUIDE.md)
- [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md)
- [CLAUDE.md](../CLAUDE.md)
- [SPEC.md](../SPEC.md)

---

## 🔧 Faza 3: Mentenanță (⏳ PLANNED — 2026-06-05)

Frontend components:
- MaintenanceCalendarPage (react-big-calendar)
- MppExecutionForm (semnătură digitală)
- RepairTicketsPage (Kanban board)
- VerificationsPage (registru)
- ServiceContractsPage (contracte + rating)

Dependencies: react-big-calendar, date-fns, react-signature-canvas

See [tasks/PLAN-FAZA3-DETALIAT.md](../tasks/PLAN-FAZA3-DETALIAT.md) for details.

---

**Ready to contribute? Read [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md).**

**Versiune:** 2.2 | **Status:** Faza 1-2 ✅ | Faza 3 ⏳ | **Data:** 2026-06-02
