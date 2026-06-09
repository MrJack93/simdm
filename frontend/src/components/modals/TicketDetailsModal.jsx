import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const STATUS_FLOW = {
  DESCHIS: ['IN_LUCRU', 'ESCALADAT'],
  IN_LUCRU: ['REZOLVAT', 'DESCHIS', 'ESCALADAT'],
  REZOLVAT: ['TESTAT', 'IN_LUCRU', 'ESCALADAT'],
  TESTAT: ['INCHIS', 'IN_LUCRU', 'ESCALADAT'],
  INCHIS: ['ESCALADAT'],
  ESCALADAT: ['IN_LUCRU', 'DESCHIS'],
};

const api = axios.create({
  baseURL: '/api',
});

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
    onSuccess: () => {
      setSelectedStatus('');
      onRefresh();
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Eroare la actualizare');
    },
  });

  const handleStatusChange = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate(selectedStatus);
  };

  const downloadFormular8 = async () => {
    try {
      const res = await api.get(`/repair-tickets/${ticket.id}/formular8-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formular8-${ticket.ticketNumber}.pdf`;
      a.click();
    } catch (err) {
      setError('Eroare la descărcare PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ticket.ticketNumber}</h2>
            <p className="text-sm text-gray-600">Status: {ticket.status}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Device Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Dispozitiv Medical</h3>
            <p className="text-gray-700">{ticket.device?.name}</p>
            {ticket.device?.serialNumber && (
              <p className="text-sm text-gray-600">Serie: {ticket.device.serialNumber}</p>
            )}
            {ticket.device?.inventoryNumber && (
              <p className="text-sm text-gray-600">Inventar: {ticket.device.inventoryNumber}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Prioritate</h3>
            <p className="text-gray-700">{ticket.priority}</p>
          </div>

          {/* Reported Date */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Data Raportării</h3>
            <p className="text-gray-700">
              {new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}
            </p>
          </div>

          {/* Fault Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descriere Defecțiune</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">
              {ticket.faultDescription}
            </p>
          </div>

          {/* Fault Cause (if triaged) */}
          {ticket.faultCause && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Cauza Defecțiunii</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {ticket.faultCause}
              </p>
            </div>
          )}

          {/* Repair Type */}
          {ticket.externalized !== undefined && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tip Reparație</h3>
              <p className="text-gray-700">
                {ticket.externalized ? 'EXTERNĂ (Furnizor)' : 'INTERNĂ'}
              </p>
            </div>
          )}

          {/* Actions Taken (if available) */}
          {ticket.actionsTaken && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Acțiuni Întreprinse</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {ticket.actionsTaken}
              </p>
            </div>
          )}

          {/* Status Transition */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tranziție Status</h3>
            {validTransitions.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selectează nouul status</option>
                  {validTransitions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={!selectedStatus || updateStatusMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateStatusMutation.isPending ? 'Se actualizează...' : 'Actualizează Status'}
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Nu sunt tranziții disponibile pentru acest status.</p>
            )}
          </div>

          {/* Download Formular */}
          {ticket.actionsTaken && (
            <div className="border-t pt-6">
              <button
                onClick={downloadFormular8}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Descarcă Formular Nr. 8 (PDF)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
