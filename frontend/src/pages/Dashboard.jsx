import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import {
  Activity, Wrench, AlertCircle, Package, Calendar,
  Shield, Clock, FileText, Briefcase, ShoppingCart,
  PackageCheck, Archive, BarChart3, CheckSquare, AlertTriangle, TicketCheck, ClipboardList,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

function StatCard({ icon: Icon, label, value, color = 'accent', href, isLoading = false }) {
  const colorMap = {
    accent:  { bg: 'var(--color-accent-subtle)',  icon: 'var(--color-accent)' },
    success: { bg: 'var(--color-success-bg)',      icon: 'var(--color-success)' },
    error:   { bg: 'var(--color-error-bg)',        icon: 'var(--color-error)' },
    warning: { bg: 'var(--color-warning-bg)',      icon: 'var(--color-warning)' },
    info:    { bg: 'var(--color-info-bg)',         icon: 'var(--color-info)' },
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <Link
      to={href}
      aria-label={`${label}: ${isLoading ? 'Se încarcă' : value}`}
      className="group p-5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 block"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', textDecoration: 'none', color: 'inherit' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: c.bg }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {isLoading ? <span className="skeleton skeleton-text" style={{ width: '40px', display: 'inline-block' }} /> : value}
      </p>
    </Link>
  );
}

function AlertCard({ icon: Icon, label, value, color, href }) {
  if (!value) return null;
  const colorMap = {
    error:   { bg: 'var(--color-error-bg)',   text: 'var(--color-error)' },
    warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
    info:    { bg: 'var(--color-info-bg)',    text: 'var(--color-info)' },
  };
  const c = colorMap[color] || colorMap.warning;
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md"
      style={{ backgroundColor: c.bg, borderColor: 'transparent', textDecoration: 'none', color: 'inherit' }}
    >
      <Icon size={18} style={{ color: c.text }} />
      <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <span className="text-lg font-bold" style={{ color: c.text }}>{value}</span>
    </Link>
  );
}

function MiniBarChart({ data, maxValue }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-16">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.value}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max((d.value / max) * 48, 2)}px`,
              backgroundColor: d.color,
              minHeight: '2px',
            }}
          />
          <span className="text-[10px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => { const { data } = await api.get('/dashboard/summary'); return data; },
    staleTime: 60_000,
  });

  const d = summary?.devices || {};
  const m = summary?.maintenance || {};
  const v = summary?.verifications || {};
  const inc = summary?.incidents || {};
  const t = summary?.tickets || {};
  const doc = summary?.documents || {};
  const ct = summary?.contracts || {};
  const cs = summary?.consumables || {};

  const statusData = [
    { label: 'FUNC.', value: d.byStatus?.FUNCTIONAL || 0, color: 'var(--color-success)' },
    { label: 'În Rep.', value: d.byStatus?.IN_REPARATIE || 0, color: 'var(--color-warning)' },
    { label: 'Defect', value: d.byStatus?.DEFECT || 0, color: 'var(--color-error)' },
    { label: 'Conservat', value: d.byStatus?.CONSERVAT || 0, color: 'var(--color-info)' },
    { label: 'Împr.', value: d.byStatus?.IMPRUMUTAT || 0, color: 'var(--color-text-secondary)' },
    { label: 'Rezervă', value: d.byStatus?.REZERVA || 0, color: 'var(--color-text-tertiary)' },
  ];

  const totalAlerts = (m.overdue || 0) + (v.expired || 0) + (t.open || 0) + (doc.expiringIn30Days || 0) + (ct.expiringIn30Days || 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Page header */}
      <div className="border-b px-8 py-6" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Bine ai venit, <span style={{ color: 'var(--color-accent)' }}>{user?.username}</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Prezentare generală a sistemului de management al dispozitivelor medicale
        </p>
      </div>

      <div className="container mx-auto p-8">
        {/* KPI Grid - Row 1: Device Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Package} label="Total DM active" value={d.total ?? '—'} href="/inventory" color="accent" isLoading={isLoading} />
          <StatCard icon={Activity} label="Funcționale" value={d.byStatus?.FUNCTIONAL ?? '—'} href="/inventory?status=FUNCTIONAL" color="success" isLoading={isLoading} />
          <StatCard icon={AlertCircle} label="Defecte" value={d.byStatus?.DEFECT ?? '—'} href="/inventory?status=DEFECT" color="error" isLoading={isLoading} />
          <StatCard icon={Wrench} label="În reparație" value={d.byStatus?.IN_REPARATIE ?? '—'} href="/inventory?status=IN_REPARATIE" color="warning" isLoading={isLoading} />
          <StatCard icon={Package} label="Consumabile stoc scăzut" value={cs.lowStock ?? '—'} href="/consumables" color="warning" isLoading={isLoading} />
        </div>

        {/* KPI Grid - Row 2: Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Wrench} label="MPP scadente (≤7z)" value={m.dueSoon ?? '—'} href="/maintenance/calendar" color="warning" isLoading={isLoading} />
          <StatCard icon={AlertTriangle} label="MPP depășite" value={m.overdue ?? '—'} href="/maintenance/calendar" color="error" isLoading={isLoading} />
          <StatCard icon={CheckSquare} label="Verificări expirate" value={v.expired ?? '—'} href="/verifications" color="error" isLoading={isLoading} />
          <StatCard icon={TicketCheck} label="Tichete deschise" value={t.open ?? '—'} href="/maintenance/tickets" color="warning" isLoading={isLoading} />
          <StatCard icon={AlertTriangle} label="Incidente deschise" value={inc.open ?? '—'} href="/incidents" color="error" isLoading={isLoading} />
        </div>

        {/* KPI Grid - Row 3: Expiring Soon */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={FileText} label="Documente expiră (≤30z)" value={doc.expiringIn30Days ?? '—'} href="/documents" color="info" isLoading={isLoading} />
          <StatCard icon={Briefcase} label="Contracte expiră (≤30z)" value={ct.expiringIn30Days ?? '—'} href="/service-contracts" color="info" isLoading={isLoading} />
          <StatCard icon={CheckSquare} label="Verificări expiră (≤30z)" value={v.expiringIn30Days ?? '—'} href="/verifications" color="info" isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Alerts Widget */}
          <section className="p-5 rounded-xl border" aria-label="Alerte active" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400, color: 'var(--color-text-primary)' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
              Alerte active
              {totalAlerts > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                  {totalAlerts}
                </span>
              )}
            </h2>
            {isLoading ? (
              <div className="space-y-2"><Skeleton lines={4} variant="card" /></div>
            ) : (
              <div className="space-y-2">
                <AlertCard icon={Wrench} label="MPP depășite" value={m.overdue} color="error" href="/maintenance/calendar" />
                <AlertCard icon={CheckSquare} label="Verificări expirate" value={v.expired} color="error" href="/verifications" />
                <AlertCard icon={TicketCheck} label="Tichete deschise" value={t.open} color="warning" href="/maintenance/tickets" />
                <AlertCard icon={AlertTriangle} label="Incidente deschise" value={inc.open} color="warning" href="/incidents" />
                <AlertCard icon={AlertTriangle} label="Raportare AMDM necesară" value={inc.pendingAmdm} color="error" href="/incidents" />
                <AlertCard icon={FileText} label="Documente expiră (≤30z)" value={doc.expiringIn30Days} color="info" href="/documents" />
                <AlertCard icon={Briefcase} label="Contracte expiră (≤30z)" value={ct.expiringIn30Days} color="info" href="/service-contracts" />
                <AlertCard icon={Wrench} label="MPP scadente (≤7z)" value={m.dueSoon} color="info" href="/maintenance/calendar" />
                {totalAlerts === 0 && (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>Nicio alertă activă</p>
                )}
              </div>
            )}
          </section>

          {/* DM Status Chart */}
          <section className="p-5 rounded-xl border" aria-label="Dispozitive pe status" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400, color: 'var(--color-text-primary)' }}>
              <Package size={18} style={{ color: 'var(--color-accent)' }} />
              DM pe status
            </h2>
            {isLoading ? (
              <Skeleton lines={3} variant="card" />
            ) : (
              <MiniBarChart data={statusData} maxValue={d.total} />
            )}

            {/* Risk breakdown */}
            {d.byRisk && Object.keys(d.byRisk).length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Pe clasă de risc</h3>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(d.byRisk).map(([risk, count]) => (
                    <span key={risk} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                      Clasa {risk}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section className="p-5 rounded-xl border mb-6" aria-label="Acțiuni rapide" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400, color: 'var(--color-text-primary)' }}>Acțiuni rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { to: '/devices/new', Icon: Package, label: '+ Adaugă DM' },
              { to: '/inventory', Icon: Package, label: 'Inventar' },
              { to: '/procurement', Icon: ShoppingCart, label: 'Plan Procurare' },
              { to: '/commissioning', Icon: PackageCheck, label: 'Recepție' },
              { to: '/maintenance/calendar', Icon: Calendar, label: 'Calendar MPP' },
              { to: '/decommission', Icon: Archive, label: 'Casare' },
              { to: '/duty-log', Icon: ClipboardList, label: 'Jurnal Gardă' },
              { to: '/reports', Icon: BarChart3, label: 'Raport Activitate' },
            ].map(({ to, Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2.5 rounded-lg font-medium transition-all text-center text-sm flex items-center justify-center gap-1.5 border"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
              >
                <Icon size={14} /> {label}
              </Link>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="p-5 rounded-xl border" aria-label="Despre SIMDM" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderLeft: '4px solid var(--color-info)' }}>
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>📋 Despre SIMDM</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            SIMDM este sistemul informațional pentru gestionarea centralizată a dispozitivelor medicale
            conform Ghidului Bioinginerului (Ordinul MS nr. 889/2024, Republica Moldova).
          </p>
        </section>
      </div>
    </div>
  );
}
