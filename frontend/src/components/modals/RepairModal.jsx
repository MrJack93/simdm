import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

export default function RepairModal({ ticket, onClose, onRefresh }) {
  const [repairReport, setRepairReport] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [partsUsed, setPartsUsed] = useState([]);
  const [functionalTest, setFunctionalTest] = useState('FUNCTIONAL');
  const [engineerName, setEngineerName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [newPart, setNewPart] = useState({ description: '', qty: 1, costUnit: 0 });
  const [error, setError] = useState('');

  const engineerSigRef = useRef();
  const managerSigRef = useRef();

  const { data: consumablesData } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => (await api.get('/consumables')).data,
  });
  const consumables = consumablesData?.consumables || [];

  const repairMutation = useMutation({
    mutationFn: async (data) => (await api.put(`/repair-tickets/${ticket.id}/repair`, data)).data,
    onSuccess: () => { onRefresh(); onClose(); },
    onError: (err) => setError(err.response?.data?.error || 'Eroare la salvare reparație'),
  });

  const handleAddPart = () => {
    if (!newPart.description || !newPart.qty) { setError('Completați descrierea și cantitatea'); return; }
    setPartsUsed([...partsUsed, { id: Date.now(), description: newPart.description, qty: parseInt(newPart.qty), costUnit: parseFloat(newPart.costUnit) || 0 }]);
    setNewPart({ description: '', qty: 1, costUnit: 0 });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!repairReport.trim()) { setError('Raportul de reparație este obligatoriu'); return; }
    if (!actionsTaken.trim()) { setError('Acțiunile întreprinse sunt obligatorii'); return; }
    if (!durationHours || isNaN(parseFloat(durationHours))) { setError('Durata trebuie să fie un număr valid'); return; }
    if (!engineerName.trim()) { setError('Numele inginerului este obligatoriu'); return; }
    const engSig = engineerSigRef.current?.toDataURL();
    if (!engSig || engineerSigRef.current?.isEmpty?.()) { setError('Semnătura inginerului este obligatorie'); return; }
    const mgrSig = managerSigRef.current?.toDataURL();
    repairMutation.mutate({ repairReport, actionsTaken, durationHours: parseFloat(durationHours), partsUsed, functionalTest, engineerName, engineerSignature: engSig, managerSignature: mgrSig && !managerSigRef.current?.isEmpty?.() ? mgrSig : null, beforePhoto, afterPhoto });
  };

  const totalCost = partsUsed.reduce((sum, p) => sum + p.qty * p.costUnit, 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formular de Reparație — {ticket.ticketNumber}</DialogTitle>
          <DialogDescription>Completează detaliile reparației pentru acest tichet.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && <div role="alert" className="alert-error">{error}</div>}

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info-bg)', border: '1px solid var(--color-info)' }}>
            <h3 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Dispozitiv Medical</h3>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{ticket.device?.name}</p>
            {ticket.device?.serialNumber && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Serie: {ticket.device.serialNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Descriere Defecțiune</h3>
              <p className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>{ticket.faultDescription}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Cauza (din Triaj)</h3>
              <p className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>{ticket.faultCause || '(Nu a fost stabilit)'}</p>
            </div>
          </div>

          <div>
            <label htmlFor="repair-report" className="label-base">Raport de Reparație *</label>
            <textarea id="repair-report" value={repairReport} onChange={(e) => setRepairReport(e.target.value)} placeholder="Descrieți procedurile de reparație..." className="input-base h-24 resize-none" />
          </div>

          <div>
            <label htmlFor="repair-actions" className="label-base">Acțiuni Întreprinse *</label>
            <textarea id="repair-actions" value={actionsTaken} onChange={(e) => setActionsTaken(e.target.value)} placeholder="Descrieți acțiunile executate..." className="input-base h-24 resize-none" />
          </div>

          <div>
            <label htmlFor="repair-duration" className="label-base">Durată (ore) *</label>
            <input id="repair-duration" type="number" step="0.5" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} placeholder="Ex: 2.5" className="input-base" />
          </div>

          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Piese Folosite</h3>
            <div className="p-4 rounded-lg mb-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={newPart.description} onChange={(e) => setNewPart({ ...newPart, description: e.target.value })} placeholder="Descriere" className="input-base text-sm" list="consumables-list" />
                <datalist id="consumables-list">{consumables.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                <input type="number" min="1" value={newPart.qty} onChange={(e) => setNewPart({ ...newPart, qty: e.target.value })} placeholder="Cantitate" className="input-base text-sm" />
                <input type="number" step="0.01" value={newPart.costUnit} onChange={(e) => setNewPart({ ...newPart, costUnit: e.target.value })} placeholder="Cost/buc" className="input-base text-sm" />
              </div>
              <button onClick={handleAddPart} className="w-full btn-primary text-sm py-2">+ Adaugă Piesa</button>
            </div>

            {partsUsed.length > 0 && (
              <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--color-border)' }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Descriere</th>
                      <th className="px-4 py-2 text-center w-20 text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cant.</th>
                      <th className="px-4 py-2 text-right w-24 text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cost/buc</th>
                      <th className="px-4 py-2 text-right w-24 text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
                      <th className="px-4 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsUsed.map((part) => (
                      <tr key={part.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-2">{part.description}</td>
                        <td className="px-4 py-2 text-center">{part.qty}</td>
                        <td className="px-4 py-2 text-right">{part.costUnit.toFixed(2)} RON</td>
                        <td className="px-4 py-2 text-right font-medium">{(part.qty * part.costUnit).toFixed(2)} RON</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => setPartsUsed(partsUsed.filter((p) => p.id !== part.id))} className="font-medium hover:opacity-70" style={{ color: 'var(--color-error)' }} aria-label={`Șterge piesa ${part.description}`}>✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--color-bg-tertiary)', borderTop: '1px solid var(--color-border)' }}>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium">Total Piese:</td>
                      <td className="px-4 py-3 text-right font-medium">{totalCost.toFixed(2)} RON</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Documentație Fotografie</h3>
            <div className="grid grid-cols-2 gap-4">
              {[['beforePhoto', 'Foto Inițială', setBeforePhoto, beforePhoto, 'repair-photo-before'], ['afterPhoto', 'Foto Finală', setAfterPhoto, afterPhoto, 'repair-photo-after']].map(([key, label, setter, value, inputId]) => (
                <div key={key}>
                  <label htmlFor={inputId} className="label-base">{label}</label>
                  <input id={inputId} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setter(ev.target?.result); r.readAsDataURL(f); } }} className="input-base text-sm" />
                  {value && <img src={value} alt={label} className="mt-2 w-full h-32 object-cover rounded-lg" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label-base">Test Funcțional *</label>
            <div className="space-y-2">
              {[['FUNCTIONAL', 'Dispozitiv Funcțional ✓', 'var(--color-success)'], ['NEFUNCTIONAL', 'Dispozitiv Nefuncțional ✗', 'var(--color-error)']].map(([val, label, color]) => (
                <label key={val} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ border: `1px solid ${functionalTest === val ? color : 'var(--color-border)'}`, backgroundColor: functionalTest === val ? `color-mix(in srgb, ${color} 8%, transparent)` : 'transparent' }}>
                  <input type="radio" name="functionalTest" value={val} checked={functionalTest === val} onChange={(e) => setFunctionalTest(e.target.value)} className="w-4 h-4" />
                  <span className="font-medium" style={{ color }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="repair-engineer" className="label-base">Inginer Responsabil {engineerName && `(${engineerName})`} *</label>
            <input id="repair-engineer" type="text" value={engineerName} onChange={(e) => setEngineerName(e.target.value)} placeholder="Nume inginer" className="input-base mb-3" />
            <div className="rounded-lg overflow-hidden" style={{ border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <SignatureCanvas ref={engineerSigRef} canvasProps={{ width: 500, height: 150, style: { display: 'block', margin: '0 auto' } }} />
            </div>
            <button onClick={() => engineerSigRef.current?.clear()} className="mt-2 text-sm hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>Șterge Semnătura</button>
          </div>

          <div>
            <label htmlFor="repair-manager" className="label-base">Manager/Supraveghetor {managerName && `(${managerName})`} (opțional)</label>
            <input id="repair-manager" type="text" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Nume manager" className="input-base mb-3" />
            <div className="rounded-lg overflow-hidden" style={{ border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <SignatureCanvas ref={managerSigRef} canvasProps={{ width: 500, height: 150, style: { display: 'block', margin: '0 auto' } }} />
            </div>
            <button onClick={() => managerSigRef.current?.clear()} className="mt-2 text-sm hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>Șterge Semnătura</button>
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="btn-secondary">Anulează</button>
          <button onClick={handleSubmit} disabled={repairMutation.isPending} className="btn-primary">
            {repairMutation.isPending ? 'Se salvează...' : 'Salvează Reparație'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
