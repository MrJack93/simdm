# Ghid Dezvoltator — SIMDM Frontend & Backend

**Versiune:** 2.1 (Faza 1-2 Complete + Faza 3 Ready + Testing & Docker Best Practices 2026)  
**Actualizat:** 2026-06-02  
**Audiență:** Dezvoltatori frontend și backend  
**Limbă:** Engleză (cod), Română (comentarii și UI)

---

## 📋 Cuprins

1. [Frontend — React + Vite + Tailwind](#frontend)
2. [Backend — Express + Prisma](#backend)
3. [Integrare API & Axios](#api-integration)
4. [Tipare Frecvente](#tipare-frecvente)
5. [Checklist Calitate](#checklist-calitate)
6. [Debugging & Performance](#debugging)

---

## 🎨 Frontend — React + Vite + Tailwind

### Configurare Proiect

```bash
cd frontend
npm install
npm run dev  # Vite server — http://localhost:5173
```

### Structura Directoare Frontend

```
frontend/src/
├── pages/              # Pagini principale (ex: Login.jsx)
├── components/         # Componente reutilizabile
├── hooks/             # Custom React hooks
├── api/               # Apeluri API (axios.js, services)
├── schemas/           # Scheme validare Zod
├── context/           # React Context (temă, autentificare)
├── assets/            # Imagini, icoane, fonturi
├── App.jsx            # Componentă rădăcină + Router
├── index.css          # Stiluri globale (directive Tailwind)
└── main.jsx           # Punct de intrare
```

### Crearea unei Componente (React 19)

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
          {device.status === 'FUNCTIONAL' ? '✓ Funcțional' : '�- Defect'}
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

### Tailwind CSS — Clase Utility

```jsx
// ✅ BUN — Utilities Tailwind
<div className="flex gap-4 p-6 bg-gray-900 rounded-lg border border-gray-700">
  <h2 className="text-2xl font-bold text-accent">Titlu</h2>
  <button className="px-4 py-2 min-h-[44px] bg-accent rounded-lg focusable">
    Acțiune
  </button>
</div>

// ❌ R�'U — CSS custom
<div style={{ display: 'flex', gap: '16px', backgroundColor: '#111827' }}>
  <h2>Titlu</h2>
</div>

// ❌ R�'U — nume clase aleatorii
<div className="my-custom-box">...</div>
```

**Clase Tailwind Frecvente:**

| Scop | Clase | Exemplu |
|------|-------|---------|
| **Padding** | `p-4`, `px-6`, `py-3` | Spațiere internă |
| **Margin** | `m-4`, `mb-2`, `mt-6` | Spațiere externă |
| **Text** | `text-lg`, `text-center`, `font-bold` | Tipografie |
| **Culori** | `text-accent`, `bg-gray-900`, `border-gray-700` | Culori |
| **Grid** | `grid`, `grid-cols-3`, `gap-4` | Layout |
| **Responsive** | `md:text-2xl`, `lg:grid-cols-4` | Puncte de rupere |
| **Focus** | `focusable` | Focus ring WCAG |
| **Dimensiuni** | `w-full`, `h-screen`, `min-h-[44px]` | Dimensiuni |

### React Hooks Frecvente

```jsx
// useState — stare locală
const [isOpen, setIsOpen] = useState(false);

// useEffect — efecte laterale
useEffect(() => {
  fetchDevices();
}, [deviceId]); // Matrice de dependențe

// useContext — API Context
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

### Validare Formular cu React Hook Form + Zod

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Definire schemă (Zod)
const deviceSchema = z.object({
  inventoryNumber: z.string().min(1, 'Obligatoriu'),
  name: z.string().min(3, 'Minim 3 caractere'),
  status: z.enum(['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT']),
});

// 2. Componentă cu formular
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

### Configurare Proiect

```bash
cd backend
npm install
npm run dev  # Server Express — http://localhost:3001
```

### Structura Directoare Backend

```
backend/
├── prisma/
�'   ├── schema/            # Schemă multi-fișier
�'   ├── migrations/        # Migrații versionizate
�'   └── seed.js            # Pre-populate date
├── src/
�'   ├── routes/            # Rute API (auth.js, devices.js)
�'   ├── controllers/       # Logică de business
�'   ├── middleware/        # Autentificare, erori, validare
�'   ├── services/          # Apeluri externe, logică complexă
�'   ├── lib/              # Utilitare (tokenuri, crypto)
�'   ├── db.js             # Client Prisma
�'   └── index.js          # Server Express
├── scripts/              # Instrumente unice
├── uploads/              # Fișiere încărcate de utilizator
├── .env                  # Secrete (NU în Git)
└── package.json
```

### Crearea unui Endpoint Express

```javascript
// routes/devices.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { listDevices, createDevice } = require('../controllers/deviceController');

const router = express.Router();

// GET /api/devices — listare cu filtru
router.get('/', authMiddleware, listDevices);

// POST /api/devices — creare
router.post('/', authMiddleware, createDevice);

module.exports = router;
```

```javascript
// controllers/deviceController.js
const prisma = require('../db');

async function listDevices(req, res) {
  const { status, section } = req.query; // Parametri query

  try {
    // Construire clauză where dinamic
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
        createdById: req.user.id, // Din middleware JWT
      },
    });

    res.status(201).json({ data: device });
  } catch (error) {
    if (error.code === 'P2002') {
      // Încălcare constrângere unicitate
      return res.status(409).json({
        error: `inventoryNumber "${inventoryNumber}" deja există`,
      });
    }

    console.error('[Error createDevice]', error);
    res.status(500).json({ error: 'Eroare server' });
  }
}

module.exports = { listDevices, createDevice };
```

### Middleware — Autentificare

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
    req.user = decoded; // Atașare utilizator la cerere
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalid' });
  }
}

module.exports = authMiddleware;
```

### Prisma — Interogări Frecvente

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

// Agregate
const stats = await prisma.devices.aggregate({
  _count: true,
  _max: { acquisitionValue: true },
  _min: { createdAt: true },
});
```

---

## �- Integrare API & Axios

### Configurare Client Axios

```javascript
// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy Vite: /api → http://localhost:3001
  withCredentials: true, // Includere cookies
});

// Request interceptor — atașare token JWT
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token la 401
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
        // Reîncercați cererea inițială
        return api.request(error.config);
      } catch {
        // Refresh eșuat — deconectare
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Apeluri API în Componentă

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
      // Refetch lista dispozitive
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

### Tipar 1: Dark/Light Mode

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

### Tipar 2: Rută Protejată

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

### Tipar 3: Error Boundary

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

### Tipar 4: Validare Backend cu Zod (Faza 2)

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
  // ... 18 câmpuri suplimentare validate
});

// În handler POST:
router.post('/', (req, res) => {
  const parsed = deviceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Date invalide',
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  // Creare dispozitiv cu date validate
  const device = await prisma.devices.create({ data: parsed.data });
  res.status(201).json(device);
});
```

### Tipar 5: Paginare cu Validare (Faza 2)

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

### Tipar 6: Încărcare Fișier cu Antivirus (Faza 2)

```javascript
// backend/src/routes/devices.js
const { antivirusMiddleware } = require('../middleware/antivirus');

router.post('/:id/upload', upload.single('file'), antivirusMiddleware, async (req, res) => {
  const device = await prisma.devices.update({
    where: { id: parseInt(req.params.id) },
    data: { manualUrl: `/uploads/devices/${req.file.filename}` },
  });

  // Jurnal încărcare fișier cu rezultat scan
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

### Tipar 7: Filtrare Ștergere Soft (Faza 2)

```javascript
// backend/src/routes/devices.js
router.get('/', async (req, res) => {
  const { includeCasat } = req.query;
  const where = {};

  // Implicit: exclud dispozitive CASAT decât dacă explicit cerut
  if (includeCasat !== 'true') {
    where.status = { not: 'CASAT' };
  }

  // Aplică filtre explicite (suprascriere implicit)
  if (req.query.status) where.status = req.query.status;

  const devices = await prisma.devices.findMany({ where });
  res.json(devices);
});
```

---

## ✅ Checklist Calitate

### Frontend

- [ ] **Accesibilitate:**
  - [ ] Etichetele pe TOATE input-urile (`htmlFor` + `id`)
  - [ ] Focus ring pe orice element interactiv (`.focusable`)
  - [ ] Erori anunțate cu `role="alert"`
  - [ ] Badge-uri status cu text + icoană (nu doar culoare)

- [ ] **Responsive:**
  - [ ] Testat pe mobil (DevTools F12)
  - [ ] Testat pe tablet
  - [ ] Testat pe desktop 1920px

- [ ] **Dark Mode:**
  - [ ] Comutatorul funcționează
  - [ ] Culori folosesc variabile CSS
  - [ ] Contrast ≥ 4.5:1 (dark + light)

- [ ] **Performance:**
  - [ ] Nicio eroare în consolă
  - [ ] Lighthouse Accessibility ≥ 95
  - [ ] Lighthouse Performance ≥ 80

### Backend

- [ ] **Validare (Faza 2):**
  - [ ] **Validare schemă Zod** pe POST/PUT (24 câmpuri)
  - [ ] Răspunsuri eroare structurate (400 + fieldErrors)
  - [ ] Verificare auth (token valid, neexpirati)
  - [ ] Mesaje eroare în limba română
  - [ ] Parametri query validați (page ≥ 1, limit ≤ 1000)

- [ ] **Bază de Date (Faza 2):**
  - [ ] Interogările sunt indexate (7+ migrații aplicate)
  - [ ] Filtrare ștergere soft funcționează (status != 'CASAT')
  - [ ] Jurnal audit înregistrat (CREATE, UPDATE, DELETE, FILE_UPLOAD)
  - [ ] Relații populate dacă necesar
  - [ ] Tranzacții pentru operații multi-etapă

- [ ] **Securitate (Faza 2):**
  - [ ] Rate limiting la exporturi (10/15min)
  - [ ] Scan antivirus încărcare fișier (magic bytes)
  - [ ] Niciun secret în jurnale
  - [ ] Protejat împotriva injecție SQL (Prisma)
  - [ ] CORS configurat
  - [ ] Rate limiting la login (5/15min)

---

## 🐛 Debugging & Performance

### Debugging Frontend

```javascript
// DevTools — Console
console.log('Device:', device);
console.warn('Unexpected state:', state);
console.error('API failed:', error);

// Extensie React DevTools
// Inspectare props componentă, stare, re-randări

// Tabul Network
// Verificare cereri API, coduri stare, timpuri răspuns

// Lighthouse
// DevTools → Lighthouse → Generare raport
```

### Debugging Backend

```javascript
// Logging
console.log('[DeviceController] Creating device:', req.body);
console.error('[ERROR] Database:', error.message);

// Postman / Thunder Client
// Test endpoint-uri manual
// Verificare anteturi cerere/răspuns

// Prisma Studio
npm run db:studio  # Explorer vizual bază de date
```

### Sfaturi Performance

- Utilizare React.memo pentru componente grele
- Utilizare useCallback pentru handler-e eveniment
- Utilizare useMemo pentru calcule costisitoare
- Utilizare TanStack Query pentru caching
- Paginare pentru liste lungi
- Lazy load imagini
- Code splitting (import-uri dinamice)

---

**Gata cu development? Consultă [CONTRIBUTING.md](./CONTRIBUTING.md) pentru fluxul de PR.**

