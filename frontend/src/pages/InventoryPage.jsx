import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import AlertsWidget from '../components/AlertsWidget';

const STATUS_ICONS = {
  FUNCTIONAL: '✓',
  IN_REPARATIE: '⟳',
  DEFECT: '✗',
  CASAT: '−',
  IMPRUMUTAT: '→',
  REZERVA: '◻',
};

const STATUS_LABELS = {
  FUNCTIONAL: 'Funcțional',
  IN_REPARATIE: 'În reparație',
  DEFECT: 'Defect',
  CASAT: 'Casat',
  IMPRUMUTAT: 'Împrumutat',
  REZERVA: 'Rezervă',
};

const getStatusStyle = (status) => {
  const styles = {
    FUNCTIONAL: { bg: '#4ade80', text: '#1a1a1a' },
    IN_REPARATIE: { bg: '#fbbf24', text: '#1a1a1a' },
    DEFECT: { bg: '#ffb4ab', text: '#1a1a1a' },
    CASAT: { bg: '#6b7280', text: '#ffffff' },
    IMPRUMUTAT: { bg: '#60a5fa', text: '#1a1a1a' },
    REZERVA: { bg: '#a78bfa', text: '#1a1a1a' },
  };
  return styles[status] || { bg: '#gray', text: '#ffffff' };
};

function EditModal({ device, onClose, onSave }) {
  const [formData, setFormData] = useState(device || {});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/devices/${device.id}`, formData);
      toast.success('Dispozitiv actualizat');
      onSave();
    } catch {
      toast.error('Eroare la actualizare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="rounded-xl max-w-lg w-full p-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Editare Dispozitiv</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="label-base">Status</label>
            <select
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-base"
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Anulare
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvare'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // State for filters, search, and pagination
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    riskClass: '',
    sectionId: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filters.status) params.append('status', filters.status);
    if (filters.riskClass) params.append('riskClass', filters.riskClass);
    if (filters.sectionId) params.append('sectionId', filters.sectionId);
    params.append('page', page);
    params.append('limit', limit);
    return params.toString();
  }, [search, filters, page, limit]);

  // Fetch devices
  const { data: devicesData, isLoading: devicesLoading, error: devicesError } = useQuery({
    queryKey: ['devices', search, filters, page, limit],
    queryFn: () => api.get(`/devices?${queryParams}`).then(res => res.data),
    keepPreviousData: true,
  });

  // Fetch sections for filter dropdown
  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: () => api.get('/devices/dropdown/sections').then(res => res.data),
  });

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/devices/${id}`),
    onSuccess: () => {
      toast.success('Dispozitiv marcat ca CASAT');
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: () => {
      toast.error('Eroare la ștergere dispozitiv');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Marchezi "${name}" ca CASAT? Acțiunea este reversibilă.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportExcel = () => {
    api
      .get(`/devices/export/xlsx?${queryParams}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dispozitive_DM_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Eroare la export Excel'));
  };

  const handleExportCsv = () => {
    api
      .get(`/devices/export/csv?${queryParams}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dispozitive_DM_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Eroare la export CSV'));
  };

  const devices = devicesData?.devices || [];
  const pagination = devicesData?.pagination || {};
  const totalPages = pagination.pages || 1;

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    return (devicesData?.devices || [])
      .filter(
        (d) =>
          d.inventoryNumber.toLowerCase().includes(search.toLowerCase()) ||
          d.name.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5);
  }, [search, devicesData?.devices]);

  const handleEditClick = (device) => {
    setEditingDevice(device);
    setShowModal(true);
  };

  return (
    <main id="main" className="p-6 min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventar Dispozitive Medicale</h1>
          <Link to="/devices/new" className="btn-primary">
            + Adaugă DM
          </Link>
        </div>

        {/* Alerts Widget */}
        <AlertsWidget />

        {/* Filters Section */}
        <div className="card-base mb-6 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Filtrare și Căutare</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search with Autocomplete */}
            <div className="relative">
              <label htmlFor="search" className="label-base">
                Căutare
              </label>
              <input
                ref={searchInputRef}
                id="search"
                type="text"
                placeholder="Nr. Inv., Denumire..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="input-base w-full"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="search-suggestions"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="search-suggestions"
                  className="absolute top-full left-0 right-0 mt-1 rounded-lg border z-10 animate-slide-down"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                  }}
                  role="listbox"
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setSearch(suggestion.inventoryNumber);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:opacity-70 transition border-b last:border-b-0"
                      style={{ borderColor: 'var(--color-border)' }}
                      role="option"
                    >
                      <div className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>
                        {suggestion.inventoryNumber}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {suggestion.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="label-base">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                className="input-base w-full"
              >
                <option value="">Toate statusurile</option>
                <option value="FUNCTIONAL">Funcțional</option>
                <option value="IN_REPARATIE">În reparație</option>
                <option value="DEFECT">Defect</option>
                <option value="CASAT">Casat</option>
                <option value="IMPRUMUTAT">Împrumutat</option>
                <option value="REZERVA">Rezervă</option>
              </select>
            </div>

            {/* Risk Class Filter */}
            <div>
              <label htmlFor="risk-filter" className="label-base">
                Clasa Risc
              </label>
              <select
                id="risk-filter"
                value={filters.riskClass}
                onChange={(e) => {
                  setFilters({ ...filters, riskClass: e.target.value });
                  setPage(1);
                }}
                className="input-base w-full"
              >
                <option value="">Toate clasele</option>
                <option value="I">I</option>
                <option value="IIa">IIa</option>
                <option value="IIb">IIb</option>
                <option value="III">III</option>
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label htmlFor="section-filter" className="label-base">
                Secție
              </label>
              <select
                id="section-filter"
                value={filters.sectionId}
                onChange={(e) => {
                  setFilters({ ...filters, sectionId: e.target.value });
                  setPage(1);
                }}
                className="input-base w-full"
              >
                <option value="">Toate secțiile</option>
                {sectionsData?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setFilters({ status: '', riskClass: '', sectionId: '' });
                  setPage(1);
                }}
                className="btn-secondary w-full"
              >
                Resetare
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button onClick={handleExportExcel} className="btn-primary flex-1">
              📊 Export Excel
            </button>
            <button onClick={handleExportCsv} className="btn-primary flex-1">
              📋 Export CSV
            </button>
          </div>
        </div>

        {/* Error Message */}
        {devicesError && (
          <div className="alert-error mb-6" role="alert">
            Eroare la încărcarea dispozitivelor: {devicesError.message}
          </div>
        )}

        {/* Error Message */}
        {devicesError && (
          <div className="alert-error mb-6" role="alert">
            Eroare la încărcarea dispozitivelor: {devicesError.message}
          </div>
        )}

        {/* Table */}
        <div className="card-base overflow-x-auto mb-6">
          {devicesLoading ? (
            <div className="p-6 text-center">Se încarcă...</div>
          ) : devices.length === 0 ? (
            <div className="p-6 text-center">Nu sunt dispozitive în baza de date.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Nr. Inventar
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Denumire / Model
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Producător
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Clasa
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Secție
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => {
                  const statusStyle = getStatusStyle(device.status);
                  return (
                    <tr
                      key={device.id}
                      className="border-b hover:opacity-70 transition"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--color-accent)' }}>
                        {device.inventoryNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {device.model || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">{device.manufacturer || '—'}</td>
                      <td className="px-4 py-3">{device.riskClass}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-3 py-1 rounded text-xs font-semibold inline-flex items-center gap-1"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            border: '1px solid currentColor',
                          }}
                        >
                          {STATUS_ICONS[device.status]} {STATUS_LABELS[device.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{device.sections?.name || '—'}</td>
                      <td className="px-4 py-3 text-center space-x-2 flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(device)}
                          className="px-3 py-1 rounded text-xs font-semibold focusable hover:opacity-70 transition"
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: '#1a1a1a',
                          }}
                        >
                          ✎ Editare
                        </button>
                        <Link
                          to={`/devices/${device.id}/edit`}
                          className="px-3 py-1 rounded text-xs font-semibold focusable hover:opacity-70 transition"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          📝 Detalii
                        </Link>
                        <button
                          onClick={() => handleDelete(device.id, device.name)}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1 rounded text-xs font-semibold focusable-danger hover:opacity-70 transition disabled:opacity-50"
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                          }}
                        >
                          {deleteMutation.isPending ? '...' : '✕'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {devices.length > 0 && (
          <div className="flex justify-between items-center" style={{ color: 'var(--color-text-primary)' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              ← Înapoi
            </button>

            <span>
              Pagina <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{page}</span> din{' '}
              <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{totalPages}</span> •{' '}
              <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{pagination.total || 0}</span> total
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Înainte →
            </button>
          </div>
        )}

        {/* Edit Modal */}
        {showModal && editingDevice && (
          <EditModal
            device={editingDevice}
            onClose={() => {
              setShowModal(false);
              setEditingDevice(null);
            }}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['devices'] });
              setShowModal(false);
              setEditingDevice(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
