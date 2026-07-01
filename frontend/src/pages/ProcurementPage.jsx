import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { ShoppingCart, Plus, Download, Trash2, X } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Field, FieldLabel } from '../components/ui/field';

const TYPE_LABELS = { DM: 'Dispozitive Medicale', CONSUMABIL: 'Consumabile' };
const STATUS_LABELS = { DRAFT: 'Ciornă', COORDONAT: 'Coordonat', APROBAT: 'Aprobat' };
const STATUS_COLORS = {
  DRAFT: { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' },
  COORDONAT: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
  APROBAT: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
};

function formatCurrency(v) {
  if (!v) return '0 MDL';
  return Number(v).toLocaleString('ro-RO', { minimumFractionDigits: 2 }) + ' MDL';
}

function CreatePlanModal({ onClose, onSave }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState('DM');
  const [elaboratedBy, setElaboratedBy] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/procurement/plans', { year: parseInt(year), type, elaboratedBy });
      toast.success('Plan creat');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="plan-title">
      <div className="rounded-xl max-w-md w-full p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="plan-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Plan Nou de Procurare</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="plan-year" required>An</FieldLabel>
            <input id="plan-year" type="number" value={year} onChange={e => setYear(e.target.value)} className="input-base w-full" min="2020" max="2099" />
          </Field>
          <Field>
            <FieldLabel>Tip</FieldLabel>
            <div className="flex gap-4">
              {['DM', 'CONSUMABIL'].map(t => (
                <label key={t} className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="planType" value={t} checked={type === t} onChange={() => setType(t)} />
                  <span style={{ color: 'var(--color-text-primary)' }}>{TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="plan-bio">Elaborat de</FieldLabel>
            <input id="plan-bio" type="text" value={elaboratedBy} onChange={e => setElaboratedBy(e.target.value)} className="input-base w-full" placeholder="Bioinginer" />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Anulare</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Se creează...' : 'Creează'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanDetailModal({ plan, onClose, onSave }) {
  const [itemName, setItemName] = useState('');
  const [itemSpec, setItemSpec] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [itemFunding, setItemFunding] = useState('');
  const [loading, setLoading] = useState(false);

  const isDM = plan.type === 'DM';

  const addItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) { toast.error('Nume obligatoriu'); return; }
    setLoading(true);
    try {
      await api.post(`/procurement/plans/${plan.id}/items`, {
        name: itemName.trim(),
        specification: itemSpec || undefined,
        quantity: parseInt(itemQty) || 1,
        unitPrice: itemPrice ? parseFloat(itemPrice) : undefined,
        funding: itemFunding || undefined,
      });
      toast.success('Rând adăugat');
      setItemName(''); setItemSpec(''); setItemQty(1); setItemPrice(''); setItemFunding('');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare'); }
    finally { setLoading(false); }
  };

  const deleteItem = async (itemId) => {
    try {
      await api.delete(`/procurement/items/${itemId}`);
      toast.success('Rând șters');
      onSave();
    } catch { toast.error('Eroare la ștergere'); }
  };

  const transitionStatus = async (newStatus) => {
    try {
      await api.patch(`/procurement/plans/${plan.id}/status`, { newStatus });
      toast.success(`Status: ${STATUS_LABELS[newStatus]}`);
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Eroare tranziție'); }
  };

  const downloadPdf = async () => {
    try {
      const response = await api.get(`/procurement/plans/${plan.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Plan_${plan.year}_${plan.type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Eroare PDF'); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backgroundColor: 'var(--overlay-medium)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="detail-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Plan {plan.year} — {TYPE_LABELS[plan.type]}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide"><X size={20} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[plan.status]?.bg, color: STATUS_COLORS[plan.status]?.text }}>{STATUS_LABELS[plan.status]}</span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Total: {formatCurrency(plan.totalAmount)}</span>
          {plan.status === 'DRAFT' && <button onClick={() => transitionStatus('COORDONAT')} className="btn-secondary text-xs px-2 py-1"> marchează Coordonat</button>}
          {plan.status === 'COORDONAT' && <button onClick={() => transitionStatus('APROBAT')} className="btn-primary text-xs px-2 py-1">Aprobă</button>}
          <button onClick={downloadPdf} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"><Download size={12} /> PDF</button>
        </div>

        {/* Tabel rânduri */}
        {plan.items && plan.items.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nr.</th>
                  <th className="text-left py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Denumire</th>
                  {isDM && <th className="text-left py-2 px-2 text-xs hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Specificație</th>}
                  <th className="text-right py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cant.</th>
                  {isDM && <th className="text-left py-2 px-2 text-xs hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Finanțare</th>}
                  <th className="text-right py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Preț/uc.</th>
                  <th className="text-right py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Sumă</th>
                  <th className="text-right py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>{idx + 1}</td>
                    <td className="py-2 px-2" style={{ color: 'var(--color-text-primary)' }}>{item.name}</td>
                    {isDM && <td className="py-2 px-2 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{item.specification || '—'}</td>}
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-primary)' }}>{item.quantity}</td>
                    {isDM && <td className="py-2 px-2 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{item.funding || '—'}</td>}
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-2 text-right font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(item.totalPrice)}</td>
                    <td className="py-2 px-2 text-right">
                      {plan.status === 'DRAFT' && (
                        <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:opacity-70 focusable" aria-label="Șterge" style={{ color: 'var(--color-error)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formular adăugare rând (doar DRAFT) */}
        {plan.status === 'DRAFT' && (
          <form onSubmit={addItem} className="p-3 rounded-lg space-y-3" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Adaugă rând</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="input-base" placeholder="Denumire" />
              {isDM && <input type="text" value={itemSpec} onChange={e => setItemSpec(e.target.value)} className="input-base" placeholder="Specificație" />}
              <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} className="input-base" min="1" placeholder="Cant." />
              <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="input-base" step="0.01" min="0" placeholder="Preț/uc. MDL" />
              {isDM && <select value={itemFunding} onChange={e => setItemFunding(e.target.value)} className="input-base"><option value="">Finanțare</option><option value="BUGETARA">Bugetară</option><option value="EXTRABUGETARA">Extrabugetară</option></select>}
            </div>
            <button type="submit" className="btn-primary text-sm" disabled={loading}>{loading ? '...' : 'Adaugă rând'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['procurement-plans'],
    queryFn: async () => { const { data } = await api.get('/procurement/plans'); return data; },
  });

  const plans = data?.data || [];
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['procurement-plans'] });

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>Planificare Procurare</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Procedura MDM Nr. 2 — Formulare Nr. 1 & 2</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Plan Nou</button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} lines={2} variant="card" />)}</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Niciun plan de procurare</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Creează primul plan anual de procurare</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const sc = STATUS_COLORS[plan.status] || STATUS_COLORS.DRAFT;
            return (
              <button key={plan.id} onClick={() => setDetailPlan(plan)} className="text-left p-4 rounded-lg border transition-all hover:shadow-md focusable" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{plan.year}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>{STATUS_LABELS[plan.status]}</span>
                </div>
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>{TYPE_LABELS[plan.type]}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(plan.totalAmount)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{plan.items?.length || 0} rânduri</div>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); invalidateAll(); }} />}
      {detailPlan && <PlanDetailModal plan={detailPlan} onClose={() => setDetailPlan(null)} onSave={() => { setDetailPlan(null); invalidateAll(); }} />}
    </div>
  );
}
