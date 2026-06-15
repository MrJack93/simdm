import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

export default function TriageModal({ ticket, onClose, onRefresh }) {
  const [repairType, setRepairType] = useState('INTERN');
  const [defectCause, setDefectCause] = useState('');
  const [externalProviderId, setExternalProviderId] = useState('');
  const [error, setError] = useState('');
  const [providers] = useState([]);

  const triageMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch(`/repair-tickets/${ticket.id}/triage`, data);
      return res.data;
    },
    onSuccess: () => { onRefresh(); onClose(); },
    onError: (err) => setError(err.response?.data?.error || 'Eroare la triaj'),
  });

  const handleSubmit = () => {
    if (!defectCause.trim()) { setError('Cauza defecțiunii este obligatorie'); return; }
    triageMutation.mutate({ repairType, defectCause, externalProviderId: repairType === 'EXTERN' ? externalProviderId : null });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Triaj — {ticket.ticketNumber}</DialogTitle>
          <DialogDescription>Completează informațiile de triaj pentru tichetul de reparație.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && <div role="alert" className="alert-error">{error}</div>}

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info-bg)', border: '1px solid var(--color-info)' }}>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Dispozitiv Medical</h3>
            <p style={{ color: 'var(--color-text-primary)' }}>{ticket.device?.name}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Defecțiune: {ticket.faultDescription}</p>
          </div>

          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Tip Reparație</h3>
            <div className="space-y-3">
              {['INTERN', 'EXTERN'].map((type) => (
                <label key={type} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ border: `1px solid ${repairType === type ? 'var(--color-accent)' : 'var(--color-border)'}`, backgroundColor: repairType === type ? 'var(--color-accent-subtle)' : 'transparent' }}>
                  <input type="radio" name="repairType" value={type} checked={repairType === type} onChange={(e) => setRepairType(e.target.value)} className="w-4 h-4" />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{type === 'INTERN' ? 'Reparație Internă' : 'Reparație Externă'}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{type === 'INTERN' ? 'Se efectuează la spital' : 'Se trimite la furnizor'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {repairType === 'EXTERN' && (
            <div>
              <label htmlFor="triage-provider" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Furnizor Service</label>
              <select id="triage-provider" value={externalProviderId} onChange={(e) => setExternalProviderId(e.target.value)} className="input-base">
                <option value="">Selectează furnizor...</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Furnizorii vor fi adăugați în Modulul 5</p>
            </div>
          )}

          <div>
            <label htmlFor="triage-cause" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Cauza Defecțiunii *</label>
            <textarea id="triage-cause" value={defectCause} onChange={(e) => setDefectCause(e.target.value)} placeholder="Descrieți cauza defecțiunii..." className="input-base h-24 resize-none" />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{defectCause.length} caractere</p>
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="btn-secondary">Anulează</button>
          <button onClick={handleSubmit} disabled={!defectCause.trim() || triageMutation.isPending} className="btn-primary">
            {triageMutation.isPending ? 'Se salvează...' : 'Salvează Triaj'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
