import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConsumablesPage from '../../pages/ConsumablesPage';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const SAMPLE = [
  { id: 1, name: 'Mănuși nitril', model: 'L', quantity: 5, minQuantity: 100, unitOfMeasure: 'buc', expiryDate: null },
  { id: 2, name: 'Seringă 10ml', model: 'STD', quantity: 500, minQuantity: 50, unitOfMeasure: 'buc', expiryDate: null },
];

function mockConsumables(consumables = SAMPLE) {
  api.get.mockResolvedValue({
    data: { consumables, pagination: { total: consumables.length, pages: 1 } },
  });
}

describe('ConsumablesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumables();
  });

  it('randează tabelul de consumabile și câmpul de căutare', async () => {
    renderWithProviders(<ConsumablesPage />);
    expect(await screen.findByText('Mănuși nitril')).toBeInTheDocument();
    expect(screen.getByLabelText('Căutare')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('marchează rândurile sub stoc minim cu badge-ul "Sub minim"', async () => {
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');
    // Mănuși: 5 < 100 -> sub minim; Seringă: 500 >= 50 -> OK
    // Badge-ul afișează icoană + etichetă în același element (ex: "❌ Sub minim").
    expect(screen.getByText(/Sub minim/)).toBeInTheDocument();
    expect(screen.getByText(/✅ OK/)).toBeInTheDocument();
  });

  it('butonul "+ Adaugă Consumabil" deschide formularul de adăugare', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.click(screen.getByRole('button', { name: /Adaugă Consumabil/ }));
    // Modalul de adăugare apare cu titlul și câmpurile sale specifice.
    expect(await screen.findByText('Adaugă Consumabil Nou')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantitate')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Expirare')).toBeInTheDocument();
  });

  it('filtrul Cantitate Minimă declanșează un nou fetch cu ?minQuantity=', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.type(screen.getByLabelText('Cantitate Minimă'), '10');
    await waitFor(() => {
      const call = api.get.mock.calls.find(
        ([url]) => url.includes('/consumables?') && url.includes('minQuantity=10')
      );
      expect(call).toBeTruthy();
    });
  });

  it('butonul Export CSV este vizibil', async () => {
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument();
  });

  it('exportul CSV generează un blob descărcabil când există date', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    await user.click(screen.getByRole('button', { name: /Export CSV/ }));
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('șterge un consumabil după confirmare (DELETE)', async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(true);
    api.delete.mockResolvedValue({ data: {} });
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    const deleteButtons = screen.getAllByRole('button', { name: '✕' });
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/consumables/1');
    });
  });

  it('editează un consumabil existent și salvează prin PUT', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({ data: {} });
    renderWithProviders(<ConsumablesPage />);
    await screen.findByText('Mănuși nitril');

    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);

    expect(await screen.findByText('Editare Consumabil')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvare' }));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/consumables/1', expect.any(Object));
    });
  });

  it('afișează mesajul de listă goală când nu există consumabile', async () => {
    mockConsumables([]);
    renderWithProviders(<ConsumablesPage />);
    expect(await screen.findByText('Nu sunt consumabile în baza de date.')).toBeInTheDocument();
  });
});
