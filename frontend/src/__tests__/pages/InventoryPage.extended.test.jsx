import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPageV2';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const SAMPLE_DEVICES = [
  { id: 1, inventoryNumber: 'DM-001', name: 'Defibrilator', model: 'X100', status: 'FUNCTIONAL', section: 'ATI' },
  { id: 2, inventoryNumber: 'DM-002', name: 'Monitor', model: 'M50', status: 'DEFECT', section: 'Bloc Operator' },
  { id: 3, inventoryNumber: 'DM-003', name: 'Ventilator', model: 'V200', status: 'IN_REPARATIE', section: 'ATI' },
  { id: 4, inventoryNumber: 'DM-004', name: 'Echograf', model: 'E100', status: 'CASAT', section: 'Radiologie' },
  { id: 5, inventoryNumber: 'DM-005', name: 'Pulsoximetru', model: 'P50', status: 'REZERVA', section: 'ATI' },
  { id: 6, inventoryNumber: 'DM-006', name: 'Aspirator', model: 'A30', status: 'IMPRUMUTAT', section: 'Chirurgie' },
];

function mockApiRouter(devices = SAMPLE_DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices')) {
      return Promise.resolve({
        data: { devices, pagination: { total: devices.length, pages: 1 } },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('InventoryPage — Extended Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRouter();
  });

  it('afișează status Funcțional în tabel', async () => {
    renderWithProviders(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Funcțional')).toBeInTheDocument();
    });
  });

  it('comută la vizualizarea carduri', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const cardsBtn = screen.getByRole('button', { name: 'Carduri' });
    fireEvent.click(cardsBtn);

    expect(cardsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Defibrilator')).toBeInTheDocument();
  });

  it('comută la vizualizarea kanban', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const kanbanBtn = screen.getByRole('button', { name: 'Kanban' });
    fireEvent.click(kanbanBtn);

    await waitFor(() => {
      expect(kanbanBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('kanban afișează dispozitive grupate pe status', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.click(screen.getByRole('button', { name: 'Kanban' }));

    await waitFor(() => {
      expect(screen.getByText('✓ Funcțional (1)')).toBeInTheDocument();
    });
  });

  it('căutarea funcționează pe model', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.change(screen.getByLabelText(/Căutare/), { target: { value: 'X100' } });

    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
    });
  });

  it('căutarea funcționează pe inventar number', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.change(screen.getByLabelText(/Căutare/), { target: { value: 'DM-002' } });

    await waitFor(() => {
      expect(screen.getByText('Monitor')).toBeInTheDocument();
      expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
    });
  });

  it('link-urile de editare au href corect', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const editLinks = screen.getAllByRole('link', { name: /Editare/ });
    expect(editLinks[0]).toHaveAttribute('href', '/devices/1/edit');
  });

  it('butonul Adaugă navighează la /devices/new', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const addLink = screen.getByRole('link', { name: /Adaugă/ });
    expect(addLink).toHaveAttribute('href', '/devices/new');
  });

  it('afișează skeleton-uri în timpul încărcării', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<InventoryPage />);
    expect(screen.getByText('Inventar Dispozitive Medicale')).toBeInTheDocument();
  });

  it('filtrarea după secție returnează doar dispozitivele din secția respectivă', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.change(screen.getByLabelText('Filtru secție'), { target: { value: 'Radiologie' } });

    await waitFor(() => {
      expect(screen.getByText('Echograf')).toBeInTheDocument();
      expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
    });
  });

  it('resetarea filtrelor afișează toate dispozitivele', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.change(screen.getByLabelText('Filtru status'), { target: { value: 'DEFECT' } });
    await waitFor(() => expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtru status'), { target: { value: 'all' } });
    await waitFor(() => expect(screen.getByText('Defibrilator')).toBeInTheDocument());
  });

  it('cardurile au link de editare', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    fireEvent.click(screen.getByRole('button', { name: 'Carduri' }));

    await waitFor(() => {
      const editLinks = screen.getAllByRole('link', { name: /Editare/ });
      expect(editLinks.length).toBeGreaterThan(0);
    });
  });

  it('status badge afișează icon corect', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('⟳')).toBeInTheDocument();
  });

  it('afișează mesajul corect pentru 0 dispozitive', async () => {
    mockApiRouter([]);
    renderWithProviders(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Niciun dispozitiv găsit')).toBeInTheDocument();
    });
    expect(screen.getByText('Adaugă dispozitiv')).toBeInTheDocument();
  });

  it('filtrul de status funcționează pe toate statusurile', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    for (const status of ['FUNCTIONAL', 'DEFECT', 'IN_REPARATIE', 'CASAT', 'IMPRUMUTAT', 'REZERVA']) {
      fireEvent.change(screen.getByLabelText('Filtru status'), { target: { value: status } });
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText('Filtru status'), { target: { value: 'all' } });
      await waitFor(() => {
        expect(screen.getByText('DM-001')).toBeInTheDocument();
      });
    }
  });

  it('tooltip-ul de ștergere conține numele dispozitivului', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const deleteBtn = screen.getByRole('button', { name: /Ștergere Defibrilator/ });
    expect(deleteBtn).toBeInTheDocument();
  });
});
