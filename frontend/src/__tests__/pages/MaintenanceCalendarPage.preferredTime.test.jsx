import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

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
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockPlans = [
  {
    id: 1,
    frequency: 'LUNAR',
    device: { id: 1, name: 'Ventilator' },
    occurrences: [
      { id: 101, scheduledDate: '2026-06-15T14:30:00.000Z', status: 'PROGRAMAT' },
    ],
  },
];

vi.mock('../../api/maintenancePlans', () => ({
  getMaintenancePlans: vi.fn(() => Promise.resolve({ data: mockPlans })),
  createMaintenancePlan: vi.fn(() => Promise.resolve({})),
  rescheduleOccurrence: vi.fn(() => Promise.resolve({})),
  downloadFormular5: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() => Promise.resolve({ devices: [{ id: 1, name: 'Ventilator' }] })),
}));

import MaintenanceCalendarPage from '../../pages/MaintenanceCalendarPage';
import { createMaintenancePlan } from '../../api/maintenancePlans';

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

describe('T2 — Oră mentenanță', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CreatePlanModal — preferredTime', () => {
    it('shows preferredTime input with default 09:00', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });

      screen.getByText('Creare Plan').click();

      await waitFor(() => {
        expect(screen.getByText('Ora preferată')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/ora preferată/i);
      expect(timeInput).toHaveValue('09:00');
      expect(timeInput).toHaveAttribute('type', 'time');
    });

    it('sends preferredTime in payload when creating plan', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Creare Plan')).toBeInTheDocument();
      });

      screen.getByText('Creare Plan').click();

      await waitFor(() => {
        expect(screen.getByLabelText(/dispozitiv/i)).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/dispozitiv/i), '1');
      await user.selectOptions(screen.getByLabelText(/frecvență/i), 'LUNAR');
      await user.type(screen.getByLabelText(/responsabil/i), 'Ing. Test');

      const timeInput = screen.getByLabelText(/ora preferată/i);
      await user.clear(timeInput);
      await user.type(timeInput, '14:30');

      screen.getByText('Salvare Plan').click();

      await waitFor(() => {
        expect(createMaintenancePlan).toHaveBeenCalled();
        const callArgs = createMaintenancePlan.mock.calls[0][0];
        expect(callArgs).toMatchObject({ preferredTime: '14:30' });
      });
    });
  });

  describe('Reschedule — datetime-local', () => {
    it('reschedule form uses datetime-local input', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Ventilator')).toBeInTheDocument();
      });

      const dayBtn = screen.getByText('15');
      fireEvent.click(dayBtn.closest('button') || dayBtn);

      await waitFor(() => {
        expect(screen.getByText('Reprogramează')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reprogramează'));

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/data și ora nouă/i);
        expect(dateInput).toHaveAttribute('type', 'datetime-local');
      });
    });
  });
});
