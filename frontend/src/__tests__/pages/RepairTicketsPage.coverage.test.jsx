import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/repairTickets', () => ({
  getRepairTickets: vi.fn(() =>
    Promise.resolve({
      data: [
        { id: 1, ticketNumber: 'TKT-001', device: { name: 'Echograf', inventoryNumber: 'INV-001' }, status: 'DESCHIS', priority: 'URGENT', faultDescription: 'Ecran spart', reportedAt: '2026-06-10T10:00:00Z', reportedBy: 'Dr. Popescu' },
        { id: 2, ticketNumber: 'TKT-002', device: { name: 'Radiograf', inventoryNumber: 'INV-002' }, status: 'IN_LUCRU', priority: 'RIDICAT', faultDescription: 'Motor zgomotos', reportedAt: '2026-06-09T10:00:00Z', reportedBy: 'Dr. Ion', engineerName: 'Ing. Vasile' },
        { id: 3, ticketNumber: 'TKT-003', device: { name: 'Densitometru', inventoryNumber: 'INV-003' }, status: 'REZOLVAT', priority: 'NORMAL', faultDescription: 'Calibrare', reportedAt: '2026-06-08T10:00:00Z', reportedBy: 'Dr. Maria' },
        { id: 4, ticketNumber: 'TKT-004', device: { name: 'Defibrilator', inventoryNumber: 'INV-004' }, status: 'TESTAT', priority: 'SCAZUT', faultDescription: 'Baterie', reportedAt: '2026-06-07T10:00:00Z', reportedBy: 'Dr. Ana' },
        { id: 5, ticketNumber: 'TKT-005', device: { name: 'Monitor', inventoryNumber: 'INV-005' }, status: 'INCHIS', priority: 'NORMAL', faultDescription: 'Display', reportedAt: '2026-06-06T10:00:00Z', reportedBy: 'Dr. Andrei' },
      ],
    })
  ),
  createRepairTicket: vi.fn(() => Promise.resolve({ id: 6, ticketNumber: 'TKT-006' })),
  updateTicketStatus: vi.fn(() => Promise.resolve({})),
  triageTicket: vi.fn(() => Promise.resolve({})),
  submitRepair: vi.fn(() => Promise.resolve({})),
  downloadFormular7Pdf: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
  downloadFormular8Pdf: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
  downloadFormular9Pdf: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
}));

vi.mock('../../api/devices', () => ({
  getDevices: vi.fn(() =>
    Promise.resolve({
      devices: [
        { id: 1, name: 'Echograf' },
        { id: 2, name: 'Radiograf' },
        { id: 3, name: 'Densitometru' },
      ],
    })
  ),
}));

import RepairTicketsPage from '../../pages/RepairTicketsPage';
import * as repairApi from '../../api/repairTickets';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RepairTicketsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RepairTicketsPage Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('kanban board columns', () => {
    it('renders all 5 kanban columns with counts', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('DESCHIS')).toBeInTheDocument();
        expect(screen.getByText('IN_LUCRU')).toBeInTheDocument();
        expect(screen.getByText('REZOLVAT')).toBeInTheDocument();
        expect(screen.getByText('TESTAT')).toBeInTheDocument();
        expect(screen.getByText('INCHIS')).toBeInTheDocument();
      });
    });

    it('shows ticket counts per column', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getAllByText('(1)').length).toBeGreaterThan(0);
      });
    });

    it('displays ticket cards with correct data', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('TKT-001')).toBeInTheDocument();
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
    });
  });

  describe('triage and repair modals', () => {
    it('opens details modal for DESCHIS ticket', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => {
        expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
      });
    });

    it('shows repair tab for IN_LUCRU ticket', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Radiograf'));
      await waitFor(() => {
        expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
      });
      expect(screen.getByText('Informatii')).toBeInTheDocument();
      expect(screen.getByText('Editare Reparatie')).toBeInTheDocument();
    });

    it('switches to repair tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Radiograf'));
      await waitFor(() => {
        expect(screen.getByText('Editare Reparatie')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Editare Reparatie'));
      await waitFor(() => {
        expect(screen.getByText(/Raport reparatie/)).toBeInTheDocument();
      expect(screen.getByText(/Actiuni intreprinse/)).toBeInTheDocument();
      });
    });

    it('validates repair form fields', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Radiograf'));
      await waitFor(() => {
        expect(screen.getByText('Editare Reparatie')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Editare Reparatie'));
      await waitFor(() => {
        expect(screen.getByText('Salvare reparație')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Salvare reparație'));
      await waitFor(() => {
        expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
      });
    });

    it('submits repair with valid data', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Radiograf'));
      await waitFor(() => {
        expect(screen.getByText('Editare Reparatie')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Editare Reparatie'));
      await waitFor(() => {
        expect(screen.getByText(/Raport reparatie/)).toBeInTheDocument();
      expect(screen.getByText(/Actiuni intreprinse/)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByText(/Raport reparatie/).parentElement.querySelector('textarea'), { target: { value: 'Reparatie efectuata' } });
      fireEvent.change(screen.getByText(/Actiuni intreprinse/).parentElement.querySelector('textarea'), { target: { value: 'Actiuni concrete' } });
      fireEvent.change(screen.getByText(/Durata/).parentElement.querySelector('input'), { target: { value: '2' } });
      fireEvent.change(screen.getByText(/Inginer responsabil/).parentElement.querySelector('input'), { target: { value: 'Ing. Test' } });
      fireEvent.click(screen.getByText('Salvare reparație'));
      await waitFor(() => {
        expect(repairApi.submitRepair).toHaveBeenCalled();
      });
    });
  });

  describe('status transitions', () => {
    it('shows status change dropdown for DESCHIS ticket', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => {
        expect(screen.getByText('Schimba status')).toBeInTheDocument();
      });
    });

    it('changes status via dropdown', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => {
        expect(screen.getByText('Salvare status')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText('Schimba status'), { target: { value: 'IN_LUCRU' } });
      fireEvent.click(screen.getByText('Salvare status'));
      await waitFor(() => {
        expect(repairApi.updateTicketStatus).toHaveBeenCalledWith(1, 'IN_LUCRU');
      });
    });

    it('externalizes ticket', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => {
        expect(screen.getByText('Externalizeaza')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Externalizeaza'));
      await waitFor(() => {
        expect(repairApi.triageTicket).toHaveBeenCalled();
      });
    });
  });

  describe('view modes', () => {
    it('switches to jurnal view', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('DESCHIS')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
      await waitFor(() => {
        expect(screen.getByText('Nr.')).toBeInTheDocument();
      });
    });

    it('switches back to kanban view', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('DESCHIS')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
      await waitFor(() => {
        expect(screen.getByText('Nr.')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Kanban'));
      await waitFor(() => {
        expect(screen.getByText('DESCHIS')).toBeInTheDocument();
      });
    });
  });

  describe('create ticket modal', () => {
    it('opens create modal', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Tichet Nou'));
      await waitFor(() => {
        expect(screen.getByText('Creare Tichet Reparație')).toBeInTheDocument();
      });
    });

    it('validates device required', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Tichet Nou'));
      await waitFor(() => {
        expect(screen.getByText('Creează')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Creează'));
      await waitFor(() => {
        expect(screen.getAllByText(/obligatoriu/i).length).toBeGreaterThan(0);
      });
    });

    it('validates description required', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Tichet Nou'));
      await waitFor(() => {
        expect(screen.getByLabelText(/Dispozitiv/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/i), { target: { value: '1' } });
      fireEvent.click(screen.getByText('Creează'));
      await waitFor(() => {
        expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
      });
    });

    it('creates ticket with valid data', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Tichet Nou'));
      await waitFor(() => {
        expect(screen.getByLabelText(/Dispozitiv/i)).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/i), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText(/Descriere/i), { target: { value: 'Test problem' } });
      fireEvent.click(screen.getByText('Creează'));
      await waitFor(() => {
        expect(screen.queryByText('Creare Tichet Reparație')).not.toBeInTheDocument();
      });
    });

    it('closes modal on cancel', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Tichet Nou'));
      await waitFor(() => {
        expect(screen.getByText('Creare Tichet Reparație')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Anulare'));
      await waitFor(() => {
        expect(screen.queryByText('Creare Tichet Reparație')).not.toBeInTheDocument();
      });
    });
  });

  describe('filters', () => {
    it('toggles filter panel', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('Filtrare')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Filtrare'));
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('filters by status', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Filtrare'));
      await waitFor(() => { expect(screen.getByText('Status')).toBeInTheDocument(); });
      fireEvent.change(screen.getByDisplayValue('Toate'), { target: { value: 'DESCHIS' } });
      await waitFor(() => {
        expect(repairApi.getRepairTickets).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'DESCHIS' })
        );
      });
    });

    it('filters by priority', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Filtrare'));
      await waitFor(() => {
        expect(screen.getByLabelText(/URGENT/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText(/URGENT/i));
      await waitFor(() => {
        expect(repairApi.getRepairTickets).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'URGENT' })
        );
      });
    });
  });

  describe('PDF downloads', () => {
    it('downloads Formular 7 from jurnal view', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
      await waitFor(() => {
        expect(screen.getByText('Descarca Formular Nr. 7 (PDF)')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Descarca Formular Nr. 7 (PDF)'));
      await waitFor(() => {
        expect(repairApi.downloadFormular7Pdf).toHaveBeenCalled();
      });
    });

    it('downloads Formular 8 from details modal', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Radiograf'));
      await waitFor(() => {
        expect(screen.getByText('Formular 8 (PDF)')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Formular 8 (PDF)'));
      await waitFor(() => {
        expect(repairApi.downloadFormular8Pdf).toHaveBeenCalled();
      });
    });
  });

  describe('empty states', () => {
    it('shows empty jurnal message', async () => {
      repairApi.getRepairTickets.mockResolvedValueOnce({ data: [] });
      renderPage();
      fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
      await waitFor(() => {
        expect(screen.getByText('Nu exista chemari inregistrate.')).toBeInTheDocument();
      });
    });
  });

  describe('ticket card interactions', () => {
    it('shows Formular 8 button on non-DESCHIS cards', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Radiograf')).toBeInTheDocument();
      });
      const f8Buttons = screen.getAllByText(/Formular Nr\. 8/);
      expect(f8Buttons.length).toBeGreaterThan(0);
    });

    it('clicking card opens details', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Densitometru')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Densitometru'));
      await waitFor(() => {
        expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
      });
    });
  });

  describe('details modal info tab', () => {
    it('displays ticket info fields', async () => {
      renderPage();
      await waitFor(() => { expect(screen.getByText('Echograf')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => { expect(screen.getByText('Detalii Tichet')).toBeInTheDocument(); });
      expect(screen.getAllByText('TKT-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('URGENT').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ecran spart').length).toBeGreaterThan(0);
    });

    it('closes details modal', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Echograf')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Echograf'));
      await waitFor(() => {
        expect(screen.getByText(/nchide/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/nchide/i));
      await waitFor(() => {
        expect(screen.queryByText('Detalii Tichet')).not.toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading indicator', async () => {
      repairApi.getRepairTickets.mockReturnValue(new Promise(() => {}));
      renderPage();
      expect(screen.getByText('Incarcand...')).toBeInTheDocument();
    });
  });
});
