import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getMaintenancePlans,
  createMaintenancePlan,
  rescheduleOccurrence,
  downloadFormular5,
} from '../api/maintenancePlans';
import { getDevices } from '../api/devices';
import { Calendar } from '../components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../components/ui/drawer';
import { Button } from '../components/ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const FREQUENCIES = ['LUNAR', 'BIMESTRIAL', 'TRIMESTRIAL', 'SEMESTRIAL', 'ANUAL'];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

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

export default function MaintenanceCalendarPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rescheduleOccId, setRescheduleOccId] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', reason: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pdfError, setPdfError] = useState('');

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

  const { data: calendarData } = useQuery({
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
      setTimeout(() => setSuccessMsg(''), 4000);
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
      setTimeout(() => setSuccessMsg(''), 4000);
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
    } catch {
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
  const occurrencesForMonth = plans.flatMap((item) => {
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
  });

  const occurrencesForDay = (day) =>
    occurrencesForMonth.filter(
      (occ) => new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate).getDate() === day
    );



  return (
    <div className="p-4 md:p-8 space-y-6">
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

      {/* Year dropdown + month navigation */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label htmlFor="year-select" className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>An:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedDay(null); }}
          className="border rounded-lg px-3 py-1.5 text-sm cursor-pointer outline-none transition-all duration-150"
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
          className="px-3 py-1.5 border rounded-lg transition-all duration-150 text-sm font-medium hover:bg-[var(--color-bg-elevated)] cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          ‹ Luna anterioară
        </button>
        <span className="font-semibold text-sm px-2" style={{ color: 'var(--color-text-primary)' }}>
          {MONTHS_RO[currentMonth]} {selectedYear}
        </span>
        <button
          aria-label="Luna următoare"
          onClick={nextMonth}
          className="px-3 py-1.5 border rounded-lg transition-all duration-150 text-sm font-medium hover:bg-[var(--color-bg-elevated)] cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          Luna următoare ›
        </button>
      </div>

      {/* Color legend */}
      <div className="flex gap-3 mb-4 text-xs flex-wrap font-medium">
        <span className="px-2.5 py-1 rounded" style={getStatusStyle('PROGRAMAT')}>PROGRAMAT</span>
        <span className="px-2.5 py-1 rounded" style={getStatusStyle('SCADENT')}>SCADENT</span>
        <span className="px-2.5 py-1 rounded" style={getStatusStyle('DEPASIT')}>DEPASIT</span>
        <span className="px-2.5 py-1 rounded" style={getStatusStyle('EFECTUAT')}>EFECTUAT</span>
      </div>

      {/* Calendar */}
      <div data-testid="maintenance-calendar">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          month={new Date(selectedYear, currentMonth, 1)}
          onMonthChange={handleMonthChange}
          captionLayout="dropdown"
          showOutsideDays={false}
          startMonth={new Date(CURRENT_YEAR - 1, 0, 1)}
          endMonth={new Date(CURRENT_YEAR + 3, 11, 31)}
          className="mb-6"
          classNames={{
            day: "min-h-[64px] p-1",
            day_button: "h-auto min-h-[64px] w-full p-1 font-normal",
          }}
        />
      </div>

      {/* Occurrence indicators below calendar */}
      {occurrencesForMonth.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {occurrencesForMonth.map((occ) => {
            const occDay = new Date(occ.rescheduledTo || occ.scheduledDate || occ.dueDate).getDate();
            return (
              <button
                key={occ.id}
                onClick={() => handleDayClick(occDay)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-150 hover:opacity-80"
                style={getStatusStyle(occ.status)}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusStyle(occ.status).color }} />
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
                    <span className="text-xs px-2.5 py-0.5 rounded font-semibold" style={getStatusStyle(occ.status)}>
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
                          <label htmlFor={`drawer-reschedule-date-${occ.id}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data nouă</label>
                          <input
                            id={`drawer-reschedule-date-${occ.id}`}
                            type="date"
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
                      <label htmlFor="cal-reschedule-date" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data nouă</label>
                      <input
                        id="cal-reschedule-date"
                        type="date"
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
  );
}

function CreatePlanModal({ devices, onClose, onCreate, year, isPending }) {
  const [deviceId, setDeviceId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleAffil, setResponsibleAffil] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    setFormError('');
    if (!deviceId) {
      setFormError('Câmpul Dispozitiv este obligatoriu');
      return;
    }
    if (!frequency) {
      setFormError('Câmpul Frecvență este obligatoriu');
      return;
    }
    if (!responsibleName.trim()) {
      setFormError('Câmpul Responsabil este obligatoriu');
      return;
    }
    onCreate({ deviceId: parseInt(deviceId), frequency, year, responsibleName, responsibleAffil: responsibleAffil || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity" style={{ backgroundColor: 'var(--overlay-strong)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border transition-all duration-150" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>Creare Plan Mentenanță — {year}</h2>

        <div className="mb-4">
          <label htmlFor="device-select" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Dispozitiv
          </label>
          <select
            id="device-select"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează dispozitiv --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="freq-select" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Frecvență
          </label>
          <select
            id="freq-select"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>-- Selectează frecvență --</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f} style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="responsible-input" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Responsabil <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="responsible-input"
            type="text"
            value={responsibleName}
            onChange={(e) => setResponsibleName(e.target.value)}
            placeholder="Ing. Ion Popescu"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="affil-input" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Afiliat <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'normal' }} className="text-xs">(opțional)</span>
          </label>
          <input
            id="affil-input"
            type="text"
            value={responsibleAffil}
            onChange={(e) => setResponsibleAffil(e.target.value)}
            placeholder="Ex: Dept. Bioinginerie"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          />
        </div>

        {formError && <p role="alert" aria-live="assertive" className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all duration-150 font-semibold cursor-pointer text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'transparent' }}
          >
            Anulare
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-150 font-semibold cursor-pointer text-sm"
            style={{ backgroundColor: 'var(--healthcare-primary)', color: 'var(--color-bg-primary)' }}
          >
            {isPending ? 'Se salvează...' : 'Salvare Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
