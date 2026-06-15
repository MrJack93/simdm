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

describe('RepairTicketsPage — Extended Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează toate 5 coloanele kanban', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('DESCHIS')).toBeInTheDocument();
      expect(screen.getByText('IN_LUCRU')).toBeInTheDocument();
      expect(screen.getByText('REZOLVAT')).toBeInTheDocument();
      expect(screen.getByText('TESTAT')).toBeInTheDocument();
      expect(screen.getByText('INCHIS')).toBeInTheDocument();
    });
  });

  it('afișează device names pe carduri', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
  });

  it('comută între vizualizarea Kanban și Jurnal', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('DESCHIS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
    await waitFor(() => {
      expect(screen.getByText('Nr.')).toBeInTheDocument();
    });
  });

  it('afișează tabelul Jurnal cu device names', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
      expect(screen.getByText('Radiograf')).toBeInTheDocument();
    });
  });

  it('afișează data și solicitantul în jurnal', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
    await waitFor(() => {
      expect(screen.getByText('Dr. Popescu')).toBeInTheDocument();
    });
  });

  it('descarcă Formular 7', async () => {
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

  it('afișează butonul de filtrare', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Filtrare')).toBeInTheDocument();
    });
  });

  it('filtrează tichetele după prioritate', async () => {
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

  it('deschide modal creare tichet și validează', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tichet Nou')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Tichet Nou'));
    await waitFor(() => {
      expect(screen.getByText('Creare Tichet Reparație')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Creează'));
    await waitFor(() => {
      expect(screen.getByText(/obligatoriu/i)).toBeInTheDocument();
    });
  });

  it('creează tichet cu date valide', async () => {
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
      expect(repairApi.createRepairTicket).toHaveBeenCalled();
    });
  });

  it('deschide detalii tichet', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Echograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
  });

  it('schimbă statusul tichetului din detalii', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Echograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
    const statusSelect = screen.getByLabelText('Schimba status');
    fireEvent.change(statusSelect, { target: { value: 'IN_LUCRU' } });
    fireEvent.click(screen.getByText('Salvare status'));
    await waitFor(() => {
      expect(repairApi.updateTicketStatus).toHaveBeenCalledWith(1, 'IN_LUCRU');
    });
  });

  it('afișează Formular 8 pe carduri non-DESCHIS', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Radiograf')).toBeInTheDocument();
    });
    const f8Buttons = screen.getAllByText(/Formular Nr\. 8/);
    expect(f8Buttons.length).toBeGreaterThan(0);
  });

  it('descarcă Formular 8 din detalii', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Radiograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Radiograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Formular 8 (PDF)'));
    await waitFor(() => {
      expect(repairApi.downloadFormular8Pdf).toHaveBeenCalled();
    });
  });

  it('afișează butonul de externalizare pentru tichete ne-închise', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Echograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
    expect(screen.getByText('Externalizeaza')).toBeInTheDocument();
  });

  it('externalizează tichetul', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Echograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Externalizeaza'));
    await waitFor(() => {
      expect(repairApi.triageTicket).toHaveBeenCalled();
    });
  });

  it('închide modalul de detalii', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Echograf'));
    await waitFor(() => {
      expect(screen.getByText('Detalii Tichet')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/nchide/));
    await waitFor(() => {
      expect(screen.queryByText('Detalii Tichet')).not.toBeInTheDocument();
    });
  });

  it('afișează priorități pe carduri', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('URGENT')).toBeInTheDocument();
      expect(screen.getByText('RIDICAT')).toBeInTheDocument();
    });
  });

  it('jurnalul afișează mesaj gol când lista e goală', async () => {
    repairApi.getRepairTickets.mockResolvedValueOnce({ data: [] });
    renderPage();
    fireEvent.click(screen.getByText('Jurnal Chemari (F7)'));
    await waitFor(() => {
      expect(screen.getByText('Nu exista chemari inregistrate.')).toBeInTheDocument();
    });
  });

  it('filtrează tichetele după prioritate', async () => {
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

  it('afișează tabul reparație pentru tichete IN_LUCRU', async () => {
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
});
