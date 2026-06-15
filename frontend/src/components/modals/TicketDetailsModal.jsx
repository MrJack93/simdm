import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

const STATUS_FLOW = {
  DESCHIS: ['IN_LUCRU', 'ESCALADAT'],
  IN_LUCRU: ['REZOLVAT', 'DESCHIS', 'ESCALADAT'],
  REZOLVAT: ['TESTAT', 'IN_LUCRU', 'ESCALADAT'],
  TESTAT: ['INCHIS', 'IN_LUCRU', 'ESCALADAT'],
  INCHIS: ['ESCALADAT'],
  ESCALADAT: ['IN_LUCRU', 'DESCHIS'],
};

const api = axios.create({ baseURL: '/api' });

export default function TicketDetailsModal({ ticket, onClose, onRefresh }) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState('');
  const validTransitions = STATUS_FLOW[ticket.status] || [];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await api.patch(`/repair-tickets/${ticket.id}/status`, { newStatus });
      return res.data;
    },
    onSuccess: () => { setSelectedStatus(''); onRefresh(); onClose(); },
    onError: (err) => setError(err.response?.data?.error || 'Eroare la actualizare'),
  });

  const downloadFormular8 = async () => {
    try {
      const res = await api.get(`/repair-tickets/${ticket.id}/formular8-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formular8-${ticket.ticketNumber}.pdf`;
      a.click();
    } catch { setError('Eroare la descărcare PDF'); }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.ticketNumber}</DialogTitle>
          <DialogDescription>Status: {ticket.status}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && <div role="alert" aria-live="assertive" className="alert-error">{error}</div>}

          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Dispozitiv Medical</h3>
            <p style={{ color: 'var(--color-text-primary)' }}>{ticket.device?.name}</p>
            {ticket.device?.serialNumber && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Serie: {ticket.device.serialNumber}</p>}
            {ticket.device?.inventoryNumber && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Inventar: {ticket.device.inventoryNumber}</p>}
          </div>

          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Prioritate</h3>
            <p style={{ color: 'var(--color-text-primary)' }}>{ticket.priority}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Data Raportării</h3>
            <p style={{ color: 'var(--color-text-primary)' }}>{new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Descriere Defecțiune</h3>
            <p className="p-3 rounded-lg text-sm" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-tertiary)' }}>{ticket.faultDescription}</p>
          </div>

          {ticket.faultCause && (
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Cauza Defecțiunii</h3>
              <p className="p-3 rounded-lg text-sm" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-tertiary)' }}>{ticket.faultCause}</p>
            </div>
          )}

          {ticket.externalized !== undefined && (
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Tip Reparație</h3>
              <p style={{ color: 'var(--color-text-primary)' }}>{ticket.externalized ? 'EXTERNĂ (Furnizor)' : 'INTERNĂ'}</p>
            </div>
          )}

          {ticket.actionsTaken && (
            <div>
              <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Acțiuni Întreprinse</h3>
              <p className="p-3 rounded-lg text-sm" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-tertiary)' }}>{ticket.actionsTaken}</p>
            </div>
          )}

          <div className="pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <h3 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Tranziție Status</h3>
            {validTransitions.length > 0 ? (
              <div className="space-y-3">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base">
                  <option value="">Selectează nouul status</option>
                  {validTransitions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => updateStatusMutation.mutate(selectedStatus)} disabled={!selectedStatus || updateStatusMutation.isPending} className="w-full btn-primary">
                  {updateStatusMutation.isPending ? 'Se actualizează...' : 'Actualizează Status'}
                </button>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nu sunt tranziții disponibile.</p>
            )}
          </div>

          {ticket.actionsTaken && (
            <div className="pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button onClick={downloadFormular8} className="w-full btn-primary">Descarcă Formular Nr. 8 (PDF)</button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="btn-secondary">Închide</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
