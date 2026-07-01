import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import '../../styles/calendar-sidebar.css';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

function MiniCalendar({ selectedDate, onDateSelect, currentMonth, onMonthChange }) {
  const sidebarMonth = currentMonth || new Date();

  const handlePrevMonth = () => {
    const prev = new Date(sidebarMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(sidebarMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  return (
    <div className="sidebar-mini-calendar">
      <div className="sidebar-calendar-header">
        <button
          onClick={handlePrevMonth}
          className="sidebar-calendar-nav"
          aria-label="Luna anterioară (mini-calendar)"
          title="Trecere la luna anterioară"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="sidebar-calendar-month">
          {MONTHS_RO[sidebarMonth.getMonth()]}
        </span>
        <button
          onClick={handleNextMonth}
          className="sidebar-calendar-nav"
          aria-label="Luna următoare (mini-calendar)"
          title="Trecere la luna următoare"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        month={sidebarMonth}
        locale={ro}
        disabled={() => false}
        showOutsideDays={true}
        className="sidebar-day-picker"
        classNames={{
          months: "sidebar-months",
          month: "sidebar-month",
          weekdays: "sidebar-weekdays",
          weekday: "sidebar-weekday",
          week: "sidebar-week",
          day: "sidebar-day",
          day_button: cn(
            "sidebar-day-button",
            "h-8 w-8 p-0 font-normal text-sm"
          ),
          selected: "sidebar-day-selected",
          today: "sidebar-day-today",
          outside: "sidebar-day-outside",
        }}
      />
    </div>
  );
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
  upcomingEvents = [],
  todayEvents = [],
  tomorrowEvents = [],
  showEmpty = false,
  onToggleEmpty = () => {},
  isMobile = false,
}) {
  const isEmpty = useMemo(() => {
    return (
      todayEvents.length === 0 &&
      tomorrowEvents.length === 0 &&
      upcomingEvents.length === 0
    );
  }, [todayEvents, tomorrowEvents, upcomingEvents]);

  const EventItem = ({ event, time }) => (
    <div className="sidebar-event-item">
      <div className="sidebar-event-name">{event.deviceName}</div>
      {time && <div className="sidebar-event-time">{time}</div>}
    </div>
  );

  const EventSection = ({ icon, title, events, times = [] }) => {
    if (events.length === 0) return null;

    return (
      <div className="sidebar-event-section">
        <h3 className="sidebar-section-title">
          <span className="sidebar-section-icon">{icon}</span>
          {title}
        </h3>
        <div className="sidebar-events-list">
          {events.map((event, idx) => (
            <EventItem
              key={event.id || idx}
              event={event}
              time={times[idx]}
            />
          ))}
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="sidebar-empty-state">
      <div className="sidebar-empty-icon">📅</div>
      <p className="sidebar-empty-text">Nicio programare viitoare</p>
    </div>
  );

  if (isMobile && showEmpty) {
    return null; // Hidden on mobile by default
  }

  return (
    <aside className={cn('calendar-sidebar', { 'mobile-hidden': isMobile && showEmpty })}>
      {/* Header cu toggle */}
      <div className="sidebar-header">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleEmpty}
          aria-label="Comută vizibilitatea sidebar-ului"
          title="Ascunde/arată sidebar"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Comută</span>
        </button>
      </div>

      {/* Mini Calendar */}
      <MiniCalendar
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
      />

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Events Sections */}
      <div className="sidebar-content">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <EventSection
              icon="📌"
              title="Astăzi"
              events={todayEvents}
              times={todayEvents.map((e) => e.scheduledTime || '')}
            />
            <EventSection
              icon="📌"
              title="Mâine"
              events={tomorrowEvents}
              times={tomorrowEvents.map((e) => e.scheduledTime || '')}
            />

          </>
        )}
      </div>
    </aside>
  );
}
