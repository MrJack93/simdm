import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Edit2, Trash2, Plus, Grid3x3, List, Layout, Search } from 'lucide-react';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useDevices } from '../hooks/useDevices';
import { deleteDevice, deviceKeys } from '../api/devices';

/** @typedef {import('../types').Device} Device */

const STATUS_COLORS = {
  FUNCTIONAL:  '#34d399',
  IN_REPARATIE:'#fbbf24',
  DEFECT:      '#f87171',
  CASAT:       '#6b7280',
  IMPRUMUTAT:  '#60a5fa',
  REZERVA:     '#a78bfa',
};

const STATUS_LABELS = {
  FUNCTIONAL:  'Funcțional',
  IN_REPARATIE:'În reparație',
  DEFECT:      'Defect',
  CASAT:       'Casat',
  IMPRUMUTAT:  'Împrumutat',
  REZERVA:     'Rezervă',
};

const STATUS_ICONS = {
  FUNCTIONAL:  '✓',
  IN_REPARATIE:'⟳',
  DEFECT:      '✗',
  CASAT:       '−',
  IMPRUMUTAT:  '→',
  REZERVA:     '◻',
};

// ─── Componente extrase la nivel de modul ─────────────────────────────────────
// Sunt definite ÎN AFARA componentei principale pentru a evita re-montarea
// (remount) la fiecare render al părintelui, ce cauza INP degradat.

const RADIUS_MAP = { full: 'rounded-full', md: 'rounded-md' };

/** @param {{ status: Device['status'], rounded?: string }} props */
function StatusBadge({ status, rounded = 'full' }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${RADIUS_MAP[rounded] || 'rounded-full'}`}
      style={{ backgroundColor: color, color: status === 'CASAT' ? '#ffffff' : '#1a1a1a' }}
    >
      <span aria-hidden="true">{STATUS_ICONS[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** @param {{ view: 'table'|'cards'|'kanban', setView: (v: string) => void }} props */
function ViewToggle({ view, setView }) {
  return (
    <div className="flex gap-1 border rounded-lg p-1" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      {[
        { key: 'table',  Icon: List,     label: 'Tabel' },
        { key: 'cards',  Icon: Grid3x3,  label: 'Carduri' },
        { key: 'kanban', Icon: Layout,   label: 'Kanban', hideOnMobile: true },
      ].map(({ key, Icon, label, hideOnMobile }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${hideOnMobile ? 'hidden md:flex' : ''}`}
          style={{
            backgroundColor: view === key ? 'var(--color-accent)' : 'transparent',
            color: view === key ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
          }}
          aria-pressed={view === key}
          aria-label={label}
          data-view-toggle={key}
        >
          <Icon size={16} />{label}
        </button>
      ))}
    </div>
  );
}

/**
 * @param {{ devices: Device[], isLoading: boolean, onDelete: (id: number) => void }} props
 */
function TableView({ devices, isLoading, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
            {['Dispozitiv', 'Inv. Nr.', 'Secție', 'Status', 'Acțiuni'].map(col => (
              <th key={col} scope="col" className="px-6 py-4 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              <td colSpan={5} className="px-6 py-4"><div className="skeleton skeleton-row" /></td>
            </tr>
          ))}
          {!isLoading && devices.map(device => (
            <tr key={device.id} className="border-b transition-colors hover:bg-[var(--color-bg-elevated)]" style={{ borderColor: 'var(--color-border)' }}>
              <td className="px-6 py-4">
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{device.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{device.model}</p>
              </td>
              <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>{device.inventoryNumber}</td>
              <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{device.section}</td>
              <td className="px-6 py-4"><StatusBadge status={device.status} /></td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link
                    to={`/devices/${device.id}/edit`}
                    className="p-3 rounded hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ color: 'var(--color-accent)' }}
                    aria-label={`Editare ${device.name}`}
                  >
                    <Edit2 size={16} />
                  </Link>
                  <DeleteConfirmDialog
                    name={device.name}
                    onConfirm={() => onDelete(device.id)}
                    trigger={
                      <button
                        className="p-3 rounded hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                        style={{ color: 'var(--color-error)' }}
                        aria-label={`Ștergere ${device.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** @param {{ devices: Device[], isLoading: boolean, onDelete: (id: number) => void }} props */
function CardView({ devices, isLoading, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading && Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="skeleton skeleton-text mb-2"></div>
          <div className="skeleton skeleton-text mb-4 w-3/4"></div>
          <div className="skeleton skeleton-row mb-4"></div>
          <div className="flex gap-2 justify-end">
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
          </div>
        </div>
      ))}
      {!isLoading && devices.map(device => (
        <div
          key={device.id}
          className="p-6 rounded-xl border card-hover animate-bounce-in"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{device.name}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{device.model}</p>
            </div>
            <StatusBadge status={device.status} rounded="md" />
          </div>
          <div className="text-xs space-y-1.5 mb-4 pb-4 border-b" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
            <p><strong>Inv. Nr.:</strong> {device.inventoryNumber}</p>
            <p><strong>Secție:</strong> {device.section}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/devices/${device.id}/edit`}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all text-center"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
            >
              Editare
            </Link>
            <DeleteConfirmDialog
              name={device.name}
              onConfirm={() => onDelete(device.id)}
              trigger={
                <button
                  className="py-2 px-3 rounded-lg text-sm border transition-all"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-error)' }}
                  aria-label={`Ștergere ${device.name}`}
                >
                  <Trash2 size={14} />
                </button>
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @param {{ devices: Device[] }} props */
function KanbanView({ devices }) {
  const STATUS_ORDER = ['FUNCTIONAL', 'REZERVA', 'IN_REPARATIE', 'DEFECT', 'IMPRUMUTAT', 'CASAT'];
  const KANBAN_LIMIT = 10;
  const grouped = Object.fromEntries(
    STATUS_ORDER.map(s => [s, devices.filter(d => d.status === s)])
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
      {STATUS_ORDER.map(status => {
        const allItems = grouped[status];
        const visibleItems = allItems.slice(0, KANBAN_LIMIT);
        const hiddenCount = Math.max(0, allItems.length - KANBAN_LIMIT);

        return (
          <div key={status}>
            <div
              className="p-3 rounded-lg mb-3 font-bold text-sm"
              style={{ backgroundColor: STATUS_COLORS[status], color: status === 'CASAT' ? '#fff' : '#1a1a1a' }}
            >
              {STATUS_ICONS[status]} {STATUS_LABELS[status]} ({allItems.length})
            </div>
            <div className="space-y-2">
              {visibleItems.map(device => (
                <div
                  key={device.id}
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                >
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{device.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{device.inventoryNumber}</p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/devices/${device.id}/edit`}
                      className="flex-1 py-1 px-2 rounded text-xs font-medium text-center"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
                    >
                      Editare
                    </Link>
                  </div>
                </div>
              ))}
              {hiddenCount > 0 && (
                <div
                  className="p-3 rounded-lg border text-center text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  +{hiddenCount} mai mult{hiddenCount === 1 ? '' : 'e'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componenta principală ─────────────────────────────────────────────────────

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  // useTransition: evită blocarea UI-ului în timp ce React re-renderizează lista filtrată.
  // Actualizarea searchTerm devine non-urgentă → tastatura rămâne responsivă (Fix INP).
  const [isPending, startTransition] = useTransition();
  const handleSearch = (value) => { startTransition(() => setSearchTerm(value)); };
  // Pre-populează filtrul din query param ?status= (e.g. venit din Dashboard StatCard).
  // STATUS_LABELS conține cheile valide; orice altă valoare → 'all'.
  const [filterStatus, setFilterStatus] = useState(() => {
    const param = searchParams.get('status') ?? 'all';
    return Object.prototype.hasOwnProperty.call(STATUS_LABELS, param) ? param : 'all';
  });
  const [filterSection, setFilterSection] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const searchInputRef = useRef(null);

  const { data: devicesData, isLoading } = useDevices();

  const devices = devicesData?.devices || [];

  const filteredDevices = useMemo(() => devices.filter(device => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      device.name?.toLowerCase().includes(q) ||
      device.inventoryNumber?.toLowerCase().includes(q) ||
      device.model?.toLowerCase().includes(q);
    const matchesStatus  = filterStatus  === 'all' || device.status  === filterStatus;
    const matchesSection = filterSection === 'all' || device.section === filterSection;
    return matchesSearch && matchesStatus && matchesSection;
  }), [devices, searchTerm, filterStatus, filterSection]);

  const sections = useMemo(
    () => [...new Set(devices.map(d => d.section).filter(Boolean))].sort(),
    [devices]
  );

  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterSection]);

  /**
   * Optimistic delete: rândul/cardul dispare instant din UI.
   * Dacă API-ul răspunde cu eroare, lista este restaurată automat
   * din snapshot-ul salvat în onMutate (rollback).
   */
  const deleteMutation = useMutation({
    mutationFn: deleteDevice,

    onMutate: async (deletedId) => {
      // Anulăm orice refetch în curs pentru a evita suprascrierea optimistă
      await queryClient.cancelQueries({ queryKey: deviceKeys.all });

      // Salvăm starea curentă pentru rollback
      const previousData = queryClient.getQueryData(deviceKeys.all);

      // Actualizare optimistă: scoatem dispozitivul din cache
      queryClient.setQueryData(deviceKeys.all, (old) => {
        if (!old) return old;
        return { ...old, devices: old.devices.filter(d => d.id !== deletedId) };
      });

      return { previousData };
    },

    onError: (_err, _id, context) => {
      // Rollback la starea anterioară dacă API-ul a eșuat
      if (context?.previousData) {
        queryClient.setQueryData(deviceKeys.all, context.previousData);
      }
      toast.error('Eroare la ștergere. Lista a fost restaurată.');
    },

    onSuccess: () => {
      toast.success('Dispozitiv șters');
    },

    // Indiferent de succes/eroare, sincronizăm cu serverul
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Page header */}
      <div className="border-b px-8 py-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Inventar Dispozitive Medicale
          </h1>
          <Link
            to="/devices/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
          >
            <Plus size={18} /> Adaugă
          </Link>
        </div>
      </div>

      {/* Filters & search */}
      <div className="border-b px-8 py-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Filtrare și Căutare</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label htmlFor="inventory-search" className="sr-only">
              Căutare dispozitive
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              size={16}
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              ref={searchInputRef}
              id="inventory-search"
              type="text"
              placeholder="Căuta după nume, inv. nr., model…"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              className="input-base w-full pl-9"
              style={{
                opacity: isPending ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-base"
            aria-label="Filtru status"
          >
            <option value="all">Toate statusurile</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterSection}
            onChange={e => setFilterSection(e.target.value)}
            className="input-base"
            aria-label="Filtru secție"
          >
            <option value="all">Toate secțiile</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <ViewToggle view={view} setView={setView} />
        </div>

        <p className="text-xs" role="status" aria-live="polite" style={{ color: 'var(--color-text-tertiary)' }}>
          Pagina {currentPage} din {totalPages || 1} • {filteredDevices.length} dispozitive găsite
        </p>
      </div>

      {/* Content */}
      <div className="p-8" style={{ minHeight: '500px' }}>
        {!isLoading && filteredDevices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>Niciun dispozitiv găsit</p>
            <Link
              to="/devices/new"
              className="inline-block px-6 py-2 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
            >
              Adaugă dispozitiv
            </Link>
          </div>
        ) : view === 'table' ? (
          <TableView devices={paginatedDevices} isLoading={isLoading} onDelete={handleDelete} />
        ) : view === 'cards' ? (
          <CardView devices={isLoading ? [] : paginatedDevices} isLoading={isLoading} onDelete={handleDelete} />
        ) : (
          <KanbanView devices={filteredDevices} />
        )}

        {/* Pagination */}
        {filteredDevices.length > ITEMS_PER_PAGE && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              ← Înapoi
            </button>

            <span style={{ color: 'var(--color-text-primary)' }}>
              Pagina <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{currentPage}</span> din{' '}
              <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 rounded-lg border font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              Înainte →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
