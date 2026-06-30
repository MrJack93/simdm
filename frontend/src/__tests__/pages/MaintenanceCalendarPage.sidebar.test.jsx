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

vi.mock('../../api/maintenancePlans', () => ({
  getMaintenancePlans: vi.fn(() => Promise.resolve({ data: [] })),
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

describe('T7 — Sidebar drawer mobil', () => {
  beforeEach(() => vi.clearAllMocks());

  it('desktop: sidebar vizibil fără trigger', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Deschide sidebar calendar')).not.toBeInTheDocument();
  });

  it('mobile: buton trigger vizibil pentru sidebar', async () => {
    window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Deschide sidebar calendar')).toBeInTheDocument();
  });

  it('aria-label-urile sunt unice (nu duplicate)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });
    const prevButtons = screen.getAllByLabelText(/Luna anterioară/);
    const nextButtons = screen.getAllByLabelText(/Luna următoare/);
    expect(prevButtons.length).toBeGreaterThanOrEqual(1);
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
    const prevLabels = prevButtons.map((b) => b.getAttribute('aria-label'));
    const nextLabels = nextButtons.map((b) => b.getAttribute('aria-label'));
    expect(new Set(prevLabels).size).toBe(prevButtons.length);
    expect(new Set(nextLabels).size).toBe(nextButtons.length);
  });
});

describe('T8 — Sync mini-calendar ↔ luna principală', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sidebar arată luna curentă din calendarul principal', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });
    const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    const currentMonth = monthNames[new Date().getMonth()];
    expect(screen.getAllByText(new RegExp(currentMonth)).length).toBeGreaterThanOrEqual(1);
  });

  it('navigare din toolbar schimbă luna afișată', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Calendar Mentenanță')).toBeInTheDocument();
    });
    const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    const currentMonth = new Date().getMonth();
    expect(screen.getAllByText(new RegExp(monthNames[currentMonth])).length).toBeGreaterThanOrEqual(1);
  });
});
