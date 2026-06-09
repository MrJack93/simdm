import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaintenancePlans, createMaintenancePlan } from '../api/maintenancePlans';
import { getDevices } from '../api/devices';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const FREQUENCIES = ['LUNAR', 'BIMESTRIAL', 'TRIMESTRIAL', 'SEMESTRIAL', 'ANUAL'];

export default function MaintenanceCalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: plansData } = useQuery({
    queryKey: ['maintenancePlans', year],
    queryFn: () => getMaintenancePlans({ year }),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const plans = plansData?.data || [];
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

  const prevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Occurrences for current month
  const occurrencesForMonth = plans.flatMap((plan) =>
    (plan.occurrences || [])
      .filter((occ) => {
        const d = new Date(occ.dueDate || occ.scheduledDate);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((occ) => ({
        ...occ,
        planFrequency: plan.frequency,
        deviceName: plan.device?.name,
      }))
  );

  const occurrencesForDay = (day) =>
    occurrencesForMonth.filter(
      (occ) => new Date(occ.dueDate || occ.scheduledDate).getDate() === day
    );

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="p-4">
      {/* Hidden identifier for tests */}
      <span className="sr-only">MaintenanceCalendarPage</span>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Calendar Mentenanță — {MONTHS_RO[month]} {year}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Creare Plan
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{successMsg}</div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button
          aria-label="Luna anterioară"
          onClick={prevMonth}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          ‹ Luna anterioară
        </button>
        <span className="font-semibold">
          {MONTHS_RO[month]} {year}
        </span>
        <button
          aria-label="Luna următoare"
          onClick={nextMonth}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          Luna următoare ›
        </button>
      </div>

      {/* Plan frequency summary */}
      {plans.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {plans.map((plan) => (
            <span
              key={plan.id}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
            >
              {plan.device?.name} — {plan.frequency}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">
            {d}
          </div>
        ))}
        {/* Empty cells before first day */}
        {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayOccs = occurrencesForDay(day);
          return (
            <div
              key={day}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={`min-h-[48px] p-1 border rounded cursor-pointer hover:bg-gray-50 ${
                selectedDay === day ? 'bg-blue-50 border-blue-400' : 'border-gray-200'
              }`}
            >
              <span className="text-sm font-medium">{day}</span>
              {dayOccs.map((occ) => (
                <div
                  key={occ.id}
                  className={`text-xs mt-1 rounded px-1 ${
                    occ.status === 'DEPASIT'
                      ? 'bg-red-200 text-red-800'
                      : occ.status === 'SCADENT'
                        ? 'bg-yellow-200 text-yellow-800'
                        : occ.status === 'EFECTUAT'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {occ.status}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDay !== null && (
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Apariții mentenanță — {selectedDay} {MONTHS_RO[month]}</h2>
          {occurrencesForDay(selectedDay).length === 0 ? (
            <p className="text-gray-500 text-sm">Nu există apariții pentru această zi.</p>
          ) : (
            occurrencesForDay(selectedDay).map((occ) => (
              <div key={occ.id} className="mb-2 p-2 bg-white rounded border">
                <span className="font-medium">{occ.deviceName}</span>
                {' — '}
                <span>{occ.planFrequency}</span>
                {' — '}
                <span>{occ.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <CreatePlanModal
          devices={devices}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
          year={year}
        />
      )}
    </div>
  );
}

function CreatePlanModal({ devices, onClose, onCreate, year }) {
  const [deviceId, setDeviceId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
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
    onCreate({ deviceId: parseInt(deviceId), frequency, year, responsibleName });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Creare Plan Mentenanță</h2>

        <div className="mb-3">
          <label htmlFor="device-select" className="block font-medium mb-1">
            Dispozitiv
          </label>
          <select
            id="device-select"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Selectează dispozitiv --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="freq-select" className="block font-medium mb-1">
            Frecvență
          </label>
          <select
            id="freq-select"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Selectează frecvență --</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="responsible-input" className="block font-medium mb-1">
            Responsabil
          </label>
          <input
            id="responsible-input"
            type="text"
            value={responsibleName}
            onChange={(e) => setResponsibleName(e.target.value)}
            placeholder="Ing. Ion Popescu"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Anulare
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Salvare Plan
          </button>
        </div>
      </div>
    </div>
  );
}
