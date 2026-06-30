import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import '../../styles/calendar-day.css';

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i); // 08:00-17:00

function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function getEventPosition(startHour, startMin, duration) {
  const startPercent = (startHour - 8 + startMin / 60) * 100; // 100 = 1 hour in %
  const durationPercent = (duration / 60) * 100;
  return { top: `${startPercent}%`, height: `${durationPercent}%` };
}

export function CalendarDayView({
  selectedDate,
  occurrences = [],
  onEventClick = () => {},
}) {
  if (!selectedDate) {
    return (
      <div className="calendar-day-view empty">
        <div className="empty-state">
          <p>Selectați o zi pentru a vedea programul</p>
        </div>
      </div>
    );
  }

  const dateStr = selectedDate.toLocaleDateString('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const groupedEvents = useMemo(() => {
    const grouped = {};
    occurrences.forEach((occ) => {
      const dateObj = new Date(occ.rescheduledTo || occ.scheduledDate);
      let startHour = dateObj.getUTCHours();
      let startMin = dateObj.getUTCMinutes();
      if (startHour < 8) { startHour = 8; startMin = 0; }
      if (startHour > 17) { startHour = 17; startMin = 0; }
      const duration = occ.duration || 60;

      if (!grouped[startHour]) grouped[startHour] = [];
      grouped[startHour].push({
        ...occ,
        startMin,
        duration,
        position: getEventPosition(startHour, startMin, duration),
      });
    });
    return grouped;
  }, [occurrences]);

  return (
    <div className="calendar-day-view">
      {/* Header */}
      <div className="calendar-day-header">
        <h2 className="calendar-day-title">{dateStr}</h2>
        <p className="calendar-day-subtitle">
          {occurrences.length} {occurrences.length === 1 ? 'eveniment' : 'evenimente'}
        </p>
      </div>

      {/* Timeline */}
      <div className="calendar-day-timeline">
        {/* Hour labels */}
        <div className="timeline-hours">
          <div className="timeline-hour-slot">
            <span className="timeline-hour-label"></span>
          </div>
          {HOURS.map((hour) => (
            <div key={hour} className="timeline-hour-slot">
              <span className="timeline-hour-label">{formatTime(hour)}</span>
            </div>
          ))}
          <div className="timeline-hour-slot">
            <span className="timeline-hour-label">18:00</span>
          </div>
        </div>

        {/* Event grid */}
        <div className="timeline-grid">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className={cn('timeline-hour-cell', {
                'has-events': groupedEvents[hour]?.length > 0,
              })}
            >
              {/* Events in this hour */}
              {groupedEvents[hour]?.map((event, idx) => (
                <div
                  key={event.id}
                  className={cn(
                    'timeline-event',
                    `status-${event.status.toLowerCase()}`
                  )}
                  style={{
                    ...event.position,
                    left: `${(idx % 2) * 50}%`,
                    width: groupedEvents[hour].length > 1 ? '50%' : '100%',
                    zIndex: idx,
                  }}
                  onClick={() => onEventClick(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onEventClick(event);
                    }
                  }}
                  title={`${event.deviceName} (${event.status})`}
                  aria-label={`${event.deviceName} — ${event.status}, ora ${String(new Date(event.rescheduledTo || event.scheduledDate).getUTCHours()).padStart(2, '0')}:${String(new Date(event.rescheduledTo || event.scheduledDate).getUTCMinutes()).padStart(2, '0')}`}
                >
                  <div className="timeline-event-content">
                    <div className="timeline-event-name">{event.deviceName}</div>
                    <div className="timeline-event-time">
                      {`${String(new Date(event.rescheduledTo || event.scheduledDate).getUTCHours()).padStart(2, '0')}:${String(new Date(event.rescheduledTo || event.scheduledDate).getUTCMinutes()).padStart(2, '0')}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Final hour 18:00 */}
          <div className="timeline-hour-cell" />
        </div>
      </div>

      {/* Legend */}
      {occurrences.length > 0 && (
        <div className="calendar-day-legend">
          <div className="legend-item">
            <span className="legend-color status-programat"></span>
            <span>Programat</span>
          </div>
          <div className="legend-item">
            <span className="legend-color status-scadent"></span>
            <span>Scadent</span>
          </div>
          <div className="legend-item">
            <span className="legend-color status-depasit"></span>
            <span>Depășit</span>
          </div>
          <div className="legend-item">
            <span className="legend-color status-efectuat"></span>
            <span>Efectuat</span>
          </div>
        </div>
      )}
    </div>
  );
}
