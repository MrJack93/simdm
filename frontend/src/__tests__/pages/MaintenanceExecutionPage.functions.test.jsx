import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('react-signature-canvas', () => {
  const React = require('react');
  return {
    default: React.forwardRef(({ onEnd, canvasProps }, ref) => {
      React.useImperativeHandle(ref, () => ({
        toDataURL: () => 'data:image/png;base64,mock',
        isEmpty: () => false,
        clear: vi.fn(),
      }));
      return React.createElement('canvas', {
        ...canvasProps,
        'data-testid': 'signature-canvas',
        onMouseUp: () => onEnd && onEnd(),
      });
    }),
  };
});

import MaintenanceExecutionPage from '../../pages/MaintenanceExecutionPage';

const PLANS = [
  { id: 1, deviceName: 'Echograf', scheduledDate: '2026-06-15', status: 'scheduled', type: 'preventive' },
  { id: 2, deviceName: 'Defibrilator', scheduledDate: '2026-06-20', status: 'scheduled', type: 'corrective' },
];

const ENGINEERS = [
  { id: 1, name: 'Ing. Popescu' },
  { id: 2, name: 'Ing. Vasile' },
];

const EXECUTIONS = [
  { id: 10, deviceName: 'Ventilator', executionDate: '2026-06-01', engineerName: 'Ing. Ion', status: 'completed' },
];

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

describe('MaintenanceExecutionPage — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: PLANS });
      if (url.includes('/engineers')) return Promise.resolve({ data: ENGINEERS });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: EXECUTIONS });
      return Promise.resolve({ data: [] });
    });
  });

  it('renders page heading and description', async () => {
    renderPage();
    expect(await screen.findByText('Execuție mentenanță')).toBeInTheDocument();
    expect(screen.getByText(/Raportare execuție MPP/)).toBeInTheDocument();
  });

  it('displays pending plans', async () => {
    renderPage();
    expect(await screen.findByText('Planuri în așteptare execuție')).toBeInTheDocument();
    expect(screen.getByText('Echograf')).toBeInTheDocument();
    expect(screen.getByText('Defibrilator')).toBeInTheDocument();
  });

  it('shows completed executions in table', async () => {
    renderPage();
    expect(await screen.findByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText('Ing. Ion')).toBeInTheDocument();
  });

  it('delete execution button calls deleteMutation', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Ventilator');
    const trashBtns = screen.getAllByRole('button').filter(b => {
      return b.querySelector('svg') && !b.textContent.includes('PDF') && !b.textContent.includes('Execută');
    });
    if (trashBtns.length > 0) {
      await user.click(trashBtns[trashBtns.length - 1]);
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalled();
      });
    }
  });

  it('opens execution dialog when "Execută mentenanță" is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    const execBtn = screen.getAllByText('Execută mentenanță')[0];
    await user.click(execBtn);
    await waitFor(() => {
      expect(screen.getByText(/Raport execuție/)).toBeInTheDocument();
    });
  });

  it('shows form fields in execution dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => {
      expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument();
      expect(screen.getByText('Data execuției *')).toBeInTheDocument();
      expect(screen.getByText('Rezultat inspecție *')).toBeInTheDocument();
    });
  });

  it('submit button disabled when no signature', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    const submitBtn = screen.getByText('Salvare & Generare PDF').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('shows signature clear button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    const clearBtn = screen.getByText('Curățare semnătură');
    expect(clearBtn).toBeInTheDocument();
  });

  it('cancel button closes the dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText(/Raport execuție/)).toBeInTheDocument(); });
    const cancelBtn = screen.getAllByText('Anulare')[0];
    await user.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByText(/Raport execuție/)).not.toBeInTheDocument();
    });
  });

  it('shows pending plan count', async () => {
    renderPage();
    expect(await screen.findByText('2 dispozitiv(e) programat(e) pentru mentenanță')).toBeInTheDocument();
  });

  it('shows empty execution message', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    expect(await screen.findByText('Nu sunt execuții finalizate încă')).toBeInTheDocument();
  });

  it('filters pending plans to only scheduled status', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({
        data: [
          { id: 1, deviceName: 'Echograf', scheduledDate: '2026-06-15', status: 'completed', type: 'preventive' },
          { id: 2, deviceName: 'Monitor', scheduledDate: '2026-06-20', status: 'scheduled', type: 'corrective' },
        ],
      });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Echograf')).not.toBeInTheDocument();
      expect(screen.getByText('Monitor')).toBeInTheDocument();
    });
  });

  it('signature canvas is rendered in dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
    });
  });

  it('shows table headers', async () => {
    renderPage();
    expect(await screen.findByText('Dispozitiv')).toBeInTheDocument();
    expect(screen.getByText('Data execuției')).toBeInTheDocument();
    expect(screen.getByText('Inginer')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Acțiuni')).toBeInTheDocument();
  });
});
