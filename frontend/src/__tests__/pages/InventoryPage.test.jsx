import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPage';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const SAMPLE_DEVICES = [
  {
    id: 1,
    inventoryNumber: 'DM-2024-001',
    name: 'Defibrilator',
    model: 'X100',
    manufacturer: 'Philips',
    riskClass: 'IIb',
    status: 'FUNCTIONAL',
    sections: { name: 'ATI' },
  },
  {
    id: 2,
    inventoryNumber: 'DM-2024-002',
    name: 'Monitor pacient',
    model: 'M50',
    manufacturer: 'GE',
    riskClass: 'IIa',
    status: 'DEFECT',
    sections: { name: 'Bloc Operator' },
  },
];

// Router pe URL: dispozitivele, secțiile (dropdown) și consumabilele (AlertsWidget).
function mockApiRouter(devices = SAMPLE_DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices/dropdown/sections')) {
      return Promise.resolve({ data: [{ id: 1, name: 'ATI' }, { id: 2, name: 'Bloc Operator' }] });
    }
    if (url.startsWith('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
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

  it('afișează coloanele Nr. Inventar, Denumire, Status și Secție', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');
    expect(screen.getByRole('columnheader', { name: 'Nr. Inventar' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Denumire / Model' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Secție' })).toBeInTheDocument();
  });

  it('refiltrarea după status declanșează un nou fetch cu ?status=DEFECT', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.selectOptions(screen.getByLabelText('Status'), 'DEFECT');

    await waitFor(() => {
      const statusCall = api.get.mock.calls.find(
        ([url]) => url.includes('/devices?') && url.includes('status=DEFECT')
      );
      expect(statusCall).toBeTruthy();
    });
  });

  it('căutarea declanșează un nou fetch cu ?search=', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.type(screen.getByLabelText('Căutare'), 'Monitor');

    await waitFor(() => {
      const searchCall = api.get.mock.calls.find(
        ([url]) => url.includes('/devices?') && url.includes('search=Monitor')
      );
      expect(searchCall).toBeTruthy();
    });
  });

  it('butoanele de export Excel și CSV sunt vizibile și pot fi apăsate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const excelBtn = screen.getByRole('button', { name: /Export Excel/ });
    const csvBtn = screen.getByRole('button', { name: /Export CSV/ });
    expect(excelBtn).toBeInTheDocument();
    expect(csvBtn).toBeInTheDocument();

    await user.click(excelBtn);
    await waitFor(() => {
      const exportCall = api.get.mock.calls.find(([url]) => url.includes('/devices/export/xlsx'));
      expect(exportCall).toBeTruthy();
    });
  });

  it('afișează sugestii de autocomplete la căutare și le poate selecta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.type(screen.getByLabelText('Căutare'), 'Monitor');
    // Sugestiile apar ca opțiuni în listbox
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    await user.click(options[0]);
    // După selecție, câmpul de căutare preia numărul de inventar al sugestiei
    expect(screen.getByLabelText('Căutare')).toHaveValue('DM-2024-002');
  });

  it('filtrarea după clasă de risc și secție declanșează fetch-uri noi', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.selectOptions(screen.getByLabelText('Clasa Risc'), 'IIb');
    await user.selectOptions(screen.getByLabelText('Secție'), '1');

    await waitFor(() => {
      const call = api.get.mock.calls.find(
        ([url]) => url.includes('riskClass=IIb') && url.includes('sectionId=1')
      );
      expect(call).toBeTruthy();
    });
  });

  it('butonul Resetare curăță căutarea și filtrele', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const searchInput = screen.getByLabelText('Căutare');
    await user.type(searchInput, 'ceva');
    await user.click(screen.getByRole('button', { name: 'Resetare' }));
    expect(searchInput).toHaveValue('');
  });

  it('deschide modalul de editare și salvează statusul prin PUT', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({ data: {} });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    // Primul buton "✎ Editare" din tabel
    const editButtons = screen.getAllByRole('button', { name: /Editare/ });
    await user.click(editButtons[0]);

    expect(await screen.findByRole('heading', { name: 'Editare Dispozitiv' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvare' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/devices/1', expect.any(Object));
    });
  });

  it('marchează un dispozitiv ca CASAT (soft delete) după confirmare', async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(true);
    api.delete.mockResolvedValue({ data: {} });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const deleteButtons = screen.getAllByRole('button', { name: '✕' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/devices/1');
    });
  });

  it('butonul de export CSV apelează endpoint-ul de export CSV', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url.startsWith('/devices/dropdown/sections')) return Promise.resolve({ data: [] });
      if (url.startsWith('/consumables')) return Promise.resolve({ data: { consumables: [] } });
      if (url.includes('/devices/export/csv')) return Promise.resolve({ data: new Blob(['csv']) });
      return Promise.resolve({ data: { devices: SAMPLE_DEVICES, pagination: { total: 2, pages: 1 } } });
    });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => {
      const call = api.get.mock.calls.find(([url]) => url.includes('/devices/export/csv'));
      expect(call).toBeTruthy();
    });
  });

  it('afișează mesajul "Nu sunt dispozitive" când lista este goală', async () => {
    mockApiRouter([]);
    renderWithProviders(<InventoryPage />);
    expect(await screen.findByText('Nu sunt dispozitive în baza de date.')).toBeInTheDocument();
  });

  it('randează AlertsWidget cu alerte de stoc scăzut când există', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/devices/dropdown/sections')) {
        return Promise.resolve({ data: [] });
      }
      if (url.startsWith('/consumables')) {
        return Promise.resolve({
          data: { consumables: [{ id: 9, name: 'Mănuși', quantity: 1, minQuantity: 100, expiryDate: null }] },
        });
      }
      return Promise.resolve({ data: { devices: SAMPLE_DEVICES, pagination: { total: 2, pages: 1 } } });
    });
    renderWithProviders(<InventoryPage />);
    expect(await screen.findByText(/Alerte Consumabile/)).toBeInTheDocument();
    expect(screen.getByText(/sub stoc minim/)).toBeInTheDocument();
  });
});
