import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock window.matchMedia for react-day-picker
if (!window.matchMedia) {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/maintenancePlans', () => ({
  getMaintenancePlans: vi.fn(() => Promise.resolve({ data: [] })),
  createMaintenancePlan: vi.fn(() => Promise.resolve({})),
  rescheduleOccurrence: vi.fn(() => Promise.resolve({})),
  downloadFormular5: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() => Promise.resolve({ devices: [{ id: 1, name: 'Echograf' }, { id: 2, name: 'Ventilator' }] })),
}));

import MaintenanceCalendarPage from '../../pages/MaintenanceCalendarPage';
import { getMaintenancePlans, createMaintenancePlan, rescheduleOccurrence, downloadFormular5 } from '../../api/maintenancePlans';
import { getDevices } from '../../api/devices';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceCalendarPage — function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    getMaintenancePlans.mockResolvedValue({ data: [] });
    getDevices.mockResolvedValue({ devices: [{ id: 1, name: 'Echograf' }] });
    downloadFormular5.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    createMaintenancePlan.mockResolvedValue({});
    rescheduleOccurrence.mockResolvedValue({});
  });

  it('renders page heading', async () => {
    renderPage();
    expect(await screen.findByText('Calendar Mentenanță')).toBeInTheDocument();
    expect(screen.getByText(/Vizualizați programările/)).toBeInTheDocument();
  });

  it('renders color legend', async () => {
    renderPage();
    expect(await screen.findByText('Calendar Mentenanță')).toBeInTheDocument();
    expect(screen.getByText('PROGRAMAT')).toBeInTheDocument();
    expect(screen.getByText('SCADENT')).toBeInTheDocument();
    expect(screen.getByText('DEPASIT')).toBeInTheDocument();
    expect(screen.getByText('EFECTUAT')).toBeInTheDocument();
  });

  it('getStatusStyle returns correct styles for all statuses', async () => {
    renderPage();
    const programat = screen.getByText('PROGRAMAT');
    const scadent = screen.getByText('SCADENT');
    const depasit = screen.getByText('DEPASIT');
    const efectuat = screen.getByText('EFECTUAT');
    expect(programat).toHaveStyle({ backgroundColor: 'var(--color-success-bg)' });
    expect(scadent).toHaveStyle({ backgroundColor: 'var(--color-warning-bg)' });
    expect(depasit).toHaveStyle({ backgroundColor: 'var(--color-error-bg)' });
    expect(efectuat).toHaveStyle({ backgroundColor: 'var(--color-info-bg)' });
  });

  it('prevMonth navigates to previous month', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const prevBtn = screen.getByLabelText('Luna anterioară');
    fireEvent.click(prevBtn);
    const expectedMonth = CURRENT_MONTH === 0 ? 11 : CURRENT_MONTH - 1;
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    expect(screen.getByText(new RegExp(`^${months[expectedMonth]} `))).toBeInTheDocument();
  });

  it('nextMonth navigates to next month', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const nextBtn = screen.getByLabelText('Luna următoare');
    fireEvent.click(nextBtn);
    const expectedMonth = CURRENT_MONTH === 11 ? 0 : CURRENT_MONTH + 1;
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    expect(screen.getByText(new RegExp(`^${months[expectedMonth]} `))).toBeInTheDocument();
  });

  it('prevMonth wraps to December and decrements year when at January', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const prevBtn = screen.getByLabelText('Luna anterioară');
    for (let i = 0; i <= CURRENT_MONTH; i++) {
      fireEvent.click(prevBtn);
    }
    expect(screen.getByText(/Decembrie \d{4}/)).toBeInTheDocument();
  });

  it('nextMonth wraps to January and increments year when at December', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const nextBtn = screen.getByLabelText('Luna următoare');
    for (let i = 0; i < 12 - CURRENT_MONTH; i++) {
      fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/Ianuarie \d{4}/)).toBeInTheDocument();
  });

  it('handleDownloadPdf calls downloadFormular5 and creates blob', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await userEvent.setup().click(screen.getByText(/Descarcă Formular Nr\. 5/));
    await waitFor(() => {
      expect(downloadFormular5).toHaveBeenCalledWith(CURRENT_YEAR);
    });
  });

  it('handleDownloadPdf shows error on failure', async () => {
    downloadFormular5.mockRejectedValue(new Error('Network error'));
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await userEvent.setup().click(screen.getByText(/Descarcă Formular Nr\. 5/));
    await waitFor(() => {
      expect(screen.getByText(/Nu există planuri/)).toBeInTheDocument();
    });
  });

  it('year dropdown changes selected year', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const yearSelect = screen.getByLabelText('An:');
    fireEvent.change(yearSelect, { target: { value: CURRENT_YEAR - 1 } });
    expect(yearSelect).toHaveValue(String(CURRENT_YEAR - 1));
  });

  it('day click selects and deselects a day', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText('15');
    fireEvent.click(dayEl.closest('button') || dayEl.closest('div'));
    expect(screen.getByText(/Apariții mentenanță — 15/)).toBeInTheDocument();
    fireEvent.click(dayEl.closest('button') || dayEl.closest('div'));
    await waitFor(() => {
      expect(screen.queryByText(/Apariții mentenanță/)).not.toBeInTheDocument();
    });
  });

  it('CreatePlanModal opens and closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await user.click(screen.getByText('Creare Plan'));
    await waitFor(() => {
      expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument();
    });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText(/Creare Plan Mentenanță/)).not.toBeInTheDocument();
    });
  });

  it('CreatePlanModal validates required fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await user.click(screen.getByText('Creare Plan'));
    await waitFor(() => { expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument(); });
    await user.click(screen.getByText('Salvare Plan'));
    expect(screen.getByText('Câmpul Dispozitiv este obligatoriu')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Dispozitiv'), { target: { value: '1' } });
    await user.click(screen.getByText('Salvare Plan'));
    expect(screen.getByText('Câmpul Frecvență este obligatoriu')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Frecvență'), { target: { value: 'LUNAR' } });
    await user.click(screen.getByText('Salvare Plan'));
    expect(screen.getByText('Câmpul Responsabil este obligatoriu')).toBeInTheDocument();
  });

  it('CreatePlanModal submits with all fields filled', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await user.click(screen.getByText('Creare Plan'));
    await waitFor(() => { expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Dispozitiv'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Frecvență'), { target: { value: 'LUNAR' } });
    fireEvent.change(screen.getByLabelText(/Responsabil/), { target: { value: 'Ing. Test' } });
    fireEvent.change(screen.getByLabelText(/Afiliat/), { target: { value: 'Dept. Bio' } });
    await user.click(screen.getByText('Salvare Plan'));
    await waitFor(() => {
      expect(createMaintenancePlan).toHaveBeenCalledTimes(1);
      const callArg = createMaintenancePlan.mock.calls[0][0];
      expect(callArg.deviceId).toBe(1);
      expect(callArg.frequency).toBe('LUNAR');
      expect(callArg.responsibleName).toBe('Ing. Test');
    });
  });

  it('with occurrences data shows day badges', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await waitFor(() => {
      expect(screen.getAllByText('PROGRAMAT').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('day click with occurrences shows occurrence details', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'SCADENT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    expect(screen.getByText(/Apariții mentenanță/)).toBeInTheDocument();
    expect(screen.getAllByText('Echograf').length).toBeGreaterThan(0);
  });

  it('reschedule button opens inline form', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    await screen.findAllByText('Echograf');
    const rescheduleBtn = screen.getByText('Reprogramează');
    fireEvent.click(rescheduleBtn);
    expect(screen.getByText('Data și ora nouă')).toBeInTheDocument();
    expect(screen.getByText(/Motiv/)).toBeInTheDocument();
  });

  it('reschedule form validates date and reason', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    await screen.findAllByText('Echograf');
    fireEvent.click(screen.getByText('Reprogramează'));
    fireEvent.click(screen.getByText('Salvează'));
    expect(screen.getByText('Data nouă este obligatorie')).toBeInTheDocument();
    const dateInput = screen.getAllByDisplayValue('')[0];
    fireEvent.change(dateInput, { target: { value: '2026-07-01T10:00' } });
    fireEvent.click(screen.getByText('Salvează'));
    expect(screen.getByText('Motivul trebuie să aibă cel puțin 5 caractere')).toBeInTheDocument();
  });

  it('reschedule form submits valid data', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    await screen.findAllByText('Echograf');
    fireEvent.click(screen.getByText('Reprogramează'));
    const dateInput = screen.getAllByDisplayValue('')[0];
    fireEvent.change(dateInput, { target: { value: '2026-07-01T10:00' } });
    fireEvent.change(screen.getByPlaceholderText(/Bioinginerul/), { target: { value: 'Reason for reschedule' } });
    fireEvent.click(screen.getByText('Salvează'));
    await waitFor(() => {
      expect(rescheduleOccurrence).toHaveBeenCalled();
    });
  });

  it('reschedule cancel closes the form', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    await screen.findAllByText('Echograf');
    fireEvent.click(screen.getByText('Reprogramează'));
    expect(screen.getByText('Data și ora nouă')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText('Data și ora nouă')).not.toBeInTheDocument();
    });
  });

  it('Execută MPP navigates to execution page', async () => {
    const day = 10;
    const dateStr = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    getMaintenancePlans.mockResolvedValue({
      data: [{
        id: 'occ-1',
        scheduledDate: dateStr,
        status: 'PROGRAMAT',
        plan: { frequency: 'LUNAR', device: { name: 'Echograf' } },
      }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText(String(day));
    fireEvent.click(dayEl.closest('button') || dayEl);
    await screen.findAllByText('Echograf');
    fireEvent.click(screen.getByText('Execută MPP'));
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/execution');
  });

  it('empty day shows no occurrences message', async () => {
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    const dayEl = screen.getByText('15');
    fireEvent.click(dayEl.closest('button') || dayEl);
    await waitFor(() => {
      expect(screen.getByText('Nu există apariții pentru această zi.')).toBeInTheDocument();
    });
  });

  it('plan frequency summary shows when plans exist', async () => {
    getMaintenancePlans.mockResolvedValue({
      data: [{ id: 'plan-1', device: { name: 'Echograf' }, frequency: 'LUNAR', occurrences: [] }],
    });
    renderPage();
    await screen.findByText('Calendar Mentenanță');
    await waitFor(() => {
      expect(screen.getByText('Echograf — LUNAR')).toBeInTheDocument();
    });
  });
});
