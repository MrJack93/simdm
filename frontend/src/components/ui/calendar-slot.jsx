import { cn } from '@/lib/utils';

export function CalendarSlot({
  type = 'full',
  monthView = false,
  quantity = 'single',
  weekend = false,
  today = false,
  children,
  className,
}) {
  const slotClass = cn(
    'calendar-day-cell',
    {
      'weekend': weekend,
      'today': today,
    },
    className
  );

  return (
    <div className={slotClass}>
      {children}
    </div>
  );
}

export function CalendarEventIndicator({
  status = 'programat',
  deviceName = 'Event',
  quantity = 1,
  showExtra = false,
}) {
  const statusClass = `status-${status.toLowerCase()}`;

  return (
    <div className={cn('calendar-event-indicator', statusClass)} title={deviceName}>
      {deviceName}
    </div>
  );
}
