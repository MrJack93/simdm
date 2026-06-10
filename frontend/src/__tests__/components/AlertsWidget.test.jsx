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

function resolveAllEmpty() {
  api.get.mockImplementation((url) => {
    if (url.includes('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
    if (url.includes('/service-contracts/contracts')) {
      return Promise.resolve({ data: { data: [] } });
    }
    if (url.includes('/verifications/compliance-report')) {
      return Promise.resolve({ data: { conform: 0, expirat: 0, expiraCurand: 0, neverificat: 0, neconform: 0, total: 0 } });
    }
    if (url.includes('/maintenance-plans/calendar')) {
      return Promise.resolve({ data: { data: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

function resolveConsumables(consumables) {
  api.get.mockImplementation((url) => {
    if (url.includes('/consumables')) {
      return Promise.resolve({ data: { consumables } });
    }
    if (url.includes('/service-contracts/contracts')) {
      return Promise.resolve({ data: { data: [] } });
    }
    if (url.includes('/verifications/compliance-report')) {
      return Promise.resolve({ data: { conform: 0, expirat: 0, expiraCurand: 0, neverificat: 0, neconform: 0, total: 0 } });
    }
    if (url.includes('/maintenance-plans/calendar')) {
      return Promise.resolve({ data: { data: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

function resolveContracts(contracts) {
  api.get.mockImplementation((url) => {
    if (url.includes('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
    if (url.includes('/service-contracts/contracts')) {
      return Promise.resolve({ data: { data: contracts } });
    }
    if (url.includes('/verifications/compliance-report')) {
      return Promise.resolve({ data: { conform: 0, expirat: 0, expiraCurand: 0, neverificat: 0, neconform: 0, total: 0 } });
    }
    if (url.includes('/maintenance-plans/calendar')) {
      return Promise.resolve({ data: { data: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

function resolveCompliance(compliance) {
  api.get.mockImplementation((url) => {
    if (url.includes('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
    if (url.includes('/service-contracts/contracts')) {
      return Promise.resolve({ data: { data: [] } });
    }
    if (url.includes('/verifications/compliance-report')) {
      return Promise.resolve({ data: compliance });
    }
    if (url.includes('/maintenance-plans/calendar')) {
      return Promise.resolve({ data: { data: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

function resolveMpps(occurrences) {
  api.get.mockImplementation((url) => {
    if (url.includes('/consumables')) {
      return Promise.resolve({ data: { consumables: [] } });
    }
    if (url.includes('/service-contracts/contracts')) {
      return Promise.resolve({ data: { data: [] } });
    }
    if (url.includes('/verifications/compliance-report')) {
      return Promise.resolve({ data: { conform: 0, expirat: 0, expiraCurand: 0, neverificat: 0, neconform: 0, total: 0 } });
    }
    if (url.includes('/maintenance-plans/calendar')) {
      return Promise.resolve({ data: { data: occurrences } });
    }
    return Promise.resolve({ data: {} });
  });
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
    expect(screen.queryByText(/Alerte Active Sistem/)).not.toBeInTheDocument();
    expect(container.querySelector('.card-base')).toBeNull();
  });

  it('apelează api.get pentru lista de consumabile (limit=1000)', async () => {
    resolveAllEmpty();
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
    expect(await screen.findByText(/2 consumabile expiră în <7 zile/)).toBeInTheDocument();
  });

  it('afișează numărul de produse care expiră între 7 și 30 de zile', async () => {
    resolveConsumables([withExpiry(15), withExpiry(20), withExpiry(25)]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/3 consumabile expiră în <30 zile/)).toBeInTheDocument();
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

  // Teste noi pentru alerte de contracte, verificări și MPP
  it('afișează alerte despre contracte de service care expiră în <=30 de zile', async () => {
    resolveContracts([
      { id: 101, contractNo: 'C1', daysUntilExpiry: 15, isExpired: false },
      { id: 102, contractNo: 'C2', daysUntilExpiry: 5, isExpired: false },
    ]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/2 contracte expiră în <30 zile/)).toBeInTheDocument();
  });

  it('navighează către pagina de contracte la click pe alerta de contracte', async () => {
    const user = userEvent.setup();
    resolveContracts([{ id: 101, contractNo: 'C1', daysUntilExpiry: 15, isExpired: false }]);
    renderWithProviders(<AlertsWidget />);
    const alertButton = await screen.findByText(/contracte expiră în/);
    await user.click(alertButton);
    expect(mockNavigate).toHaveBeenCalledWith('/service-contracts');
  });

  it('afișează alerte despre verificări critice', async () => {
    resolveCompliance({
      neverificat: 2,
      expirat: 3,
      expiraCurand: 1,
      neconform: 1,
      total: 7,
    });
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/7 verificări critice/)).toBeInTheDocument();
  });

  it('navighează către verificări la click pe alerta de verificări', async () => {
    const user = userEvent.setup();
    resolveCompliance({ neverificat: 1, expirat: 0, expiraCurand: 0, neconform: 0, total: 1 });
    renderWithProviders(<AlertsWidget />);
    const alertButton = await screen.findByText(/verificări critice/);
    await user.click(alertButton);
    expect(mockNavigate).toHaveBeenCalledWith('/verifications');
  });

  it('afișează alerte despre MPP scadente sau depășite', async () => {
    resolveMpps([
      { id: 1, status: 'SCADENT' },
      { id: 2, status: 'DEPASIT' },
      { id: 3, status: 'PROGRAMAT' }, // Ignorat
    ]);
    renderWithProviders(<AlertsWidget />);
    expect(await screen.findByText(/2 mentenanțe active \/ depășite/)).toBeInTheDocument();
  });

  it('navighează către calendar la click pe alerta MPP', async () => {
    const user = userEvent.setup();
    resolveMpps([{ id: 1, status: 'SCADENT' }]);
    renderWithProviders(<AlertsWidget />);
    const alertButton = await screen.findByText(/mentenanțe active \/ depășite/);
    await user.click(alertButton);
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/calendar');
  });
});
