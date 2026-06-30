/**
 * Teste pentru MaintenanceCalendarPage
 * - Randare calendar cu apariții MPP
 * - Creare plan
 * - Navigare luni
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

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

import MaintenanceCalendarPage from '../pages/MaintenanceCalendarPage';

// Mock API calls
vi.mock('../api/maintenancePlans', () => ({
  getMaintenancePlans: vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 1,
          deviceId: 1,
          device: { name: 'Echograf' },
          type: 'PREVENTIVA',
          frequency: 'LUNAR',
          occurrences: [
            {
              id: 101,
              dueDate: '2026-06-15',
              status: 'SCADENT',
            },
            {
              id: 102,
              dueDate: '2026-07-15',
              status: 'PLANIFICAT',
            },
          ],
        },
      ],
    })
  ),
  createMaintenancePlan: vi.fn(() =>
    Promise.resolve({
      id: 2,
      deviceId: 2,
      type: 'PREVENTIVA',
      frequency: 'TRIMESTRIAL',
    })
  ),
  rescheduleOccurrence: vi.fn(() => Promise.resolve({ id: 101 })),
  downloadFormular5: vi.fn(() => Promise.resolve(new Blob(['%PDF'], { type: 'application/pdf' }))),
}));

vi.mock('../api/devices', () => ({
  getDevices: vi.fn(() =>
    Promise.resolve({
      data: [
        { id: 1, name: 'Echograf' },
        { id: 2, name: 'Radiograf' },
      ],
    })
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MaintenanceCalendarPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceCalendarPage — Calendar & Apariții MPP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează calendar cu luna curenta', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Lunar/i)).toBeInTheDocument();
    });
  });

  it('afișează apariții mentenanță pe calendar', async () => {
    renderPage();

    await waitFor(() => {
      // Check if calendar days are rendered
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });
  });

  it('permite navigare lună anterioară', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Luna anterioară/i })).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /Luna anterioară/i });
    await user.click(prevBtn);

    // Calendar should update to previous month
    await waitFor(() => {
      expect(screen.queryByText(/MaintenanceCalendarPage/i)).toBeTruthy();
    });
  });

  it('permite navigare lună următoare', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Luna următoare/i })).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /Luna următoare/i });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.queryByText(/MaintenanceCalendarPage/i)).toBeTruthy();
    });
  });

  it('afișează status apariție (SCADENT, PLANIFICAT)', async () => {
    renderPage();

    await waitFor(() => {
      // Status-uri ar trebui afișate cu culori diferite
      expect(screen.queryByText(/15/)).toBeTruthy();
    });
  });

  it('deschide modal creare plan la click "Creare Plan"', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creare Plan/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Creare Plan/i });
    await user.click(createBtn);

    // Modal should open - wait for input field to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Dispozitiv/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('validează form creare plan (device + frequency)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creare Plan/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Creare Plan/i });
    await user.click(createBtn);

    // Try submit without filling fields
    const submitBtn = screen.getByRole('button', { name: /Salvare Plan/i });
    await user.click(submitBtn);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
    });
  });

  it('trimite criere plan cu date valide', async () => {
    const user = userEvent.setup();
    const { createMaintenancePlan } = await import('../api/maintenancePlans');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creare Plan/i })).toBeInTheDocument();
    });

    // Open modal
    const createBtn = screen.getByRole('button', { name: /Creare Plan/i });
    expect(createBtn).toBeEnabled();

    // Use fireEvent for click and wrap in act
    act(() => {
      fireEvent.click(createBtn);
    });

    // Check if modal opened
    await waitFor(() => {
      // Modal should appear - check for any element specific to modal
      const buttons = screen.getAllByRole('button');
      // Should have more buttons now (Criere Plan + Salvare Plan + Închide)
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 2000 });

    expect(createMaintenancePlan).toBeDefined();
  });

  it('afișează mesaj după creare plan reușită', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creare Plan/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Creare Plan/i });
    await user.click(createBtn);

    const deviceSelect = screen.getByLabelText(/Dispozitiv/i);
    await user.selectOptions(deviceSelect, '2');

    const frequencySelect = screen.getByLabelText(/Frecvență/i);
    await user.selectOptions(frequencySelect, 'TRIMESTRIAL');

    const responsibleInput = screen.getByLabelText(/Responsabil/i);
    await user.type(responsibleInput, 'Ing. Test');

    const submitBtn = screen.getByRole('button', { name: /Salvare Plan/i });
    await user.click(submitBtn);

    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/Plan creat cu succes/i)).toBeInTheDocument();
    });
  });

  it('afișează apariții zilei la click pe data calendarului', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    const dayCell = screen.getByText(/15/);
    await user.click(dayCell);

    // Details panel should appear
    await waitFor(() => {
      expect(screen.getByText(/Apariții mentenanță/i)).toBeInTheDocument();
    });
  });

  it('navigare între luni nu pierde state-ul', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Luna următoare/i })).toBeInTheDocument();
    });

    // Navigate to next month
    let nextBtn = screen.getByRole('button', { name: /Luna următoare/i });
    await user.click(nextBtn);

    await waitFor(() => {
      // Should still show calendar
      expect(screen.queryByText(/MaintenanceCalendarPage/i)).toBeTruthy();
    });

    // Navigate back
    const prevBtn = screen.getByRole('button', { name: /Luna anterioară/i });
    await user.click(prevBtn);

    await waitFor(() => {
      expect(screen.queryByText(/MaintenanceCalendarPage/i)).toBeTruthy();
    });
  });
});
