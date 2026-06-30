import { useState, useEffect, useRef } from 'react';

const FREQUENCIES = ['LUNAR', 'BIMESTRIAL', 'TRIMESTRIAL', 'SEMESTRIAL', 'ANUAL'];

export function CreatePlanModal({ devices, onClose, onCreate, year, isPending }) {
  const [deviceId, setDeviceId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleAffil, setResponsibleAffil] = useState('');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [formError, setFormError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';
    const focusable = modal.querySelectorAll(focusableSelector);
    if (focusable.length > 0) focusable[0].focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    setFormError('');
    if (!deviceId) {
      setFormError('Câmpul Dispozitiv este obligatoriu');
      return;
    }
    if (!frequency) {
      setFormError('Câmpul Frecvență este obligatoriu');
      return;
    }
    if (!responsibleName.trim()) {
      setFormError('Câmpul Responsabil este obligatoriu');
      return;
    }
    onCreate({ deviceId: parseInt(deviceId), frequency, year, responsibleName, responsibleAffil: responsibleAffil || undefined, preferredTime: preferredTime || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity" onClick={onClose} style={{ backgroundColor: 'var(--overlay-strong)' }}>
      <div ref={modalRef} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 w-full max-w-md shadow-2xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>Creare Plan Mentenanță — {year}</h2>

        <div className="mb-4">
          <label htmlFor="device-select" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Dispozitiv
          </label>
          <select
            id="device-select"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează dispozitiv --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="freq-select" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Frecvență
          </label>
          <select
            id="freq-select"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează frecvență --</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="time-input" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Ora preferată <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'normal' }} className="text-xs">(opțional)</span>
          </label>
          <input
            id="time-input"
            type="time"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="responsible-input" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Responsabil <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="responsible-input"
            type="text"
            value={responsibleName}
            onChange={(e) => setResponsibleName(e.target.value)}
            placeholder="Ing. Ion Popescu"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="affil-input" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Afiliat <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'normal' }} className="text-xs">(opțional)</span>
          </label>
          <input
            id="affil-input"
            type="text"
            value={responsibleAffil}
            onChange={(e) => setResponsibleAffil(e.target.value)}
            placeholder="Ex: Dept. Bioinginerie"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        {formError && <p role="alert" aria-live="assertive" className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 font-semibold cursor-pointer text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'transparent' }}
          >
            Anulare
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-150 font-semibold cursor-pointer text-sm"
            style={{ backgroundColor: 'var(--healthcare-primary)', color: 'var(--color-bg-primary)' }}
          >
            {isPending ? 'Se salvează...' : 'Salvare Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
