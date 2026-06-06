import { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SkipLink from './components/SkipLink';
import { Menu, X, Home, Warehouse, Package, Calendar, Cog, LogOut, Wrench, AlertTriangle, FileText } from 'lucide-react';

// Lazy-loaded pages - code splitting pentru perf boost
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InventoryPageV2 = lazy(() => import('./pages/InventoryPageV2'));
const ConsumablesPage = lazy(() => import('./pages/ConsumablesPage'));
const AnnualInventoryPage = lazy(() => import('./pages/AnnualInventoryPage'));
const DeviceForm = lazy(() => import('./pages/DeviceForm'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const MaintenancePlanPage = lazy(() => import('./pages/MaintenancePlanPage'));
const MaintenanceExecutionPage = lazy(() => import('./pages/MaintenanceExecutionPage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="text-center">
        <div className="inline-block" style={{ color: 'var(--healthcare-primary)' }}>
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă...</p>
        </div>
      </div>
    </div>
  );
}

function Header({ user, logout, theme, toggleTheme, isMobileMenuOpen, setIsMobileMenuOpen, menuTriggerRef }) {

  return (
    <header
      className="border-b px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-40"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-4">
        <button
          ref={menuTriggerRef}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:opacity-70 transition-opacity"
          aria-label="Meniu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          style={{ color: 'var(--color-accent)' }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="flex items-center gap-1.5" style={{ textDecoration: 'none', color: 'var(--color-accent)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>flare</span>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-family-headline)', color: 'var(--color-accent)' }}>SIMDM</span>
        </Link>

        <nav className="hidden md:flex gap-6 ml-8">
          {[
            { to: '/inventory',        Icon: Warehouse,     label: 'Inventar' },
            { to: '/inventory/annual', Icon: Calendar,      label: 'Inventariere' },
            { to: '/consumables',      Icon: Package,       label: 'Consumabile' },
            { to: '/maintenance',      Icon: Wrench,        label: 'Mentenanță' },
            { to: '/incidents',        Icon: AlertTriangle, label: 'Incidente' },
            { to: '/audit-logs',       Icon: FileText,      label: 'Jurnal' },
          ].map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1.5 pb-2 ${isActive ? 'border-b-2' : ''}`
              }
              style={({ isActive }) => ({
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                borderColor: isActive ? 'var(--color-accent)' : 'transparent',
              })}
            >
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:opacity-70 transition-opacity"
          aria-label={theme === 'dark' ? 'Comută la modul clar' : 'Comută la modul închis'}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <Link
          to="/settings"
          className="p-2 rounded-lg hover:opacity-70 transition-opacity hidden sm:inline-flex"
          aria-label="Setări"
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
        >
          <Cog size={20} />
        </Link>

        <button
          onClick={logout}
          className="px-3 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
                     hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Deconectare din sistem"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Deconectare</span>
        </button>
      </div>
    </header>
  );
}

function MobileMenu({ isOpen, onClose, triggerRef }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Move focus into menu on open
    const first = menuRef.current?.querySelector('a, button');
    first?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        const focusable = menuRef.current?.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger button on close
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  const links = [
    { to: '/',                 Icon: Home,          label: 'Dashboard' },
    { to: '/inventory',        Icon: Warehouse,     label: 'Inventar' },
    { to: '/inventory/annual', Icon: Calendar,      label: 'Inventariere' },
    { to: '/consumables',      Icon: Package,       label: 'Consumabile' },
    { to: '/maintenance',      Icon: Wrench,        label: 'Mentenanță' },
    { to: '/incidents',        Icon: AlertTriangle, label: 'Incidente' },
    { to: '/audit-logs',       Icon: FileText,      label: 'Jurnal Audit' },
    { to: '/settings',         Icon: Cog,           label: 'Setări' },
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="mobile-menu"
      className="md:hidden fixed inset-0 top-16 z-30 border-b p-4 space-y-2 animate-slide-down"
      role="navigation"
      aria-label="Meniu mobil"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      {links.map(({ to, Icon, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
        >
          <Icon size={18} /> {label}
        </Link>
      ))}
    </div>
  );
}

function DashboardLayout({ logout, theme, toggleTheme }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <SkipLink />

      <Header
        user={user}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        menuTriggerRef={menuTriggerRef}
      />

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} triggerRef={menuTriggerRef} />

      <main id="main">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory"         element={<ProtectedRoute><InventoryPageV2 /></ProtectedRoute>} />
            <Route path="/inventory/annual"  element={<ProtectedRoute><AnnualInventoryPage /></ProtectedRoute>} />
            <Route path="/consumables"       element={<ProtectedRoute><ConsumablesPage /></ProtectedRoute>} />
            <Route path="/maintenance"       element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
            <Route path="/maintenance/plan"  element={<ProtectedRoute><MaintenancePlanPage /></ProtectedRoute>} />
            <Route path="/maintenance/execution" element={<ProtectedRoute><MaintenanceExecutionPage /></ProtectedRoute>} />
            <Route path="/incidents"         element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
            <Route path="/audit-logs"        element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
            <Route path="/devices/new"       element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
            <Route path="/devices/:id/edit"  element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
            <Route path="/settings"          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  const { loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă…</p>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => window.location.href = '/'}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoute><DashboardLayout logout={logout} theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
  );
}
