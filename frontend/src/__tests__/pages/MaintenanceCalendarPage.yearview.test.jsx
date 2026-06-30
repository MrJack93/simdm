import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      { id: 101, scheduledDate: '2026-01-15T09:00:00.000Z', status: 'PROGRAMAT' },
      { id: 102, scheduledDate: '2026-02-15T09:00:00.000Z', status: 'PROGRAMAT' },
      { id: 103, scheduledDate: '2026-03-15T09:00:00.000Z', status: 'PROGRAMAT' },
      { id: 104, scheduledDate: '2026-06-15T09:00:00.000Z', status: 'SCADENT' },
      { id: 105, scheduledDate: '2026-07-15T09:00:00.000Z', status: 'PROGRAMAT' },
    ],
  },
  {
    id: 2,
    frequency: 'TRIMESTRIAL',
    device: { id: 2, name: 'Monitor' },
    occurrences: [
      { id: 201, scheduledDate: '2026-03-15T09:00:00.000Z', status: 'PROGRAMAT' },
      { id: 202, scheduledDate: '2026-06-15T09:00:00.000Z', status: 'EFECTUAT', executionId: 1 },
      { id: 203, scheduledDate: '2026-09-15T09:00:00.000Z', status: 'PROGRAMAT' },
      { id: 204, scheduledDate: '2026-12-15T09:00:00.000Z', status: 'PROGRAMAT' },
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
  getDevices: vi.fn(() => Promise.resolve({ devices: [] })),
}));

import MaintenanceCalendarPage from '../../pages/MaintenanceCalendarPage';

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

describe('CalendarYearView — T1 fix', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Year View shows events grouped by correct month', async () => {
    renderPage();

    const yearBtn = screen.getByRole('button', { name: /vizualizare year/i });
    yearBtn.click();

    await waitFor(() => {
      expect(screen.getByText('Ianuarie 2026')).toBeInTheDocument();
    });

    expect(screen.getByText('Februarie 2026')).toBeInTheDocument();
    expect(screen.getByText('Martie 2026')).toBeInTheDocument();

    const iunie = screen.getAllByText('Iunie 2026');
    expect(iunie.length).toBeGreaterThanOrEqual(1);
  });

  it('Year View total event count matches occurrences', async () => {
    renderPage();

    screen.getByRole('button', { name: /vizualizare year/i }).click();

    await waitFor(() => {
      expect(screen.getByText(/total evenimente/i)).toBeInTheDocument();
    });

    const subtitle = screen.getByText(/total evenimente/i);
    expect(subtitle.textContent).toContain('9');
  });

  it('Year View does not show events from other years', async () => {
    renderPage();

    screen.getByRole('button', { name: /vizualizare year/i }).click();

    await waitFor(() => {
      expect(screen.getByText('Ianuarie 2026')).toBeInTheDocument();
    });

    expect(screen.queryByText('Ianuarie 2025')).not.toBeInTheDocument();
  });

  it('view selector buttons have aria-pressed reflecting current view', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });

    const monthBtn = screen.getByRole('button', { name: /vizualizare month/i });
    const dayBtn = screen.getByRole('button', { name: /vizualizare day/i });
    const weekBtn = screen.getByRole('button', { name: /vizualizare week/i });
    const yearBtn = screen.getByRole('button', { name: /vizualizare year/i });

    expect(monthBtn).toHaveAttribute('aria-pressed', 'true');
    expect(dayBtn).toHaveAttribute('aria-pressed', 'false');
    expect(weekBtn).toHaveAttribute('aria-pressed', 'false');
    expect(yearBtn).toHaveAttribute('aria-pressed', 'false');

    yearBtn.click();

    await waitFor(() => {
      expect(yearBtn).toHaveAttribute('aria-pressed', 'true');
    });
    expect(monthBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
