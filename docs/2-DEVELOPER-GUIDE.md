# Ghid Dezvoltator — SIMDM Frontend & Backend

**Versiune:** 1.0 (Faza 1 Complete)  
**Actualizat:** 2026-05-30  
**Audiență:** Frontend & backend developers  
**Limbă:** Engleză (cod), Română (comentarii)

---

## 📋 Cuprins

1. [Frontend — React + Vite + Tailwind](#frontend)
2. [Backend — Express + Prisma](#backend)
3. [API Integration & Axios](#api-integration)
4. [Tipare Frecvente (Patterns)](#tipare-frecvente)
5. [Checklist Calitate](#checklist-calitate)
6. [Debugging & Performance](#debugging)

---

## 🎨 Frontend — React + Vite + Tailwind

### Setup Proiect

```bash
cd frontend
npm install
npm run dev  # Vite server — http://localhost:5173
```

### Structura Foldere Frontend

```
frontend/src/
├── pages/              # Pagini principale (ex: Login.jsx)
├── components/         # Componente reutilizabile
├── hooks/             # Custom React hooks
├── api/               # API calls (axios.js, services)
├── schemas/           # Zod validation schemas
├── context/           # React Context (theme, auth)
├── assets/            # Imagini, icoane, fonts
├── App.jsx            # Root component + Router
├── index.css          # Global styles (Tailwind directives)
└── main.jsx           # Entry point
```

### Creiere Componentă (React 19)

```jsx
// components/DeviceCard.jsx
import { useState } from 'react';

export function DeviceCard({ device, onEdit }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="card-base cursor-pointer transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <h3 className="text-lg font-bold text-accent mb-2">
        {device.name}
      </h3>
      
      <p className="text-sm text-text-secondary mb-4">
        {device.manufacturer}
      </p>

      {/* Status badge — accesibil, nu doar culoare */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            device.status === 'FUNCTIONAL' ? 'bg-success' : 'bg-error'
          }`}
        />
        <span className="text-sm text-text-secondary">
          {device.status === 'FUNCTIONAL' ? '✓ Funcțional' : '✗ Defect'}
        </span>
      </div>

      {/* Button cu focus ring obligatoriu */}
      <button
        onClick={() => onEdit(device)}
        className="btn-primary focusable w-full"
      >
        Editare
      </button>
    </div>
  );
}
```

### Tailwind CSS — Utility Classes

```jsx
// ✅ BUNĂ — Tailwind utilities
<div className="flex gap-4 p-6 bg-gray-900 rounded-lg border border-gray-700">
  <h2 className="text-2xl font-bold text-accent">Titlu</h2>
  <button className="px-4 py-2 min-h-[44px] bg-accent rounded-lg focusable">
    Acțiune
  </button>
</div>

// ❌ PROASTĂ — custom CSS
<div style={{ display: 'flex', gap: '16px', backgroundColor: '#111827' }}>
  <h2>Titlu</h2>
</div>

// ❌ PROASTĂ — random class names
<div className="my-custom-box">...</div>
```

**Clase Tailwind Frecvente:**

| Scop | Clase | Exemplu |
|------|-------|---------|
| **Padding** | `p-4`, `px-6`, `py-3` | Spațiere interne |
| **Margin** | `m-4`, `mb-2`, `mt-6` | Spațiere externe |
| **Text** | `text-lg`, `text-center`, `font-bold` | Tipografie |
| **Culori** | `text-accent`, `bg-gray-900`, `border-gray-700` | Colors |
| **Grid** | `grid`, `grid-cols-3`, `gap-4` | Layout |
| **Responsive** | `md:text-2xl`, `lg:grid-cols-4` | Breakpoints |
| **Focus** | `focusable` | Focus ring WCAG |
| **Dimensiuni** | `w-full`, `h-screen`, `min-h-[44px]` | Size |

### React Hooks Frecvente

```jsx
// useState — stare locală
const [isOpen, setIsOpen] = useState(false);

// useEffect — side effects
useEffect(() => {
  fetchDevices();
}, [deviceId]); // Dependency array

// useContext — context API
const { theme, toggleTheme } = useContext(ThemeContext);

// useCallback — memoizare funcții
const handleEdit = useCallback((device) => {
  onEdit(device);
}, [onEdit]);

// useMemo — memoizare valori
const filteredDevices = useMemo(() => {
  return devices.filter(d => d.status === filter);
}, [devices, filter]);
```

### Form Validation cu React Hook Form + Zod

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Definire schema (Zod)
const deviceSchema = z.object({
  inventoryNumber: z.string().min(1, 'Obligatoriu'),
  name: z.string().min(3, 'Minim 3 caractere'),
  status: z.enum(['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT']),
});

// 2. Component cu form
export function DeviceForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(deviceSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label htmlFor="inventoryNumber" className="label-base">
          Numărul Inventar
        </label>
        <input
          id="inventoryNumber"
          {...register('inventoryNumber')}
          className="input-base focusable"
        />
        {errors.inventoryNumber && (
          <p className="text-error text-sm mt-1">
            {errors.inventoryNumber.message}
          </p>
        )}
      </div>

      <button type="submit" className="btn-primary focusable">
        Salvare
      </button>
    </form>
  );
}
```

---

## 🔧 Backend — Express + Prisma

### Setup Proiect

```bash
cd backend
npm install
npm run dev  # Express server — http://localhost:3001
```

### Structura Foldere Backend

```
backend/
├── prisma/
│   ├── schema/            # Multi-file schema
│   ├── migrations/        # Versionized migrations
│   └── seed.js            # Auto-populate data
├── src/
│   ├── routes/            # API routes (auth.js, devices.js)
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth, errors, validation
│   ├── services/          # External calls, complex logic
│   ├── lib/              # Utilities (tokens, crypto)
│   ├── db.js             # Prisma client
│   └── index.js          # Express server
├── scripts/              # One-off tools
├── uploads/              # User-uploaded files
├── .env                  # Secrets (NU în Git)
└── package.json
```

### Creiere Endpoint Express

```javascript
// routes/devices.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { listDevices, createDevice } = require('../controllers/deviceController');

const router = express.Router();

// GET /api/devices — lista cu filtru
router.get('/', authMiddleware, listDevices);

// POST /api/devices — creare
router.post('/', authMiddleware, createDevice);

module.exports = router;
```

```javascript
// controllers/deviceController.js
const prisma = require('../db');

async function listDevices(req, res) {
  const { status, section } = req.query; // Query params

  try {
    // Build where clause dinamically
    const where = {};
    if (status) where.status = status;
    if (section) where.sectionId = parseInt(section);

    const devices = await prisma.devices.findMany({
      where,
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: devices });
  } catch (error) {
    console.error('[Error listDevices]', error);
    res.status(500).json({ error: 'Eroare server' });
  }
}

async function createDevice(req, res) {
  const { inventoryNumber, name, status, sectionId } = req.body;

  // Validare
  if (!inventoryNumber || !name) {
    return res.status(400).json({
      error: 'inventoryNumber și name sunt obligatorii',
    });
  }

  try {
    const device = await prisma.devices.create({
      data: {
        inventoryNumber,
        name,
        status: status || 'FUNCTIONAL',
        sectionId: sectionId ? parseInt(sectionId) : null,
        createdById: req.user.id, // De la JWT middleware
      },
    });

    res.status(201).json({ data: device });
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      return res.status(409).json({
        error: `inventoryNumber "${inventoryNumber}" deja exista`,
      });
    }

    console.error('[Error createDevice]', error);
    res.status(500).json({ error: 'Eroare server' });
  }
}

module.exports = { listDevices, createDevice };
```

### Middleware — Auth

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token lipseşte' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalid' });
  }
}

module.exports = authMiddleware;
```

### Prisma — Queries Frecvente

```javascript
// SELECT
const device = await prisma.devices.findUnique({
  where: { id: 1 },
});

const devices = await prisma.devices.findMany({
  where: { status: 'FUNCTIONAL' },
  include: { section: true, incidents: true },
  orderBy: { name: 'asc' },
  take: 10, // limit
  skip: 0,  // offset
});

// CREATE
const device = await prisma.devices.create({
  data: {
    inventoryNumber: 'DM-001',
    name: 'Monitor',
    sectionId: 1,
    createdById: req.user.id,
  },
});

// UPDATE
const device = await prisma.devices.update({
  where: { id: 1 },
  data: { status: 'DEFECT' },
});

// DELETE
await prisma.devices.delete({ where: { id: 1 } });

// COUNT
const total = await prisma.devices.count({
  where: { status: 'FUNCTIONAL' },
});

// Aggregate
const stats = await prisma.devices.aggregate({
  _count: true,
  _max: { acquisitionValue: true },
  _min: { createdAt: true },
});
```

---

## 🔗 API Integration & Axios

### Setup Axios Client

```javascript
// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy Vite: /api → http://localhost:3001
  withCredentials: true, // Include cookies
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirat — refresh
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
        });
        sessionStorage.setItem('accessToken', data.accessToken);
        // Retry original request
        return api.request(error.config);
      } catch {
        // Refresh failed — logout
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Apeluri API în Component

```javascript
// pages/Inventory.jsx
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function Inventory() {
  // TanStack Query — caching + refetch
  const { data, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(res => res.data.data),
  });

  if (isLoading) return <p>Se încarcă...</p>;
  if (error) return <p className="text-error">Eroare: {error.message}</p>;

  return (
    <div>
      {data?.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}
```

### POST cu Mutare

```javascript
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

export function CreateDevice({ onSuccess }) {
  const mutation = useMutation({
    mutationFn: (newDevice) => api.post('/devices', newDevice),
    onSuccess: () => {
      // Refetch devices list
      queryClient.invalidateQueries(['devices']);
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({
        inventoryNumber: 'DM-NEW',
        name: 'Monitor Nou',
      });
    }}>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Se salvează...' : 'Salvare'}
      </button>
    </form>
  );
}
```

---

## 📌 Tipare Frecvente

### Pattern 1: Dark/Light Mode

```javascript
// context/ThemeContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light-mode');
    } else {
      html.classList.add('light-mode');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Pattern 2: Protected Route

```javascript
// components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return <p>Se încarcă...</p>;

  return user ? children : <Navigate to="/login" />;
}
```

### Pattern 3: Error Boundary

```javascript
// components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert-error">
          <h2>Ceva a mers rău</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Pattern 4: Backend Zod Validation (Faza 2)

```javascript
// backend/src/routes/devices.js
const { z } = require('zod');

const deviceCreateSchema = z.object({
  inventoryNumber: z.string().regex(/^[A-Z0-9\-]+$/, 'Doar litere majuscule'),
  name: z.string().min(3, 'Minim 3 caractere'),
  riskClass: z.enum(['I', 'IIa', 'IIb', 'III']),
  sectionId: z.coerce.number().int().min(1),
  status: z.enum(['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA']).default('FUNCTIONAL'),
  acquisitionDate: z.coerce.date().optional().nullable(),
  acquisitionValue: z.coerce.number().min(0).optional().nullable(),
  // ... 18 more fields validated
});

// In POST handler:
router.post('/', (req, res) => {
  const parsed = deviceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Date invalide',
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  // Create device with validated data
  const device = await prisma.devices.create({ data: parsed.data });
  res.status(201).json(device);
});
```

### Pattern 5: Pagination with Validation (Faza 2)

```javascript
// backend/src/routes/devices.js
router.get('/', async (req, res) => {
  const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
  const rawLimit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const skip = (rawPage - 1) * rawLimit;

  const [devices, total] = await Promise.all([
    prisma.devices.findMany({ skip, take: rawLimit, orderBy: { createdAt: 'desc' } }),
    prisma.devices.count({}),
  ]);

  res.json({
    devices,
    pagination: {
      page: rawPage,
      limit: rawLimit,
      total,
      pages: Math.ceil(total / rawLimit),
    },
  });
});
```

### Pattern 6: File Upload with Antivirus (Faza 2)

```javascript
// backend/src/routes/devices.js
const { antivirusMiddleware } = require('../middleware/antivirus');

router.post('/:id/upload', upload.single('file'), antivirusMiddleware, async (req, res) => {
  const device = await prisma.devices.update({
    where: { id: parseInt(req.params.id) },
    data: { manualUrl: `/uploads/devices/${req.file.filename}` },
  });

  // Log file upload with scan result
  await prisma.audit_logs.create({
    data: {
      userId: req.user.sub,
      action: 'FILE_UPLOAD',
      entity: 'Device',
      entityId: String(device.id),
      changes: {
        filename: req.file.originalname,
        mimeType: req.fileScanResult?.mimeType,
        clamavScanned: req.fileScanResult?.clamavScanned || false,
      },
    },
  });

  res.json({ message: 'Fișier încărcat cu succes', device });
});
```

### Pattern 7: Soft-Delete Filtering (Faza 2)

```javascript
// backend/src/routes/devices.js
router.get('/', async (req, res) => {
  const { includeCasat } = req.query;
  const where = {};

  // Default: exclude CASAT devices unless explicitly requested
  if (includeCasat !== 'true') {
    where.status = { not: 'CASAT' };
  }

  // Apply explicit filters (override default)
  if (req.query.status) where.status = req.query.status;

  const devices = await prisma.devices.findMany({ where });
  res.json(devices);
});
```

---

## ✅ Checklist Calitate

### Frontend

- [ ] **Accesibilitate:**
  - [ ] Labels pe TOATE input-urile (`htmlFor` + `id`)
  - [ ] Focus ring pe orice element interactiv (`.focusable`)
  - [ ] Erori anunțate cu `role="alert"`
  - [ ] Status badges cu text + icoană (nu doar culoare)

- [ ] **Responsive:**
  - [ ] Testat mobile (DevTools F12)
  - [ ] Testat tablet
  - [ ] Testat desktop 1920px

- [ ] **Dark Mode:**
  - [ ] Toggle switch funcționează
  - [ ] Culori folosesc CSS variables
  - [ ] Contrast ≥ 4.5:1 (dark + light)

- [ ] **Performance:**
  - [ ] Niciun console error
  - [ ] Lighthouse Accessibility ≥ 95
  - [ ] Lighthouse Performance ≥ 80

### Backend

- [ ] **Validare (Faza 2):**
  - [ ] **Zod schema validation** on POST/PUT (24 fields)
  - [ ] Structured error responses (400 + fieldErrors)
  - [ ] Auth check (token valid, not expired)
  - [ ] Error messages în română
  - [ ] Query params validated (page ≥ 1, limit ≤ 1000)

- [ ] **Database (Faza 2):**
  - [ ] Queries are indexed (7+ migrations applied)
  - [ ] Soft-delete filter working (status != 'CASAT')
  - [ ] Audit log recorded (CREATE, UPDATE, DELETE, FILE_UPLOAD)
  - [ ] Relații sunt populate dacă necesar
  - [ ] Tranzacții pentru operații multi-step

- [ ] **Security (Faza 2):**
  - [ ] Rate limiting on exports (10/15min)
  - [ ] File upload antivirus scanning (magic bytes)
  - [ ] Niciun secret în logs
  - [ ] SQL injection protected (Prisma)
  - [ ] CORS configured
  - [ ] Rate limiting pe login (5/15min)

---

## 🐛 Debugging & Performance

### Frontend Debugging

```javascript
// DevTools — Console
console.log('Device:', device);
console.warn('Unexpected state:', state);
console.error('API failed:', error);

// React DevTools extension
// Inspect component props, state, re-renders

// Network tab
// Check API requests, status codes, response times

// Lighthouse
// DevTools → Lighthouse → Generate report
```

### Backend Debugging

```javascript
// Logging
console.log('[DeviceController] Creating device:', req.body);
console.error('[ERROR] Database:', error.message);

// Postman / Thunder Client
// Test endpoints manually
// Check request/response headers

// Prisma Studio
npm run db:studio  # Visual DB explorer
```

### Performance Tips

- Use React.memo for heavy components
- Use useCallback for event handlers
- Use useMemo for expensive calculations
- Use TanStack Query for caching
- Pagination for large lists
- Lazy load images
- Code splitting (dynamic imports)

---

**Gata cu development? Consultă [CONTRIBUTING.md](./CONTRIBUTING.md) pentru PR flow.**
