import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AlertTriangle, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api/axios';

const ITEMS_PER_PAGE = 25;

const SEVERITY_CONFIG = {
  NEAR_MISS:   { label: 'Aproape-incident', color: 'var(--color-text-secondary)' },
  MINOR:       { label: 'Minor',            color: 'var(--color-warning)' },
  MODERAT:     { label: 'Moderat',          color: '#f97316' },
  GRAV:        { label: 'Grav',             color: 'var(--color-error)' },
  CRITIC:      { label: 'Critic',           color: '#7f1d1d' },
};

const STATUS_CONFIG = {
  DESCHIS:        { label: 'Deschis',         color: 'var(--color-accent)' },
  IN_LUCRU:       { label: 'În lucru',        color: 'var(--color-warning)' },
  REZOLVAT:       { label: 'Rezolvat',        color: 'var(--color-success)' },
  INCHIS:         { label: 'Închis',          color: 'var(--color-text-secondary)' },
  ESCALADAT_AMDM: { label: 'Escaladat AMDM', color: 'var(--color-error)' },
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || { label: severity, color: 'var(--color-text-secondary)' };
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'var(--color-text-secondary)' };
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

const EMPTY_FORM = {
  deviceId: '', occurredAt: '', description: '', severity: 'MINOR',
  patientAffected: false, patientHarm: '', rootCause: '',
  correctiveAction: '', preventiveAction: '',
  reportedToAmdm: false, amdmReportDate: '', amdmReportRef: '',
};

function IncidentModal({ incident, devices, onClose, onSaved }) {
  const isNew = !incident?.id;
  const [form, setForm] = useState(incident ? {
    ...EMPTY_FORM,
    deviceId: String(incident.deviceId),
    occurredAt: incident.occurredAt ? incident.occurredAt.slice(0, 16) : '',
    description: incident.description ?? '',
    severity: incident.severity ?? 'MINOR',
    patientAffected: incident.patientAffected ?? false,
    patientHarm: incident.patientHarm ?? '',
    rootCause: incident.rootCause ?? '',
    correctiveAction: incident.correctiveAction ?? '',
    preventiveAction: incident.preventiveAction ?? '',
    reportedToAmdm: incident.reportedToAmdm ?? false,
    amdmReportDate: incident.amdmReportDate ? incident.amdmReportDate.slice(0, 10) : '',
    amdmReportRef: incident.amdmReportRef ?? '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deviceId) return toast.error('Selectați dispozitivul');
    if (!form.occurredAt) return toast.error('Data incidentului este obligatorie');
    if (!form.description.trim()) return toast.error('Descrierea este obligatorie');

    setLoading(true);
    try {
      const payload = {
        ...form,
        deviceId: parseInt(form.deviceId),
        patientAffected: Boolean(form.patientAffected),
        reportedToAmdm: Boolean(form.reportedToAmdm),
        patientHarm: form.patientAffected ? form.patientHarm : undefined,
        amdmReportDate: form.reportedToAmdm ? form.amdmReportDate || undefined : undefined,
        amdmReportRef: form.reportedToAmdm ? form.amdmReportRef : undefined,
      };

      if (isNew) {
        await api.post('/incidents', payload);
        toast.success('Incident raportat cu succes');
      } else {
        await api.put(`/incidents/${incident.id}`, payload);
        toast.success('Incident actualizat cu succes');
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
            {isNew ? 'Raportează Incident' : 'Editează Incident'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label-base" htmlFor="i-device">Dispozitiv *</label>
            <select id="i-device" className="input-base w-full" value={form.deviceId} onChange={(e) => set('deviceId', e.target.value)} required>
              <option value="">— Selectați —</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.inventoryNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base" htmlFor="i-occurred">Data Incidentului *</label>
              <input id="i-occurred" type="datetime-local" className="input-base w-full" value={form.occurredAt} onChange={(e) => set('occurredAt', e.target.value)} required />
            </div>
            <div>
              <label className="label-base" htmlFor="i-severity">Severitate *</label>
              <select id="i-severity" className="input-base w-full" value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="i-desc">Descriere *</label>
            <textarea id="i-desc" className="input-base w-full" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>

          <div className="flex items-center gap-3">
            <input id="i-patient" type="checkbox" checked={form.patientAffected} onChange={(e) => set('patientAffected', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="i-patient" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Pacient afectat</label>
          </div>

          {form.patientAffected && (
            <div>
              <label className="label-base" htmlFor="i-harm">Descriere vătămare pacient</label>
              <textarea id="i-harm" className="input-base w-full" rows={2} value={form.patientHarm} onChange={(e) => set('patientHarm', e.target.value)} />
            </div>
          )}

          <div>
            <label className="label-base" htmlFor="i-cause">Cauza radăcină</label>
            <textarea id="i-cause" className="input-base w-full" rows={2} value={form.rootCause} onChange={(e) => set('rootCause', e.target.value)} />
          </div>

          <div>
            <label className="label-base" htmlFor="i-corrective">Acțiune corectivă</label>
            <textarea id="i-corrective" className="input-base w-full" rows={2} value={form.correctiveAction} onChange={(e) => set('correctiveAction', e.target.value)} />
          </div>

          <div>
            <label className="label-base" htmlFor="i-preventive">Acțiune preventivă</label>
            <textarea id="i-preventive" className="input-base w-full" rows={2} value={form.preventiveAction} onChange={(e) => set('preventiveAction', e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <input id="i-amdm" type="checkbox" checked={form.reportedToAmdm} onChange={(e) => set('reportedToAmdm', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="i-amdm" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Raportat la AMDM</label>
          </div>

          {form.reportedToAmdm && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base" htmlFor="i-amdm-date">Data raportului AMDM</label>
                <input id="i-amdm-date" type="date" className="input-base w-full" value={form.amdmReportDate} onChange={(e) => set('amdmReportDate', e.target.value)} />
              </div>
              <div>
                <label className="label-base" htmlFor="i-amdm-ref">Nr. referință AMDM</label>
                <input id="i-amdm-ref" className="input-base w-full" value={form.amdmReportRef} onChange={(e) => set('amdmReportRef', e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Se salvează...' : isNew ? 'Raportează' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusChanger({ incident, onChanged }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.put(`/incidents/${incident.id}`, {
        status: newStatus,
        ...(newStatus === 'REZOLVAT' || newStatus === 'INCHIS' ? { resolvedAt: new Date().toISOString() } : {}),
      });
      toast.success('Status actualizat');
      setOpen(false);
      onChanged();
    } catch {
      toast.error('Eroare la actualizarea statusului');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <StatusBadge status={incident.status} />
      <button
        onClick={() => setOpen(!open)}
        className="ml-1 text-xs px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
        aria-label="Schimbă status"
        disabled={loading}
      >
        ▼
      </button>
      {open && (
        <div
          className="absolute top-8 left-0 z-10 rounded-lg border shadow-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', minWidth: '160px' }}
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => handleChange(k)}
              disabled={k === incident.status}
              className="w-full text-left px-3 py-2 text-sm hover:opacity-70 transition-opacity disabled:opacity-40"
              style={{ color: v.color, display: 'block' }}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents?limit=500');
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
  const incidents = data?.data ?? [];

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (filterSeverity && i.severity !== filterSeverity) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      return true;
    });
  }, [incidents, filterSeverity, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/incidents/${id}`),
    onSuccess: () => {
      toast.success('Incident șters');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Eroare la ștergere'),
  });

  const onSaved = () => {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  };

  const onStatusChanged = () => queryClient.invalidateQueries({ queryKey: ['incidents'] });

  return (
    <section className="p-4 md:p-8" aria-label="Incidente">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Incidente</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} incidente</p>
          </div>
        </div>
        <button onClick={() => setModal({ incident: null })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Raportează Incident
        </button>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="label-base sr-only" htmlFor="f-severity">Severitate</label>
          <select id="f-severity" className="input-base" value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}>
            <option value="">Toate severitățile</option>
            {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-base sr-only" htmlFor="f-status">Status</label>
          <select id="f-status" className="input-base" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="">Toate statusurile</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                {['Dispozitiv', 'Severitate', 'Status', 'Data', 'Descriere', 'Pacient', 'AMDM', 'Acțiuni'].map((h) => (
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
                    {incidents.length === 0 ? 'Nu există incidente raportate. Adăugați primul incident.' : 'Niciun incident pentru filtrele selectate.'}
                  </td>
                </tr>
              ) : (
                paginated.map((inc) => (
                  <tr key={inc.id} style={{ borderTop: '1px solid var(--color-border)' }} className="hover:opacity-80 transition-opacity">
                    <td className="px-4 py-3">
                      <div style={{ color: 'var(--color-text-primary)' }} className="font-medium">{inc.devices?.name || '—'}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{inc.devices?.inventoryNumber}</div>
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-4 py-3">
                      <StatusChanger incident={inc} onChanged={onStatusChanged} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(inc.occurredAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)', maxWidth: '200px' }}>
                      <span className="line-clamp-2">{inc.description}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inc.patientAffected ? <span style={{ color: 'var(--color-error)' }} title={inc.patientHarm || 'Da'}>⚠️</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inc.reportedToAmdm ? <span style={{ color: 'var(--color-success)' }} title={inc.amdmReportRef || 'Da'}>✓</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal({ incident: inc })} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-accent)' }} aria-label="Editează"><Edit2 size={14} /></button>
                        {deleteId === inc.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteMutation.mutate(inc.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}>Confirm</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs px-2 py-1 rounded btn-secondary">Nu</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(inc.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-error)' }} aria-label="Șterge"><Trash2 size={14} /></button>
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
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pagina {currentPage} din {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary flex items-center gap-1 text-sm"><ChevronLeft size={14} /> Înapoi</button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary flex items-center gap-1 text-sm">Înainte <ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {modal && (
        <IncidentModal
          incident={modal.incident}
          devices={devices}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}
