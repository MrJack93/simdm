import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InventoryPageV2 from './pages/InventoryPageV2';
import ConsumablesPage from './pages/ConsumablesPage';
import AnnualInventoryPage from './pages/AnnualInventoryPage';
import DeviceForm from './pages/DeviceForm';
import SettingsPage from './pages/SettingsPage';
import MaintenancePage from './pages/MaintenancePage';
import MaintenancePlanPage from './pages/MaintenancePlanPage';
import MaintenanceExecutionPage from './pages/MaintenanceExecutionPage';
import IncidentsPage from './pages/IncidentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SkipLink from './components/SkipLink';
import { Menu, X, Home, Warehouse, Package, Calendar, Cog, LogOut, Wrench, AlertTriangle, FileText } from 'lucide-react';

function Header({ user, logout, theme, toggleTheme, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header
      className="border-b px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-40"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:opacity-70 transition-opacity"
          aria-label="Meniu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          style={{ color: 'var(--color-accent)' }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <a href="/" className="flex items-center gap-1.5" style={{ textDecoration: 'none', color: 'var(--color-accent)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>flare</span>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-family-headline)', color: 'var(--color-accent)' }}>SIMDM</span>
        </a>

        <nav className="hidden md:flex gap-6 ml-8">
          {[
            { href: '/inventory',        Icon: Warehouse,     label: 'Inventar' },
            { href: '/inventory/annual', Icon: Calendar,      label: 'Inventariere' },
            { href: '/consumables',      Icon: Package,       label: 'Consumabile' },
            { href: '/maintenance',      Icon: Wrench,        label: 'Mentenanță' },
            { href: '/incidents',        Icon: AlertTriangle, label: 'Incidente' },
            { href: '/audit-logs',       Icon: FileText,      label: 'Jurnal' },
          ].map(({ href, Icon, label }) => (
            <a
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1.5 pb-2 ${
                isActive(href) ? 'border-b-2' : ''
              }`}
              style={{
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                borderColor: isActive(href) ? 'var(--color-accent)' : 'transparent',
              }}
            >
              <Icon size={15} /> {label}
            </a>
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

        <a
          href="/settings"
          className="p-2 rounded-lg hover:opacity-70 transition-opacity hidden sm:inline-flex"
          aria-label="Setări"
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
        >
          <Cog size={20} />
        </a>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-error)', color: '#ffffff' }}
        >
          <LogOut size={16} />
          <span>Deconectare</span>
        </button>
      </div>
    </header>
  );
}

function MobileMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const links = [
    { href: '/',                 Icon: Home,          label: 'Dashboard' },
    { href: '/inventory',        Icon: Warehouse,     label: 'Inventar' },
    { href: '/inventory/annual', Icon: Calendar,      label: 'Inventariere' },
    { href: '/consumables',      Icon: Package,       label: 'Consumabile' },
    { href: '/maintenance',      Icon: Wrench,        label: 'Mentenanță' },
    { href: '/incidents',        Icon: AlertTriangle, label: 'Incidente' },
    { href: '/audit-logs',       Icon: FileText,      label: 'Jurnal Audit' },
    { href: '/settings',         Icon: Cog,           label: 'Setări' },
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
      {links.map(({ href, Icon, label }) => (
        <a
          key={href}
          href={href}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
        >
          <Icon size={18} /> {label}
        </a>
      ))}
    </div>
  );
}

function DashboardLayout({ logout, theme, toggleTheme }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      />

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main id="main">
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
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return <DashboardLayout logout={logout} theme={theme} toggleTheme={toggleTheme} />;
}
