import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import SignatureCanvas from 'react-signature-canvas';

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
  const [newPart, setNewPart] = useState({
    description: '',
    qty: 1,
    costUnit: 0,
  });
  const [error, setError] = useState('');

  const engineerSigRef = useRef();
  const managerSigRef = useRef();

  // Fetch consumables for parts selector
  const { data: consumablesData } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      const res = await api.get('/consumables');
      return res.data;
    },
  });

  const consumables = consumablesData?.consumables || [];

  const repairMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/repair-tickets/${ticket.id}/repair`, data);
      return res.data;
    },
    onSuccess: () => {
      onRefresh();
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Eroare la salvare reparație');
    },
  });

  const handleAddPart = () => {
    if (!newPart.description || !newPart.qty) {
      setError('Completați descrierea și cantitatea piesei');
      return;
    }
    setPartsUsed([
      ...partsUsed,
      {
        id: Date.now(),
        description: newPart.description,
        qty: parseInt(newPart.qty),
        costUnit: parseFloat(newPart.costUnit) || 0,
      },
    ]);
    setNewPart({ description: '', qty: 1, costUnit: 0 });
    setError('');
  };

  const handleRemovePart = (id) => {
    setPartsUsed(partsUsed.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    setError('');

    if (!repairReport.trim()) {
      setError('Raportul de reparație este obligatoriu');
      return;
    }

    if (!actionsTaken.trim()) {
      setError('Acțiunile întreprinse sunt obligatorii');
      return;
    }

    if (!durationHours || isNaN(parseFloat(durationHours))) {
      setError('Durata trebuie să fie un număr valid');
      return;
    }

    if (!engineerName.trim()) {
      setError('Numele inginerului este obligatoriu');
      return;
    }

    // Get signatures
    const engineerSignature = engineerSigRef.current?.toDataURL();
    const managerSignature = managerSigRef.current?.toDataURL();

    if (!engineerSignature || engineerSigRef.current?.isEmpty?.()) {
      setError('Semnătura inginerului este obligatorie');
      return;
    }

    const submitData = {
      repairReport,
      actionsTaken,
      durationHours: parseFloat(durationHours),
      partsUsed,
      functionalTest,
      engineerName,
      engineerSignature,
      managerSignature: managerSignature && !managerSigRef.current?.isEmpty?.() ? managerSignature : null,
      beforePhoto: beforePhoto || null,
      afterPhoto: afterPhoto || null,
    };

    repairMutation.mutate(submitData);
  };

  const totalCost = partsUsed.reduce((sum, p) => sum + p.qty * p.costUnit, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-6">
        {/* Header */}
        <div className="bg-gray-50 border-b p-6 flex justify-between items-center sticky top-0">
          <h2 className="text-2xl font-bold text-gray-900">Formular de Reparație — {ticket.ticketNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Device Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-1">Dispozitiv Medical</h3>
            <p className="text-gray-700 font-semibold">{ticket.device?.name}</p>
            {ticket.device?.serialNumber && (
              <p className="text-sm text-gray-600">Serie: {ticket.device.serialNumber}</p>
            )}
          </div>

          {/* Fault Description & Cause */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Descriere Defecțiune</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">
                {ticket.faultDescription}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Cauza (din Triaj)</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">
                {ticket.faultCause || '(Nu a fost stabilit în triaj)'}
              </p>
            </div>
          </div>

          {/* Repair Report */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Raport de Reparație *
            </label>
            <textarea
              value={repairReport}
              onChange={(e) => setRepairReport(e.target.value)}
              placeholder="Descrieți procedurile de reparație..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions Taken */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Acțiuni Întreprinse *
            </label>
            <textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="Descrieți acțiunile concrete executate..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Durată (ore) *
            </label>
            <input
              type="number"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="Ex: 2.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Parts Used */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Piese Folosite</h3>

            {/* Add Part Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newPart.description}
                  onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                  placeholder="Descriere piesa"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  list="consumables-list"
                />
                <datalist id="consumables-list">
                  {consumables.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>

                <input
                  type="number"
                  min="1"
                  value={newPart.qty}
                  onChange={(e) => setNewPart({ ...newPart, qty: e.target.value })}
                  placeholder="Cantitate"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />

                <input
                  type="number"
                  step="0.01"
                  value={newPart.costUnit}
                  onChange={(e) => setNewPart({ ...newPart, costUnit: e.target.value })}
                  placeholder="Cost/buc"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleAddPart}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                + Adaugă Piesa
              </button>
            </div>

            {/* Parts List */}
            {partsUsed.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Descriere</th>
                      <th className="px-4 py-2 text-center w-20">Cantitate</th>
                      <th className="px-4 py-2 text-right w-24">Cost/buc</th>
                      <th className="px-4 py-2 text-right w-24">Total</th>
                      <th className="px-4 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsUsed.map((part) => (
                      <tr key={part.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{part.description}</td>
                        <td className="px-4 py-2 text-center">{part.qty}</td>
                        <td className="px-4 py-2 text-right">{part.costUnit.toFixed(2)} RON</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {(part.qty * part.costUnit).toFixed(2)} RON
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemovePart(part.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan="3" className="px-4 py-3 text-right">
                        Total Piese:
                      </td>
                      <td className="px-4 py-3 text-right">
                        {totalCost.toFixed(2)} RON
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Photo Documentation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Documentație Fotografie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Foto Inițială (Înainte)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setBeforePhoto(ev.target?.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {beforePhoto && (
                  <img src={beforePhoto} alt="Before" className="mt-2 w-full h-32 object-cover rounded" />
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Foto Finală (După)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setAfterPhoto(ev.target?.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {afterPhoto && (
                  <img src={afterPhoto} alt="After" className="mt-2 w-full h-32 object-cover rounded" />
                )}
              </div>
            </div>
          </div>

          {/* Functional Test */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Test Funcțional *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="functionalTest"
                  value="FUNCTIONAL"
                  checked={functionalTest === 'FUNCTIONAL'}
                  onChange={(e) => setFunctionalTest(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="font-medium text-green-700">Dispozitiv Funcțional ✓</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="functionalTest"
                  value="NEFUNCTIONAL"
                  checked={functionalTest === 'NEFUNCTIONAL'}
                  onChange={(e) => setFunctionalTest(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="font-medium text-red-700">Dispozitiv Nefuncțional ✗</span>
              </label>
            </div>
          </div>

          {/* Engineer Signature */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Ingineri Responsabil: {engineerName && `(${engineerName})`} *
            </label>
            <input
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              placeholder="Nume ingineri"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <SignatureCanvas
                ref={engineerSigRef}
                canvasProps={{
                  width: 500,
                  height: 150,
                  style: { display: 'block', margin: '0 auto' },
                }}
              />
            </div>
            <button
              onClick={() => engineerSigRef.current?.clear()}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Șterge Semnătura
            </button>
          </div>

          {/* Manager Signature (Optional) */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Manager/Supraveghetor: {managerName && `(${managerName})`} (opțional)
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Nume manager"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <SignatureCanvas
                ref={managerSigRef}
                canvasProps={{
                  width: 500,
                  height: 150,
                  style: { display: 'block', margin: '0 auto' },
                }}
              />
            </div>
            <button
              onClick={() => managerSigRef.current?.clear()}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Șterge Semnătura
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-6 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Anulează
          </button>
          <button
            onClick={handleSubmit}
            disabled={repairMutation.isPending}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {repairMutation.isPending ? 'Se salvează...' : 'Salvează Reparație'}
          </button>
        </div>
      </div>
    </div>
  );
}
