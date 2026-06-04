import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Wrench, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api/axios';

const ITEMS_PER_PAGE = 25;

const TYPE_CONFIG = {
  PREVENTIVA: { label: 'Preventivă', color: 'var(--color-success)' },
  CORECTIVA:  { label: 'Corectivă',  color: 'var(--color-warning)' },
  VERIFICARE: { label: 'Verificare', color: 'var(--color-accent)' },
  CALIBRARE:  { label: 'Calibrare',  color: '#a855f7' },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: 'var(--color-text-secondary)' };
  return (
    <span
      className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

const EMPTY_FORM = {
  deviceId: '', type: 'PREVENTIVA', scheduledDate: '', executedDate: '',
  duration: '', description: '', partsReplaced: '', consumablesUsed: '',
  result: '', cost: '', externalService: false, serviceProvider: '', notes: '',
};

function MaintenanceModal({ record, devices, onClose, onSaved }) {
  const isNew = !record?.id;
  const [form, setForm] = useState(record ? {
    ...EMPTY_FORM,
    deviceId: String(record.deviceId),
    type: record.type,
    scheduledDate: record.scheduledDate ? record.scheduledDate.slice(0, 10) : '',
    executedDate: record.executedDate ? record.executedDate.slice(0, 10) : '',
    duration: record.duration ?? '',
    description: record.description ?? '',
    partsReplaced: record.partsReplaced ?? '',
    consumablesUsed: record.consumablesUsed ?? '',
    result: record.result ?? '',
    cost: record.cost ?? '',
    externalService: record.externalService ?? false,
    serviceProvider: record.serviceProvider ?? '',
    notes: record.notes ?? '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deviceId) return toast.error('Selectați dispozitivul');
    if (!form.executedDate) return toast.error('Data execuției este obligatorie');
    if (!form.description.trim()) return toast.error('Descrierea este obligatorie');

    setLoading(true);
    try {
      const payload = {
        ...form,
        deviceId: parseInt(form.deviceId),
        duration: form.duration ? parseFloat(form.duration) : undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        scheduledDate: form.scheduledDate || undefined,
        externalService: Boolean(form.externalService),
      };

      if (isNew) {
        await api.post('/maintenance', payload);
        toast.success('Înregistrare adăugată cu succes');
      } else {
        await api.put(`/maintenance/${record.id}`, payload);
        toast.success('Înregistrare actualizată cu succes');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-fade-in z-50" onClick={onClose}>
      <div
        className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isNew ? 'Adaugă Înregistrare Mentenanță' : 'Editează Înregistrare'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label-base" htmlFor="m-device">Dispozitiv *</label>
            <select id="m-device" className="input-base w-full" value={form.deviceId} onChange={(e) => set('deviceId', e.target.value)} required>
              <option value="">— Selectați —</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.inventoryNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base" htmlFor="m-type">Tip *</label>
              <select id="m-type" className="input-base w-full" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base" htmlFor="m-duration">Durată (ore)</label>
              <input id="m-duration" type="number" step="0.5" min="0" className="input-base w-full" value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base" htmlFor="m-exec-date">Data Execuției *</label>
              <input id="m-exec-date" type="date" className="input-base w-full" value={form.executedDate} onChange={(e) => set('executedDate', e.target.value)} required />
            </div>
            <div>
              <label className="label-base" htmlFor="m-sched-date">Data Planificată</label>
              <input id="m-sched-date" type="date" className="input-base w-full" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="m-desc">Descriere *</label>
            <textarea id="m-desc" className="input-base w-full" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>

          <div>
            <label className="label-base" htmlFor="m-parts">Piese înlocuite</label>
            <input id="m-parts" className="input-base w-full" value={form.partsReplaced} onChange={(e) => set('partsReplaced', e.target.value)} />
          </div>

          <div>
            <label className="label-base" htmlFor="m-consumables">Consumabile folosite</label>
            <input id="m-consumables" className="input-base w-full" value={form.consumablesUsed} onChange={(e) => set('consumablesUsed', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base" htmlFor="m-result">Rezultat</label>
              <input id="m-result" className="input-base w-full" value={form.result} onChange={(e) => set('result', e.target.value)} />
            </div>
            <div>
              <label className="label-base" htmlFor="m-cost">Cost (MDL)</label>
              <input id="m-cost" type="number" step="0.01" min="0" className="input-base w-full" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="m-external"
              type="checkbox"
              checked={form.externalService}
              onChange={(e) => set('externalService', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="m-external" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Serviciu extern</label>
          </div>

          {form.externalService && (
            <div>
              <label className="label-base" htmlFor="m-provider">Furnizor serviciu</label>
              <input id="m-provider" className="input-base w-full" value={form.serviceProvider} onChange={(e) => set('serviceProvider', e.target.value)} />
            </div>
          )}

          <div>
            <label className="label-base" htmlFor="m-notes">Note</label>
            <textarea id="m-notes" className="input-base w-full" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Se salvează...' : isNew ? 'Adaugă' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState(null); // null | { record: null } | { record: {...} }
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance?limit=500');
      return res.data;
    },
    staleTime: 60_000,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices-dropdown'],
    queryFn: async () => {
      const res = await api.get('/devices?limit=500&includeCasat=false');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  const devices = devicesData?.devices ?? [];
  const records = data?.data ?? [];

  const filtered = useMemo(() => {
    if (!filterType) return records;
    return records.filter((r) => r.type === filterType);
  }, [records, filterType]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/maintenance/${id}`),
    onSuccess: () => {
      toast.success('Înregistrare ștearsă');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: () => toast.error('Eroare la ștergere'),
  });

  const onSaved = () => {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  };

  return (
    <section className="p-4 md:p-8" aria-label="Mentenanță">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Wrench size={24} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Mentenanță</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} înregistrări</p>
          </div>
        </div>
        <button onClick={() => setModal({ record: null })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Adaugă Înregistrare
        </button>
      </div>

      {/* Filtru tip */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => { setFilterType(''); setCurrentPage(1); }}
          className={filterType === '' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
        >
          Toate ({records.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
          <button
            key={k}
            onClick={() => { setFilterType(k); setCurrentPage(1); }}
            className={filterType === k ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {v.label} ({records.filter((r) => r.type === k).length})
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                {['Dispozitiv', 'Tip', 'Data Execuției', 'Data Planificată', 'Descriere', 'Cost', 'Serviciu Extern', 'Acțiuni'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="skeleton" style={{ height: '20px', borderRadius: '4px' }} />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {records.length === 0 ? 'Nu există înregistrări de mentenanță. Adăugați prima înregistrare.' : 'Nicio înregistrare pentru filtrul selectat.'}
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)' }} className="hover:opacity-80 transition-opacity">
                    <td className="px-4 py-3">
                      <div style={{ color: 'var(--color-text-primary)' }} className="font-medium">{r.devices?.name || '—'}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.devices?.inventoryNumber}</div>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={r.type} /></td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                      {new Date(r.executedDate).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('ro-RO') : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)', maxWidth: '200px' }}>
                      <span className="line-clamp-2">{r.description}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                      {r.cost ? `${parseFloat(r.cost).toLocaleString('ro-RO')} MDL` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.externalService ? (
                        <span style={{ color: 'var(--color-success)' }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ record: r })}
                          className="p-1.5 rounded hover:opacity-70"
                          style={{ color: 'var(--color-accent)' }}
                          aria-label="Editează"
                        >
                          <Edit2 size={14} />
                        </button>
                        {deleteId === r.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteMutation.mutate(r.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}>Confirm</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs px-2 py-1 rounded btn-secondary">Nu</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="p-1.5 rounded hover:opacity-70"
                            style={{ color: 'var(--color-error)' }}
                            aria-label="Șterge"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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
            Pagina {currentPage} din {totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary flex items-center gap-1 text-sm">
              <ChevronLeft size={14} /> Înapoi
            </button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary flex items-center gap-1 text-sm">
              Înainte <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {modal && (
        <MaintenanceModal
          record={modal.record}
          devices={devices}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}
