import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConsumablesPage from '../../pages/ConsumablesPage';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// Teste de integrare pentru ConsumablesPage — căutare, sugestii, badge expirare,
// reset filtre și creare consumabil. Toate folosesc instanța axios mockată global.

// Date dependente de „acum" pentru badge-urile de expirare.
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

const SAMPLE = [
  { id: 1, name: 'Mănuși nitril', model: 'L', quantity: 5, minQuantity: 100, unitOfMeasure: 'buc', expiryDate: null },
  { id: 2, name: 'Seringă 10ml', model: 'STD', quantity: 500, minQuantity: 50, unitOfMeasure: 'buc', expiryDate: null },
];

function mockConsumables(consumables = SAMPLE) {
  api.get.mockResolvedValue({
    data: { consumables, pagination: { total: consumables.length, pages: 1 } },
  });
}

describe('ConsumablesPage — căutare, expirare și creare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumables();
  });

  it('căutarea declanșează un nou fetch cu ?search=', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.type(screen.getByLabelText('Căutare'), 'Mănuși');
    await waitFor(() => {
      const call = api.get.mock.calls.find(
        ([url]) => url.includes('/consumables?') && url.includes('search=M')
      );
      expect(call).toBeTruthy();
    });
  });

  it('selectarea unei sugestii de autocomplete completează câmpul de căutare', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.type(screen.getByLabelText('Căutare'), 'Ser');
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    await user.click(options[0]);
    expect(screen.getByLabelText('Căutare')).toHaveValue('Seringă 10ml');
  });

  it('butonul Resetare curăță câmpul de căutare', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    const searchInput = screen.getByLabelText('Căutare');
    await user.type(searchInput, 'ceva');
    await user.click(screen.getByRole('button', { name: 'Resetare' }));
    expect(searchInput).toHaveValue('');
  });

  it('afișează badge "expirat" pentru un consumabil cu data de expirare trecută', async () => {
    mockConsumables([
      { id: 3, name: 'Tampon steril', model: 'X', quantity: 10, minQuantity: 1, unitOfMeasure: 'buc', expiryDate: inDays(-5) },
    ]);
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Tampon steril');
    // getExpiryBadge => "⚠️ Expirat" pentru daysUntilExpiry < 0.
    expect(screen.getByText('⚠️ Expirat')).toBeInTheDocument();
  });

  it('afișează badge de expirare iminentă (zile rămase) pentru produs ce expiră curând', async () => {
    mockConsumables([
      { id: 4, name: 'Expiră curând', model: 'Y', quantity: 10, minQuantity: 1, unitOfMeasure: 'buc', expiryDate: inDays(3) },
    ]);
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Expiră curând');
    // daysUntilExpiry < 7 => badge cu "zile".
    expect(screen.getByText(/zile/)).toBeInTheDocument();
  });

  it('creează un consumabil nou prin POST din formularul de adăugare', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { id: 99 } });
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.click(screen.getByRole('button', { name: /Adaugă Consumabil/ }));
    await screen.findByText('Adaugă Consumabil Nou');

    await user.type(screen.getByLabelText('Denumire'), 'Comprese sterile');
    await user.type(screen.getByLabelText('Cantitate'), '200');

    await user.click(screen.getByRole('button', { name: 'Adaugă' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/consumables',
        expect.objectContaining({ name: 'Comprese sterile' })
      );
    });
  });
});
