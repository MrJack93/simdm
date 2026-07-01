import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

import ActivityReportPage from '../../pages/ActivityReportPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><ActivityReportPage /></MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ActivityReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockRejectedValue(new Error('unauthorized'));
  });

  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Raport Activitate')).toBeInTheDocument();
  });

  it('renders date inputs with default values', () => {
    renderPage();
    const fromInput = document.getElementById('rp-from');
    const toInput = document.getElementById('rp-to');
    expect(fromInput).toBeInTheDocument();
    expect(toInput).toBeInTheDocument();
    expect(fromInput.value).toBe('2026-01-01');
    expect(toInput.value).toBe('2026-12-31');
  });

  it('renders Generează Raport button', () => {
    renderPage();
    expect(screen.getByText(/Generează Raport/)).toBeInTheDocument();
  });

  it('clicking generate triggers query', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  it('shows loading state after generate', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => {
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  it('shows PDF download button when data loaded', async () => {
    api.get.mockResolvedValue({
      data: {
        activityAnalysis: { repairs: { count: 5, hours: 10 }, maintenance: { count: 3, hours: 5 }, verifications: { count: 2 }, totalHours: 15 },
        newDevicesInstalled: 1,
        faultBreakdown: { DEFECT_MECANIC: { count: 2, hours: 4 } },
        timeIntervals: { under_1h: 3, '1_5h': 2, '5h_1day': 1, '1day_1week': 0, '1week_1month': 0, over_1month: 0 },
      },
    });
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => {
      expect(screen.getByText(/Descarcă PDF/)).toBeInTheDocument();
    });
  });

  it('shows analysis sections when data loaded', async () => {
    api.get.mockResolvedValue({
      data: {
        activityAnalysis: { repairs: { count: 5, hours: 10 }, maintenance: { count: 3, hours: 5 }, verifications: { count: 2 }, totalHours: 15 },
        newDevicesInstalled: 1,
        faultBreakdown: { DEFECT_MECANIC: { count: 2, hours: 4 } },
        timeIntervals: { under_1h: 3, '1_5h': 2, '5h_1day': 1, '1day_1week': 0, '1week_1month': 0, over_1month: 0 },
      },
    });
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => {
      expect(screen.getByText(/Analiza Activității/)).toBeInTheDocument();
      expect(screen.getByText(/Defalcarea Cauzelor/)).toBeInTheDocument();
      expect(screen.getByText(/Analiza Timpului/)).toBeInTheDocument();
    });
  });

  it('shows no faults message when all counts are 0', async () => {
    api.get.mockResolvedValue({
      data: {
        activityAnalysis: { repairs: { count: 0, hours: 0 }, maintenance: { count: 0, hours: 0 }, verifications: { count: 0 }, totalHours: 0 },
        newDevicesInstalled: 0,
        faultBreakdown: { DEFECT_MECANIC: { count: 0, hours: 0 }, ALTE: { count: 0, hours: 0 } },
        timeIntervals: { under_1h: 0, '1_5h': 0, '5h_1day': 0, '1day_1week': 0, '1week_1month': 0, over_1month: 0 },
      },
    });
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => {
      expect(screen.getByText(/Nicio defecțiune înregistrată/)).toBeInTheDocument();
    });
  });

  it('downloads PDF on button click', async () => {
    const mockBlob = new Blob(['pdf-data']);
    api.get
      .mockResolvedValueOnce({
        data: {
          activityAnalysis: { repairs: { count: 5, hours: 10 }, maintenance: { count: 3, hours: 5 }, verifications: { count: 2 }, totalHours: 15 },
          newDevicesInstalled: 1,
          faultBreakdown: {},
          timeIntervals: { under_1h: 0, '1_5h': 0, '5h_1day': 0, '1day_1week': 0, '1week_1month': 0, over_1month: 0 },
        },
      })
      .mockResolvedValueOnce({ data: mockBlob });
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => expect(screen.getByText(/Descarcă PDF/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Descarcă PDF/));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/activity-report/formular12-pdf'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });
  });

  it('shows error toast on PDF download failure', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          activityAnalysis: { repairs: { count: 0, hours: 0 }, maintenance: { count: 0, hours: 0 }, verifications: { count: 0 }, totalHours: 0 },
          newDevicesInstalled: 0,
          faultBreakdown: {},
          timeIntervals: { under_1h: 0, '1_5h': 0, '5h_1day': 0, '1day_1week': 0, '1week_1month': 0, over_1month: 0 },
        },
      })
      .mockRejectedValueOnce(new Error('network fail'));
    renderPage();
    fireEvent.click(screen.getByText(/Generează Raport/));
    await waitFor(() => expect(screen.getByText(/Descarcă PDF/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Descarcă PDF/));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la descărcare PDF');
    });
  });

  it('allows changing date inputs', () => {
    renderPage();
    const fromInput = document.getElementById('rp-from');
    fireEvent.change(fromInput, { target: { value: '2025-06-01' } });
    expect(fromInput.value).toBe('2025-06-01');
  });
});
