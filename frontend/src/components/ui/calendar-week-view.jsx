import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import '../../styles/calendar-week.css';

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i); // 08:00-17:00
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function getDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday to 6
}

function getDateRange(date) {
  const currentDay = getDayOfWeek(date);
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - currentDay);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  return dates;
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getEventPosition(startHour, startMin, duration) {
  const startPercent = (startHour - 8 + startMin / 60) * 100;
  const durationPercent = (duration / 60) * 100;
  return { top: `${startPercent}%`, height: `${durationPercent}%` };
}

export function CalendarWeekView({
  selectedDate,
  occurrencesByDate = {},
  onEventClick = () => {},
}) {
  // Hook-urile trebuie apelate necondiționat (înainte de orice early return)
  const weekDates = useMemo(
    () => (selectedDate ? getDateRange(selectedDate) : []),
    [selectedDate]
  );

  const groupedEvents = useMemo(() => {
    const grouped = {};
    weekDates.forEach((date, dayIdx) => {
      const dateKey = date.toISOString().split('T')[0];
      const dayOccs = occurrencesByDate[dateKey] || [];

      grouped[dayIdx] = {};
      dayOccs.forEach((occ) => {
        const dateObj = new Date(occ.rescheduledTo || occ.scheduledDate);
        let startHour = dateObj.getUTCHours();
        let startMin = dateObj.getUTCMinutes();
        if (startHour < 8) { startHour = 8; startMin = 0; }
        if (startHour > 17) { startHour = 17; startMin = 0; }
        const duration = occ.duration || 60;

        if (!grouped[dayIdx][startHour]) grouped[dayIdx][startHour] = [];
        grouped[dayIdx][startHour].push({
          ...occ,
          startMin,
          duration,
          position: getEventPosition(startHour, startMin, duration),
        });
      });
    });
    return grouped;
  }, [weekDates, occurrencesByDate]);

  if (!selectedDate) {
    return (
      <div className="calendar-week-view empty">
        <div className="empty-state">
          <p>Selectați o săptămână pentru a vedea programul</p>
        </div>
      </div>
    );
  }

  const weekRange = `${formatDate(weekDates[0])} - ${formatDate(
    weekDates[6]
  )}`;

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="calendar-week-view">
      {/* Header */}
      <div className="calendar-week-header">
        <h2 className="calendar-week-title">Săptămâna: {weekRange}</h2>
      </div>

      {/* Day headers */}
      <div className="week-day-headers">
        <div className="week-time-column" />
        {weekDates.map((date, idx) => (
          <div
            key={idx}
            className={cn('week-day-header', {
              today: isToday(date),
            })}
          >
            <div className="week-day-name">{DAYS_OF_WEEK[idx]}</div>
            <div className="week-day-date">{formatDate(date)}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="calendar-week-timeline">
        {/* Time labels */}
        <div className="week-time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="week-time-slot">
              <span>{formatTime(hour)}</span>
            </div>
          ))}
          <div className="week-time-slot">
            <span>18:00</span>
          </div>
        </div>

        {/* Grid with events */}
        <div className="week-grid">
          {HOURS.map((hour) => (
            <div key={hour} className="week-grid-row">
              {weekDates.map((date, dayIdx) => (
                <div
                  key={`${hour}-${dayIdx}`}
                  className={cn('week-time-cell', {
                    today: isToday(date),
                    'has-events': groupedEvents[dayIdx]?.[hour]?.length > 0,
                  })}
                >
                  {/* Events in this time slot */}
                  {groupedEvents[dayIdx]?.[hour]?.map((event, eventIdx) => (
                    <div
                      key={event.id}
                      className={cn(
                        'week-event',
                        `status-${event.status.toLowerCase()}`
                      )}
                      style={{
                        ...event.position,
                        left: `${(eventIdx % 2) * 50}%`,
                        width:
                          groupedEvents[dayIdx][hour].length > 1 ? '50%' : '100%',
                        zIndex: eventIdx,
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
                      <div className="week-event-label">
                        {event.deviceName.substring(0, 8)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* Final hour */}
          <div className="week-grid-row">
            {weekDates.map((date, dayIdx) => (
              <div
                key={`18-${dayIdx}`}
                className={cn('week-time-cell', {
                  today: isToday(date),
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
