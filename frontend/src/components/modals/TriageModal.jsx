import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export default function TriageModal({ ticket, onClose, onRefresh }) {
  const [repairType, setRepairType] = useState('INTERN');
  const [defectCause, setDefectCause] = useState('');
  const [externalProviderId, setExternalProviderId] = useState('');
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]); // TODO: Fetch from API

  const triageMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch(`/repair-tickets/${ticket.id}/triage`, data);
      return res.data;
    },
    onSuccess: () => {
      onRefresh();
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Eroare la triaj');
    },
  });

  const handleSubmit = () => {
    if (!defectCause.trim()) {
      setError('Cauza defecțiunii este obligatorie');
      return;
    }

    triageMutation.mutate({
      repairType,
      defectCause,
      externalProviderId: repairType === 'EXTERN' ? externalProviderId : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Triaj — {ticket.ticketNumber}</h2>
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Dispozitiv Medical</h3>
            <p className="text-gray-700">{ticket.device?.name}</p>
            <p className="text-sm text-gray-600">Defecțiune: {ticket.faultDescription}</p>
          </div>

          {/* Repair Type Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tip Reparație</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="repairType"
                  value="INTERN"
                  checked={repairType === 'INTERN'}
                  onChange={(e) => setRepairType(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-gray-900">Reparație Internă</p>
                  <p className="text-sm text-gray-600">Se efectuează la spital</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="repairType"
                  value="EXTERN"
                  checked={repairType === 'EXTERN'}
                  onChange={(e) => setRepairType(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-gray-900">Reparație Externă</p>
                  <p className="text-sm text-gray-600">Se trimite la furnizor</p>
                </div>
              </label>
            </div>
          </div>

          {/* External Provider (if EXTERN) */}
          {repairType === 'EXTERN' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Furnizor Service</h3>
              <select
                value={externalProviderId}
                onChange={(e) => setExternalProviderId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selectează furnizor...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Furnizori vor fi adaugați în Modulul 5 (Contracte Externe)
              </p>
            </div>
          )}

          {/* Defect Cause */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Cauza Defecțiunii *</h3>
            <textarea
              value={defectCause}
              onChange={(e) => setDefectCause(e.target.value)}
              placeholder="Descrieți cauza defecțiunii..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              {defectCause.length} caractere
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Anulează
          </button>
          <button
            onClick={handleSubmit}
            disabled={!defectCause.trim() || triageMutation.isPending}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
          >
            {triageMutation.isPending ? 'Se salvează...' : 'Salvează Triaj'}
          </button>
        </div>
      </div>
    </div>
  );
}
