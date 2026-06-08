import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FileText, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';

/**
 * @typedef {import('../types').AuditLog} AuditLog
 * @typedef {import('../types').PaginatedResponse<AuditLog>} AuditLogPage
 */

// Paginare server-side: fiecare pagină face un request distinct cu `page` și `limit`.
// Am eliminat fetch-ul de 500 rânduri + paginarea client-side (useMemo pe logs.slice).
const ITEMS_PER_PAGE = 50;

const ACTION_LABELS = {
  CREATE:       'Creare',
  UPDATE:       'Actualizare',
  DELETE:       'Ștergere',
  LOGIN:        'Autentificare',
  LOGOUT:       'Deconectare',
  LOGIN_FAILED: 'Autentificare eșuată',
  FILE_UPLOAD:  'Încărcare fișier',
  STOCK_UPDATE: 'Actualizare stoc',
};

const ACTION_COLORS = {
  CREATE:       'var(--color-success)',
  UPDATE:       'var(--color-accent)',
  DELETE:       'var(--color-error)',
  LOGIN:        'var(--color-text-secondary)',
  LOGOUT:       'var(--color-text-secondary)',
  LOGIN_FAILED: 'var(--color-warning)',
  FILE_UPLOAD:  'var(--color-accent)',
  STOCK_UPDATE: 'var(--color-success)',
};

/** @param {{ changes: AuditLog['changes'] }} props */
function ChangesCell({ changes }) {
  const [expanded, setExpanded] = useState(false);
  if (!changes) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;

  const text = JSON.stringify(changes, null, 2);
  const short = text.length > 60 ? text.slice(0, 60) + '…' : text;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs"
        style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Restrânge' : short}
      </button>
      {expanded && (
        <pre
          className="mt-1 text-xs p-2 rounded overflow-auto max-h-32"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            maxWidth: '280px',
          }}
        >
          {text}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ entity: '', action: '', dateFrom: '', dateTo: '' });

  // Paginare server-side: queryKey include `currentPage` și `filters`,
  // astfel React Query cache-uiește fiecare pagină separat și prefetch-ează automat.
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['audit-logs', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:  currentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (filters.entity)   params.set('entity',   filters.entity);
      if (filters.action)   params.set('action',   filters.action);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo)   params.set('dateTo',   filters.dateTo);

      const res = await api.get(`/audit-logs?${params}`);
      return res.data; // { data: AuditLog[], total: number, page: number, totalPages: number }
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev, // păstrează datele anterioare vizibile la schimbarea paginii
  });

  const logs      = data?.data       ?? [];
  const total     = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? Math.ceil(total / ITEMS_PER_PAGE);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setCurrentPage(1); // resetează la pagina 1 când filtrele se schimbă
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.entity)   params.set('entity',   filters.entity);
      if (filters.action)   params.set('action',   filters.action);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo)   params.set('dateTo',   filters.dateTo);

      const res = await api.get(`/audit-logs/export/csv?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Fișier CSV descărcat');
    } catch {
      toast.error('Eroare la exportul CSV');
    }
  };

  return (
    <section className="p-4 md:p-8" aria-label="Jurnal de audit">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText size={24} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Jurnal de Audit
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {total > 0 ? `${total} înregistrări total` : 'Se încarcă…'}
            </p>
          </div>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filtre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div>
          <label className="label-base" htmlFor="filter-entity">Entitate</label>
          <input
            id="filter-entity"
            className="input-base w-full"
            placeholder="ex: Device"
            value={filters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base" htmlFor="filter-action">Acțiune</label>
          <select
            id="filter-action"
            className="input-base w-full"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Toate</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base" htmlFor="filter-from">De la dată</label>
          <input
            id="filter-from"
            type="date"
            className="input-base w-full"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="label-base" htmlFor="filter-to">Până la dată</label>
          <input
            id="filter-to"
            type="date"
            className="input-base w-full"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Tabel */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{
          borderColor: 'var(--color-border)',
          opacity: isPlaceholderData ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                {['Data/Ora', 'Utilizator', 'Acțiune', 'Entitate', 'ID', 'Modificări', 'IP'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-semibold"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="skeleton skeleton-row" style={{ height: '20px', borderRadius: '4px' }} />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    Nu există înregistrări pentru filtrele selectate
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderTop: '1px solid var(--color-border)' }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                      {log.users?.username || <em style={{ color: 'var(--color-text-muted)' }}>sistem</em>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: (ACTION_COLORS[log.action] || 'var(--color-text-muted)') + '22',
                          color: ACTION_COLORS[log.action] || 'var(--color-text-muted)',
                        }}
                      >
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{log.entity}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{log.entityId || '—'}</td>
                    <td className="px-4 py-3"><ChangesCell changes={log.changes} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginare */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Pagina {currentPage} din {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="btn-secondary flex items-center gap-1 text-sm"
            >
              <ChevronLeft size={14} /> Înapoi
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading || isPlaceholderData}
              className="btn-secondary flex items-center gap-1 text-sm"
            >
              Înainte <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
