import { useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home, Warehouse, Package, Calendar, Wrench, TicketCheck,
  CheckSquare, Briefcase, AlertTriangle, BookOpen, Archive,
  ClipboardList, BarChart3, ShoppingCart, PackageCheck, FileText,
  Cog, PanelLeftClose, PanelLeftOpen, CalendarDays,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  NAV STRUCTURE — grupuri logice
// ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'principal',
    label: null, // fără titlu — prima secțiune
    items: [
      { to: '/', Icon: Home, label: 'Dashboard', end: true },
    ],
  },
  {
    id: 'gestiune',
    label: 'GESTIUNE',
    items: [
      { to: '/inventory',        Icon: Warehouse,    label: 'Inventar' },
      { to: '/inventory/annual', Icon: Calendar,     label: 'Inventariere' },
      { to: '/consumables',      Icon: Package,      label: 'Consumabile' },
      { to: '/procurement',      Icon: ShoppingCart, label: 'Procurare' },
      { to: '/commissioning',    Icon: PackageCheck, label: 'Recepție' },
    ],
  },
  {
    id: 'mentenanta',
    label: 'MENTENANȚĂ',
    items: [
      { to: '/maintenance',          Icon: Wrench,       label: 'Mentenanță' },
      { to: '/maintenance/calendar', Icon: CalendarDays, label: 'Calendar MPP' },
      { to: '/maintenance/tickets',  Icon: TicketCheck,  label: 'Bilete' },
      { to: '/verifications',        Icon: CheckSquare,  label: 'Verificări' },
      { to: '/service-contracts',    Icon: Briefcase,    label: 'Contracte' },
    ],
  },
  {
    id: 'operational',
    label: 'OPERAȚIONAL',
    items: [
      { to: '/incidents',    Icon: AlertTriangle, label: 'Incidente' },
      { to: '/documents',    Icon: BookOpen,      label: 'Documente' },
      { to: '/decommission', Icon: Archive,       label: 'Casare' },
      { to: '/duty-log',     Icon: ClipboardList, label: 'Jurnal Gardă' },
      { to: '/reports',      Icon: BarChart3,     label: 'Raport' },
    ],
  },
  {
    id: 'sistem',
    label: 'SISTEM',
    items: [
      { to: '/settings',   Icon: Cog,      label: 'Setări' },
      { to: '/audit-logs', Icon: FileText, label: 'Jurnal Audit' },
    ],
  },
];

// Lățimi exportate — folosite în DashboardLayout pentru marginea conținutului
export const SIDEBAR_EXPANDED_W = 240;
export const SIDEBAR_RAIL_W = 64;

// ─────────────────────────────────────────────
//  SIDEBAR COMPONENT
//  Props:
//    isExpanded      – boolean  (controlled de DashboardLayout)
//    onToggle        – fn()     – toggle rail/expanded (desktop)
//    isMobileOpen    – boolean  – drawer deschis pe mobile
//    onMobileClose   – fn()     – închide drawer-ul mobile
// ─────────────────────────────────────────────
export default function Sidebar({ isExpanded, onToggle, isMobileOpen, onMobileClose }) {
  const handleLinkClick = useCallback(() => {
    if (onMobileClose) onMobileClose();
  }, [onMobileClose]);

  return (
    <>
      {/* ── Backdrop mobil: fundal semi-transparent când drawer-ul e deschis ── */}
      <div
        aria-hidden="true"
        onClick={onMobileClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          backgroundColor: 'rgba(20, 20, 19, 0.55)',
          backdropFilter: 'blur(2px)',
          opacity: isMobileOpen ? 1 : 0,
          pointerEvents: isMobileOpen ? 'auto' : 'none',
          transition: 'opacity 220ms ease',
        }}
        className="md:hidden"
      />

      {/* ── Sidebar / Drawer ── */}
      <aside
        aria-label="Meniu principal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          // Desktop: lățime animată; Mobile: lățime fixă (240px), drawer slide
          width: `${isExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_RAIL_W}px`,
          backgroundColor: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 220ms cubic-bezier(0.4,0,0.2,1), transform 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
        // Pe mobile: lățime fixă expanded + translate pentru slide in/out
        className={[
          'max-md:!w-[240px]',
          isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        {/* ── Antet sidebar: Logo + buton Toggle ── */}
        <div
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Logo — dispare lin în modul rail */}
          <Link
            to="/"
            onClick={handleLinkClick}
            aria-label="SIMDM – Pagina principală"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: 0,
              opacity: isExpanded ? 1 : 0,
              pointerEvents: isExpanded ? 'auto' : 'none',
              transition: 'opacity 180ms ease',
              overflow: 'hidden',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px', color: 'var(--color-accent)', flexShrink: 0 }}
            >
              flare
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-family-headline)',
              color: 'var(--color-accent)',
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
            }}>
              SIMDM
            </span>
          </Link>

          {/* Buton Toggle expand/rail — vizibil doar pe desktop */}
          <button
            onClick={onToggle}
            aria-label={isExpanded ? 'Restrânge meniul lateral' : 'Extinde meniul lateral'}
            aria-expanded={isExpanded}
            className="sidebar-toggle-btn hidden md:flex"
            style={{
              width: '36px',
              height: '36px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {/* ── Corp navigare — scroll independent față de conținut ── */}
        <nav
          aria-label="Navigare principală"
          className="sidebar-nav"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: '8px',
            paddingBottom: '16px',
          }}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>

              {/* Titlu categorie (expanded) — separator linie (rail) */}
              {group.label && (
                <div aria-hidden="true" style={{ margin: '4px 0', overflow: 'hidden' }}>
                  {/* Textul categoriei — apare lin la expandare */}
                  <div style={{
                    padding: '10px 18px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    opacity: isExpanded ? 1 : 0,
                    maxHeight: isExpanded ? '28px' : '0px',
                    transition: 'opacity 180ms ease, max-height 220ms cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                  }}>
                    {group.label}
                  </div>
                  {/* Separator în loc de label în modul rail */}
                  <div style={{
                    height: '1px',
                    margin: '0 12px',
                    backgroundColor: 'var(--color-border)',
                    opacity: isExpanded ? 0 : 1,
                    transition: 'opacity 180ms ease',
                  }} />
                </div>
              )}

              {/* Itemii de navigare */}
              {group.items.map(({ to, Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={handleLinkClick}
                  // Tooltip nativ în modul rail (icon-only)
                  title={!isExpanded ? label : undefined}
                  aria-label={!isExpanded ? label : undefined}
                  // Clasa CSS separă logica hover/active de stilurile inline
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                  }
                  // Doar proprietăți care depind de stare (nu background — e în CSS)
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    fontWeight: isActive ? 500 : 400,
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          transition: 'color 150ms ease',
                        }}
                      />
                      {/* Textul linkului dispare lin în modul rail */}
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: isExpanded ? 1 : 0,
                        maxWidth: isExpanded ? '160px' : '0px',
                        transition: 'opacity 180ms ease, max-width 220ms cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}

            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
