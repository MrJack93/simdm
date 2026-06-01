import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AlertsWidget from '../../components/AlertsWidget';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// useNavigate este mockat pentru a verifica navigarea la click pe alertă.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Construiește un consumabil cu o dată de expirare la `days` zile distanță.
function withExpiry(days, overrides = {}) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return {
    id: Math.random(),
    name: 'Test',
    quantity: 10,
    minQuantity: 0,
    expiryDate: d.toISOString(),
    ...overrides,
  };
}

function resolveConsumables(consumables) {
  api.get.mockResolvedValue({ data: { consumables } });
}

describe('AlertsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nu randează nimic când nu există alerte', async () => {
    resolveConsumables([{ id: 1, name: 'OK', quantity: 50, minQuantity: 10, expiryDate: null }]);
    const { container } = renderWithProviders(<AlertsWidget />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
    expect(screen.queryByText(/Alerte Consumabile/)).not.toBeInTheDocument();
    expect(container.querySelector('.card-base')).toBeNull();
  });

  it('apelează api.get pentru lista de consumabile (limit=1000)', async () => {
    resolveConsumables([]);
    renderWithProviders(<AlertsWidget />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/consumables?limit=1000');
    });
  });

  it('afișează numărul de produse sub stoc minim (quantity < minQuantity)', async () => {
    resolveConsumables([
      { id: 1, name: 'A', quantity: 2, minQuantity: 10, expiryDate: null },
      { id: 2, name: 'B', quantity: 0, minQuantity: 5, expiryDate: null },
      { id: 3, name: 'C', quantity: 50, minQuantity: 5, expiryDate: null },
    ]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/2 sub stoc minim/)).toBeInTheDocument();
  });

  it('afișează numărul de produse care expiră în mai puțin de 7 zile', async () => {
    resolveConsumables([withExpiry(3), withExpiry(5)]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/2 expirând în/)).toBeInTheDocument();
  });

  it('afișează numărul de produse care expiră între 7 și 30 de zile', async () => {
    resolveConsumables([withExpiry(15), withExpiry(20), withExpiry(25)]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/3 expirând în/)).toBeInTheDocument();
  });

  it('navighează către pagina de consumabile la click pe alerta de stoc', async () => {
    const user = userEvent.setup();
    resolveConsumables([{ id: 1, name: 'A', quantity: 1, minQuantity: 10, expiryDate: null }]);
    renderWithProviders(<AlertsWidget />);
    const alertButton = await screen.findByText(/sub stoc minim/);
    await user.click(alertButton);
    expect(mockNavigate).toHaveBeenCalledWith('/consumables?filter=LOW_STOCK');
  });

  it('nu randează nimic cât timp datele se încarcă (fără flicker)', async () => {
    // Promisiune care nu se rezolvă -> rămâne în isLoading
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<AlertsWidget />);
    expect(container.firstChild).toBeNull();
  });
});
