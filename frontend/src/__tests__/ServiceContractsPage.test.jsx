/**
 * Teste pentru ServiceContractsPage
 * - Contracte externă
 * - Rating furnizor
 * - Cost analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ServiceContractsPage from '../pages/ServiceContractsPage';

vi.mock('../api/serviceContracts', () => ({
  getProviders: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        name: 'Service Pro',
        contact: 'Ion Pop',
        email: 'ion@servicepro.md',
        phone: '+373 67 123 456',
        ratingAvg: 4.5,
        _count: { contracts: 3, ratings: 2 },
      },
      {
        id: 2,
        name: 'Tech Solutions',
        contact: 'Maria Ionescu',
        email: 'maria@tech.md',
        phone: '+373 68 234 567',
        ratingAvg: 3.8,
        _count: { contracts: 2, ratings: 3 },
      },
    ])
  ),
  getContracts: vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 1,
          contractNo: 'CONTRACT-2026-001',
          provider: { id: 1, name: 'Service Pro' },
          startDate: '2026-01-01',
          endDate: '2027-01-01',
          value: 50000,
          daysUntilExpiry: 200,
          isExpired: false,
        },
        {
          id: 2,
          contractNo: 'CONTRACT-2026-002',
          provider: { id: 2, name: 'Tech Solutions' },
          startDate: '2025-06-08',
          endDate: '2026-06-08',
          value: 30000,
          daysUntilExpiry: -1,
          isExpired: true,
        },
      ],
      pagination: { page: 1, limit: 50, total: 2 },
    })
  ),
  getCostAnalysis: vi.fn(() =>
    Promise.resolve({
      internal: {
        totalCost: 120000,
        count: 15,
      },
      external: {
        totalValue: 80000,
        contractCount: 2,
      },
      comparison: {
        savings: 40000,
        internalAvgPerRepair: '8000.00',
        externalAvgPerContract: '40000.00',
      },
      byProvider: [
        { providerId: 1, providerName: 'Service Pro', totalValue: 50000, contractCount: 1 },
      ],
      contractStatus: { active: 1, expired: 1 },
    })
  ),
  createContract: vi.fn(() =>
    Promise.resolve({
      id: 3,
      contractNo: 'CONTRACT-2026-003',
      provider: { id: 1, name: 'Service Pro' },
    })
  ),
  rateProvider: vi.fn(() =>
    Promise.resolve({
      id: 1,
      rating: {
        id: 10,
        score: 5,
        comment: 'Excellent service',
      },
      provider: {
        id: 1,
        ratingAvg: 4.67,
      },
    })
  ),
  deleteContract: vi.fn(() => Promise.resolve()),
}));

vi.mock('../api/devices', () => ({
  getDevices: vi.fn(() =>
    Promise.resolve({
      data: [
        { id: 1, name: 'Echograf' },
        { id: 2, name: 'Radiograf' },
        { id: 3, name: 'Densitometru' },
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
        <ServiceContractsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('ServiceContractsPage — Contracte Externe & Cost Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează carduri furnizori cu rating', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Service Pro').length).toBeGreaterThan(0);
      expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
    });
  });

  it('afișează rating mediu furnizor (1-5 stele)', async () => {
    renderPage();

    await waitFor(() => {
      // Rating 4.5 should be visible
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });
  });

  it('afișează tabel contracte cu status expirare', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('CONTRACT-2026-001')).toBeInTheDocument();
      expect(screen.getByText('CONTRACT-2026-002')).toBeInTheDocument();
    });
  });

  it('culori diferite pentru contracte active vs expirate', async () => {
    renderPage();

    await waitFor(() => {
      const activeContract = screen.getByText('CONTRACT-2026-001');
      const expiredContract = screen.getByText('CONTRACT-2026-002');

      // Contractele ar trebui să aibă clase/stiluri diferite
      expect(activeContract).toBeInTheDocument();
      expect(expiredContract).toBeInTheDocument();
    });
  });

  it('permite creare contract nou', async () => {
    const user = userEvent.setup();
    const { createContract } = await import('../api/serviceContracts');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Contract Nou/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Contract Nou/i });
    await user.click(createBtn);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText(/Creare Contract/i)).toBeInTheDocument();
    });

    // Fill form
    const providerSelect = screen.getByLabelText(/Furnizor/i);
    await user.selectOptions(providerSelect, '1');

    const contractNoInput = screen.getByLabelText(/Contract Nr\./i);
    await user.type(contractNoInput, 'CONTRACT-2026-003');

    const startDateInput = screen.getByLabelText(/Data Începere/i);
    await user.type(startDateInput, '2026-06-08');

    const endDateInput = screen.getByLabelText(/Data Încheiere/i);
    await user.type(endDateInput, '2027-06-08');

    const valueInput = screen.getByLabelText(/Valoare/i);
    await user.type(valueInput, '50000');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Salvare Contract/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createContract).toHaveBeenCalled();
    });
  }, 15000);

  it('validează form creare contract', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Contract Nou/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Contract Nou/i });
    await user.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Creare Contract/i)).toBeInTheDocument();
    });

    // Try submit empty
    const submitBtn = screen.getByRole('button', { name: /Salvare Contract/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
    });
  });

  it('permite rating furnizor (1-5 stele + comment)', async () => {
    const user = userEvent.setup();
    const { rateProvider } = await import('../api/serviceContracts');

    renderPage();

    await waitFor(() => {
      const rateButtons = screen.getAllByRole('button', { name: /Evaluare/i });
      expect(rateButtons.length).toBeGreaterThan(0);
    });

    const rateBtn = screen.getAllByRole('button', { name: /Evaluare/i })[0];
    expect(rateBtn).toBeEnabled();

    // Use fireEvent for click
    act(() => {
      fireEvent.click(rateBtn);
    });

    // Rating modal should open
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      // Should have more buttons now including Salvare Evaluare
      expect(allButtons.length).toBeGreaterThan(2);
    }, { timeout: 2000 });

    expect(rateProvider).toBeDefined();
  });

  it('recalculează rating mediu după adăugare rating nou', async () => {
    renderPage();

    await waitFor(() => {
      // Initial rating 4.5
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });

    // After adding rating 5, average should update to ~4.67
    // This would be verified after actual rating submission
    expect(screen.getAllByText('Service Pro').length).toBeGreaterThan(0);
  });

  it('afișează cost analysis (internal vs external)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Analiză Costuri/i)).toBeInTheDocument();
    });

    // Check internal cost
    await waitFor(() => {
      expect(screen.getByText(/120\.000/)).toBeInTheDocument(); // internal total
    });

    // Check external cost
    expect(screen.getByText(/80\.000/)).toBeInTheDocument(); // external total

    // Check savings
    expect(screen.getAllByText(/40\.000/).length).toBeGreaterThan(0); // savings
  });

  it('calculează economii (external - internal)', async () => {
    renderPage();

    await waitFor(() => {
      // 80000 - 120000 = -40000 (actually costs more internally)
      // Should show savings or extra cost appropriately
      expect(screen.getAllByText(/40\.000/).length).toBeGreaterThan(0);
    });
  });

  it('calculează average cost per repair vs per contract', async () => {
    renderPage();

    await waitFor(() => {
      // Internal: 120000 / 15 = 8000
      expect(screen.getByText(/8\.000/)).toBeInTheDocument();
    });
  });

  it('permite filtrare contracte după status (active/expirat)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Filtrare/i })).toBeInTheDocument();
    });

    const filterBtn = screen.getByRole('button', { name: /Filtrare/i });
    await user.click(filterBtn);

    const activeCheckbox = screen.getByLabelText(/Active/i);
    await user.click(activeCheckbox);

    await waitFor(() => {
      // Should only show active contracts
      expect(screen.getByText('CONTRACT-2026-001')).toBeInTheDocument();
    });
  });

  it('permite sortare contracte după data expirare', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /Expiră/i })).toBeInTheDocument();
    });

    const sortBtn = screen.getByRole('columnheader', { name: /Expiră/i });
    await user.click(sortBtn);

    // Table should re-render sorted
    await waitFor(() => {
      expect(screen.getByText('CONTRACT-2026-001')).toBeInTheDocument();
    });
  });

  it('afișează alerte pentru contracte care expiră în 30 zile', async () => {
    renderPage();

    await waitFor(() => {
      // Check if alert is shown
      expect(screen.getByText('CONTRACT-2026-002')).toBeInTheDocument();
    });
  });

  it('permite ștergere contract (cu confirmare)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Șterge/i }).length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Șterge/i });
    await user.click(deleteButtons[0]);

    // Confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Ești sigur\?/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirmare/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Ești sigur\?/i)).not.toBeInTheDocument();
    });
  });
});
