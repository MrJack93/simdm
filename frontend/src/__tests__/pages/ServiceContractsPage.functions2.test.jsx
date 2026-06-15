import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../api/serviceContracts', () => ({
  getProviders: vi.fn(() => Promise.resolve([])),
  getContracts: vi.fn(() => Promise.resolve({ data: [] })),
  getCostAnalysis: vi.fn(() => Promise.resolve(null)),
  createContract: vi.fn(() => Promise.resolve({})),
  rateProvider: vi.fn(() => Promise.resolve({})),
  deleteContract: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() => Promise.resolve({ devices: [] })),
}));

import ServiceContractsPage from '../../pages/ServiceContractsPage';
import { getProviders, getContracts, getCostAnalysis, createContract, rateProvider, deleteContract } from '../../api/serviceContracts';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ServiceContractsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const PROVIDERS = [
  { id: 1, name: 'ServiceTech SRL', contact: '+37360123456', email: 'info@servicetech.md', ratingAvg: 4.5, _count: { contracts: 3, ratings: 5 } },
  { id: 2, name: 'MedEquip', contact: null, email: null, ratingAvg: null, _count: { contracts: 1, ratings: 0 } },
];

const CONTRACTS = [
  { id: 1, provider: { name: 'ServiceTech SRL' }, contractNo: 'C-001', value: 5000, isExpired: false, daysUntilExpiry: 120 },
  { id: 2, provider: { name: 'MedEquip' }, contractNo: 'C-002', value: null, isExpired: true, daysUntilExpiry: 0 },
];

const COST_ANALYSIS = {
  internal: { totalCost: 15000, count: 10 },
  external: { totalValue: 30000, contractCount: 3 },
  comparison: { internalAvgPerRepair: 1500, externalAvgPerContract: 10000, savings: -15000 },
};

describe('ServiceContractsPage -- function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProviders.mockResolvedValue(PROVIDERS);
    getContracts.mockResolvedValue({ data: CONTRACTS });
    getCostAnalysis.mockResolvedValue(COST_ANALYSIS);
  });

  it('renders page heading and contract button', async () => {
    renderPage();
    expect(await screen.findByText('Contract Nou')).toBeInTheDocument();
    expect(screen.getByText(/Contracte Mentenan/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    getProviders.mockReturnValue(new Promise(() => {}));
    getContracts.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/nc/)).toBeInTheDocument();
  });

  it('displays provider cards', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('ServiceTech SRL').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('MedEquip').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Contact: \+37360123456/)).toBeInTheDocument();
    expect(screen.getByText('Email: info@servicetech.md')).toBeInTheDocument();
    expect(screen.getByText(/Rating: 4\.5 \/ 5/)).toBeInTheDocument();
  });

  it('displays contracts table', async () => {
    renderPage();
    await screen.findByText('C-001');
    expect(screen.getByText('5000 MDL')).toBeInTheDocument();
    expect(screen.getByText('120z')).toBeInTheDocument();
    expect(screen.getByText('Expirat')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows cost analysis section', async () => {
    renderPage();
    expect(await screen.findByText(/Analiz.*Costuri/)).toBeInTheDocument();
  });

  it('filter toggle shows/hides filter panel', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    await user.click(screen.getByText('Filtrare'));
    expect(screen.getByText('Active (neexpirate)')).toBeInTheDocument();
    await user.click(screen.getByText('Filtrare'));
    await waitFor(() => {
      expect(screen.queryByText('Active (neexpirate)')).not.toBeInTheDocument();
    });
  });

  it('filterActive toggle filters expired contracts', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    await user.click(screen.getByText('Filtrare'));
    fireEvent.click(screen.getByText('Active (neexpirate)'));
    await waitFor(() => {
      expect(screen.queryByText('C-002')).not.toBeInTheDocument();
      expect(screen.getByText('C-001')).toBeInTheDocument();
    });
  });

  it('sort toggle sorts by expiry', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    const headers = screen.getAllByRole('columnheader');
    const expiryHeader = headers.find(h => h.textContent.toLowerCase().includes('expir'));
    expect(expiryHeader).toBeInTheDocument();
    await user.click(expiryHeader);
    await waitFor(() => {
      expect(screen.getByText('C-002')).toBeInTheDocument();
    });
  });

  it('CreateContractModal opens and closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Contract Nou');
    await user.click(screen.getByText('Contract Nou'));
    await waitFor(() => {
      expect(screen.getByText('Creare Contract')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText('Creare Contract')).not.toBeInTheDocument();
    });
  });

  it('CreateContractModal validates required fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Contract Nou');
    await user.click(screen.getByText('Contract Nou'));
    await waitFor(() => { expect(screen.getByText('Creare Contract')).toBeInTheDocument(); });
    await user.click(screen.getByText('Salvare'));
    expect(screen.getByText(/Furnizorul.*obligatoriu/)).toBeInTheDocument();
  });

  it('CreateContractModal submits with valid data', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Contract Nou');
    await user.click(screen.getByText('Contract Nou'));
    await waitFor(() => { expect(screen.getByText('Creare Contract')).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Furnizor'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Contract Nr.'), { target: { value: 'C-NEW' } });
    const dateInputs = screen.getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-12-31' } });
    await user.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(createContract).toHaveBeenCalled();
    });
  });

  it('RateProviderModal opens and closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('Evaluare').length).toBeGreaterThanOrEqual(1); });
    await user.click(screen.getAllByText('Evaluare')[0]);
    await waitFor(() => {
      expect(screen.getByText(/Evaluare: ServiceTech/)).toBeInTheDocument();
    });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText(/Evaluare: ServiceTech/)).not.toBeInTheDocument();
    });
  });

  it('RateProviderModal submits rating', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('Evaluare').length).toBeGreaterThanOrEqual(1); });
    await user.click(screen.getAllByText('Evaluare')[0]);
    await waitFor(() => { expect(screen.getByText(/Evaluare: ServiceTech/)).toBeInTheDocument(); });
    fireEvent.change(screen.getByLabelText('Scor'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Comentariu'), { target: { value: 'Good service' } });
    await user.click(screen.getByText('Salvare'));
    await waitFor(() => {
      expect(rateProvider).toHaveBeenCalled();
    });
  });

  it('delete contract shows ConfirmModal', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    const delBtns = screen.getAllByRole('button').filter(b => b.textContent.toLowerCase().includes('terge'));
    await user.click(delBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/contractul C-001/)).toBeInTheDocument();
    });
  });

  it('ConfirmModal confirm deletes contract', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    const delBtns = screen.getAllByRole('button').filter(b => b.textContent.toLowerCase().includes('terge'));
    await user.click(delBtns[0]);
    await waitFor(() => { expect(screen.getByText(/contractul/)).toBeInTheDocument(); });
    await user.click(screen.getByText('Confirmare'));
    await waitFor(() => {
      expect(deleteContract).toHaveBeenCalled();
    });
  });

  it('ConfirmModal cancel closes', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('C-001');
    const delBtns = screen.getAllByRole('button').filter(b => b.textContent.toLowerCase().includes('terge'));
    await user.click(delBtns[0]);
    await waitFor(() => { expect(screen.getByText(/contractul/)).toBeInTheDocument(); });
    await user.click(screen.getByText('Anulare'));
    await waitFor(() => {
      expect(screen.queryByText(/contractul/)).not.toBeInTheDocument();
    });
  });

  it('shows empty contracts when no data', async () => {
    getContracts.mockResolvedValue({ data: [] });
    renderPage();
    await screen.findByText(/exist.*contracte/);
  });

  it('expired contract row has error background', async () => {
    renderPage();
    await screen.findByText('C-002');
    const row = screen.getByText('C-002').closest('tr');
    expect(row).toHaveStyle({ backgroundColor: 'var(--color-error-bg)' });
  });
});
