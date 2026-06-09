import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';

export default function MppExecutionForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState('');
  const [executedDate, setExecutedDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [result, setResult] = useState('FUNCTIONAL');
  const [engineerName, setEngineerName] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [consumablesUsed, setConsumablesUsed] = useState([]);
  const [photoBefore, setPhotoBefore] = useState(null);
  const [photoAfter, setPhotoAfter] = useState(null);

  // Signature canvases
  const signaturePadEngineerRef = useRef(null);
  const signaturePadManagerRef = useRef(null);

  // Queries
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await axios.get('/api/devices');
      return res.data;
    },
  });

  const { data: calendarData } = useQuery({
    queryKey: ['maintenance-calendar', new Date().getFullYear()],
    queryFn: async () => {
      const res = await axios.get(
        `/api/maintenance-plans/calendar?year=${new Date().getFullYear()}`
      );
      return res.data;
    },
  });

  const { data: checklistData } = useQuery({
    queryKey: ['checklist-template', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      const res = await axios.get(
        `/api/mpp-executions/checklist-template/${selectedDeviceId}`
      );
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  const { data: consumablesData } = useQuery({
    queryKey: ['consumables-dropdown'],
    queryFn: async () => {
      const res = await axios.get('/api/consumables/dropdown');
      return res.data;
    },
  });

  // Initialize checklist when template loads
  useEffect(() => {
    if (checklistData?.checklist) {
      setChecklist(
        checklistData.checklist.map((item) => ({
          ...item,
          nota: item.nota || '',
        }))
      );
    }
  }, [checklistData]);

  // Get occurrences for selected device
  const deviceOccurrences = calendarData?.data?.filter(
    (occ) => occ.plan?.deviceId === parseInt(selectedDeviceId)
  ) || [];

  // Handle checklist item update
  const handleChecklistUpdate = (index, field, value) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value };
    setChecklist(updated);
  };

  // Handle consumable add
  const handleAddConsumable = () => {
    setConsumablesUsed([...consumablesUsed, { consumableId: '', qty: 1 }]);
  };

  // Handle consumable update
  const handleUpdateConsumable = (index, field, value) => {
    const updated = [...consumablesUsed];
    updated[index] = { ...updated[index], [field]: value };
    setConsumablesUsed(updated);
  };

  // Handle consumable remove
  const handleRemoveConsumable = (index) => {
    setConsumablesUsed(consumablesUsed.filter((_, i) => i !== index));
  };

  // Handle photo upload
  const handlePhotoUpload = (e, setPhoto) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Fișierul trebuie să fie o imagine');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError('Fișierul este prea mare (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert canvas to base64
  const getSignatureBase64 = (canvasRef) => {
    if (!canvasRef?.current) return null;
    const isEmpty = canvasRef.current.isEmpty();
    return isEmpty ? null : canvasRef.current.toDataURL('image/png');
  };

  // Form validation
  const validateForm = () => {
    if (!selectedDeviceId) {
      setError('Selectează dispozitivul');
      return false;
    }
    if (!executedDate) {
      setError('Selectează data execuției');
      return false;
    }
    if (!engineerName.trim()) {
      setError('Introdu numele inginerului');
      return false;
    }
    if (checklist.length === 0) {
      setError('Checklist-ul este gol');
      return false;
    }
    if (!checklist.some((item) => item.bifat)) {
      setError('Cel puțin o operațiune trebuie bifată');
      return false;
    }
    return true;
  };

  // Submit form
  const submitMutation = useMutation({
    mutationFn: async () => {
      const signatureEngineer = getSignatureBase64(signaturePadEngineerRef);
      const signatureManager = getSignatureBase64(signaturePadManagerRef);

      const payload = {
        deviceId: parseInt(selectedDeviceId),
        occurrenceId: selectedOccurrenceId ? parseInt(selectedOccurrenceId) : undefined,
        executedDate: new Date(executedDate).toISOString(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        checklist,
        consumablesUsed:
          consumablesUsed.length > 0
            ? consumablesUsed.map((c) => ({
                consumableId: parseInt(c.consumableId),
                qty: parseInt(c.qty),
              }))
            : undefined,
        result,
        engineerName,
        notes: notes || undefined,
        signature: signatureEngineer, // Engineer signature in base64
        // photoBeforeBase64: photoBefore, // Optional: add to backend if needed
        // photoAfterBase64: photoAfter,
      };

      const res = await axios.post('/api/mpp-executions', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccess('Execuție MPP salvată cu succes!');
      if (data.defectDetected) {
        setTimeout(
          () => navigate('/maintenance/tickets?defect=true'),
          2000
        );
      } else {
        setTimeout(() => navigate('/maintenance/calendar'), 2000);
      }
    },
    onError: (err) => {
      setError(
        err.response?.data?.error ||
          'Eroare la salvarea execuției'
      );
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    await submitMutation.mutateAsync();
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Formular Execuție MPP</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device & Occurrence Selection */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block font-semibold mb-2">Dispozitiv *</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                setSelectedOccurrenceId('');
                setChecklist([]);
              }}
              className="border w-full px-3 py-2 rounded"
              required
            >
              <option value="">-- Selectează dispozitiv --</option>
              {devicesData?.devices?.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.inventoryNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">Ocurență (opțional)</label>
            <select
              value={selectedOccurrenceId}
              onChange={(e) => setSelectedOccurrenceId(e.target.value)}
              className="border w-full px-3 py-2 rounded"
              disabled={!selectedDeviceId}
            >
              <option value="">-- Fără ocurență --</option>
              {deviceOccurrences.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {new Date(occ.scheduledDate).toLocaleDateString('ro-RO')} (
                  {occ.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Execution Details */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block font-semibold mb-2">Data execuției *</label>
            <input
              type="date"
              value={executedDate}
              onChange={(e) => setExecutedDate(e.target.value)}
              className="border w-full px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Durată (minute)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="45"
              className="border w-full px-3 py-2 rounded"
              min="1"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Rezultat *</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="border w-full px-3 py-2 rounded bg-white"
            >
              <option value="FUNCTIONAL">✅ Funcțional</option>
              <option value="DEFECT">❌ Defect</option>
            </select>
          </div>
        </div>

        {/* Engineer Name */}
        <div className="bg-gray-50 p-4 rounded">
          <label className="block font-semibold mb-2">Inginer responsabil *</label>
          <input
            type="text"
            value={engineerName}
            onChange={(e) => setEngineerName(e.target.value)}
            placeholder="Ing. Ion Popescu"
            className="border w-full px-3 py-2 rounded"
            required
          />
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-4">Checklist Operații</h2>
            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b pb-3">
                  <input
                    type="checkbox"
                    checked={item.bifat}
                    onChange={(e) =>
                      handleChecklistUpdate(idx, 'bifat', e.target.checked)
                    }
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <label className="block font-semibold text-sm">
                      {item.operatiune}
                    </label>
                    <textarea
                      value={item.nota}
                      onChange={(e) =>
                        handleChecklistUpdate(idx, 'nota', e.target.value)
                      }
                      placeholder="Notă (opțional)"
                      className="border w-full px-2 py-1 rounded text-sm mt-1 h-12"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumables */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Consumabile Utilizate</h2>
          {consumablesUsed.length > 0 && (
            <div className="space-y-2 mb-3">
              {consumablesUsed.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={item.consumableId}
                    onChange={(e) =>
                      handleUpdateConsumable(idx, 'consumableId', e.target.value)
                    }
                    className="flex-1 border px-2 py-1 rounded text-sm"
                  >
                    <option value="">-- Selectează consumabil --</option>
                    {consumablesData?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      handleUpdateConsumable(idx, 'qty', e.target.value)
                    }
                    placeholder="Cantitate"
                    className="w-20 border px-2 py-1 rounded text-sm"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveConsumable(idx)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleAddConsumable}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            + Adaugă consumabil
          </button>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block font-semibold mb-2">Foto înainte</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, setPhotoBefore)}
              className="border w-full px-2 py-1 rounded text-sm"
            />
            {photoBefore && (
              <img
                src={photoBefore}
                alt="Before"
                className="mt-2 w-full h-32 object-cover rounded"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">Foto după</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, setPhotoAfter)}
              className="border w-full px-2 py-1 rounded text-sm"
            />
            {photoAfter && (
              <img
                src={photoAfter}
                alt="After"
                className="mt-2 w-full h-32 object-cover rounded"
              />
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block font-semibold mb-2">Semnătură Inginer *</label>
            <div className="border-2 border-dashed bg-white rounded">
              <SignatureCanvas
                ref={signaturePadEngineerRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'w-full rounded',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => signaturePadEngineerRef.current?.clear()}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Șterge semnătură
            </button>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Semnătură Responsabil Secție
            </label>
            <div className="border-2 border-dashed bg-white rounded">
              <SignatureCanvas
                ref={signaturePadManagerRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'w-full rounded',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => signaturePadManagerRef.current?.clear()}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Șterge semnătură
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 p-4 rounded">
          <label className="block font-semibold mb-2">Observații generale</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observații sau comentarii (opțional)"
            className="border w-full px-3 py-2 rounded h-24"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Se salvează...' : '💾 Salvează Execuție MPP'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance/calendar')}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Anulează
          </button>
        </div>

        {/* Defect Warning */}
        {result === 'DEFECT' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700 font-semibold">
              ⚠️ Atenție: Defect detectat!
            </p>
            <p className="text-yellow-600 text-sm">
              După salvare, vei fi redirecționat pentru a deschide un tichet de
              reparație.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
