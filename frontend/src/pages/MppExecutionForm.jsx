import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from '../api/axios';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';
import { Field, FieldLabel, FieldDescription, FieldError } from '../components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupText } from '../components/ui/input-group';
import { Button } from '../components/ui/button';
import { User, Clock, Hash } from 'lucide-react';

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
  const [fieldErrors, setFieldErrors] = useState({});

  // Signature canvases
  const signaturePadEngineerRef = useRef(null);
  const signaturePadManagerRef = useRef(null);

  // Queries
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await axios.get('/devices');
      return res.data;
    },
  });

  const { data: calendarData } = useQuery({
    queryKey: ['maintenance-calendar', new Date().getFullYear()],
    queryFn: async () => {
      const res = await axios.get(
        `/maintenance-plans/calendar?year=${new Date().getFullYear()}`
      );
      return res.data;
    },
  });

  const { data: checklistData } = useQuery({
    queryKey: ['checklist-template', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      const res = await axios.get(
        `/mpp-executions/checklist-template/${selectedDeviceId}`
      );
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  const { data: consumablesData } = useQuery({
    queryKey: ['consumables-dropdown'],
    queryFn: async () => {
      const res = await axios.get('/consumables/dropdown');
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
    const errors = {};
    if (!selectedDeviceId) {
      errors.device = 'Selectează dispozitivul';
    }
    if (!executedDate) {
      errors.date = 'Selectează data execuției';
    }
    if (!engineerName.trim()) {
      errors.engineer = 'Introdu numele inginerului';
    }
    if (checklist.length === 0) {
      errors.checklist = 'Checklist-ul este gol';
    } else if (!checklist.some((item) => item.bifat)) {
      errors.checklist = 'Cel puțin o operațiune trebuie bifată';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('');
      return false;
    }
    setFieldErrors({});
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

      const res = await axios.post('/mpp-executions', payload);
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
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    await submitMutation.mutateAsync();
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--healthcare-primary)' }}>Formular Execuție MPP</h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
          Înregistrați rezultatele mentenanței preventive și consumabilele utilizate conform procedurilor
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="p-4 mb-4 rounded-xl text-sm font-medium border" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="p-4 mb-4 rounded-xl text-sm font-medium border" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device & Occurrence Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <Field>
            <FieldLabel htmlFor="mpp-device" required>Dispozitiv</FieldLabel>
            <select
              id="mpp-device"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                setSelectedOccurrenceId('');
                setChecklist([]);
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
              required
            >
              <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează dispozitiv --</option>
              {devicesData?.devices?.map((device) => (
                <option key={device.id} value={device.id} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                  {device.name} ({device.inventoryNumber})
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="mpp-occurrence">Ocurență (opțional)</FieldLabel>
            <select
              id="mpp-occurrence"
              value={selectedOccurrenceId}
              onChange={(e) => setSelectedOccurrenceId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
              disabled={!selectedDeviceId}
            >
              <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Fără ocurență --</option>
              {deviceOccurrences.map((occ) => (
                <option key={occ.id} value={occ.id} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                  {new Date(occ.rescheduledTo || occ.scheduledDate).toLocaleDateString('ro-RO')} ({occ.status})
                </option>
              ))}
            </select>
            <FieldDescription>Selectează o ocurență programată</FieldDescription>
          </Field>
        </div>

        {/* Execution Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <Field>
            <FieldLabel htmlFor="mpp-date" required>Data execuției</FieldLabel>
            <input
              id="mpp-date"
              type="date"
              value={executedDate}
              onChange={(e) => setExecutedDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
              required
            />
            <FieldError>{fieldErrors.date}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="mpp-duration">Durată (minute)</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="start">
                <Clock size={16} />
              </InputGroupAddon>
              <InputGroupInput
                id="mpp-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                min="1"
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="mpp-result" required>Rezultat</FieldLabel>
            <select
              id="mpp-result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            >
              <option value="FUNCTIONAL" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>✅ Funcțional</option>
              <option value="DEFECT" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>❌ Defect</option>
            </select>
          </Field>
        </div>

        {/* Engineer Name */}
        <div className="p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <label htmlFor="mpp-engineer" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Inginer responsabil *</label>
          <InputGroup>
            <InputGroupAddon align="start">
              <User size={16} />
            </InputGroupAddon>
            <InputGroupInput
              id="mpp-engineer"
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              placeholder="Ing. Ion Popescu"
              required
            />
          </InputGroup>
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Checklist Operații</h2>
            <div className="space-y-4">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <input
                    id={`mpp-check-${idx}`}
                    type="checkbox"
                    checked={item.bifat}
                    onChange={(e) =>
                      handleChecklistUpdate(idx, 'bifat', e.target.checked)
                    }
                    className="mt-1.5 cursor-pointer accent-[var(--color-accent)]"
                  />
                  <div className="flex-1">
                    <label htmlFor={`mpp-check-${idx}`} className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {item.operatiune}
                    </label>
                    <textarea
                      value={item.nota}
                      onChange={(e) =>
                        handleChecklistUpdate(idx, 'nota', e.target.value)
                      }
                      placeholder="Notă (opțional)"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 h-16"
                      style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumables */}
        <div className="p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Consumabile Utilizate</h2>
          {consumablesUsed.length > 0 && (
            <div className="space-y-3 mb-4">
              {consumablesUsed.map((item, idx) => (
                <div key={idx} className="flex gap-2 flex-wrap md:flex-nowrap">
                  <select
                    value={item.consumableId}
                    onChange={(e) =>
                      handleUpdateConsumable(idx, 'consumableId', e.target.value)
                    }
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
                    style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează consumabil --</option>
                    {consumablesData?.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <InputGroup className="w-24">
                    <InputGroupInput
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleUpdateConsumable(idx, 'qty', e.target.value)
                      }
                      placeholder="Cantitate"
                      aria-label="Cantitate consumabil"
                      min="1"
                    />
                    <InputGroupAddon align="end">
                      <Hash size={14} />
                    </InputGroupAddon>
                  </InputGroup>
                  <button
                    type="button"
                    onClick={() => handleRemoveConsumable(idx)}
                    className="px-3 py-2 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 text-xs font-semibold cursor-pointer"
                    style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', backgroundColor: 'transparent' }}
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
            className="px-4 py-2 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 text-sm font-semibold flex items-center gap-2 cursor-pointer"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'transparent' }}
          >
            + Adaugă consumabil
          </button>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div>
            <label htmlFor="mpp-photo-before" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Foto înainte</label>
            <input
              id="mpp-photo-before"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, setPhotoBefore)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            />
            {photoBefore && (
              <img
                src={photoBefore}
                alt="Foto înainte de reparație"
                className="mt-3 w-full h-40 object-cover rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              />
            )}
          </div>

          <div>
            <label htmlFor="mpp-photo-after" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Foto după</label>
            <input
              id="mpp-photo-after"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, setPhotoAfter)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
              style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            />
            {photoAfter && (
              <img
                src={photoAfter}
                alt="Foto după reparație"
                className="mt-3 w-full h-40 object-cover rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              />
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Semnătură Inginer *</label>
            <div className="border rounded-lg bg-[var(--color-bg-primary)] overflow-hidden transition-all duration-150" style={{ borderColor: 'var(--color-border)' }} aria-label="Zonă semnătură inginer">
              <SignatureCanvas
                ref={signaturePadEngineerRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'w-full rounded-lg',
                }}
              />
            </div>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => signaturePadEngineerRef.current?.clear()}
              className="mt-2"
              aria-label="Șterge semnătura inginerului"
            >
              Șterge semnătură
            </Button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Semnătură Responsabil Secție
            </label>
            <div className="border rounded-lg bg-[var(--color-bg-primary)] overflow-hidden transition-all duration-150" style={{ borderColor: 'var(--color-border)' }} aria-label="Zonă semnătură responsabil secție">
              <SignatureCanvas
                ref={signaturePadManagerRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'w-full rounded-lg',
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => signaturePadManagerRef.current?.clear()}
              className="mt-2"
              aria-label="Șterge semnătura responsabilului"
            >
              Șterge semnătură
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="p-5 rounded-xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <label htmlFor="mpp-notes" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Observații generale</label>
          <textarea
            id="mpp-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observații sau comentarii (opțional)"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 h-24"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-150 font-bold text-sm cursor-pointer flex items-center justify-center gap-2 text-white"
            style={{ backgroundColor: 'var(--healthcare-success)' }}
          >
            {loading ? 'Se salvează...' : '💾 Salvează Execuție MPP'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance/calendar')}
            className="flex-1 py-2.5 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 font-semibold text-sm cursor-pointer flex items-center justify-center"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)' }}
          >
            Anulează
          </button>
        </div>

        {/* Defect Warning */}
        {result === 'DEFECT' && (
          <div className="border-l-4 p-4 rounded-r-xl transition-all duration-150" style={{ backgroundColor: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)' }}>
            <p className="font-semibold" style={{ color: 'var(--color-warning)' }}>
              ⚠️ Atenție: Defect detectat!
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              După salvare, vei fi redirecționat pentru a deschide un tichet de reparație.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
