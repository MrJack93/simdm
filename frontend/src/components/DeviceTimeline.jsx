import { useQuery } from '@tanstack/react-query';
import { History, Plus, RefreshCw, Trash2, Upload, LogIn, LogOut } from 'lucide-react';
import api from '../api/axios';

const ACTION_ICON = {
  CREATE:      <Plus size={14} />,
  UPDATE:      <RefreshCw size={14} />,
  DELETE:      <Trash2 size={14} />,
  FILE_UPLOAD: <Upload size={14} />,
  LOGIN:       <LogIn size={14} />,
  LOGOUT:      <LogOut size={14} />,
};

const ACTION_COLOR = {
  CREATE:      'var(--color-success)',
  UPDATE:      'var(--color-accent)',
  DELETE:      'var(--color-error)',
  FILE_UPLOAD: 'var(--color-accent)',
};

const ACTION_LABEL = {
  CREATE:      'Creat',
  UPDATE:      'Actualizat',
  DELETE:      'Șters',
  FILE_UPLOAD: 'Fișier încărcat',
};

function ChangesList({ changes }) {
  if (!changes || typeof changes !== 'object') return null;

  const entries = Object.entries(changes).filter(([k]) => !['updatedAt', 'createdAt'].includes(k));
  if (entries.length === 0) return null;

  return (
    <ul className="mt-1 space-y-0.5">
      {entries.slice(0, 6).map(([key, value]) => (
        <li key={key} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-medium">{key}:</span>{' '}
          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
        </li>
      ))}
      {entries.length > 6 && (
        <li className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          +{entries.length - 6} câmpuri...
        </li>
      )}
    </ul>
  );
}

export default function DeviceTimeline({ deviceId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['device-history', deviceId],
    queryFn: async () => {
      const res = await api.get(`/audit-logs?entity=devices&entityId=${deviceId}&limit=50`);
      return res.data;
    },
    enabled: Boolean(deviceId),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];

  if (!deviceId) return null;

  return (
    <section aria-label="Istoric modificări dispozitiv" className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} style={{ color: 'var(--color-accent)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Istoric Modificări
        </h2>
        {!isLoading && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
            {logs.length} intrări
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
              <div className="skeleton skeleton-row flex-1" style={{ height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>
          Eroare la încărcarea istoricului.
        </p>
      )}

      {!isLoading && !isError && logs.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Nu există înregistrări în jurnal pentru acest dispozitiv.
        </p>
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <ol className="relative" style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '1.5rem' }}>
          {logs.map((log, idx) => {
            const color = ACTION_COLOR[log.action] || 'var(--color-text-secondary)';
            const icon = ACTION_ICON[log.action] || <RefreshCw size={14} />;
            const label = ACTION_LABEL[log.action] || log.action;
            const isLast = idx === logs.length - 1;

            return (
              <li key={log.id} className={isLast ? '' : 'pb-5'}>
                <div
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: '-15px',
                    width: '28px',
                    height: '28px',
                    backgroundColor: color + '22',
                    color,
                    border: `2px solid ${color}`,
                  }}
                  aria-hidden="true"
                >
                  {icon}
                </div>

                <div className="ml-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    {log.users && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        {log.users.username}
                      </span>
                    )}
                  </div>
                  <ChangesList changes={log.changes} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
