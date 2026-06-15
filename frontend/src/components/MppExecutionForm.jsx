import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConsumables } from '../api/consumables';
import { executeMpp } from '../api/mppExecutions';

const DEFAULT_CHECKLIST = [
  { id: 'check1', label: 'Verificare componentă', checked: false },
  { id: 'check2', label: 'Curățare', checked: false },
  { id: 'check3', label: 'Lubrifiere', checked: false },
];

export default function MppExecutionForm({ occurrenceId }) {
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [selectedConsumable, setSelectedConsumable] = useState('');
  const [consumableQty, setConsumableQty] = useState('');
  const [addedConsumables, setAddedConsumables] = useState([]);
  const [stockError, setStockError] = useState('');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [engineerSigned, setEngineerSigned] = useState(false);
  const [managerSigned, setManagerSigned] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: consumablesData } = useQuery({
    queryKey: ['consumables-mpp'],
    queryFn: getConsumables,
  });

  const consumables = consumablesData?.consumables || consumablesData?.data || consumablesData || [];

  const handleChecklistChange = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddConsumable = () => {
    if (!selectedConsumable) return;
    const found = consumables.find((c) => String(c.id) === String(selectedConsumable));
    if (!found) return;
    const qty = parseInt(consumableQty) || 0;
    if (qty > (found.quantity ?? found.currentQuantity ?? 999)) {
      setStockError('Stoc insuficient pentru cantitatea solicitată');
      return;
    }
    setStockError('');
    setAddedConsumables((prev) => [...prev, { consumableId: found.id, name: found.name, qty }]);
    setSelectedConsumable('');
    setConsumableQty('');
  };

  const handleBeforePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) setBeforePhoto(URL.createObjectURL(file));
  };

  const handleAfterPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) setAfterPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setError('');
    if (!engineerSigned || !managerSigned) {
      setError('Semnătură obligatorie pentru inginer și manager');
      return;
    }
    setLoading(true);
    try {
      const result = await executeMpp({
        occurrenceId,
        checklist: checklist.reduce((acc, item) => ({ ...acc, [item.id]: item.checked }), {}),
        consumablesUsed: addedConsumables,
        engineerSignature: 'signed',
        managerSignature: 'signed',
        beforePhoto,
        afterPhoto,
      });
      setPdfUrl(result?.formularPdfUrl || '/files/formular6.pdf');
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-medium mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>Execuție Mentenanță</h1>

      {error && <div className="alert-error mb-4">{error}</div>}

      {success && (
        <div className="alert-success mb-4">
          <p>Mentenanță executată cu succes</p>
          <p>Formular Nr. 6</p>
          <a href={pdfUrl || '/files/formular6.pdf'} role="link">
            Descarcă Formular
          </a>
        </div>
      )}

      {/* Checklist */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Checklist Mentenanță</h2>
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id={item.id}
              checked={item.checked}
              onChange={() => handleChecklistChange(item.id)}
              aria-label={item.label}
            />
            <label htmlFor={item.id}>{item.label}</label>
          </div>
        ))}
      </section>

      {/* Consumables */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Consumabile</h2>
        <div className="flex gap-2 items-end mb-2">
          <div>
            <label htmlFor="consumable-select">Consumabil</label>
            <select
              id="consumable-select"
              value={selectedConsumable}
              onChange={(e) => setSelectedConsumable(e.target.value)}
              className="block border px-2 py-1 rounded"
            >
              <option value="">-- Selectează --</option>
              {consumables.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qty-input">Cantitate</label>
            <input
              id="qty-input"
              type="number"
              value={consumableQty}
              onChange={(e) => setConsumableQty(e.target.value)}
              className="block border px-2 py-1 rounded w-20"
              min="1"
            />
          </div>
          <button
            type="button"
            onClick={handleAddConsumable}
            className="btn-primary text-sm py-1 px-3"
          >
            Adaugă
          </button>
        </div>
        {stockError && <p className="text-red-600 text-sm">{stockError}</p>}
        {addedConsumables.map((c, i) => (
          <div key={i} className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {c.name} × {c.qty}
          </div>
        ))}
      </section>

      {/* Photos */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="before-photo">Fotografie Înainte</label>
          <input
            id="before-photo"
            type="file"
            accept="image/*"
            onChange={handleBeforePhoto}
            className="block mt-1"
          />
          {beforePhoto && <img src={beforePhoto} alt="Preview Înainte" className="mt-2 h-24 object-cover" />}
        </div>
        <div>
          <label htmlFor="after-photo">Fotografie După</label>
          <input
            id="after-photo"
            type="file"
            accept="image/*"
            onChange={handleAfterPhoto}
            className="block mt-1"
          />
          {afterPhoto && <img src={afterPhoto} alt="Preview După" className="mt-2 h-24 object-cover" />}
        </div>
      </section>

      {/* Signatures */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Semnătură Inginer</h3>
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            onClick={() => setEngineerSigned(true)}
          >
            {engineerSigned ? (
              <span style={{ color: 'var(--color-success)' }}>✓ Semnat</span>
            ) : (
              <span style={{ color: 'var(--color-text-tertiary)' }}>Click pentru semnătură</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEngineerSigned(false)}
            className="mt-1 text-sm hover:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            Curăță
          </button>
        </div>
        <div>
          <h3 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Semnătură Manager</h3>
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            onClick={() => setManagerSigned(true)}
          >
            {managerSigned ? (
              <span style={{ color: 'var(--color-success)' }}>✓ Semnat</span>
            ) : (
              <span style={{ color: 'var(--color-text-tertiary)' }}>Click pentru semnătură</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setManagerSigned(false)}
            className="mt-1 text-sm hover:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            Curăță
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Se salvează...' : 'Salvare'}
      </button>
    </div>
  );
}
