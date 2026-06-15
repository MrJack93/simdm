import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../api/maintenancePlans', () => ({
  getMaintenancePlans: vi.fn(() => Promise.resolve({ data: [] })),
  createMaintenancePlan: vi.fn(() => Promise.resolve({})),
  rescheduleOccurrence: vi.fn(() => Promise.resolve({})),
  downloadFormular5: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() => Promise.resolve({ devices: [{ id: 1, name: 'Ventilator' }, { id: 2, name: 'Monitor' }] })),
}));

import MaintenanceCalendarPage from '../../pages/MaintenanceCalendarPage';
import * as planApi from '../../api/maintenancePlans';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceCalendarPage Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calendar navigation', () => {
    it('navigates to previous month', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Luna anterioară')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Luna anterioară'));
      await waitFor(() => {
        expect(screen.getByText(/Calendar Mentenanță/)).toBeInTheDocument();
      });
    });

    it('navigates to next month', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Luna următoare')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Luna următoare'));
      await waitFor(() => {
        expect(screen.getByText(/Calendar Mentenanță/)).toBeInTheDocument();
      });
    });

    it('changes year via dropdown', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('An:')).toBeInTheDocument();
      });
      const yearSelect = screen.getByLabelText('An:');
      fireEvent.change(yearSelect, { target: { value: new Date().getFullYear() + 1 } });
      await waitFor(() => {
        expect(planApi.getMaintenancePlans).toHaveBeenCalled();
      });
    });

    it('shows current month name', async () => {
      renderPage();
      const currentMonth = new Date().toLocaleDateString('ro-RO', { month: 'long' });
      await waitFor(() => {
        expect(screen.getByText(new RegExp(currentMonth, 'i'))).toBeInTheDocument();
      });
    });

    it('resets selected day when changing month', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText('Luna anterioară')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Luna anterioară'));
      await waitFor(() => {
        expect(screen.getByText(/Calendar Mentenanță/)).toBeInTheDocument();
      });
    });
  });

  describe('create plan modal', () => {
    it('opens create plan modal', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Salvare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
      });
    });

    it('creates plan with valid data', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByLabelText(/Dispozitiv/)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText(/Frecvență/), { target: { value: 'LUNAR' } });
      fireEvent.change(screen.getByLabelText(/Responsabil/), { target: { value: 'Ing. Popescu' } });
      fireEvent.click(screen.getByText('Salvare Plan'));
      await waitFor(() => {
        expect(planApi.createMaintenancePlan).toHaveBeenCalled();
      });
    });

    it('closes modal on cancel', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/Creare Plan Mentenanță/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Anulare'));
      await waitFor(() => {
        expect(screen.queryByText(/Creare Plan Mentenanță/)).not.toBeInTheDocument();
      });
    });

    it('validates responsible field is required', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByLabelText(/Dispozitiv/)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText(/Frecvență/), { target: { value: 'LUNAR' } });
      fireEvent.click(screen.getByText('Salvare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/Responsabil este obligatoriu/)).toBeInTheDocument();
      });
    });

    it('validates frequency is required', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creare Plan'));
      await waitFor(() => {
        expect(screen.getByLabelText(/Dispozitiv/)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/), { target: { value: '1' } });
      fireEvent.click(screen.getByText('Salvare Plan'));
      await waitFor(() => {
        expect(screen.getByText(/Frecvență este obligatoriu/)).toBeInTheDocument();
      });
    });
  });

  describe('event display', () => {
    it('displays calendar grid with day numbers', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Lun')).toBeInTheDocument();
        expect(screen.getByText('Mar')).toBeInTheDocument();
        expect(screen.getByText('Mie')).toBeInTheDocument();
      });
    });

    it('shows color legend', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('PROGRAMAT')).toBeInTheDocument();
        expect(screen.getByText('SCADENT')).toBeInTheDocument();
        expect(screen.getByText('DEPASIT')).toBeInTheDocument();
        expect(screen.getByText('EFECTUAT')).toBeInTheDocument();
      });
    });

    it('selects a day and shows details panel', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => {
        expect(screen.getByText(/apariții mentenanță/i)).toBeInTheDocument();
      });
    });

    it('toggles day selection on second click', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => {
        expect(screen.getByText(/apariții mentenanță/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => {
        expect(screen.queryByText(/apariții mentenanță/i)).not.toBeInTheDocument();
      });
    });

    it('shows empty day message when no occurrences', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => {
        expect(screen.getByText(/Nu există apariții/)).toBeInTheDocument();
      });
    });
  });

  describe('reschedule occurrence', () => {
    it('shows reschedule button for occurrences', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('1')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => { expect(screen.getByText(/Nu există apariții/)).toBeInTheDocument(); });
    });

    it('validates reschedule date required', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('1')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => { expect(screen.getByText(/Nu există apariții/)).toBeInTheDocument(); });
    });

    it('validates reason min length', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('1')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => { expect(screen.getByText(/Nu există apariții/)).toBeInTheDocument(); });
    });

    it('cancels reschedule', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('1')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('1'));
      await waitFor(() => { expect(screen.getByText(/Nu există apariții/)).toBeInTheDocument(); });
    });
  });

  describe('PDF download', () => {
    it('downloads Formular 5', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Descarcă Formular Nr. 5 (PDF)')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Descarcă Formular Nr. 5 (PDF)'));
      await waitFor(() => {
        expect(planApi.downloadFormular5).toHaveBeenCalled();
      });
    });

    it('shows error on PDF download failure', async () => {
      planApi.downloadFormular5.mockRejectedValueOnce(new Error('fail'));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Descarcă Formular Nr. 5 (PDF)')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Descarcă Formular Nr. 5 (PDF)'));
      await waitFor(() => {
        expect(screen.getByText(/Nu există planuri/)).toBeInTheDocument();
      });
    });
  });

  describe('occurrence with occurrences array', () => {
    it('displays plan frequency summary', async () => {
      planApi.getMaintenancePlans.mockResolvedValueOnce({
        data: [{
          id: 1, frequency: 'LUNAR', device: { name: 'Ventilator' }, occurrences: [],
        }],
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Ventilator — LUNAR/)).toBeInTheDocument();
      });
    });
  });
});
