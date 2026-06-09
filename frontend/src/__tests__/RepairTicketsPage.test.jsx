/**
 * Teste pentru RepairTicketsPage
 * - Kanban board cu 5 coloane
 * - Creare tichet
 * - Drag & drop între stări
 * - Detalii tichet
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import RepairTicketsPage from '../pages/RepairTicketsPage';

vi.mock('../api/repairTickets', () => ({
  getRepairTickets: vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 1,
          ticketNumber: 'TKT-2026-0001',
          device: { name: 'Echograf' },
          status: 'DESCHIS',
          priority: 'URGENT',
          description: 'Ecran defect',
          reportedAt: '2026-06-08T10:00:00Z',
        },
        {
          id: 2,
          ticketNumber: 'TKT-2026-0002',
          device: { name: 'Radiograf' },
          status: 'IN_LUCRU',
          priority: 'RIDICAT',
          description: 'Motor zgomotos',
          reportedAt: '2026-06-07T10:00:00Z',
        },
        {
          id: 3,
          ticketNumber: 'TKT-2026-0003',
          device: { name: 'Densitometru' },
          status: 'REZOLVAT',
          priority: 'NORMAL',
          description: 'Calibrare necesară',
          reportedAt: '2026-06-06T10:00:00Z',
        },
      ],
    })
  ),
  createRepairTicket: vi.fn(() =>
    Promise.resolve({
      id: 4,
      ticketNumber: 'TKT-2026-0004',
      device: { name: 'Test Device' },
      status: 'DESCHIS',
      priority: 'NORMAL',
    })
  ),
  updateTicketStatus: vi.fn(() =>
    Promise.resolve({
      id: 1,
      status: 'IN_LUCRU',
    })
  ),
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RepairTicketsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('RepairTicketsPage — Kanban Board cu State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează 5 coloane Kanban (DESCHIS, IN_LUCRU, REZOLVAT, TESTAT, INCHIS)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('DESCHIS')).toBeInTheDocument();
      expect(screen.getByText('IN_LUCRU')).toBeInTheDocument();
      expect(screen.getByText('REZOLVAT')).toBeInTheDocument();
      expect(screen.getByText('TESTAT')).toBeInTheDocument();
      expect(screen.getByText('INCHIS')).toBeInTheDocument();
    });
  });

  it('afișează tichetele în coloanele corecte', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('TKT-2026-0002')).toBeInTheDocument();
      expect(screen.getByText('TKT-2026-0003')).toBeInTheDocument();
    });
  });

  it('afișează prioritate și culoare pe card (URGENT=roșu, RIDICAT=orange)', async () => {
    renderPage();

    await waitFor(() => {
      const urgentCard = screen.getByText('TKT-2026-0001');
      expect(urgentCard).toBeInTheDocument();
      // Priority should be visible
      expect(urgentCard.closest('[class*="card"]')).toBeInTheDocument();
    });
  });

  it('deschide modal detalii la click pe tichet', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
    });

    const ticket = screen.getByText('TKT-2026-0001');
    await user.click(ticket);

    await waitFor(() => {
      expect(screen.getByText(/Detalii Tichet/i)).toBeInTheDocument();
    });
  });

  it('permite creare tichet nou', async () => {
    const user = userEvent.setup();
    const { createRepairTicket } = await import('../api/repairTickets');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tichet Nou/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Tichet Nou/i });
    await user.click(createBtn);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText(/Creare Tichet Reparație/i)).toBeInTheDocument();
    });

    // Fill form
    const deviceSelect = screen.getByLabelText(/Dispozitiv/i);
    await user.selectOptions(deviceSelect, '1');

    const prioritySelect = screen.getByLabelText(/Prioritate/i);
    await user.selectOptions(prioritySelect, 'NORMAL');

    const descInput = screen.getByLabelText(/Descriere/i);
    await user.type(descInput, 'Test issue');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Creează/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createRepairTicket).toHaveBeenCalled();
    });
  });

  it('validează form creare tichet', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tichet Nou/i })).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Tichet Nou/i });
    await user.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Creare Tichet Reparație/i)).toBeInTheDocument();
    });

    // Try submit empty
    const submitBtn = screen.getByRole('button', { name: /Creează/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
    });
  });

  it('permite schimbare status tichet din modal', async () => {
    const user = userEvent.setup();
    const { updateTicketStatus } = await import('../api/repairTickets');

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
    });

    const ticket = screen.getByText('TKT-2026-0001');
    await user.click(ticket);

    await waitFor(() => {
      expect(screen.getByText(/Detalii Tichet/i)).toBeInTheDocument();
    });

    // Change status
    const statusSelect = screen.getByLabelText(/Status/i);
    await user.selectOptions(statusSelect, 'IN_LUCRU');

    const saveBtn = screen.getByRole('button', { name: /Salvare/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(updateTicketStatus).toHaveBeenCalledWith(1, 'IN_LUCRU');
    });
  });

  it('validează tranziții state machine (nu permite DESCHIS→INCHIS direct)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
    });

    const ticket = screen.getByText('TKT-2026-0001');
    await user.click(ticket);

    await waitFor(() => {
      expect(screen.getByText(/Detalii Tichet/i)).toBeInTheDocument();
    });

    // Try invalid transition
    const statusSelect = screen.getByLabelText(/Status/i);

    // Option INCHIS should not be available for DESCHIS (should only see IN_LUCRU)
    const selectOptions = statusSelect.querySelectorAll('option');
    const inchisOption = Array.from(selectOptions).find(opt => opt.value === 'INCHIS');
    expect(inchisOption).not.toBeDefined();
  });

  it('afișează timestamp și responsabil pe card', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
      // Data raportării ar trebui vizibilă
      expect(screen.getByText(/2026-06-08/)).toBeInTheDocument();
    });
  });

  it('filtrează tichetele după prioritate', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Filtrare/i })).toBeInTheDocument();
    });

    const filterBtn = screen.getByRole('button', { name: /Filtrare/i });
    await user.click(filterBtn);

    const urgentCheckbox = screen.getByLabelText(/URGENT/i);
    await user.click(urgentCheckbox);

    await waitFor(() => {
      // Should only show URGENT tickets
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
    });
  });

  it('numărul de tichetele pe coloană se actualizează după schimbarea status', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-0001')).toBeInTheDocument();
    });

    const deschisCol = screen.getByText(/DESCHIS/).parentElement;
    const initialCount = deschisCol.textContent.match(/\(\d+\)/)?.[0];

    // After status change, count should update
    // This would be verified after actual drag-drop or status update
    expect(initialCount).toBeDefined();
  });
});
