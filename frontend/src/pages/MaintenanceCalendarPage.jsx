import { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DayButton } from 'react-day-picker';
import {
  getMaintenancePlans,
  createMaintenancePlan,
  rescheduleOccurrence,
  downloadFormular5,
} from '../api/maintenancePlans';
import { getDevices } from '../api/devices';
import { Calendar } from '../components/ui/calendar';
import { CalendarEventIndicator } from '../components/ui/calendar-slot';
import { CalendarSidebar } from '../components/ui/calendar-sidebar';
import { CalendarDayView } from '../components/ui/calendar-day-view';
import { CalendarWeekView } from '../components/ui/calendar-week-view';
import { CalendarYearView } from '../components/ui/calendar-year-view';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../components/ui/drawer';
import { Button } from '../components/ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { CreatePlanModal } from '../components/CreatePlanModal';

const MAX_BARS_PER_DAY = 2;

// Context (nu props) ca să păstrăm referința componentei DayButton stabilă între render-uri —
// react-day-picker remontează toate celulele dacă `components.DayButton` se schimbă ca referință.
const OccurrencesContext = createContext({});

// Celulă custom: număr zi + bare colorate (Figma slot component style)
function DayButtonWithOccurrences({ day, modifiers, ...buttonProps }) {
  const occurrencesByDay = useContext(OccurrencesContext);
  const dayOccs = occurrencesByDay[day.date.getDate()] || [];
  const visible = dayOccs.slice(0, MAX_BARS_PER_DAY);
  const extra = dayOccs.length - visible.length;
  const isWeekend = modifiers?.disabled || day.date.getDay() === 0 || day.date.getDay() === 6;
  const ariaSuffix = dayOccs.length > 0
    ? ` — ${dayOccs.length} ${dayOccs.length === 1 ? 'ocurență' : 'ocurențe'} mentenanță`
    : '';

  return (
    <DayButton
      day={day}
      modifiers={modifiers}
      {...buttonProps}
      className={`min-h-[88px] p-1 calendar-day-cell ${isWeekend ? 'weekend' : ''} ${modifiers?.today ? 'today' : ''}`}
      aria-label={`${buttonProps['aria-label'] || ''}${ariaSuffix}`}
    >
      <span className="text-sm font-medium">{day.date.getDate()}</span>
      {dayOccs.length > 0 && (
        <span className="flex flex-col gap-0.5 w-full px-0.5 mt-0.5">
          {visible.map((occ) => (
            <CalendarEventIndicator
              key={occ.id}
              status={occ.status.toLowerCase()}
              deviceName={occ.deviceName}
              quantity={1}
            />
          ))}
          {extra > 0 && (
            <span className="text-[9px] leading-tight font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              +{extra} {extra === 1 ? 'altă' : 'altele'}
            </span>
          )}
        </span>
      )}
    </DayButton>
  );
}

// Referințe stabile (definite o singură dată) — orice obiect/funcție nouă pasată la `components`
// pe fiecare render forțează react-day-picker să remonteze toate celulele lunii.
const HiddenMonthCaption = () => null;
const CALENDAR_COMPONENTS = { MonthCaption: HiddenMonthCaption, DayButton: DayButtonWithOccurrences };

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

// spec §2.3: PROGRAMAT=verde (success), SCADENT=portocaliu (warning), DEPASIT=roșu (error), EFECTUAT=albastru (info)
function getStatusStyle(status) {
  if (status === 'DEPASIT') {
    return { backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderColor: 'var(--color-error-bg)', borderWidth: '1px', borderStyle: 'solid' };
  }
  if (status === 'SCADENT') {
    return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderColor: 'var(--color-warning-bg)', borderWidth: '1px', borderStyle: 'solid' };
  }
  if (status === 'EFECTUAT') {
    return { backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', borderColor: 'var(--color-info-bg)', borderWidth: '1px', borderStyle: 'solid' };
  }
  return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'var(--color-success-bg)', borderWidth: '1px', borderStyle: 'solid' }; // PROGRAMAT
}

// Simbol + etichetă pe lângă culoare, pentru accesibilitate (daltonism / fără culoare)
function getStatusSymbol(status) {
  if (status === 'DEPASIT') return '⚠';
  if (status === 'SCADENT') return '⏰';
  if (status === 'EFECTUAT') return '✓';
  return '○'; // PROGRAMAT
}

function getStatusLabel(status) {
  if (status === 'DEPASIT') return 'Depășit';
  if (status === 'SCADENT') return 'Scadent';
  if (status === 'EFECTUAT') return 'Efectuat';
  return 'Programat';
}

export default function MaintenanceCalendarPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = !isDesktop;

  const [initialYear] = useState(() => new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rescheduleOccId, setRescheduleOccId] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', reason: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [currentView, setCurrentView] = useState('month');
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const selectedDate = selectedDay != null ? new Date(selectedYear, currentMonth, selectedDay) : undefined;

  const handleCalendarSelect = (day) => {
    if (day) {
      setSelectedDay(day.getDate());
    } else {
      setSelectedDay(null);
    }
    setRescheduleOccId(null);
  };

  const handleDayClick = (dayNum) => {
    setSelectedDay(selectedDay === dayNum ? null : dayNum);
    setRescheduleOccId(null);
  };

  const handleMonthChange = (date) => {
    setCurrentMonth(date.getMonth());
    setSelectedYear(date.getFullYear());
    setSelectedDay(null);
  };

  const { data: calendarData, isLoading: isPlansLoading } = useQuery({
    queryKey: ['maintenancePlans', selectedYear],
    queryFn: () => getMaintenancePlans({ year: selectedYear }),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const plans = calendarData?.data || [];
  const devices = devicesData?.devices || devicesData?.data || [];

  const createMutation = useMutation({
    mutationFn: createMaintenancePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenancePlans'] });
      setSuccessMsg('Plan creat cu succes');
      setShowCreateModal(false);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }) => rescheduleOccurrence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenancePlans'] });
      setRescheduleOccId(null);
      setRescheduleData({ newDate: '', reason: '' });
      setRescheduleError('');
      setSuccessMsg('Ocurență reprogramată cu succes');
    },
    onError: (err) => {
      setRescheduleError(err?.response?.data?.error || 'Eroare la reprogramare');
    },
  });

  const handleRescheduleSubmit = (occId) => {
    if (!rescheduleData.newDate) {
      setRescheduleError('Data nouă este obligatorie');
      return;
    }
    if (!rescheduleData.reason || rescheduleData.reason.length < 5) {
      setRescheduleError('Motivul trebuie să aibă cel puțin 5 caractere');
      return;
    }
    setRescheduleError('');
    rescheduleMutation.mutate({
      id: occId,
      data: { newDate: new Date(rescheduleData.newDate).toISOString(), reason: rescheduleData.reason },
    });
  };

  const handleDownloadPdf = async () => {
    setPdfError('');
    try {
      const blob = await downloadFormular5(selectedYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formular-5-${selectedYear}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      setPdfError('Nu există planuri pentru acest an sau eroare la generare.');
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // Flatten all occurrences for the current month.
  // Support both array of plans (unit tests) and array of occurrences (real backend calendar endpoint).
  const occurrencesForMonth = useMemo(() => plans.flatMap((item) => {
    if (item.occurrences && Array.isArray(item.occurrences)) {
      return item.occurrences
        .filter((occ) => {
          const d = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate);
          return d.getFullYear() === selectedYear && d.getMonth() === currentMonth;
        })
        .map((occ) => ({
          ...occ,
          planFrequency: item.frequency,
          deviceName: item.device?.name,
        }));
    }
    const occ = item;
    const d = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate);
    if (d.getFullYear() === selectedYear && d.getMonth() === currentMonth) {
      return [{
        ...occ,
        planFrequency: occ.plan?.frequency || 'LUNAR',
        deviceName: occ.plan?.device?.name || 'Dispozitiv',
      }];
    }
    return [];
  }), [plans, selectedYear, currentMonth]);

  const occurrencesByDay = useMemo(() => occurrencesForMonth.reduce((acc, occ) => {
    const d = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate).getDate();
    (acc[d] = acc[d] || []).push(occ);
    return acc;
  }, {}), [occurrencesForMonth]);

  const occurrencesForDay = (day) =>
    occurrencesForMonth.filter(
      (occ) => new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate).getDate() === day
    );

  const todayRef = useRef(new Date());
  const today = todayRef.current;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = useMemo(() =>
    (plans || []).flatMap((item) => {
      if (item.occurrences && Array.isArray(item.occurrences)) {
        return item.occurrences
          .filter((occ) => {
            const d = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate);
            return d.toDateString() === today.toDateString();
          })
          .map((occ) => ({
            ...occ,
            deviceName: item.device?.name,
            scheduledTime: (occ.rescheduledTo || occ.scheduledDate)?.split('T')[1]?.substring(0, 5),
          }));
      }
      // Flat occurrence (from /calendar endpoint)
      const d = new Date(item.rescheduledTo || item.scheduledDate || item.dueDate);
      if (d.toDateString() === today.toDateString()) {
        return [{
          ...item,
          deviceName: item.plan?.device?.name,
          scheduledTime: (item.rescheduledTo || item.scheduledDate)?.split('T')[1]?.substring(0, 5),
        }];
      }
      return [];
    }), [plans, today]);

  const tomorrowEvents = useMemo(() =>
    (plans || []).flatMap((item) => {
      if (item.occurrences && Array.isArray(item.occurrences)) {
        return item.occurrences
          .filter((occ) => {
            const d = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate);
            return d.toDateString() === tomorrow.toDateString();
          })
          .map((occ) => ({
            ...occ,
            deviceName: item.device?.name,
            scheduledTime: (occ.rescheduledTo || occ.scheduledDate)?.split('T')[1]?.substring(0, 5),
          }));
      }
      // Flat occurrence (from /calendar endpoint)
      const d = new Date(item.rescheduledTo || item.scheduledDate || item.dueDate);
      if (d.toDateString() === tomorrow.toDateString()) {
        return [{
          ...item,
          deviceName: item.plan?.device?.name,
          scheduledTime: (item.rescheduledTo || item.scheduledDate)?.split('T')[1]?.substring(0, 5),
        }];
      }
      return [];
    }), [plans, tomorrow]);

  const occurrencesByDate = useMemo(() => {
    const grouped = {};
    (plans || []).forEach((item) => {
      if (item.occurrences) {
        item.occurrences.forEach((occ) => {
          const dateKey = (occ.rescheduledTo || occ.scheduledDate || occ.dueDate).split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push({
            ...occ,
            deviceName: item.device?.name,
            status: occ.status,
          });
        });
      }
    });
    return grouped;
  }, [plans]);



  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      {/* Sidebar — Desktop: fixed, Mobile: drawer */}
      {isDesktop ? (
        <CalendarSidebar
          selectedDate={selectedDate}
          onDateSelect={handleCalendarSelect}
          currentMonth={new Date(selectedYear, currentMonth, 1)}
          onMonthChange={(date) => {
            setCurrentMonth(date.getMonth());
            setSelectedYear(date.getFullYear());
            setSelectedDay(null);
          }}
          todayEvents={todayEvents}
          tomorrowEvents={tomorrowEvents}
          showEmpty={false}
          isMobile={false}
        />
      ) : (
        <Drawer open={showSidebar} onOpenChange={setShowSidebar}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Calendar</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <CalendarSidebar
                selectedDate={selectedDate}
                onDateSelect={(day) => {
                  handleCalendarSelect(day);
                  setShowSidebar(false);
                }}
                currentMonth={new Date(selectedYear, currentMonth, 1)}
                onMonthChange={(date) => {
                  setCurrentMonth(date.getMonth());
                  setSelectedYear(date.getFullYear());
                  setSelectedDay(null);
                }}
                todayEvents={todayEvents}
                tomorrowEvents={tomorrowEvents}
                showEmpty={false}
                isMobile={false}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col p-4 md:p-8 space-y-6">
        {/* Hidden identifier for tests */}
        <span className="sr-only">MaintenanceCalendarPage</span>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--healthcare-primary)' }}>
            Calendar Mentenanță
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
            Vizualizați programările de mentenanță preventivă și reprogramați ocurențele scadente
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 text-sm font-semibold flex items-center gap-2 cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)' }}
          >
            Descarcă Formular Nr. 5 (PDF)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg transition-all duration-150 text-sm font-semibold flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: 'var(--healthcare-primary)', color: 'var(--color-bg-primary)' }}
          >
            Creare Plan
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert-success mb-4">{successMsg}</div>
      )}
      {pdfError && (
        <div className="alert-error mb-4" role="alert" aria-live="polite">{pdfError}</div>
      )}

      {/* Toolbar — Integrated CalendarToolBar (responsive) */}
      <div className="mb-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 flex-wrap">
          <label htmlFor="year-select" className="font-medium text-xs md:text-sm" style={{ color: 'var(--color-text-secondary)' }}>An:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedDay(null); }}
            className="border rounded px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm cursor-pointer outline-none transition-all duration-150 focus:ring-2 focus:ring-offset-1"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y} style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>{y}</option>
            ))}
          </select>

          <button
            aria-label="Luna anterioară"
            onClick={prevMonth}
            className="px-2 py-1 md:px-3 md:py-1.5 border rounded transition-all duration-150 text-xs md:text-sm font-medium hover:bg-[var(--color-bg-elevated)] cursor-pointer focus:ring-2 focus:ring-offset-1"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span className="hidden md:inline">‹ Luna anterioară</span>
            <span className="md:hidden">‹</span>
          </button>
          <span className="font-semibold text-xs md:text-sm px-2 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
            {MONTHS_RO[currentMonth]} {selectedYear}
          </span>
          <button
            aria-label="Luna următoare"
            onClick={nextMonth}
            className="px-2 py-1 md:px-3 md:py-1.5 border rounded transition-all duration-150 text-xs md:text-sm font-medium hover:bg-[var(--color-bg-elevated)] cursor-pointer focus:ring-2 focus:ring-offset-1"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span className="hidden md:inline">Luna următoare ›</span>
            <span className="md:hidden">›</span>
          </button>

          {/* Mobile sidebar trigger */}
          {!isDesktop && (
            <button
              onClick={() => setShowSidebar(true)}
              className="px-2 py-1 md:px-3 md:py-1.5 border rounded transition-all duration-150 text-xs md:text-sm font-medium hover:bg-[var(--color-bg-elevated)] cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
              }}
              aria-label="Deschide sidebar calendar"
            >
              📅
            </button>
          )}

          {/* View selector */}
          <div className="ml-auto flex gap-1 border rounded p-1" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-bg-secondary)' }}>
            {['day', 'week', 'month', 'year'].map((view) => (
              <button
                key={view}
                className="text-xs font-medium px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: currentView === view ? 'var(--color-accent)' : 'transparent',
                  color: currentView === view ? 'var(--color-on-primary)' : 'var(--color-text-primary)',
                }}
                onClick={() => setCurrentView(view)}
                aria-pressed={currentView === view}
                aria-label={`Vizualizare ${view}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isPlansLoading && (
        <div className="space-y-3 mb-6" aria-busy="true" aria-label="Se încarcă planurile de mentenanță">
          <div className="skeleton skeleton-row" style={{ height: '24px', width: '320px', borderRadius: '6px' }} />
          <div className="skeleton skeleton-row" style={{ height: '320px', borderRadius: '12px' }} />
        </div>
      )}

      {/* Color legend — simbol + culoare, nu doar culoare (accesibilitate daltonism) */}
      <div className="flex gap-3 mb-4 text-xs flex-wrap font-medium">
        {['PROGRAMAT', 'SCADENT', 'DEPASIT', 'EFECTUAT'].map((status) => (
          <span
            key={status}
            role="status"
            aria-label={`Status: ${getStatusLabel(status)}`}
            className="px-2.5 py-1 rounded flex items-center gap-1"
            style={getStatusStyle(status)}
          >
            <span aria-hidden="true">{getStatusSymbol(status)}</span>
            {status}
          </span>
        ))}
      </div>

      {/* Calendar Views — Responsive (mobile 375px / desktop 1465px) */}
      <div data-testid="maintenance-calendar" className="w-full rounded-lg border flex-1 overflow-hidden flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        {currentView === 'month' && (
          <OccurrencesContext.Provider value={occurrencesByDay}>
            <div className="overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                month={new Date(selectedYear, currentMonth, 1)}
                onMonthChange={handleMonthChange}
                showOutsideDays={false}
                startMonth={new Date(initialYear - 1, 0, 1)}
                endMonth={new Date(initialYear + 3, 11, 31)}
                className="mb-6 w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full",
                  table: "w-full border-collapse",
                  head_row: "flex border-b" + ` [border-color:var(--color-border)]`,
                  head_cell: "flex-1 text-center p-2 text-xs font-medium" + ` [color:var(--color-text-secondary)] [background-color:var(--color-bg-secondary)]`,
                  row: "flex w-full border-b" + ` [border-color:var(--color-border-subtle)]`,
                  cell: "flex-1 p-0 text-center aspect-square min-h-[88px] md:min-h-[102px]",
                  day: "h-full w-full p-1",
                  day_button: "h-full w-full p-1 font-normal flex flex-col items-start justify-start text-sm",
                  nav: "hidden",
                }}
                components={CALENDAR_COMPONENTS}
              />
            </div>
          </OccurrencesContext.Provider>
        )}

        {currentView === 'day' && (
          <CalendarDayView
            selectedDate={selectedDate}
            occurrences={occurrencesForDay(selectedDay || new Date().getDate())}
          />
        )}

        {currentView === 'week' && (
          <CalendarWeekView
            selectedDate={selectedDate}
            occurrencesByDate={occurrencesByDate}
          />
        )}

        {currentView === 'year' && (
          <CalendarYearView
            selectedYear={selectedYear}
            occurrencesByDate={occurrencesByDate}
            selectedDate={selectedDate}
            onDateSelect={handleCalendarSelect}
          />
        )}
      </div>

      {!isPlansLoading && plans.length === 0 && (
        <div className="text-center py-12 rounded-xl border mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Niciun plan de mentenanță pentru anul {selectedYear}.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--healthcare-primary)', color: 'var(--color-bg-primary)' }}
          >
            Creare Plan
          </button>
        </div>
      )}

      {/* Occurrence indicators below calendar */}
      {occurrencesForMonth.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {occurrencesForMonth.map((occ) => {
            const occDay = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate).getDate();
            return (
              <button
                key={occ.id}
                onClick={() => handleDayClick(occDay)}
                aria-label={`Status: ${getStatusLabel(occ.status)} — ${occDay} ${MONTHS_RO[currentMonth]}, ${occ.deviceName}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-150 hover:opacity-80"
                style={getStatusStyle(occ.status)}
              >
                <span aria-hidden="true">{getStatusSymbol(occ.status)}</span>
                {occDay} {MONTHS_RO[currentMonth]} — {occ.deviceName} ({occ.status})
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day details */}
      {selectedDay !== null && (
        <div className="border rounded-xl p-6 transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Apariții mentenanță — {selectedDay} {MONTHS_RO[currentMonth]} {selectedYear}
          </h2>
          {occurrencesForDay(selectedDay).length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nu există apariții pentru această zi.</p>
          ) : (
            occurrencesForDay(selectedDay).map((occ) => (
              <div key={occ.id} className="mb-4 p-4 rounded-lg border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{occ.deviceName}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{occ.planFrequency}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                    <span
                      role="status"
                      aria-label={`Status: ${getStatusLabel(occ.status)}`}
                      className="text-xs px-2.5 py-0.5 rounded font-semibold flex items-center gap-1"
                      style={getStatusStyle(occ.status)}
                    >
                      <span aria-hidden="true">{getStatusSymbol(occ.status)}</span>
                      {occ.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="xl"
                      variant="outline"
                      onClick={() => {
                        setRescheduleOccId(rescheduleOccId === occ.id ? null : occ.id);
                        setRescheduleError('');
                        setRescheduleData({ newDate: '', reason: '' });
                      }}
                    >
                      Reprogramează
                    </Button>
                    <Button
                      size="xl"
                      variant="outline"
                      onClick={() => navigate('/maintenance/execution')}
                    >
                      Execută MPP
                    </Button>
                  </div>
                </div>

                {/* Reschedule form: Drawer on mobile, inline on desktop */}
                {!isDesktop && (
                  <Drawer
                    open={rescheduleOccId === occ.id}
                    onOpenChange={(open) => {
                      if (!open) setRescheduleOccId(null);
                    }}
                  >
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Reprogramare ocurență</DrawerTitle>
                      </DrawerHeader>
                      <div className="px-4 pb-6 space-y-4">
                        <div>
                          <label htmlFor={`drawer-reschedule-date-${occ.id}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data și ora nouă</label>
                          <input
                            id={`drawer-reschedule-date-${occ.id}`}
                            type="datetime-local"
                            value={rescheduleData.newDate}
                            onChange={(e) => setRescheduleData((d) => ({ ...d, newDate: e.target.value }))}
                            className="input-base w-full"
                          />
                        </div>
                        <div>
                          <label htmlFor={`drawer-reschedule-reason-${occ.id}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            Motiv <span style={{ color: 'var(--color-text-tertiary)' }}>(min 5 caractere)</span>
                          </label>
                          <textarea
                            id={`drawer-reschedule-reason-${occ.id}`}
                            value={rescheduleData.reason}
                            onChange={(e) => setRescheduleData((d) => ({ ...d, reason: e.target.value }))}
                            rows={3}
                            placeholder="Ex: Bioinginerul nu era disponibil"
                            className="input-base w-full"
                          />
                        </div>
                        {rescheduleError && (
                          <p role="alert" aria-live="assertive" className="text-xs" style={{ color: 'var(--color-error)' }}>{rescheduleError}</p>
                        )}
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => { setRescheduleOccId(null); setRescheduleError(''); }}
                            className="btn-secondary flex-1"
                          >
                            Anulare
                          </button>
                          <button
                            onClick={() => handleRescheduleSubmit(occ.id)}
                            disabled={rescheduleMutation.isPending}
                            className="btn-primary flex-1 disabled:opacity-50"
                          >
                            {rescheduleMutation.isPending ? 'Se salvează...' : 'Salvează'}
                          </button>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                )}

                {/* Desktop: inline form */}
                {isDesktop && rescheduleOccId === occ.id && (
                  <div className="mt-4 p-4 rounded-lg border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-warning)' }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Reprogramare ocurență</h3>
                    <div className="mb-3">
                      <label htmlFor="cal-reschedule-date" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data și ora nouă</label>
                      <input
                        id="cal-reschedule-date"
                        type="datetime-local"
                        value={rescheduleData.newDate}
                        onChange={(e) => setRescheduleData((d) => ({ ...d, newDate: e.target.value }))}
                        className="input-base w-full"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="cal-reschedule-reason" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Motiv <span style={{ color: 'var(--color-text-tertiary)' }}>(min 5 caractere)</span>
                      </label>
                      <textarea
                        id="cal-reschedule-reason"
                        value={rescheduleData.reason}
                        onChange={(e) => setRescheduleData((d) => ({ ...d, reason: e.target.value }))}
                        rows={2}
                        placeholder="Ex: Bioinginerul nu era disponibil"
                        className="input-base w-full"
                      />
                    </div>
                    {rescheduleError && (
                      <p role="alert" aria-live="assertive" className="text-xs mb-3" style={{ color: 'var(--color-error)' }}>{rescheduleError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRescheduleSubmit(occ.id)}
                        disabled={rescheduleMutation.isPending}
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        {rescheduleMutation.isPending ? 'Se salvează...' : 'Salvează'}
                      </button>
                      <button
                        onClick={() => { setRescheduleOccId(null); setRescheduleError(''); }}
                        className="btn-secondary text-xs"
                      >
                        Anulare
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Plan frequency summary */}
      {plans.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {plans.map((item) => {
            const isOcc = !item.occurrences;
            const deviceName = isOcc ? item.plan?.device?.name : item.device?.name;
            const frequency = isOcc ? item.plan?.frequency : item.frequency;
            if (!deviceName) return null;
            return (
              <span
                key={item.id}
                className="px-2 py-1 bg-[var(--color-info-bg)] text-[var(--color-info)] rounded text-xs"
              >
                {deviceName} — {frequency}
              </span>
            );
          })}
        </div>
      )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <CreatePlanModal
            devices={devices}
            onClose={() => setShowCreateModal(false)}
            onCreate={(data) => createMutation.mutate(data)}
            year={selectedYear}
            isPending={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
