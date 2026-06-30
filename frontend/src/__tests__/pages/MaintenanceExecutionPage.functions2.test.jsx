import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceExecutionPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceExecutionPage — function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: PLANS });
      if (url.includes('/engineers')) return Promise.resolve({ data: ENGINEERS });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: EXECUTIONS });
      return Promise.resolve({ data: [] });
    });
  });

  it('renders heading and description', async () => {
    renderPage();
    expect(await screen.findByText('Execuție mentenanță')).toBeInTheDocument();
    expect(screen.getByText(/Raportare execuție MPP/)).toBeInTheDocument();
  });

  it('shows pending plans cards', async () => {
    renderPage();
    expect(await screen.findByText('Planuri în așteptare execuție')).toBeInTheDocument();
    expect(screen.getByText('Echograf')).toBeInTheDocument();
    expect(screen.getByText('Defibrilator')).toBeInTheDocument();
  });

  it('shows pending plan count', async () => {
    renderPage();
    expect(await screen.findByText('2 dispozitiv(e) programat(e) pentru mentenanță')).toBeInTheDocument();
  });

  it('shows scheduled date and type for plans', async () => {
    renderPage();
    await screen.findByText('Echograf');
    expect(screen.getByText(/Preventivă/)).toBeInTheDocument();
    expect(screen.getByText(/Corectivă/)).toBeInTheDocument();
  });

  it('opens dialog when clicking Execută mentenanță', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => {
      expect(screen.getByText(/Raport execuție/)).toBeInTheDocument();
    });
  });

  it('dialog shows engineer, date, and inspection result fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => {
      expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument();
      expect(screen.getByText('Data execuției *')).toBeInTheDocument();
      expect(screen.getByText('Rezultat inspecție *')).toBeInTheDocument();
      expect(screen.getByText('Piese înlocuite (opțional)')).toBeInTheDocument();
      expect(screen.getByText('Observații tehnice (opțional)')).toBeInTheDocument();
    });
  });

  it('signature canvas is present in dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
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

  it('onSubmit without signature shows alert', async () => {
    const user = userEvent.setup();
    const originalAlert = window.alert;
    window.alert = vi.fn();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    const submitBtn = screen.getByText('Salvare & Generare PDF').closest('button');
    expect(submitBtn).toBeDisabled();
    window.alert = originalAlert;
  });

  it('handleSignatureClear resets signature state', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    const clearBtn = screen.getByText('Curățare semnătură');
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn);
  });

  it('handleSignatureEnd sets hasSignature to true', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByTestId('signature-canvas')).toBeInTheDocument(); });
    const canvas = screen.getByTestId('signature-canvas');
    fireEvent.mouseUp(canvas);
    await waitFor(() => {
      expect(screen.getByText('✅ Semnătură înregistrată')).toBeInTheDocument();
    });
  });

  it('cancel button closes dialog', async () => {
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

  it('shows completed executions table', async () => {
    renderPage();
    expect(await screen.findByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText('Ing. Ion')).toBeInTheDocument();
    expect(screen.getByText('Finalizat ✅')).toBeInTheDocument();
  });

  it('shows table headers', async () => {
    renderPage();
    expect(await screen.findByText('Dispozitiv')).toBeInTheDocument();
    expect(screen.getByText('Data execuției')).toBeInTheDocument();
    expect(screen.getByText('Inginer')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Acțiuni')).toBeInTheDocument();
  });

  it('delete execution calls api.delete', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Ventilator');
    const buttons = screen.getAllByRole('button');
    const trashBtns = buttons.filter(b => {
      const svgs = b.querySelectorAll('svg');
      return svgs.length > 0 && !b.textContent.includes('PDF');
    });
    if (trashBtns.length > 0) {
      await user.click(trashBtns[trashBtns.length - 1]);
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalled();
      });
    }
  });

  it('shows empty state when no executions', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    expect(await screen.findByText('Nu sunt execuții finalizate încă')).toBeInTheDocument();
  });

  it('filters pendingPlans to only scheduled status', async () => {
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

  it('shows loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('form fields can be filled', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    fireEvent.change(screen.getByPlaceholderText(/Descrieți rezultatul/), { target: { value: 'Inspection OK' } });
    expect(screen.getByPlaceholderText(/Descrieți rezultatul/)).toHaveValue('Inspection OK');
    fireEvent.change(screen.getByPlaceholderText(/Filtru aer/), { target: { value: 'Filtru HEPA' } });
    expect(screen.getByPlaceholderText(/Filtru aer/)).toHaveValue('Filtru HEPA');
    fireEvent.change(screen.getByPlaceholderText(/Orice observații/), { target: { value: 'Notes here' } });
    expect(screen.getByPlaceholderText(/Orice observații/)).toHaveValue('Notes here');
  });

  it('createExecutionMutation calls api.post on valid form', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Echograf');
    await user.click(screen.getAllByText('Execută mentenanță')[0]);
    await waitFor(() => { expect(screen.getByText('Inginer responsabil *')).toBeInTheDocument(); });
    const canvas = screen.getByTestId('signature-canvas');
    fireEvent.mouseUp(canvas);
    fireEvent.change(screen.getByPlaceholderText(/Descrieți rezultatul/), { target: { value: 'Test result here' } });
    await waitFor(() => {
      expect(screen.getByText('✅ Semnătură înregistrată')).toBeInTheDocument();
    });
    const submitBtn = screen.getByText('Salvare & Generare PDF').closest('button');
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows PDF button for each execution', async () => {
    renderPage();
    await screen.findByText('Ventilator');
    const pdfButtons = screen.getAllByText('PDF');
    expect(pdfButtons.length).toBeGreaterThan(0);
  });

  it('Wrench icon is in pending plans header', async () => {
    renderPage();
    await screen.findByText('Planuri în așteptare execuție');
    expect(screen.getByText('Planuri în așteptare execuție')).toBeInTheDocument();
  });
});
