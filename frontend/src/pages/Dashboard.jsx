import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { Activity, Wrench, AlertCircle, Package, Calendar, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'accent', href }) {
  const colorMap = {
    accent:  { bg: 'var(--color-accent-subtle)',  icon: 'var(--color-accent)' },
    success: { bg: 'var(--color-success-bg)',      icon: 'var(--color-success)' },
    error:   { bg: 'var(--color-error-bg)',        icon: 'var(--color-error)' },
    warning: { bg: 'var(--color-warning-bg)',      icon: 'var(--color-warning)' },
    info:    { bg: 'var(--color-info-bg)',         icon: 'var(--color-info)' },
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <a
      href={href}
      aria-label={`${label}: ${value}`}
      className="group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 block"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', textDecoration: 'none', color: 'inherit' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: c.bg }}>
          <Icon size={24} style={{ color: c.icon }} />
        </div>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    </a>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      const devices = data.devices || [];
      return {
        total: devices.length,
        functional: devices.filter(d => d.status === 'FUNCTIONAL').length,
        inRepair:   devices.filter(d => d.status === 'IN_REPARATIE').length,
        defect:     devices.filter(d => d.status === 'DEFECT').length,
        loaned:     devices.filter(d => d.status === 'IMPRUMUTAT').length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: consumableStats } = useQuery({
    queryKey: ['consumable-stats'],
    queryFn: async () => {
      const { data } = await api.get('/consumables');
      const consumables = data.consumables || [];
      return { lowStock: consumables.filter(c => c.currentQuantity <= c.minimumQuantity).length };
    },
    staleTime: 5 * 60 * 1000,
  });

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
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Package}      label="Total dispozitive"          value={stats?.total    ?? '—'} href="/inventory" color="accent" />
          <StatCard icon={Activity}     label="Funcționale"                value={stats?.functional ?? '—'} href="/inventory" color="success" />
          <StatCard icon={AlertCircle}  label="Defecte"                    value={stats?.defect   ?? '—'} href="/inventory" color="error" />
          <StatCard icon={Wrench}       label="În reparație"               value={stats?.inRepair ?? '—'} href="/inventory" color="warning" />
          <StatCard icon={Package}      label="Consumabile stoc scăzut"    value={consumableStats?.lowStock ?? '—'} href="/consumables" color="warning" />
          <StatCard icon={Calendar}     label="Împrumutate"                value={stats?.loaned   ?? '—'} href="/inventory" color="info" />
        </div>

        {/* Quick actions */}
        <div className="p-6 rounded-xl border mb-8" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Acțiuni rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <a href="/devices/new" className="px-4 py-3 rounded-lg font-medium transition-all text-center text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              + Adaugă dispozitiv
            </a>
            <a href="/inventory" className="px-4 py-3 rounded-lg font-medium transition-all text-center border text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              Inventar
            </a>
            <a href="/inventory/annual" className="px-4 py-3 rounded-lg font-medium transition-all text-center border text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              Inventariere anuală
            </a>
            <a href="/consumables" className="px-4 py-3 rounded-lg font-medium transition-all text-center border text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              Consumabile
            </a>
          </div>
        </div>

        {/* About */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderLeft: '4px solid var(--color-info)' }}>
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>📋 Despre SIMDM</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            SIMDM este sistemul informațional pentru gestionarea centralizată a dispozitivelor medicale
            conform Ghidului Bioinginerului (Ordinul MS nr. 889/2024, Republica Moldova).
          </p>
        </div>
      </div>
    </div>
  );
}
