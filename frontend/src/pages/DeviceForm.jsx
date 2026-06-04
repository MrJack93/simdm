import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeviceTimeline from '../components/DeviceTimeline';
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

function StepIndicator({ currentStep, totalSteps, steps }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="mb-8">
      {/* Desktop: Full visual indicator */}
      <div className="hidden md:flex gap-2 items-center">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all flex-shrink-0"
              style={{
                backgroundColor:
                  idx < currentStep
                    ? 'var(--color-success)'
                    : idx === currentStep
                    ? 'var(--color-accent)'
                    : 'var(--color-bg-tertiary)',
                color: idx < currentStep || idx === currentStep ? '#1a1a1a' : 'var(--color-text-secondary)',
                border: '1px solid',
                borderColor: idx <= currentStep ? 'transparent' : 'var(--color-border)',
              }}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2"
                style={{
                  backgroundColor: idx < currentStep ? 'var(--color-success)' : 'var(--color-border)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Simple counter */}
      <div className="md:hidden flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full font-bold flex-shrink-0"
          style={{ backgroundColor: 'var(--color-accent)', color: '#1a1a1a' }}
        >
          {currentStep + 1}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {steps[currentStep]}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Pasul {currentStep + 1}/{totalSteps}
          </p>
        </div>
      </div>

      {/* Desktop label */}
      <div className="hidden md:block mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Pasul {currentStep + 1} din {totalSteps}: <span style={{ color: 'var(--color-accent)' }} className="font-bold">{steps[currentStep]}</span>
      </div>
    </div>
  );
}

export default function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const steps = ['Identificare', 'Clasificare', 'Confirmă'];

  const { control, register, handleSubmit, reset, getValues, formState: { errors } } = useForm({
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
    queryFn: () => api.get('/sections').then((r) => r.data),
  });

  const sectionOptions = sectionsData.map((s) => ({ value: s.id, label: s.name }));

  // Query device in edit mode
  const { isLoading: deviceLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => api.get(`/devices/${id}`).then((r) => r.data),
    enabled: !!id,
    onSuccess: (data) => {
      reset({
        ...data,
        riskClass: data.riskClass || 'IIb',
        status: data.status || 'FUNCTIONAL',
        currency: data.currency || 'MDL',
        sectionId: data.sectionId || '',
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

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!id) {
      toast.error('Salvează mai întâi dispozitivul înainte de upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingDoc(true);
    try {
      await api.post(`/devices/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(true);
      toast.success('Document încărcat cu succes');
      queryClient.invalidateQueries({ queryKey: ['device', id] });
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      toast.error('Eroare la upload: ' + error.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  if (deviceLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" role="status" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă dispozitivul…</p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {isEditMode ? 'Editare Dispozitiv Medical' : 'Adaugă Dispozitiv Medical'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="mb-8 text-sm">
          Completează formularul pas cu pas
        </p>

        <StepIndicator currentStep={currentStep} totalSteps={steps.length} steps={steps} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 0: IDENTIFICARE */}
          {currentStep === 0 && (
            <div className="card-base p-6 animate-slide-up space-y-4">
              <h2 className="text-xl font-semibold">Identificare Dispozitiv</h2>

              <div>
                <label htmlFor="inventoryNumber" className="label-base">
                  Numărul inventarului *
                </label>
                <input
                  {...register('inventoryNumber')}
                  id="inventoryNumber"
                  placeholder="EX: DM-2024-001"
                  className="input-base w-full"
                  aria-invalid={!!errors.inventoryNumber}
                  aria-describedby={errors.inventoryNumber ? 'inventoryNumber-error' : undefined}
                />
                {errors.inventoryNumber && (
                  <p id="inventoryNumber-error" style={{ color: 'var(--color-error)' }} className="text-sm mt-1" role="alert">
                    {errors.inventoryNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="label-base">
                  Denumire *
                </label>
                <input
                  {...register('name')}
                  id="name"
                  placeholder="Nume dispozitiv"
                  className="input-base w-full"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" style={{ color: 'var(--color-error)' }} className="text-sm mt-1" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="model" className="label-base">
                    Model
                  </label>
                  <input {...register('model')} id="model" className="input-base w-full" />
                </div>

                <div>
                  <label htmlFor="serialNumber" className="label-base">
                    Seria
                  </label>
                  <input {...register('serialNumber')} id="serialNumber" className="input-base w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manufacturer" className="label-base">
                    Producător
                  </label>
                  <input {...register('manufacturer')} id="manufacturer" className="input-base w-full" />
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
              </div>
            </div>
          )}

          {/* STEP 1: CLASIFICARE (Risk + Status + Section + Important Dates) */}
          {currentStep === 1 && (
            <div className="card-base p-6 animate-slide-up space-y-4">
              <h2 className="text-xl font-semibold">Clasificare Risc și Status</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={RISK_CLASSES.find((r) => r.value === field.value)}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isSearchable={false}
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected ? 'var(--color-accent)' : 'transparent',
                            color: state.isSelected ? '#1a1a1a' : 'var(--color-text-primary)',
                          }),
                        }}
                      />
                    )}
                  />
                </div>

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
                        value={STATUSES.find((s) => s.value === field.value)}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isSearchable={false}
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected ? 'var(--color-accent)' : 'transparent',
                            color: state.isSelected ? '#1a1a1a' : 'var(--color-text-primary)',
                          }),
                        }}
                      />
                    )}
                  />
                </div>
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
                      value={sectionOptions.find((s) => s.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                      placeholder="Selectează secție"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? 'var(--color-accent)' : 'transparent',
                          color: state.isSelected ? '#1a1a1a' : 'var(--color-text-primary)',
                        }),
                      }}
                    />
                  )}
                />
                {errors.sectionId && (
                  <p style={{ color: 'var(--color-error)' }} className="text-sm mt-1" role="alert">
                    {errors.sectionId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="acquisitionDate" className="label-base">
                    Data achiziției
                  </label>
                  <Controller
                    control={control}
                    name="acquisitionDate"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        dateFormat="dd/MM/yyyy"
                        className="input-base w-full"
                        placeholderText="DD/MM/YYYY"
                      />
                    )}
                  />
                </div>

                <div>
                  <label htmlFor="warrantyExpiry" className="label-base">
                    Data expirării garanției
                  </label>
                  <Controller
                    control={control}
                    name="warrantyExpiry"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        dateFormat="dd/MM/yyyy"
                        className="input-base w-full"
                        placeholderText="DD/MM/YYYY"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRMĂ + ADVANCED FIELDS */}
          {currentStep === 2 && (
            <div className="card-base p-6 animate-slide-up space-y-4">
              <h2 className="text-xl font-semibold">Confirmă și Finalizare</h2>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                Verifică datele înainte de a salva
              </p>

              {/* Summary Card */}
              <div
                className="mt-4 p-4 rounded-lg space-y-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--color-accent)' }}>Informații Principale</div>
                <div>
                  <span style={{ color: 'var(--color-accent)' }} className="font-bold">
                    Inventar:
                  </span>{' '}
                  {getValues('inventoryNumber')}
                </div>
                <div>
                  <span style={{ color: 'var(--color-accent)' }} className="font-bold">
                    Denumire:
                  </span>{' '}
                  {getValues('name')}
                </div>
                <div>
                  <span style={{ color: 'var(--color-accent)' }} className="font-bold">
                    Clasa risc:
                  </span>{' '}
                  {getValues('riskClass')}
                </div>
                <div>
                  <span style={{ color: 'var(--color-accent)' }} className="font-bold">
                    Status:
                  </span>{' '}
                  {STATUSES.find((s) => s.value === getValues('status'))?.label}
                </div>
              </div>

              {/* Advanced Fields Tab */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-3 rounded-lg text-left font-semibold transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: showAdvanced ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  border: `1px solid ${showAdvanced ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
              >
                {showAdvanced ? '▼' : '▶'} Câmpuri Avansate (Opțional)
              </button>

              {showAdvanced && (
                <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <h3 className="font-semibold">Date Suplimentare</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="location" className="label-base">
                        Locație / Spațiu
                      </label>
                      <input {...register('location')} id="location" className="input-base w-full" />
                    </div>

                    <div>
                      <label htmlFor="countryOfOrigin" className="label-base">
                        Țara de origine
                      </label>
                      <input {...register('countryOfOrigin')} id="countryOfOrigin" className="input-base w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="purchasePrice" className="label-base">
                        Preț achiziție
                      </label>
                      <input
                        {...register('purchasePrice')}
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        className="input-base w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="currency" className="label-base">
                        Monedă
                      </label>
                      <select {...register('currency')} id="currency" className="input-base w-full">
                        <option value="MDL">MDL</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ceMarking" className="label-base">
                        Marcaj CE
                      </label>
                      <input {...register('ceMarking')} id="ceMarking" className="input-base w-full" />
                    </div>

                    <div>
                      <label htmlFor="cndCode" className="label-base">
                        Cod CND
                      </label>
                      <input {...register('cndCode')} id="cndCode" className="input-base w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="maintenanceSchedule" className="label-base">
                        Schema mentenanță (luni)
                      </label>
                      <input
                        {...register('maintenanceSchedule')}
                        id="maintenanceSchedule"
                        type="number"
                        className="input-base w-full"
                        placeholder="Ex: 12 (anual)"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="label-base">
                      Note / Observații
                    </label>
                    <textarea
                      {...register('notes')}
                      id="notes"
                      rows="3"
                      className="input-base w-full"
                      placeholder="Informații suplimentare..."
                    />
                  </div>
                </div>
              )}

              {/* Edit Mode: PDF + Document Upload */}
              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={() => downloadPdfMutation.mutate()}
                    disabled={downloadPdfMutation.isPending}
                    className="btn-secondary w-full"
                  >
                    📄 Descarcă Fișa PDF
                  </button>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                    <label htmlFor="document" className="label-base block mb-2">
                      📎 Atașează Document (Manual, Certificat, Factură, Pașaport)
                    </label>
                    <input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDoc}
                      className="input-base w-full"
                    />
                    {uploadingDoc && (
                      <span className="text-sm mt-2 inline-block" style={{ color: 'var(--color-accent)' }}>⏳ Se încarcă...</span>
                    )}
                    {uploadSuccess && (
                      <span className="text-sm mt-2 inline-block" style={{ color: 'var(--color-success)' }}>✓ Fișier încărcat</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              ← Înapoi
            </button>

            {currentStep < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="btn-primary flex-1">
                Înainte →
              </button>
            ) : (
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Se salvează…' : '✓ Salvare'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="btn-secondary w-full mt-2"
          >
            Anulare
          </button>
        </form>

        {isEditMode && id && (
          <div className="max-w-2xl mt-2 pb-8">
            <DeviceTimeline deviceId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
