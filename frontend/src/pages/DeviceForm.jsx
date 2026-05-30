import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { deviceSchema } from '../schemas/deviceSchema';
import api from '../api/axios';
import 'react-datepicker/dist/react-datepicker.css';

const RISK_CLASSES = [
  { value: 'I', label: 'I' },
  { value: 'IIa', label: 'IIa' },
  { value: 'IIb', label: 'IIb' },
  { value: 'III', label: 'III' },
];

const STATUSES = [
  { value: 'FUNCTIONAL', label: 'Funcțional' },
  { value: 'IN_REPARATIE', label: 'În reparație' },
  { value: 'DEFECT', label: 'Defect' },
  { value: 'CASAT', label: 'Casat' },
  { value: 'IMPRUMUTAT', label: 'Împrumutat' },
  { value: 'REZERVA', label: 'Rezervă' },
];

export default function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(deviceSchema),
    mode: 'onBlur',
    defaultValues: {
      status: 'FUNCTIONAL',
      currency: 'MDL',
      riskClass: 'IIb',
    },
  });

  // Query sections
  const { data: sectionsData = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => api.get('/sections').then(r => r.data),
  });

  const sectionOptions = sectionsData.map(s => ({ value: s.id, label: s.name }));

  // Query device in edit mode
  const { isLoading: deviceLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => api.get(`/devices/${id}`).then(r => r.data),
    enabled: !!id,
    onSuccess: (data) => {
      reset({
        ...data,
        riskClass: data.riskClass || 'IIb',
        status: data.status || 'FUNCTIONAL',
        currency: data.currency || 'MDL',
      });
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => api.post('/devices', formData),
    onSuccess: () => {
      toast.success('Dispozitiv adăugat cu succes');
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      navigate('/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Eroare la adăugare');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData) => api.put(`/devices/${id}`, formData),
    onSuccess: () => {
      toast.success('Dispozitiv actualizat cu succes');
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device', id] });
      navigate('/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Eroare la actualizare');
    },
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => api.get(`/devices/${id}/fisa-pdf`, { responseType: 'blob' }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fisa_DM_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF descărcat');
    },
    onError: () => {
      toast.error('Eroare la descărcarea PDF');
    },
  });

  const onSubmit = (data) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (deviceLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" role="status">
        <p className="text-gray-400">Se încarcă…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">
          {isEditMode ? 'Editare DM' : 'Adaugă Dispozitiv Medical'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* SECȚIUNEA 1: IDENTIFICARE */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">1. Identificare</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="inventoryNumber" className="label-base">
                  Numărul inventarului *
                </label>
                <input
                  {...register('inventoryNumber')}
                  id="inventoryNumber"
                  placeholder="EX: DM-2024-001"
                  className="input-base w-full"
                />
                {errors.inventoryNumber && (
                  <p className="text-red-400 text-sm mt-1" role="alert">
                    {errors.inventoryNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="serialNumber" className="label-base">
                  Seria
                </label>
                <input
                  {...register('serialNumber')}
                  id="serialNumber"
                  className="input-base w-full"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="name" className="label-base">
                  Denumire *
                </label>
                <input
                  {...register('name')}
                  id="name"
                  className="input-base w-full"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="model" className="label-base">
                  Model
                </label>
                <input
                  {...register('model')}
                  id="model"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="manufacturer" className="label-base">
                  Producător
                </label>
                <input
                  {...register('manufacturer')}
                  id="manufacturer"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="countryOfOrigin" className="label-base">
                  Țara de origine
                </label>
                <input
                  {...register('countryOfOrigin')}
                  id="countryOfOrigin"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="yearMade" className="label-base">
                  Anul fabricării
                </label>
                <input
                  {...register('yearMade')}
                  id="yearMade"
                  type="number"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="ceMarking" className="label-base">
                  Marcaj CE
                </label>
                <input
                  {...register('ceMarking')}
                  id="ceMarking"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="cndCode" className="label-base">
                  Cod CND
                </label>
                <input
                  {...register('cndCode')}
                  id="cndCode"
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* SECȚIUNEA 2: CLASIFICARE */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">2. Clasificare</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="riskClass" className="label-base">
                  Clasa de risc *
                </label>
                <Controller
                  control={control}
                  name="riskClass"
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="riskClass"
                      options={RISK_CLASSES}
                      value={RISK_CLASSES.find(r => r.value === field.value)}
                      onChange={(option) => field.onChange(option?.value)}
                      classNamePrefix="select"
                      classNames={{
                        control: () => 'bg-gray-800 border border-gray-600 rounded focus-within:ring-2 focus-within:ring-cyan-400',
                        input: () => 'text-white',
                        option: () => 'text-gray-900',
                      }}
                    />
                  )}
                />
                {errors.riskClass && (
                  <p className="text-red-400 text-sm mt-1" role="alert">
                    {errors.riskClass.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECȚIUNEA 3: STATUS & EXPLOATARE */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">3. Status & Exploatare</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="label-base">
                  Status *
                </label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="status"
                      options={STATUSES}
                      value={STATUSES.find(s => s.value === field.value)}
                      onChange={(option) => field.onChange(option?.value)}
                      classNamePrefix="select"
                      classNames={{
                        control: () => 'bg-gray-800 border border-gray-600 rounded focus-within:ring-2 focus-within:ring-cyan-400',
                        input: () => 'text-white',
                        option: () => 'text-gray-900',
                      }}
                    />
                  )}
                />
                {errors.status && (
                  <p className="text-red-400 text-sm mt-1" role="alert">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="sectionId" className="label-base">
                  Secție *
                </label>
                <Controller
                  control={control}
                  name="sectionId"
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="sectionId"
                      options={sectionOptions}
                      value={sectionOptions.find(s => s.value === parseInt(field.value))}
                      onChange={(option) => field.onChange(option?.value)}
                      classNamePrefix="select"
                      classNames={{
                        control: () => 'bg-gray-800 border border-gray-600 rounded focus-within:ring-2 focus-within:ring-cyan-400',
                        input: () => 'text-white',
                        option: () => 'text-gray-900',
                      }}
                    />
                  )}
                />
                {errors.sectionId && (
                  <p className="text-red-400 text-sm mt-1" role="alert">
                    {errors.sectionId.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="room" className="label-base">
                  Cameră/Locație
                </label>
                <input
                  {...register('room')}
                  id="room"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="maintenanceFreq" className="label-base">
                  Frecvență mentenanță (zile)
                </label>
                <input
                  {...register('maintenanceFreq')}
                  id="maintenanceFreq"
                  type="number"
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* SECȚIUNEA 4: DATE FINANCIARE */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">4. Date Financiare</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="acquisitionDate" className="label-base">
                  Data achiziției
                </label>
                <Controller
                  control={control}
                  name="acquisitionDate"
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      id="acquisitionDate"
                      selected={field.value instanceof Date ? field.value : null}
                      onChange={(date) => field.onChange(date)}
                      placeholderText="Selectează data"
                      className="input-base w-full"
                      dateFormat="dd/MM/yyyy"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="warrantyEndDate" className="label-base">
                  Garanție până la
                </label>
                <Controller
                  control={control}
                  name="warrantyEndDate"
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      id="warrantyEndDate"
                      selected={field.value instanceof Date ? field.value : null}
                      onChange={(date) => field.onChange(date)}
                      placeholderText="Selectează data"
                      className="input-base w-full"
                      dateFormat="dd/MM/yyyy"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="acquisitionValue" className="label-base">
                  Valoare achiziție
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('acquisitionValue')}
                    id="acquisitionValue"
                    type="number"
                    step="0.01"
                    className="input-base flex-1"
                  />
                  <input
                    {...register('currency')}
                    type="text"
                    className="input-base w-20"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label htmlFor="residualValue" className="label-base">
                  Valoare reziduală
                </label>
                <input
                  {...register('residualValue')}
                  id="residualValue"
                  type="number"
                  step="0.01"
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* SECȚIUNEA 5: DATE TEHNICE */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">5. Date Tehnice</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="voltage" className="label-base">
                  Tensiune (V)
                </label>
                <input
                  {...register('voltage')}
                  id="voltage"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="frequency" className="label-base">
                  Frecvență (Hz)
                </label>
                <input
                  {...register('frequency')}
                  id="frequency"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="power" className="label-base">
                  Putere (W)
                </label>
                <input
                  {...register('power')}
                  id="power"
                  className="input-base w-full"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="accessories" className="label-base">
                  Accesorii
                </label>
                <input
                  {...register('accessories')}
                  id="accessories"
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* SECȚIUNEA 6: OBSERVAȚII */}
          <div className="card-base p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-6">6. Observații</h2>
            <div>
              <label htmlFor="notes" className="label-base">
                Note
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows="4"
                className="input-base w-full"
              />
            </div>
          </div>

          {/* ACȚIUNI */}
          <div className="flex gap-4 justify-between">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="btn-secondary px-6 py-2"
            >
              Anulare
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={() => downloadPdfMutation.mutate()}
                disabled={downloadPdfMutation.isPending}
                className="btn-primary px-6 py-2"
              >
                {downloadPdfMutation.isPending ? 'Se descarcă…' : '📄 Descarcă Fișă PDF'}
              </button>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary px-6 py-2"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Se salvează…'
                : isEditMode
                ? 'Salvare modificări'
                : 'Adaugă DM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
