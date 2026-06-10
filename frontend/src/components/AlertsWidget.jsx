import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AlertsWidget() {
  const navigate = useNavigate();

  const { data: consumablesData, isLoading: loadingConsumables } = useQuery({
    queryKey: ['consumables-alerts'],
    queryFn: () => api.get('/consumables?limit=1000').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Count low stock items
  const lowStockCount = consumables.filter(
    c => c.quantity < c.minQuantity
  ).length;

  // Count items expiring soon
  const expiringIn7Days = consumables.filter(c => {
    if (!c.expiryDate) return false;
    const expiry = new Date(c.expiryDate);
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry < 7;
  }).length;

  const expiringIn30Days = consumables.filter(c => {
    if (!c.expiryDate) return false;
    const expiry = new Date(c.expiryDate);
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 7 && daysUntilExpiry < 30;
  }).length;

  // Count expiring contracts (SLA alerts)
  const expiringContracts = (contractsData?.data || []).filter(
    c => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30
  ).length;

  // Count verification alerts
  const unverifiedVerif = complianceData?.neverificat || 0;
  const expiredVerif = complianceData?.expirat || 0;
  const expiringSoonVerif = complianceData?.expiraCurand || 0;
  const neconformVerif = complianceData?.neconform || 0;
  const totalCriticalVerifications = unverifiedVerif + expiredVerif + expiringSoonVerif + neconformVerif;

  // Count due / overdue MPP occurrences
  const dueMpps = (mppData?.data || []).filter(
    occ => occ.status === 'SCADENT' || occ.status === 'DEPASIT'
  ).length;

  // If nothing to alert about, show nothing
  const hasConsumableAlerts = lowStockCount > 0 || expiringIn7Days > 0 || expiringIn30Days > 0;
  const hasContractAlerts = expiringContracts > 0;
  const hasVerificationAlerts = totalCriticalVerifications > 0;
  const hasMppAlerts = dueMpps > 0;

  if (!hasConsumableAlerts && !hasContractAlerts && !hasVerificationAlerts && !hasMppAlerts) {
    return null;
  }

  return (
    <div className="card-base p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">⚠️ Alerte Active Sistem</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Consumabile */}
        {lowStockCount > 0 && (
          <button
            onClick={() => navigate('/consumables?filter=LOW_STOCK')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              color: '#991b1b',
            }}
          >
            <div className="font-bold">❌ {lowStockCount} sub stoc minim</div>
            <div className="text-sm">Consumabile sub stocul de alertă</div>
          </button>
        )}

        {expiringIn7Days > 0 && (
          <button
            onClick={() => navigate('/consumables?filter=EXPIRING_7DAYS')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              color: '#991b1b',
            }}
          >
            <div className="font-bold">🚨 {expiringIn7Days} consumabile expiră în &lt;7 zile</div>
            <div className="text-sm">Urgent! Necesită înlocuire</div>
          </button>
        )}

        {expiringIn30Days > 0 && (
          <button
            onClick={() => navigate('/consumables?filter=EXPIRING_30DAYS')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fef3c7',
              borderLeft: '4px solid #fbbf24',
              color: '#78350f',
            }}
          >
            <div className="font-bold">⏰ {expiringIn30Days} consumabile expiră în &lt;30 zile</div>
            <div className="text-sm">Planificați achiziția de stoc</div>
          </button>
        )}

        {/* Contracte Externe */}
        {hasContractAlerts && (
          <button
            onClick={() => navigate('/service-contracts')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              color: '#991b1b',
            }}
          >
            <div className="font-bold">💼 {expiringContracts} contracte expiră în &lt;30 zile</div>
            <div className="text-sm">Necesită reînnoire sau renegociere</div>
          </button>
        )}

        {/* Verificări & Metrologie */}
        {hasVerificationAlerts && (
          <button
            onClick={() => navigate('/verifications')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              color: '#991b1b',
            }}
          >
            <div className="font-bold">🩺 {totalCriticalVerifications} verificări critice</div>
            <div className="text-xs">
              {neconformVerif > 0 ? `• ${neconformVerif} neconforme ` : ''}
              {expiredVerif > 0 ? `• ${expiredVerif} expirate ` : ''}
              {expiringSoonVerif > 0 ? `• ${expiringSoonVerif} expira curând ` : ''}
              {unverifiedVerif > 0 ? `• ${unverifiedVerif} niciodată verificate` : ''}
            </div>
          </button>
        )}

        {/* Mentenanță Preventivă */}
        {hasMppAlerts && (
          <button
            onClick={() => navigate('/maintenance/calendar')}
            className="p-4 rounded-lg focusable hover:opacity-70 transition text-left"
            style={{
              backgroundColor: '#fef3c7',
              borderLeft: '4px solid #fbbf24',
              color: '#78350f',
            }}
          >
            <div className="font-bold">🔧 {dueMpps} mentenanțe active / depășite</div>
            <div className="text-sm">Necesită execuție sau reprogramare</div>
          </button>
        )}
      </div>
    </div>
  );
}
