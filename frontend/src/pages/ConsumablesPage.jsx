import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';

function EditModal({ consumable, onClose, onSave }) {
  const [formData, setFormData] = useState(consumable || { quantity: 0, minQuantity: 0, unitOfMeasure: 'buc' });
  const [loading, setLoading] = useState(false);
  const isNew = !consumable || !consumable.id;

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await api.post('/consumables', formData);
        toast.success('Consumabil adăugat cu succes');
      } else {
        await api.put(`/consumables/${consumable.id}`, formData);
        toast.success('Consumabil actualizat');
      }
      onSave();
    } catch (err) {
      toast.error(isNew ? 'Eroare la adăugare consumabil' : 'Eroare la actualizare');
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
        <h2 className="text-xl font-bold mb-4">{isNew ? 'Adaugă Consumabil Nou' : 'Editare Consumabil'}</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="name" className="label-base">Denumire</label>
            <input
              id="name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-base w-full"
            />
          </div>
          <div>
            <label htmlFor="model" className="label-base">Model</label>
            <input
              id="model"
              type="text"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="input-base w-full"
            />
          </div>
          <div>
            <label htmlFor="quantity" className="label-base">Cantitate</label>
            <input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity || 0}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="input-base w-full"
            />
          </div>
          <div>
            <label htmlFor="minQuantity" className="label-base">Cantitate Minimă</label>
            <input
              id="minQuantity"
              type="number"
              min="0"
              value={formData.minQuantity || 0}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
              className="input-base w-full"
            />
          </div>
          <div>
            <label htmlFor="expiryDate" className="label-base">Data Expirare</label>
            <input
              id="expiryDate"
              type="date"
              value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value || null })}
              className="input-base w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Anulare
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Se salvează...' : (isNew ? 'Adaugă' : 'Salvare')}
          </button>
        </div>
      </div>
    </div>
  );
}

function getExpiryBadge(expiryDate) {
  if (!expiryDate) return null;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { label: '⚠️ Expirat', color: '#dc2626', textColor: 'white' };
  } else if (daysUntilExpiry < 7) {
    return { label: `🔴 ${daysUntilExpiry} zile`, color: '#dc2626', textColor: 'white' };
  } else if (daysUntilExpiry < 30) {
    return { label: `🟡 ${daysUntilExpiry} zile`, color: '#fbbf24', textColor: '#1a1a1a' };
  }

  return null;
}

function getStockStatus(quantity, minQuantity) {
  if (quantity >= minQuantity) {
    return { icon: '✅', label: 'OK', color: '#4ade80', textColor: '#1a1a1a' };
  } else {
    return { icon: '❌', label: 'Sub minim', color: '#f87171', textColor: 'white' };
  }
}

export default function ConsumablesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    minQuantity: '',
    expiryStatus: '', // 'low-stock', 'expiring-soon', 'expired'
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filters.minQuantity) params.append('minQuantity', filters.minQuantity);
    params.append('page', page);
    params.append('limit', limit);
    return params.toString();
  }, [search, filters, page, limit]);

  const { data: consumablesData, isLoading: consumablesLoading, error: consumablesError } = useQuery({
    queryKey: ['consumables', search, filters, page, limit],
    queryFn: () => api.get(`/consumables?${queryParams}`).then(res => res.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/consumables/${id}`),
    onSuccess: () => {
      toast.success('Consumabil șters cu succes');
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
    onError: () => {
      toast.error('Eroare la ștergere consumabil');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Ștergi "${name}"? Acțiunea este reversibilă.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportCsv = () => {
    const consumables = consumablesData?.consumables || [];
    if (consumables.length === 0) {
      toast.warning('Nu sunt consumabile de exportat');
      return;
    }

    const headers = ['Denumire', 'Model', 'Cantitate', 'Cantitate Min', 'Stoc OK', 'Data Expirare'];
    const rows = consumables.map(c => [
      c.name,
      c.model || '—',
      c.quantity,
      c.minQuantity,
      getStockStatus(c.quantity, c.minQuantity).label,
      c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '—',
    ]);

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Consumabile_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const consumables = consumablesData?.consumables || [];
  const pagination = consumablesData?.pagination || {};
  const totalPages = pagination.pages || 1;

  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    return (consumablesData?.consumables || [])
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, consumablesData?.consumables]);

  const handleEditClick = (consumable) => {
    setEditingConsumable(consumable);
    setShowModal(true);
  };

  return (
    <main id="main" className="p-6 min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📦 Consumabile & Piese Schimb</h1>
          <button
            onClick={() => {
              setEditingConsumable(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            + Adaugă Consumabil
          </button>
        </div>

        {/* Filters Section */}
        <div className="card-base mb-6 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Filtrare și Căutare</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor="search" className="label-base">Căutare</label>
              <input
                ref={searchInputRef}
                id="search"
                type="text"
                placeholder="Denumire, model..."
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
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
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
                        setSearch(suggestion.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:opacity-70 transition border-b last:border-b-0"
                      style={{ borderColor: 'var(--color-border)' }}
                      role="option"
                    >
                      <div className="font-medium text-sm">{suggestion.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {suggestion.model || suggestion.manufacturer || '—'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Min Quantity Filter */}
            <div>
              <label htmlFor="minQty-filter" className="label-base">Cantitate Minimă</label>
              <input
                id="minQty-filter"
                type="number"
                min="0"
                placeholder="Doar sub..."
                value={filters.minQuantity}
                onChange={(e) => {
                  setFilters({ ...filters, minQuantity: e.target.value });
                  setPage(1);
                }}
                className="input-base w-full"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setFilters({ minQuantity: '', expiryStatus: '' });
                  setPage(1);
                }}
                className="btn-secondary w-full"
              >
                Resetare
              </button>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button onClick={handleExportCsv} className="btn-primary w-full">
                📋 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {consumablesError && (
          <div className="alert-error mb-6" role="alert">
            Eroare la încărcarea consumabilelor: {consumablesError.message}
          </div>
        )}

        {/* Table */}
        <div className="card-base overflow-x-auto mb-6">
          {consumablesLoading ? (
            <div className="p-6 text-center">Se încarcă...</div>
          ) : consumables.length === 0 ? (
            <div className="p-6 text-center">Nu sunt consumabile în baza de date.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Denumire
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Model
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Cantitate
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Min
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Stoc
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Expirare
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody>
                {consumables.map((consumable) => {
                  const stockStatus = getStockStatus(consumable.quantity, consumable.minQuantity);
                  const expiryBadge = getExpiryBadge(consumable.expiryDate);

                  return (
                    <tr
                      key={consumable.id}
                      className="border-b hover:opacity-70 transition"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{consumable.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {consumable.manufacturer || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">{consumable.model || '—'}</td>
                      <td className="px-4 py-3 text-center font-mono">{consumable.quantity} {consumable.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-center font-mono">{consumable.minQuantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="px-3 py-1 rounded text-xs font-semibold inline-flex items-center gap-1"
                          style={{
                            backgroundColor: stockStatus.color,
                            color: stockStatus.textColor,
                            border: '1px solid currentColor',
                          }}
                        >
                          {stockStatus.icon} {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {expiryBadge ? (
                          <span
                            className="px-3 py-1 rounded text-xs font-semibold inline-block"
                            style={{
                              backgroundColor: expiryBadge.color,
                              color: expiryBadge.textColor,
                              border: '1px solid currentColor',
                            }}
                          >
                            {expiryBadge.label}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {consumable.expiryDate ? new Date(consumable.expiryDate).toISOString().split('T')[0] : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-x-2 flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(consumable)}
                          className="px-3 py-1 rounded text-xs font-semibold focusable hover:opacity-70 transition"
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: '#1a1a1a',
                          }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(consumable.id, consumable.name)}
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
        {consumables.length > 0 && (
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

        {/* Edit/Add Modal */}
        {showModal && (
          <EditModal
            consumable={editingConsumable}
            onClose={() => {
              setShowModal(false);
              setEditingConsumable(null);
            }}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['consumables'] });
              setShowModal(false);
              setEditingConsumable(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
