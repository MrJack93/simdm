import { cn } from '@/lib/utils';

function getStatusIcon(status) {
  switch (status.toLowerCase()) {
    case 'programat':
      return '○'; // Circle for scheduled
    case 'scadent':
      return '⏰'; // Hourglass for expiring
    case 'depasit':
      return '⚠'; // Warning for overdue
    case 'efectuat':
      return '✓'; // Checkmark for completed
    default:
      return '●'; // Dot fallback
  }
}

export function CalendarEventIndicator({
  status = 'programat',
  deviceName = 'Event',
}) {
  const statusClass = `status-${status.toLowerCase()}`;
  const icon = getStatusIcon(status);

  return (
    <div
      className={cn('calendar-event-indicator', statusClass)}
      title={`${deviceName} (${status})`}
      role="status"
      aria-label={`${deviceName} — Status: ${status}`}
    >
      <span aria-hidden="true" className="calendar-event-icon">
        {icon}
      </span>
      <span className="calendar-event-label">{deviceName}</span>
    </div>
  );
}
