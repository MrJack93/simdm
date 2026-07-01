import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { BarChart3, Download } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Field, FieldLabel } from '../components/ui/field';

const FAULT_LABELS = {
  VECHI_STRICAT: 'Vechi & stricat', VARIATII_TENSIUNE: 'Variații tensiune',
  APA_GAZ: 'Apă/gaz', DEFECT_MECANIC: 'Defect mecanic',
  DEFECT_ELECTRONIC: 'Defect electronic', INSTALAT_INCORECT: 'Instalat incorect',
  GRESEALA_UTILIZATORULUI: 'Greșeala utilizatorului', ABUZ: 'Abuz', ALTE: 'Alte',
};

export default function ActivityReportPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');
  const [showReport, setShowReport] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activity-report', from, to],
    queryFn: async () => { const { data } = await api.get(`/activity-report?from=${from}&to=${to}`); return data; },
    enabled: showReport,
  });

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/activity-report/formular12-pdf?from=${from}&to=${to}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Formular_12_${from}_${to}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Eroare la descărcare PDF'); }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>Raport Activitate</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Formular Nr. 12 — Raportarea activității D/SIBM (cap. 3.8)</p>
        </div>
        {data && (
          <button onClick={handleDownloadPdf} className="btn-secondary flex items-center gap-2"><Download size={16} /> Descarcă PDF</button>
        )}
      </div>

      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Field>
            <FieldLabel htmlFor="rp-from">De la</FieldLabel>
            <input id="rp-from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-base" />
          </Field>
          <Field>
            <FieldLabel htmlFor="rp-to">Până la</FieldLabel>
            <input id="rp-to" type="date" value={to} onChange={e => setTo(e.target.value)} className="input-base" />
          </Field>
          <button onClick={() => { setShowReport(true); refetch(); }} className="btn-primary flex items-center gap-2">
            <BarChart3 size={16} /> Generează Raport
          </button>
        </div>
      </div>

      {showReport && isLoading && (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} lines={3} variant="card" />)}</div>
      )}

      {showReport && data && (
        <div className="space-y-6">
          {/* Activitate */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>1. Analiza Activității</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Reparații', count: data.activityAnalysis.repairs.count, hours: data.activityAnalysis.repairs.hours },
                { label: 'Mentenanță', count: data.activityAnalysis.maintenance.count, hours: data.activityAnalysis.maintenance.hours },
                { label: 'Verificări', count: data.activityAnalysis.verifications.count, hours: 0 },
                { label: 'DM Instalate', count: data.newDevicesInstalled, hours: 0 },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.count}</div>
                  {item.hours > 0 && <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.hours.toFixed(1)}h</div>}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Total ore: <strong style={{ color: 'var(--color-text-primary)' }}>{data.activityAnalysis.totalHours.toFixed(1)}</strong>
            </div>
          </div>

          {/* Cauze */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>2. Defalcarea Cauzelor</h2>
            <div className="space-y-1">
              {Object.entries(data.faultBreakdown).filter(([, v]) => v.count > 0).map(([cat, val]) => (
                <div key={cat} className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-primary)' }}>{FAULT_LABELS[cat] || cat}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{val.count} ({val.hours.toFixed(1)}h)</span>
                </div>
              ))}
              {Object.values(data.faultBreakdown).every(v => v.count === 0) && (
                <p className="text-sm py-2" style={{ color: 'var(--color-text-tertiary)' }}>Nicio defecțiune înregistrată în perioada selectată</p>
              )}
            </div>
          </div>

          {/* Timp */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>3. Analiza Timpului</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'under_1h', label: '< 1 oră' },
                { key: '1_5h', label: '1–5 ore' },
                { key: '5h_1day', label: '5h–1 zi' },
                { key: '1day_1week', label: '1 zi–1 săpt.' },
                { key: '1week_1month', label: '1 săpt.–1 lună' },
                { key: 'over_1month', label: '> 1 lună' },
              ].map(({ key, label }) => (
                <div key={key} className="p-2 rounded text-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{data.timeIntervals[key] || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
