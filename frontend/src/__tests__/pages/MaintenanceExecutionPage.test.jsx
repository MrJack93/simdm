import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import api from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import MaintenanceExecutionPage from '../../pages/MaintenanceExecutionPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceExecutionPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceExecutionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  it('randează titlul paginii', async () => {
    renderPage();
    expect(await screen.findByText('Execuție mentenanță')).toBeInTheDocument();
  });

  it('afișează descrierea paginii', async () => {
    renderPage();
    expect(await screen.findByText(/Raportare execuție MPP/)).toBeInTheDocument();
  });

  it('afișează secțiunea de execuții finalizate', async () => {
    renderPage();
    expect(await screen.findByText('Execuții finalizate')).toBeInTheDocument();
  });

  it('afișează mesaj gol când nu sunt execuții', async () => {
    renderPage();
    expect(await screen.findByText('Nu sunt execuții finalizate încă')).toBeInTheDocument();
  });

  it('afișează planuri în așteptare când există planuri scheduled', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({
        data: [
          { id: 1, deviceName: 'Echograf', scheduledDate: '2026-06-15', status: 'scheduled', type: 'preventive' },
        ],
      });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    expect(await screen.findByText('Planuri în așteptare execuție')).toBeInTheDocument();
    expect(screen.getByText('Echograf')).toBeInTheDocument();
  });

  it('afișează tipul planului preventivă/corectivă', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({
        data: [
          { id: 1, deviceName: 'Defibrilator', scheduledDate: '2026-06-20', status: 'scheduled', type: 'corrective' },
        ],
      });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    expect(await screen.findByText('Defibrilator')).toBeInTheDocument();
    expect(screen.getByText('Tip: Corectivă')).toBeInTheDocument();
  });

  it('afișează lista de execuții finalizate cu date', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({
        data: [
          { id: 1, deviceName: 'Ventilator', executionDate: '2026-06-01', engineerName: 'Ing. Popescu', status: 'completed' },
        ],
      });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    expect(await screen.findByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText('Ing. Popescu')).toBeInTheDocument();
    expect(screen.getByText(/Finalizat/)).toBeInTheDocument();
  });

  it('butonul de ștergere apelează DELETE', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({
        data: [
          { id: 5, deviceName: 'Monitor', executionDate: '2026-05-10', engineerName: 'Ing. Ion', status: 'completed' },
        ],
      });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    await screen.findByText('Monitor');
    const deleteButtons = screen.getAllByRole('button');
    const trashBtn = deleteButtons.find(b => b.querySelector('svg') && !b.textContent.includes('PDF'));
    if (trashBtn) {
      fireEvent.click(trashBtn);
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalled();
      });
    }
  });

  it('se încarcă inginerii din API', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [{ id: 1, name: 'Ing. Vasile' }] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    await waitFor(() => {
      const engineersCall = api.get.mock.calls.find(([url]) => url.includes('/engineers'));
      expect(engineersCall).toBeTruthy();
    });
  });

  it('nu afișează planuri pending dacă toate sunt completed', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({
        data: [{ id: 1, status: 'completed' }],
      });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Planuri în așteptare execuție')).not.toBeInTheDocument();
    });
  });

  it('afișează coloanele tabelului corect', async () => {
    renderPage();
    expect(await screen.findByText('Dispozitiv')).toBeInTheDocument();
    expect(screen.getByText('Data execuției')).toBeInTheDocument();
    expect(screen.getByText('Inginer')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Acțiuni')).toBeInTheDocument();
  });

  it('se încarcă planurile de mentenanță cu status=scheduled', async () => {
    renderPage();
    await waitFor(() => {
      const plansCall = api.get.mock.calls.find(([url]) => url.includes('/maintenance-plans'));
      expect(plansCall).toBeTruthy();
      expect(plansCall[0]).toContain('status=scheduled');
    });
  });
});
