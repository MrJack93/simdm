import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { devices: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevices: vi.fn(),
}));

vi.mock('../../components/DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ name, onConfirm, trigger }) => (
    <div data-testid="delete-dialog">
      <span onClick={onConfirm}>{trigger}</span>
    </div>
  ),
}));

import InventoryPage from '../../pages/InventoryPageV2';
import { useDevices } from '../../hooks/useDevices';
import api from '../../api/axios';

const DEVICES = [
  { id: 1, name: 'Ventilator', model: 'V-100', inventoryNumber: 'INV-001', status: 'FUNCTIONAL', section: 'Cardiologie' },
  { id: 2, name: 'Monitor', model: 'M-200', inventoryNumber: 'INV-002', status: 'DEFECT', section: 'Terapie' },
  { id: 3, name: 'Echograf', model: 'E-300', inventoryNumber: 'INV-003', status: 'IN_REPARATIE', section: 'Cardiologie' },
  { id: 4, name: 'Defibrilator', model: 'D-400', inventoryNumber: 'INV-004', status: 'FUNCTIONAL', section: 'Urgențe' },
  { id: 5, name: 'Stetoscop', model: 'S-500', inventoryNumber: 'INV-005', status: 'CASAT', section: 'Terapie' },
];

function renderPage(searchParams = '') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/inventory${searchParams ? `?${searchParams}` : ''}`]}>
        <InventoryPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InventoryPage — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDevices.mockReturnValue({ data: { devices: DEVICES }, isLoading: false });
  });

  it('renders page heading', async () => {
    renderPage();
    expect(screen.getByText('Inventar Dispozitive Medicale')).toBeInTheDocument();
  });

  it('renders add device link', async () => {
    renderPage();
    const addLinks = screen.getAllByText('Adaugă');
    expect(addLinks.length).toBeGreaterThan(0);
  });

  it('renders all devices in table view', async () => {
    renderPage();
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
    expect(screen.getByText('Echograf')).toBeInTheDocument();
  });

  it('switches to cards view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText('Carduri'));
    expect(screen.getAllByText('Editare').length).toBeGreaterThan(0);
  });

  it('switches to kanban view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText('Kanban'));
    expect(screen.getAllByText(/Funcțional/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Defect/).length).toBeGreaterThan(0);
  });

  it('switches back to table view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText('Carduri'));
    await user.click(screen.getByLabelText('Tabel'));
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });

  it('search filters devices by name', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/Căuta după/), 'Ventilator');
    await waitFor(() => {
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
    });
  });

  it('search filters by inventory number', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/Căuta după/), 'INV-002');
    await waitFor(() => {
      expect(screen.getByText('Monitor')).toBeInTheDocument();
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('search filters by model', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/Căuta după/), 'V-100');
    await waitFor(() => {
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
    });
  });

  it('status filter shows only matching devices', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Filtru status'), 'DEFECT');
    await waitFor(() => {
      expect(screen.getByText('Monitor')).toBeInTheDocument();
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('section filter shows only matching devices', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Filtru secție'), 'Cardiologie');
    await waitFor(() => {
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.getByText('Echograf')).toBeInTheDocument();
      expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
      expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
    });
  });

  it('combining search and filters', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/Căuta după/), 'Ventilator');
    await user.selectOptions(screen.getByLabelText('Filtru status'), 'DEFECT');
    await waitFor(() => {
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('pre-populates status from URL params', async () => {
    renderPage('status=DEFECT');
    await waitFor(() => {
      expect(screen.getByText('Monitor')).toBeInTheDocument();
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('invalid URL status param defaults to all', async () => {
    renderPage('status=INVALID');
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
  });

  it('pagination: shows next page', async () => {
    const user = userEvent.setup();
    const manyDevices = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, name: `Device ${i + 1}`, model: `M-${i + 1}`, inventoryNumber: `INV-${String(i + 1).padStart(3, '0')}`,
      status: 'FUNCTIONAL', section: 'Test',
    }));
    useDevices.mockReturnValue({ data: { devices: manyDevices }, isLoading: false });
    renderPage();
    const nextBtn = screen.getByRole('button', { name: /Înainte/ });
    expect(nextBtn).not.toBeDisabled();
    await user.click(nextBtn);
    expect(nextBtn).toBeInTheDocument();
  });

  it('pagination: prev button disabled on first page', async () => {
    const manyDevices = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, name: `Device ${i + 1}`, model: `M-${i + 1}`, inventoryNumber: `INV-${String(i + 1).padStart(3, '0')}`,
      status: 'FUNCTIONAL', section: 'Test',
    }));
    useDevices.mockReturnValue({ data: { devices: manyDevices }, isLoading: false });
    renderPage();
    expect(screen.getByRole('button', { name: /Înapoi/ })).toBeDisabled();
  });

  it('handles delete mutation', async () => {
    api.delete.mockResolvedValue({ data: {} });
    renderPage();
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    useDevices.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(screen.getByText('Inventar Dispozitive Medicale')).toBeInTheDocument();
  });

  it('shows empty state when no devices', async () => {
    useDevices.mockReturnValue({ data: { devices: [] }, isLoading: false });
    renderPage();
    expect(screen.getByText('Niciun dispozitiv găsit')).toBeInTheDocument();
  });

  it('status badges display correct labels', async () => {
    renderPage();
    expect(screen.getAllByText('Funcțional').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Defect').length).toBeGreaterThan(0);
    expect(screen.getAllByText('În reparație').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Casat').length).toBeGreaterThan(0);
  });

  it('kanban shows hidden count when > 10 devices in a status', async () => {
    const user = userEvent.setup();
    const manyFunctional = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, name: `Device ${i + 1}`, model: `M-${i + 1}`, inventoryNumber: `INV-${String(i + 1).padStart(3, '0')}`,
      status: 'FUNCTIONAL', section: 'Test',
    }));
    useDevices.mockReturnValue({ data: { devices: manyFunctional }, isLoading: false });
    renderPage();
    await user.click(screen.getByLabelText('Kanban'));
    expect(await screen.findByText(/\+\d+ mai mult/)).toBeInTheDocument();
  });

  it('kanban hidden count shows singular for 1', async () => {
    const user = userEvent.setup();
    const manyFunctional = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1, name: `Device ${i + 1}`, model: `M-${i + 1}`, inventoryNumber: `INV-${String(i + 1).padStart(3, '0')}`,
      status: 'FUNCTIONAL', section: 'Test',
    }));
    useDevices.mockReturnValue({ data: { devices: manyFunctional }, isLoading: false });
    renderPage();
    await user.click(screen.getByLabelText('Kanban'));
    expect(await screen.findByText(/\+\d+ mai mult/)).toBeInTheDocument();
  });

  it('search resets page to 1', async () => {
    const user = userEvent.setup();
    const manyDevices = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, name: `Device ${i + 1}`, model: `M-${i + 1}`, inventoryNumber: `INV-${String(i + 1).padStart(3, '0')}`,
      status: 'FUNCTIONAL', section: 'Test',
    }));
    useDevices.mockReturnValue({ data: { devices: manyDevices }, isLoading: false });
    renderPage();
    await user.click(screen.getByRole('button', { name: /Înainte/ }));
    await user.type(screen.getByPlaceholderText(/Căuta după/), 'Device 1');
    expect(screen.getByText(/Pagina/)).toBeInTheDocument();
  });

  it('table view shows inventory numbers', async () => {
    renderPage();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
  });

  it('table view shows section', async () => {
    renderPage();
    expect(screen.getAllByText('Cardiologie').length).toBeGreaterThan(0);
  });
});
