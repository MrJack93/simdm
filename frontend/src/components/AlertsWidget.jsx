import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, FileWarning, Wrench, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

export default function AlertsWidget() {
  const navigate = useNavigate();

  const { data: consumablesData, isLoading: loadingConsumables } = useQuery({
    queryKey: ['consumables-alerts'],
    queryFn: () => api.get('/consumables?limit=1000').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['serviceContractsAlerts'],
    queryFn: () => api.get('/service-contracts/contracts?limit=1000').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: complianceData, isLoading: loadingCompliance } = useQuery({
    queryKey: ['complianceReportAlerts'],
    queryFn: () => api.get('/verifications/compliance-report').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const currentYear = new Date().getFullYear();
  const { data: mppData, isLoading: loadingMpps } = useQuery({
    queryKey: ['mppCalendarAlerts', currentYear],
    queryFn: () => api.get(`/maintenance-plans/calendar?year=${currentYear}`).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  if (loadingConsumables && loadingContracts && loadingCompliance && loadingMpps) {
    return null;
  }

  const consumables = consumablesData?.consumables || [];
  const now = new Date();

  const lowStockCount = consumables.filter(c => c.quantity < c.minQuantity).length;

  const expiringIn7Days = consumables.filter(c => {
    if (!c.expiryDate) return false;
    const expiry = new Date(c.expiryDate);
    const days = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days < 7;
  }).length;

  const expiringIn30Days = consumables.filter(c => {
    if (!c.expiryDate) return false;
    const expiry = new Date(c.expiryDate);
    const days = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return days >= 7 && days < 30;
  }).length;

  const expiringContracts = (contractsData?.data || []).filter(
    c => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30
  ).length;

  const unverifiedVerif = complianceData?.neverificat || 0;
  const expiredVerif = complianceData?.expirat || 0;
  const expiringSoonVerif = complianceData?.expiraCurand || 0;
  const neconformVerif = complianceData?.neconform || 0;
  const totalCriticalVerifications = unverifiedVerif + expiredVerif + expiringSoonVerif + neconformVerif;

  const dueMpps = (mppData?.data || []).filter(
    occ => occ.status === 'SCADENT' || occ.status === 'DEPASIT'
  ).length;

  const alerts = [];

  if (lowStockCount > 0) {
    alerts.push({
      icon: AlertTriangle,
      title: `${lowStockCount} sub stoc minim`,
      desc: 'Consumabile sub stocul de alertă',
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error)',
      onClick: () => navigate('/consumables?filter=LOW_STOCK'),
    });
  }

  if (expiringIn7Days > 0) {
    alerts.push({
      icon: Clock,
      title: `${expiringIn7Days} expiră în <7 zile`,
      desc: 'Urgent! Necesită înlocuire',
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error)',
      onClick: () => navigate('/consumables?filter=EXPIRING_7DAYS'),
    });
  }

  if (expiringIn30Days > 0) {
    alerts.push({
      icon: Clock,
      title: `${expiringIn30Days} expiră în <30 zile`,
      desc: 'Planificați achiziția de stoc',
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning)',
      onClick: () => navigate('/consumables?filter=EXPIRING_30DAYS'),
    });
  }

  if (expiringContracts > 0) {
    alerts.push({
      icon: FileWarning,
      title: `${expiringContracts} contracte expiră în <30 zile`,
      desc: 'Necesită reînnoire sau renegociere',
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error)',
      onClick: () => navigate('/service-contracts'),
    });
  }

  if (totalCriticalVerifications > 0) {
    alerts.push({
      icon: ShieldCheck,
      title: `${totalCriticalVerifications} verificări critice`,
      desc: [
        neconformVerif > 0 ? `${neconformVerif} neconforme` : '',
        expiredVerif > 0 ? `${expiredVerif} expirate` : '',
        expiringSoonVerif > 0 ? `${expiringSoonVerif} expira curând` : '',
        unverifiedVerif > 0 ? `${unverifiedVerif} neverificate` : '',
      ].filter(Boolean).join(', '),
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error)',
      onClick: () => navigate('/verifications'),
    });
  }

  if (dueMpps > 0) {
    alerts.push({
      icon: Wrench,
      title: `${dueMpps} mentenanțe active / depășite`,
      desc: 'Necesită execuție sau reprogramare',
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning)',
      onClick: () => navigate('/maintenance/calendar'),
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="card-base p-4 mb-6">
      <h3
        className="text-lg font-medium mb-4"
        style={{
          fontFamily: 'var(--font-family-heading)',
          color: 'var(--color-text-primary)',
        }}
      >
        Alerte Active Sistem
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert, i) => {
          const IconComp = alert.icon;
          return (
            <button
              key={i}
              onClick={alert.onClick}
              className="p-4 rounded-xl text-left transition-all focusable"
              style={{
                backgroundColor: alert.bg,
                borderLeft: `4px solid ${alert.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComp size={16} style={{ color: alert.color }} />
                <div className="font-medium text-sm" style={{ color: alert.color }}>
                  {alert.title}
                </div>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {alert.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
