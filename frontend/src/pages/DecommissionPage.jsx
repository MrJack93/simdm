import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Archive, Upload, Download, Trash2, Search, Plus, X } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { Field, FieldLabel, FieldError } from '../components/ui/field';
import { useQuery } from '@tanstack/react-query';
import { useDevices } from '../hooks/useDevices';

const TYPE_LABELS = { DEFECTARE: 'Defectare', CONSERVARE: 'Conservare', CASARE: 'Casare' };
const TYPE_COLORS = {
  DEFECTARE: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  CONSERVARE: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
  CASARE: { bg: 'var(--color-error-bg)', text: 'var(--color-error)' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DecommissionModal({ onClose, onSave, devices }) {
  const [deviceId, setDeviceId] = useState('');
  const [type, setType] = useState('CASARE');
  const [cause, setCause] = useState('');
  const [technicalState, setTechnicalState] = useState('');
  const [notes, setNotes] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceId) { toast.error('Selectează un dispozitiv'); return; }
    setLoading(true);
    try {
      await api.post('/decommission', { deviceId: parseInt(deviceId), type, cause, technicalState, notes, responsibleName });
      toast.success('Înregistrare creată cu succes');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Eroare la creare');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="decom-title">
      <div className="rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="decom-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Casare / Conservare DM</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="decom-device" required>Dispozitiv</FieldLabel>
            <select id="decom-device" value={deviceId} onChange={e => setDeviceId(e.target.value)} className="input-base w-full">
              <option value="">— Selectează DM —</option>
              {(devices || []).map(d => <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel>Tip operațiune</FieldLabel>
            <div className="flex gap-3">
              {['CASARE', 'CONSERVARE', 'DEFECTARE'].map(t => (
                <label key={t} className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="decomType" value={t} checked={type === t} onChange={() => setType(t)} />
                  <span style={{ color: 'var(--color-text-primary)' }}>{TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="decom-tech">Stare tehnică</FieldLabel>
            <textarea id="decom-tech" value={technicalState} onChange={e => setTechnicalState(e.target.value)} className="input-base w-full" rows={2} placeholder="Descrierea stării tehnice" />
          </Field>
          <Field>
            <FieldLabel htmlFor="decom-cause">Cauza</FieldLabel>
            <textarea id="decom-cause" value={cause} onChange={e => setCause(e.target.value)} className="input-base w-full" rows={2} placeholder="Cauza neutilizării" />
          </Field>
          <Field>
            <FieldLabel htmlFor="decom-notes">Note</FieldLabel>
            <textarea id="decom-notes" value={notes} onChange={e => setNotes(e.target.value)} className="input-base w-full" rows={2} />
          </Field>
          <Field>
            <FieldLabel htmlFor="decom-resp">Persoană responsabilă</FieldLabel>
            <input id="decom-resp" type="text" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} className="input-base w-full" />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Se salvează...' : 'Înregistrează'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DecommissionPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['decommission'],
    queryFn: async () => { const { data } = await api.get('/decommission'); return data; },
  });

  const { data: devicesData } = useDevices();
  const devices = devicesData?.devices || [];
  const records = data?.data || [];

  const handleDownloadPdf = async (id) => {
    try {
      const response = await api.get(`/decommission/${id}/formular10-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Formular_10_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Eroare la descărcare PDF'); }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>Casare & Conservare</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Procedura MDM Nr. 10 — Formular Nr. 10</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Înregistrează Casare</button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} lines={2} variant="card" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <Archive size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Nicio înregistrare de casare</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Înregistrează prima operațiune de casare/conservare</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Dispozitiv</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tip</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Data</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Cauza</th>
                <th className="text-right py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                const tc = TYPE_COLORS[rec.type] || TYPE_COLORS.CASARE;
                return (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="py-3 px-3">
                      <span style={{ color: 'var(--color-text-primary)' }}>{rec.device?.inventoryNumber} — {rec.device?.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: tc.bg, color: tc.text }}>{TYPE_LABELS[rec.type]}</span>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(rec.createdAt)}</td>
                    <td className="py-3 px-3 hidden lg:table-cell truncate max-w-[200px]" style={{ color: 'var(--color-text-secondary)' }}>{rec.cause || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownloadPdf(rec.id)} className="p-2 rounded hover:opacity-70 focusable" aria-label="Descarcă PDF" title="Formular Nr. 10" style={{ color: 'var(--color-text-secondary)' }}><Download size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <DecommissionModal devices={devices} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['decommission'] }); }} />}
    </div>
  );
}
