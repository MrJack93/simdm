# Frontend SIMDM — React 19 + Vite + Tailwind

**Versiune:** 2.1  
**Status:** ✅ Faza 1-2 Completă (Login + Inventory module, 91.99% coverage)  
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
├── vite.config.js        # Vite config (proxy /api → backend)
├── package.json
└── README.md (this file)
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
npm run test:e2e:debug   # Debug mode
```

---

## 🎨 Design System

**Colors & Tokens:**
- **Accent:** Cyan-400 (`#22d3ee`) — headings, buttons, active states
- **Secondary:** Gray-400 — labels, helpers
- **Background:** Gray-950 — page background
- **Surfaces:** Gray-900, Gray-800, Gray-600
- **Text:** White (#ffffff) — primary, Gray-400 — secondary
- **Status:** Green (success), Red (error), Yellow (warning)

**Components:**
- StatusBadge (FUNCTIONAL, DEFECT, IN_REPARATIE, CASAT)
- DataGrid with sorting/filtering
- Forms with error handling
- Modals, Toasts, Alerts
- Dark/Light mode toggle

See [docs/1-DESIGN-AND-ACCESSIBILITY.md](../docs/1-DESIGN-AND-ACCESSIBILITY.md) for full design system.

---

## 🔐 Authentication

1. **Login:** POST `/api/auth/login` → accessToken (sessionStorage) + refreshToken (httpOnly cookie)
2. **Auto-refresh:** Axios interceptor catches 401, calls `/api/auth/refresh` → new accessToken
3. **Logout:** POST `/api/auth/logout` → clear token + redirect to login

See [src/api/axios.js](src/api/axios.js) for interceptor details.

---

## 📊 API Integration

All API calls go through `src/api/axios.js`:

```javascript
import api from '@/api/axios';

// Devices
const devices = await api.get('/devices', { params: { status: 'FUNCTIONAL' } });
const device = await api.post('/devices', { inventoryNumber, name, ... });

// Consumables
const consumables = await api.get('/consumables');

// Files
const formData = new FormData();
formData.append('file', file);
await api.post('/devices/:id/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 🧪 Testing

**Unit/Integration Tests:**
- Vitest + React Testing Library
- 91.99% statements coverage (39 integration tests)
- Test files: `src/__tests__/pages/*.test.jsx` and `*.integration.test.jsx`

**E2E Tests:**
- Playwright for browser automation
- 5 critical flows: login, device CRUD, token refresh, inventory, PDF export
- Config: [e2e/playwright.config.js](./playwright.config.js)

Run:
```bash
npm run test:e2e
```

---

## 🚢 Production Build

```bash
npm run build
# Output: dist/ (ready for deployment)
```

Vite automatically optimizes:
- Code splitting by route
- Tree-shaking (dead code removal)
- Asset minification
- CSS purging (Tailwind)

---

## 🌍 Environment Variables

Create `.env.local` (Git-ignored):

```bash
VITE_BACKEND_URL=http://localhost:3001  # Dev
VITE_BACKEND_URL=http://spital-lan:3001 # Production (spital network)
```

Note: `VITE_` prefix exposes vars to browser. Backend URL is exposed by design (CORS safe).

---

## 📚 Resources

- [docs/1-DESIGN-AND-ACCESSIBILITY.md](../docs/1-DESIGN-AND-ACCESSIBILITY.md) — Design system, WCAG rules
- [docs/2-DEVELOPER-GUIDE.md](../docs/2-DEVELOPER-GUIDE.md) — React patterns, checklist
- [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md) — PR workflow
- [CLAUDE.md](../CLAUDE.md) — Backend + architecture overview

---

**Ready to contribute? Read [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md).**
