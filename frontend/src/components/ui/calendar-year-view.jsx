import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import { ro } from 'date-fns/locale';
import '../../styles/calendar-year.css';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

function YearMonthCard({
  month,
  year,
  occurrences = [],
  onDateSelect = () => {},
  selectedDate,
}) {
  const monthDate = new Date(year, month, 1);

  const eventsByDay = useMemo(() => {
    const grouped = {};
    occurrences.forEach((occ) => {
      const dayNum = new Date(occ.rescheduledTo || occ.scheduledDate).getDate();
      const day = String(dayNum);
      if (day) {
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(occ);
      }
    });
    return grouped;
  }, [occurrences]);

  return (
    <div className="year-month-card">
      <div className="year-month-header">
        <h3 className="year-month-title">
          {MONTHS_RO[month]} {year}
        </h3>
      </div>

      <div className="year-month-calendar">
        <DayPicker
          mode="single"
          month={monthDate}
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={false}
          showOutsideDays={true}
          locale={ro}
          className="year-day-picker"
          classNames={{
            months: "year-months",
            month: "year-month",
            weekdays: "year-weekdays",
            weekday: "year-weekday",
            week: "year-week",
            day: "year-day",
            day_button: cn(
              "year-day-button",
              "h-6 w-6 p-0 text-xs font-medium"
            ),
            selected: "year-day-selected",
            today: "year-day-today",
            outside: "year-day-outside",
          }}
        />
      </div>

      {/* Event indicators */}
      {Object.keys(eventsByDay).length > 0 && (
        <div className="year-month-events">
          <div className="year-events-header">Evenimente programate</div>
          <div className="year-events-list">
            {Object.entries(eventsByDay)
              .slice(0, 3)
              .map(([day, events]) => (
                <div key={day} className="year-event-item">
                  <span className="year-event-day">{day}</span>
                  <span className="year-event-count">
                    {events.length} {events.length === 1 ? 'eveniment' : 'evenimente'}
                  </span>
                </div>
              ))}
            {Object.keys(eventsByDay).length > 3 && (
              <div className="year-event-more">
                +{Object.keys(eventsByDay).length - 3} mai multe
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarYearView({
  selectedYear = new Date().getFullYear(),
  occurrencesByDate = {},
  onDateSelect = () => {},
  selectedDate,
}) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="calendar-year-view">
      {/* Header */}
      <div className="calendar-year-header">
        <h2 className="calendar-year-title">Anul {selectedYear}</h2>
        <p className="calendar-year-subtitle">
          Total evenimente:{' '}
          {Object.values(occurrencesByDate).reduce((sum, events) => sum + (events?.length || 0), 0)}
        </p>
      </div>

      {/* Grid with 12 month cards */}
      <div className="year-grid">
        {months.map((month) => {
          const monthOccurrences = Object.entries(occurrencesByDate)
            .filter(([dateKey]) => {
              const d = new Date(dateKey);
              return d.getFullYear() === selectedYear && d.getMonth() === month;
            })
            .flatMap(([, events]) => events);
          return (
            <YearMonthCard
              key={month}
              month={month}
              year={selectedYear}
              occurrences={monthOccurrences}
              onDateSelect={(date) => {
                if (date) {
                  onDateSelect(new Date(selectedYear, month, date.getDate()));
                }
              }}
              selectedDate={selectedDate}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="calendar-year-legend">
        <div className="legend-item">
          <span className="legend-dot status-programat"></span>
          <span>Programat</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot status-scadent"></span>
          <span>Scadent</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot status-depasit"></span>
          <span>Depășit</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot status-efectuat"></span>
          <span>Efectuat</span>
        </div>
      </div>
    </div>
  );
}
