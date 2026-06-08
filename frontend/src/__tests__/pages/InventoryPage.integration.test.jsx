import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPageV2';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// Generează N dispozitive de test cu atribute unice.
function makeDevices(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    inventoryNumber: `DM-${String(i + 1).padStart(3, '0')}`,
    name: `Dispozitiv ${i + 1}`,
    model: `Model-${i + 1}`,
    manufacturer: 'TestCo',
    riskClass: 'IIa',
    status: i % 2 === 0 ? 'FUNCTIONAL' : 'DEFECT',
    section: i < 10 ? 'ATI' : 'Bloc Operator',
  }));
}

function mockApiRouter(devices) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices')) {
      return Promise.resolve({
        data: { devices, pagination: { total: devices.length, pages: 1 } },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('InventoryPage — paginare client-side', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('paginatorul se afișează când există mai mult de 20 de dispozitive', async () => {
    const devices = makeDevices(21);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    expect(screen.getByRole('button', { name: /← Înapoi/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Înainte →/ })).toBeInTheDocument();
  });

  it('butonul de pagină Înapoi este dezactivat pe prima pagină', async () => {
    const devices = makeDevices(21);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    expect(screen.getByRole('button', { name: /← Înapoi/ })).toBeDisabled();
  });

  it('butonul Înainte avansează pagina', async () => {
    const user = userEvent.setup();
    const devices = makeDevices(21);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    await user.click(screen.getByRole('button', { name: /Înainte →/ }));

    await waitFor(() => {
      expect(screen.queryByText('Dispozitiv 1')).not.toBeInTheDocument();
      expect(screen.getByText('Dispozitiv 21')).toBeInTheDocument();
    });
  });

  it('butonul Înainte este dezactivat pe ultima pagină', async () => {
    const user = userEvent.setup();
    const devices = makeDevices(21);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    await user.click(screen.getByRole('button', { name: /Înainte →/ }));
    await waitFor(() => expect(screen.getByText('Dispozitiv 21')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /Înainte →/ })).toBeDisabled();
  });

  it('indicatorul de pagini arată total corect', async () => {
    const devices = makeDevices(21);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    expect(screen.getByText(/21 dispozitive găsite/)).toBeInTheDocument();
  });

  it('paginatorul nu se afișează când sunt maxim 20 de dispozitive', async () => {
    const devices = makeDevices(20);
    mockApiRouter(devices);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Dispozitiv 1');

    expect(screen.queryByRole('button', { name: /Înainte →/ })).not.toBeInTheDocument();
  });

  it('paginatorul nu se afișează când lista este goală', async () => {
    mockApiRouter([]);
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Niciun dispozitiv găsit');

    expect(screen.queryByRole('button', { name: /Înainte →/ })).not.toBeInTheDocument();
  });
});

describe('InventoryPage — combinații de filtre (client-side)', () => {
  const devices = [
    { id: 1, inventoryNumber: 'DM-001', name: 'Defibrilator', model: 'X1', manufacturer: 'A', riskClass: 'IIb', status: 'FUNCTIONAL', section: 'ATI' },
    { id: 2, inventoryNumber: 'DM-002', name: 'Monitor pacient', model: 'M1', manufacturer: 'B', riskClass: 'IIa', status: 'DEFECT', section: 'Bloc Operator' },
    { id: 3, inventoryNumber: 'DM-003', name: 'Ventilator', model: 'V1', manufacturer: 'C', riskClass: 'IIb', status: 'FUNCTIONAL', section: 'ATI' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.startsWith('/devices')) {
        return Promise.resolve({ data: { devices, pagination: { total: 3, pages: 1 } } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('filtrarea după status și secție returnează intersecția corectă', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    await user.selectOptions(screen.getByLabelText('Filtru status'), 'FUNCTIONAL');
    await user.selectOptions(screen.getByLabelText('Filtru secție'), 'ATI');

    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/2 dispozitive găsite/)).toBeInTheDocument();
  });

  it('căutarea + filtrul de status funcționează împreună', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    await user.type(screen.getByLabelText(/Căutare/), 'Defib');
    await user.selectOptions(screen.getByLabelText('Filtru status'), 'FUNCTIONAL');

    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      expect(screen.queryByText('Ventilator')).not.toBeInTheDocument();
    });
  });

  it('selectarea "Toate statusurile" readuce toate dispozitivele', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    await user.selectOptions(screen.getByLabelText('Filtru status'), 'DEFECT');
    await waitFor(() => expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Filtru status'), 'all');
    await waitFor(() => {
      expect(screen.getByText('Defibrilator')).toBeInTheDocument();
      expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
    });
  });

  it('filtrarea după secție populează opțiunile din dispozitivele existente', async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-001');

    const sectionSelect = screen.getByLabelText('Filtru secție');
    expect(sectionSelect).toContainElement(screen.getByRole('option', { name: 'ATI' }));
    expect(sectionSelect).toContainElement(screen.getByRole('option', { name: 'Bloc Operator' }));
  });
});
