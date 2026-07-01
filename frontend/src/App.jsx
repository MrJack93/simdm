import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SkipLink from './components/SkipLink';
import { Skeleton } from './components/ui/skeleton';
import Sidebar, { SIDEBAR_EXPANDED_W, SIDEBAR_RAIL_W } from './components/Sidebar';
import { Menu, LogOut, Sun, Moon, Cog } from 'lucide-react';

// Lazy-loaded pages
const Dashboard           = lazy(() => import('./pages/Dashboard'));
const InventoryPageV2     = lazy(() => import('./pages/InventoryPageV2'));
const ConsumablesPage     = lazy(() => import('./pages/ConsumablesPage'));
const AnnualInventoryPage = lazy(() => import('./pages/AnnualInventoryPage'));
const DeviceForm          = lazy(() => import('./pages/DeviceForm'));
const SettingsPage        = lazy(() => import('./pages/SettingsPage'));
const MaintenancePage     = lazy(() => import('./pages/MaintenancePage'));
const MaintenanceCalendarPage  = lazy(() => import('./pages/MaintenanceCalendarPage'));
const MaintenanceExecutionPage = lazy(() => import('./pages/MaintenanceExecutionPage'));
const MppExecutionForm    = lazy(() => import('./pages/MppExecutionForm'));
const RepairTicketsPage   = lazy(() => import('./pages/RepairTicketsPage'));
const VerificationsPage   = lazy(() => import('./pages/VerificationsPage'));
const ServiceContractsPage = lazy(() => import('./pages/ServiceContractsPage'));
const IncidentsPage       = lazy(() => import('./pages/IncidentsPage'));
const AuditLogsPage       = lazy(() => import('./pages/AuditLogsPage'));
const DocumentsPage       = lazy(() => import('./pages/DocumentsPage'));
const DecommissionPage    = lazy(() => import('./pages/DecommissionPage'));
const DutyLogPage         = lazy(() => import('./pages/DutyLogPage'));
const ActivityReportPage  = lazy(() => import('./pages/ActivityReportPage'));
const ProcurementPage     = lazy(() => import('./pages/ProcurementPage'));
const CommissioningPage   = lazy(() => import('./pages/CommissioningPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="text-center">
        <Skeleton lines={1} variant="text" className="w-32 mb-4" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TOP BAR — bara orizontală deasupra conținutului
//  Conține: hamburger (mobile), logo (mobile), theme, setări, logout
// ─────────────────────────────────────────────
function TopBar({ logout, theme, toggleTheme, onMobileMenuOpen }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      {/* ── Stânga: Hamburger (mobile) + Logo (mobile) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger — vizibil doar pe mobile */}
        <button
          className="md:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Deschide meniu lateral"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Menu size={22} />
        </button>

        {/* Logo — vizibil doar pe mobile (sidebar îl arată pe desktop) */}
        <Link
          to="/"
          className="md:hidden"
          aria-label="SIMDM – Acasă"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: 'var(--color-accent)' }}
          >
            flare
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: 'var(--font-family-headline)',
            color: 'var(--color-accent)',
            letterSpacing: '-0.5px',
          }}>
            SIMDM
          </span>
        </Link>
      </div>

      {/* ── Dreapta: comenzi globale ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Toggle dark/light mode */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Comută la modul clar' : 'Comută la modul întunecat'}
          className="topbar-btn"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Setări */}
        <Link
          to="/settings"
          aria-label="Setări aplicație"
          className="topbar-btn hidden sm:flex"
          style={{
            width: '36px',
            height: '36px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
        >
          <Cog size={18} />
        </Link>

        {/* Separator vizual */}
        <div
          aria-hidden="true"
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'var(--color-border)',
            margin: '0 4px',
          }}
        />

        {/* Deconectare */}
        <button
          onClick={logout}
          aria-label="Deconectare din sistem"
          className="topbar-btn"
          style={{
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Deconectare</span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
//  DASHBOARD LAYOUT — structura principală
//  Sidebar fix pe stânga + conținut cu margin-left animat
// ─────────────────────────────────────────────
function DashboardLayout({ logout, theme, toggleTheme }) {
  // Starea sidebar-ului persiste în localStorage
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    try { return localStorage.getItem('simdm-sidebar-expanded') !== 'false'; } catch { return true; }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem('simdm-sidebar-expanded', String(next)); } catch { /* localStorage indisponibil */ }
      return next;
    });
  };

  // Închide sidebar-ul mobil cu Escape
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsMobileSidebarOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMobileSidebarOpen]);

  // Lățimea curentă a sidebar-ului (pentru offset-ul conținutului pe desktop)
  const sidebarW = isSidebarExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_RAIL_W;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <SkipLink />

      {/* Sidebar — position: fixed, nu participă la flux */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Conținut principal — offset la dreapta cu lățimea sidebar-ului */}
      <div
        className="sidebar-content-wrapper"
        style={{
          marginLeft: `${sidebarW}px`,
          transition: 'margin-left 220ms cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopBar
          logout={logout}
          theme={theme}
          toggleTheme={toggleTheme}
          onMobileMenuOpen={() => setIsMobileSidebarOpen(true)}
        />

        <main id="main" style={{ flex: 1 }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/"                          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/inventory"                 element={<ProtectedRoute><InventoryPageV2 /></ProtectedRoute>} />
              <Route path="/inventory/annual"          element={<ProtectedRoute><AnnualInventoryPage /></ProtectedRoute>} />
              <Route path="/consumables"               element={<ProtectedRoute><ConsumablesPage /></ProtectedRoute>} />
              <Route path="/maintenance"               element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
              <Route path="/maintenance/calendar"      element={<ProtectedRoute><MaintenanceCalendarPage /></ProtectedRoute>} />
              <Route path="/maintenance/execution"     element={<ProtectedRoute><MppExecutionForm /></ProtectedRoute>} />
              <Route path="/maintenance/execution/legacy" element={<ProtectedRoute><MaintenanceExecutionPage /></ProtectedRoute>} />
              <Route path="/maintenance/tickets"       element={<ProtectedRoute><RepairTicketsPage /></ProtectedRoute>} />
              <Route path="/verifications"             element={<ProtectedRoute><VerificationsPage /></ProtectedRoute>} />
              <Route path="/service-contracts"         element={<ProtectedRoute><ServiceContractsPage /></ProtectedRoute>} />
              <Route path="/incidents"                 element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
              <Route path="/documents"                 element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
              <Route path="/decommission"              element={<ProtectedRoute><DecommissionPage /></ProtectedRoute>} />
              <Route path="/duty-log"                  element={<ProtectedRoute><DutyLogPage /></ProtectedRoute>} />
              <Route path="/reports"                   element={<ProtectedRoute><ActivityReportPage /></ProtectedRoute>} />
              <Route path="/procurement"               element={<ProtectedRoute><ProcurementPage /></ProtectedRoute>} />
              <Route path="/commissioning"             element={<ProtectedRoute><CommissioningPage /></ProtectedRoute>} />
              <Route path="/audit-logs"                element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
              <Route path="/devices/new"               element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
              <Route path="/devices/:id/edit"          element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
              <Route path="/settings"                  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
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
        <Route path="/*" element={
          <ProtectedRoute>
            <DashboardLayout logout={logout} theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  );
}
