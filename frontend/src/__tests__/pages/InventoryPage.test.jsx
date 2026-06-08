import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPageV2';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// Dispozitive de test — folosesc `section` (string) conform InventoryPageV2
const SAMPLE_DEVICES = [
  {
    id: 1,
    inventoryNumber: 'DM-2024-001',
    name: 'Defibrilator',
    model: 'X100',
    manufacturer: 'Philips',
    riskClass: 'IIb',
    status: 'FUNCTIONAL',
    section: 'ATI',
  },
  {
    id: 2,
    inventoryNumber: 'DM-2024-002',
    name: 'Monitor pacient',
    model: 'M50',
    manufacturer: 'GE',
    riskClass: 'IIa',
    status: 'DEFECT',
    section: 'Bloc Operator',
  },
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

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRouter();
  });

  it('randează tabelul cu lista de dispozitive și secțiunea de filtre', async () => {
    renderWithProviders(<InventoryPage />);
    expect(await screen.findByText('DM-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Filtrare și Căutare')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('afișează coloanele Dispozitiv, Inv. Nr., Status și Secție', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');
    expect(screen.getByRole('columnheader', { name: 'Dispozitiv' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Inv. Nr.' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Secție' })).toBeInTheDocument();
  });

  it('filtrarea după status afișează doar dispozitivele cu acel status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.selectOptions(screen.getByLabelText('Filtru status'), 'DEFECT');

    await waitFor(() => {
      expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
      expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
    });
  });

  it('căutarea filtrează dispozitivele în timp real', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.type(screen.getByLabelText(/Căutare/), 'Monitor');

    await waitFor(() => {
      expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
      expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
    });
  });

  it('butoanele de vizualizare (tabel/carduri/kanban) sunt vizibile și schimbă view-ul', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const cardsBtn = screen.getByRole('button', { name: 'Carduri' });
    expect(cardsBtn).toBeInTheDocument();
    await user.click(cardsBtn);
    expect(cardsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('filtrarea după secție afișează doar dispozitivele din acea secție', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.selectOptions(screen.getByLabelText('Filtru secție'), 'ATI');

    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
    });
  });

  it('combinarea filtrelor de status și secție afișează rezultatele corecte', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.selectOptions(screen.getByLabelText('Filtru status'), 'FUNCTIONAL');
    await user.selectOptions(screen.getByLabelText('Filtru secție'), 'ATI');

    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
    });
  });

  it('ștergerea textului de căutare restaurează toate dispozitivele', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const searchInput = screen.getByLabelText(/Căutare/);
    await user.type(searchInput, 'Monitor');
    await waitFor(() => expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument());

    await user.clear(searchInput);
    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
    });
  });

  it('link-ul de editare navighează la pagina de editare a dispozitivului', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const editLink = screen.getByRole('link', { name: /Editare Defibrilator/ });
    expect(editLink).toHaveAttribute('href', '/devices/1/edit');
  });

  it('ștergerea unui dispozitiv după confirmare apelează DELETE', async () => {
    const user = userEvent.setup();
    api.delete.mockResolvedValue({ data: {} });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.click(screen.getByRole('button', { name: /Ștergere Defibrilator/ }));
    await user.click(await screen.findByRole('button', { name: 'Șterge' }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/devices/1');
    });
  });

  it('indicatorul de pagini arată numărul corect de dispozitive găsite', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    expect(await screen.findByText(/2 dispozitive găsite/)).toBeInTheDocument();
  });

  it('afișează mesajul "Niciun dispozitiv găsit" când lista este goală', async () => {
    mockApiRouter([]);
    renderWithProviders(<InventoryPage />);
    expect(await screen.findByText('Niciun dispozitiv găsit')).toBeInTheDocument();
  });

  it('pagina afișează titlul corect și butonul de adăugare', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    expect(screen.getByRole('heading', { name: 'Inventar Dispozitive Medicale' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Adaugă/ })).toBeInTheDocument();
  });
});
