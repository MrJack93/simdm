import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';

const STATUS_COLORS = {
  FUNCTIONAL: 'bg-green-900 text-green-300',
  IN_REPARATIE: 'bg-yellow-900 text-yellow-300',
  DEFECT: 'bg-red-900 text-red-300',
  CASAT: 'bg-gray-700 text-gray-300',
  IMPRUMUTAT: 'bg-blue-900 text-blue-300',
  REZERVA: 'bg-purple-900 text-purple-300',
};

const STATUS_LABELS = {
  FUNCTIONAL: 'Funcțional',
  IN_REPARATIE: 'În reparație',
  DEFECT: 'Defect',
  CASAT: 'Casat',
  IMPRUMUTAT: 'Împrumutat',
  REZERVA: 'Rezervă',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

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

  return (
    <main id="main" className="p-6 bg-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Inventar Dispozitive Medicale</h1>
          <Link to="/devices/new" className="btn-primary">
            + Adaugă DM
          </Link>
        </div>

        {/* Filters Section */}
        <div className="card-base mb-6 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Filtrare și Căutare</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="label-base">
                Căutare
              </label>
              <input
                id="search"
                type="text"
                placeholder="Nr. Inv., Denumire, Model..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input-base w-full"
              />
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

        {/* Table */}
        <div className="card-base overflow-x-auto">
          {devicesLoading ? (
            <div className="p-6 text-center text-gray-400">Se încarcă...</div>
          ) : devices.length === 0 ? (
            <div className="p-6 text-center text-gray-400">Nu sunt dispozitive în baza de date.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Nr. Inventar
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Denumire / Model
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Producător
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Clasa
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Secție
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-cyan-400 font-semibold">
                    Data PIF
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-cyan-400 font-semibold">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-gray-800 hover:bg-gray-900 transition">
                    <td className="px-4 py-3 font-mono text-white">{device.inventoryNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{device.name}</div>
                      <div className="text-gray-400 text-xs">{device.model || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{device.manufacturer || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{device.riskClass}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[device.status]}`}>
                        {STATUS_LABELS[device.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{device.sections?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {device.acquisitionDate
                        ? new Date(device.acquisitionDate).toLocaleDateString('ro-RO')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                      <Link
                        to={`/devices/${device.id}/edit`}
                        className="px-3 py-1 bg-cyan-900 text-cyan-300 rounded text-xs font-semibold focusable hover:bg-cyan-800 transition"
                      >
                        Editare
                      </Link>
                      <button
                        onClick={() => handleDelete(device.id, device.name)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 bg-red-900 text-red-300 rounded text-xs font-semibold focusable-danger hover:bg-red-800 transition disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? '...' : 'Șterge'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {devices.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              ← Înapoi
            </button>

            <span className="text-gray-300">
              Pagina <span className="font-bold text-cyan-400">{page}</span> din{' '}
              <span className="font-bold text-cyan-400">{totalPages}</span> •{' '}
              <span className="font-bold text-cyan-400">{pagination.total || 0}</span> total
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
      </div>
    </main>
  );
}
