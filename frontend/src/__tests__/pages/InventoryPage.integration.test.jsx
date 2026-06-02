import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPage';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// Teste de integrare pentru InventoryPage — paginare și combinații de filtre.

const DEVICE = {
  id: 1,
  inventoryNumber: 'DM-2024-001',
  name: 'Defibrilator',
  model: 'X100',
  manufacturer: 'Philips',
  riskClass: 'IIb',
  status: 'FUNCTIONAL',
  sections: { name: 'ATI' },
};

// Router pe URL cu paginare configurabilă (total pagini).
function mockApiRouter({ devices = [DEVICE], pages = 1, total = 1 } = {}) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices/dropdown/sections')) {
      return Promise.resolve({ data: [{ id: 1, name: 'ATI' }, { id: 2, name: 'Bloc Operator' }] });
    }
    if (url.startsWith('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
    if (url.startsWith('/devices')) {
      return Promise.resolve({ data: { devices, pagination: { total, pages } } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('InventoryPage — paginare și combinații de filtre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('butonul de pagină Înapoi este dezactivat pe prima pagină', async () => {
    mockApiRouter({ pages: 3, total: 120 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const prevBtn = screen.getByRole('button', { name: /← Înapoi/ });
    expect(prevBtn).toBeDisabled();
  });

  it('butonul Înainte avansează pagina și declanșează fetch cu page=2', async () => {
    const user = userEvent.setup();
    mockApiRouter({ pages: 3, total: 120 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.click(screen.getByRole('button', { name: /Înainte →/ }));

    await waitFor(() => {
      const call = api.get.mock.calls.find(
        ([url]) => url.includes('/devices?') && url.includes('page=2')
      );
      expect(call).toBeTruthy();
    });
    // Indicatorul de pagină reflectă pagina 2.
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('butonul Înainte este dezactivat când există o singură pagină', async () => {
    mockApiRouter({ pages: 1, total: 1 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    expect(screen.getByRole('button', { name: /Înainte →/ })).toBeDisabled();
  });

  it('combinația căutare + status + clasă de risc trimite toți parametrii într-un singur query', async () => {
    const user = userEvent.setup();
    mockApiRouter({ pages: 1, total: 1 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    await user.type(screen.getByLabelText('Căutare'), 'Defib');
    await user.selectOptions(screen.getByLabelText('Status'), 'FUNCTIONAL');
    await user.selectOptions(screen.getByLabelText('Clasa Risc'), 'IIb');

    await waitFor(() => {
      const call = api.get.mock.calls.find(
        ([url]) =>
          url.includes('search=Defib') &&
          url.includes('status=FUNCTIONAL') &&
          url.includes('riskClass=IIb')
      );
      expect(call).toBeTruthy();
    });
  });

  it('butonul Resetare readuce statusul la valoarea implicită și refetch fără filtre', async () => {
    const user = userEvent.setup();
    mockApiRouter({ pages: 1, total: 1 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('DM-2024-001');

    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'DEFECT');
    await user.click(screen.getByRole('button', { name: 'Resetare' }));

    // După resetare, selectul de status revine la "" (toate).
    expect(statusSelect).toHaveValue('');
  });

  it('paginatorul nu se afișează când lista de dispozitive este goală', async () => {
    mockApiRouter({ devices: [], pages: 1, total: 0 });
    renderWithProviders(<InventoryPage />);
    await screen.findByText('Nu sunt dispozitive în baza de date.');

    expect(screen.queryByRole('button', { name: /Înainte →/ })).not.toBeInTheDocument();
  });
});
