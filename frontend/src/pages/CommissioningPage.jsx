import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { PackageCheck, Plus, Download, X, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Field, FieldLabel } from '../components/ui/field';
import { useDevices } from '../hooks/useDevices';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CommissionModal({ onClose, onSave, devices }) {
  const [deviceId, setDeviceId] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [conformityOk, setConformityOk] = useState(false);
  const [operationTestOk, setOperationTestOk] = useState(false);
  const [operationManual, setOperationManual] = useState(false);
  const [serviceManual, setServiceManual] = useState(false);
  const [trainingDone, setTrainingDone] = useState(false);
  const [commissionMembers, setCommissionMembers] = useState('');
  const [commissionDecision, setCommissionDecision] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceId) { toast.error('Selectează un dispozitiv'); return; }
    setLoading(true);
    try {
      await api.post('/commissioning', {
        deviceId: parseInt(deviceId),
        installDate: installDate || undefined,
        warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : undefined,
        contractNo: contractNo || undefined,
        conformityOk, operationTestOk, operationManual, serviceManual, trainingDone,
        commissionMembers: commissionMembers || undefined,
        commissionDecision: commissionDecision || undefined,
        comments: comments || undefined,
      });
      toast.success('Dispozitiv dat în exploatare');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="comm-title">
      <div className="rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="comm-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Dă în Expluatare DM</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="comm-device" required>Dispozitiv</FieldLabel>
            <select id="comm-device" value={deviceId} onChange={e => setDeviceId(e.target.value)} className="input-base w-full">
              <option value="">— Selectează DM —</option>
              {(devices || []).map(d => <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="comm-install">Data instalării</FieldLabel>
              <input id="comm-install" type="date" value={installDate} onChange={e => setInstallDate(e.target.value)} className="input-base w-full" />
            </Field>
            <Field>
              <FieldLabel htmlFor="comm-warranty">Garanție (luni)</FieldLabel>
              <input id="comm-warranty" type="number" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} className="input-base w-full" min="0" />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="comm-contract">Nr. contract</FieldLabel>
            <input id="comm-contract" type="text" value={contractNo} onChange={e => setContractNo(e.target.value)} className="input-base w-full" />
          </Field>

          <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Checklist (Formular Nr. 4)</h3>
            {[
              { label: 'Conformitate', val: conformityOk, set: setConformityOk },
              { label: 'Test operare', val: operationTestOk, set: setOperationTestOk },
              { label: 'Manual operare', val: operationManual, set: setOperationManual },
              { label: 'Manual deservire', val: serviceManual, set: setServiceManual },
              { label: 'Training', val: trainingDone, set: setTrainingDone },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
              </label>
            ))}
          </div>

          <Field>
            <FieldLabel htmlFor="comm-commission">Comisia</FieldLabel>
            <input id="comm-commission" type="text" value={commissionMembers} onChange={e => setCommissionMembers(e.target.value)} className="input-base w-full" placeholder="Componența comisiei" />
          </Field>
          <Field>
            <FieldLabel htmlFor="comm-decision">Decizia</FieldLabel>
            <input id="comm-decision" type="text" value={commissionDecision} onChange={e => setCommissionDecision(e.target.value)} className="input-base w-full" placeholder="Decizia comisiei" />
          </Field>
          <Field>
            <FieldLabel htmlFor="comm-comments">Observații</FieldLabel>
            <textarea id="comm-comments" value={comments} onChange={e => setComments(e.target.value)} className="input-base w-full" rows={2} />
          </Field>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Se salvează...' : 'Dă în exploatare'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CommissioningPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['commissioning'],
    queryFn: async () => { const { data } = await api.get('/commissioning'); return data; },
  });

  const { data: devicesData } = useDevices();
  const devices = devicesData?.devices || [];
  const records = data?.data || [];

  const downloadPdf = async (id, formular) => {
    try {
      const response = await api.get(`/commissioning/${id}/${formular}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formular}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Eroare PDF'); }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>Recepție & Dare în Expluatare</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Procedura MDM Nr. 3 — Formulare Nr. 3 & 4</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Dă în exploatare</button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} lines={2} variant="card" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <PackageCheck size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Nicio recepție înregistrată</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Dă primul dispozitiv în exploatare</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>DM</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Data instalare</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Garanție</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Conformitate</th>
                <th className="text-right py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-3 px-3" style={{ color: 'var(--color-text-primary)' }}>{rec.device?.inventoryNumber} — {rec.device?.name}</td>
                  <td className="py-3 px-3 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(rec.installDate)}</td>
                  <td className="py-3 px-3 hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{rec.warrantyMonths ? `${rec.warrantyMonths} luni` : '—'}</td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    {rec.conformityOk ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}><CheckCircle size={12} /> Conform</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => downloadPdf(rec.id, 'formular4-pdf')} className="p-2 rounded hover:opacity-70 focusable" aria-label="Formular 4" title="Formular Nr. 4" style={{ color: 'var(--color-text-secondary)' }}><Download size={16} /></button>
                      {rec.handoverActNo && (
                        <button onClick={() => downloadPdf(rec.id, 'formular3-pdf')} className="p-2 rounded hover:opacity-70 focusable" aria-label="Formular 3" title="Formular Nr. 3 — Act predare-primire" style={{ color: 'var(--color-text-secondary)' }}><Download size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CommissionModal devices={devices} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['commissioning'] }); }} />}
    </div>
  );
}
