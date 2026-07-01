import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { ClipboardList, Plus, Download, X, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Field, FieldLabel } from '../components/ui/field';
import { useDevices } from '../hooks/useDevices';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ReportModal({ onClose, onSave, devices }) {
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceName.trim() || !faultDescription.trim() || !reportedBy.trim()) {
      toast.error('Completează toate câmpurile obligatorii'); return;
    }
    setLoading(true);
    try {
      await api.post('/duty-log', { deviceName: deviceName.trim(), deviceId: deviceId ? parseInt(deviceId) : undefined, faultDescription: faultDescription.trim(), reportedBy: reportedBy.trim() });
      toast.success('Defecțiune raportată');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="duty-title">
      <div className="rounded-xl max-w-lg w-full p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="duty-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Raportează Defecțiune</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="duty-name" required>Denumire DM defectat</FieldLabel>
            <input id="duty-name" type="text" value={deviceName} onChange={e => setDeviceName(e.target.value)} className="input-base w-full" placeholder="ex. Ventilator Mecanic Nr1" />
          </Field>
          <Field>
            <FieldLabel htmlFor="duty-device">DM din inventar (opțional)</FieldLabel>
            <select id="duty-device" value={deviceId} onChange={e => setDeviceId(e.target.value)} className="input-base w-full">
              <option value="">— Fără —</option>
              {(devices || []).map(d => <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="duty-fault" required>Defectul</FieldLabel>
            <textarea id="duty-fault" value={faultDescription} onChange={e => setFaultDescription(e.target.value)} className="input-base w-full" rows={3} placeholder="Descrie defectul" />
          </Field>
          <Field>
            <FieldLabel htmlFor="duty-by" required>Responsabil gardă secție</FieldLabel>
            <input id="duty-by" type="text" value={reportedBy} onChange={e => setReportedBy(e.target.value)} className="input-base w-full" />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Se trimite...' : 'Raportează'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResolveModal({ entry, onClose, onSave }) {
  const [resolution, setResolution] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolution.trim() || !engineerName.trim()) { toast.error('Completează toate câmpurile'); return; }
    setLoading(true);
    try {
      await api.patch(`/duty-log/${entry.id}/resolve`, { resolution: resolution.trim(), engineerName: engineerName.trim() });
      toast.success('Defecțiune soluționată');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="resolve-title">
      <div className="rounded-xl max-w-lg w-full p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="resolve-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Soluționează</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>DM: {entry.deviceName} — {entry.faultDescription}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="res-sol" required>Soluționarea</FieldLabel>
            <textarea id="res-sol" value={resolution} onChange={e => setResolution(e.target.value)} className="input-base w-full" rows={3} />
          </Field>
          <Field>
            <FieldLabel htmlFor="res-eng" required>Nume inginer</FieldLabel>
            <input id="res-eng" type="text" value={engineerName} onChange={e => setEngineerName(e.target.value)} className="input-base w-full" />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Se salvează...' : 'Soluționează'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DutyLogPage() {
  const queryClient = useQueryClient();
  const [showReport, setShowReport] = useState(false);
  const [resolveEntry, setResolveEntry] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['duty-log'],
    queryFn: async () => { const { data } = await api.get('/duty-log'); return data; },
  });

  const { data: devicesData } = useDevices();
  const devices = devicesData?.devices || [];
  const entries = data?.data || [];

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['duty-log'] });

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get('/duty-log/formular11-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Formular_11_Jurnal_Garda.pdf');
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
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>Jurnal de Gardă</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Formular Nr. 11 — Raportare & soluționare defecțiuni</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPdf} className="btn-secondary flex items-center gap-2"><Download size={16} /> PDF</button>
          <button onClick={() => setShowReport(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Raportează</button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} lines={2} variant="card" />)}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Nicio înregistrare în jurnal</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Raportează prima defecțiune din gardă</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>DM</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Defectul</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Raportat de</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Data</th>
                <th className="text-left py-3 px-3 font-medium hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                <th className="text-right py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-3 px-3" style={{ color: 'var(--color-text-primary)' }}>{entry.deviceName}</td>
                  <td className="py-3 px-3 truncate max-w-[200px]" style={{ color: 'var(--color-text-primary)' }}>{entry.faultDescription}</td>
                  <td className="py-3 px-3 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{entry.reportedBy}</td>
                  <td className="py-3 px-3 hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(entry.reportedAt)}</td>
                  <td className="py-3 px-3 hidden xl:table-cell">
                    {entry.resolvedAt ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}><CheckCircle size={12} /> Rezolvat</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-warning)' }}><Clock size={12} /> Nerezolvat</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {!entry.resolvedAt && (
                      <button onClick={() => setResolveEntry(entry)} className="text-xs px-3 py-1.5 rounded font-medium focusable" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                        Soluționează
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showReport && <ReportModal devices={devices} onClose={() => setShowReport(false)} onSave={() => { setShowReport(false); invalidateAll(); }} />}
      {resolveEntry && <ResolveModal entry={resolveEntry} onClose={() => setResolveEntry(null)} onSave={() => { setResolveEntry(null); invalidateAll(); }} />}
    </div>
  );
}
