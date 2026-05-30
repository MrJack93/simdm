import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AlertsWidget() {
  const navigate = useNavigate();

  const { data: consumablesData, isLoading } = useQuery({
    queryKey: ['consumables-alerts'],
    queryFn: () => api.get('/consumables?limit=1000').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !consumablesData) {
    return null;
  }

  const consumables = consumablesData.consumables || [];
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

  // If nothing to alert about, show nothing
  if (lowStockCount === 0 && expiringIn7Days === 0 && expiringIn30Days === 0) {
    return null;
  }

  return (
    <div className="card-base p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">⚠️ Alerte Consumabile</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-sm">Click pentru mai detalii</div>
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
            <div className="font-bold">🚨 {expiringIn7Days} expirând în &lt;7 zile</div>
            <div className="text-sm">Urgent!</div>
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
            <div className="font-bold">⏰ {expiringIn30Days} expirând în &lt;30 zile</div>
            <div className="text-sm">Click pentru mai detalii</div>
          </button>
        )}
      </div>
    </div>
  );
}
