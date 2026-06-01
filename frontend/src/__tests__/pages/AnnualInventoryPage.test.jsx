import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import AnnualInventoryPage from '../../pages/AnnualInventoryPage';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_SECTIONS = [
  { sectionId: 1, sectionName: 'ATI', status: 'COMPLETED', foundCount: 10, totalCount: 10, percentage: 100 },
  { sectionId: 2, sectionName: 'Bloc Operator', status: 'IN_PROGRESS', foundCount: 4, totalCount: 8, percentage: 50 },
  { sectionId: 3, sectionName: 'Laborator', status: 'NOT_STARTED', foundCount: 0, totalCount: 5, percentage: 0 },
];

const SECTION_DEVICES = [
  { id: 101, inventoryNumber: 'DM-001', name: 'Aparat ATI', serialNumber: 'SN1' },
  { id: 102, inventoryNumber: 'DM-002', name: 'Pompă', serialNumber: 'SN2' },
];

function mockApiRouter({ sections = STATUS_SECTIONS, devices = SECTION_DEVICES } = {}) {
  api.get.mockImplementation((url) => {
    if (url.includes('/annual-inventory/years')) {
      return Promise.resolve({ data: [CURRENT_YEAR, CURRENT_YEAR - 1] });
    }
    if (url.includes('/status')) {
      return Promise.resolve({ data: sections });
    }
    if (url.includes('/discrepancies')) {
      return Promise.resolve({ data: [] });
    }
    if (url.startsWith('/devices')) {
      return Promise.resolve({ data: { devices } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('AnnualInventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRouter();
  });

  it('randează selectorul de an cu anii disponibili', async () => {
    renderWithProviders(<AnnualInventoryPage />);
    const yearSelect = await screen.findByLabelText('Selectează an:');
    expect(yearSelect).toBeInTheDocument();
    await waitFor(() => {
      expect(within(yearSelect).getByRole('option', { name: String(CURRENT_YEAR) })).toBeInTheDocument();
    });
  });

  it('randează secțiile ca grilă de carduri selectabile', async () => {
    renderWithProviders(<AnnualInventoryPage />);
    expect(await screen.findByText('ATI')).toBeInTheDocument();
    expect(screen.getByText('Bloc Operator')).toBeInTheDocument();
    expect(screen.getByText('Laborator')).toBeInTheDocument();
  });

  it('afișează statusul fiecărei secții (etichetă + procent)', async () => {
    renderWithProviders(<AnnualInventoryPage />);
    await screen.findByText('ATI');
    expect(screen.getByText('Completată')).toBeInTheDocument();
    expect(screen.getByText('În curs')).toBeInTheDocument();
    expect(screen.getByText('Nu a început')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('permite marcarea dispozitivelor ca găsite în modalul de inventariere', async () => {
    const user = userEvent.setup();
    // Pre-populăm cache-ul cu dispozitivele secției, astfel încât modalul să se
    // monteze direct cu lista (evită cursa empty -> filled din componentă).
    // gcTime mare: datele pre-încărcate pentru o secție inactivă nu sunt
    // evacuate înainte de deschiderea modalului.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
    });
    client.setQueryData(['devices-for-inventory', 1], { devices: SECTION_DEVICES });

    renderWithProviders(<AnnualInventoryPage />, { client });
    await user.click(await screen.findByText('ATI'));

    // Modalul de checklist se deschide cu dispozitivele secției.
    // (Titlul folosește section.name + anul; dispozitivele apar ca rânduri.)
    expect(await screen.findByText(/Inventariere:/)).toBeInTheDocument();
    expect(await screen.findByText('DM-001')).toBeInTheDocument();
    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes.length).toBe(SECTION_DEVICES.length);

    expect(checkboxes[0]).not.toBeChecked();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('afișează butonul de vizualizare discrepanțe când există secții incomplete', async () => {
    renderWithProviders(<AnnualInventoryPage />);
    // Bloc Operator (4/8) și Laborator (0/5) sunt incomplete
    expect(await screen.findByRole('button', { name: /Vizualizare Discrepanțe/ })).toBeInTheDocument();
  });

  it('afișează butonul de generare raport PDF', async () => {
    renderWithProviders(<AnnualInventoryPage />);
    await screen.findByText('ATI');
    expect(screen.getByRole('button', { name: /Descarcă Raport PDF/ })).toBeInTheDocument();
  });

  it('deschide modalul de discrepanțe și marchează o discrepanță ca verificată', async () => {
    const user = userEvent.setup();
    const discrepancies = [
      {
        id: 11,
        status: 'PENDING',
        device: { inventoryNumber: 'DM-X', name: 'Lipsă' },
        inventory: { section: { name: 'Laborator' } },
      },
    ];
    api.get.mockImplementation((url) => {
      if (url.includes('/annual-inventory/years')) return Promise.resolve({ data: [CURRENT_YEAR] });
      if (url.includes('/status')) return Promise.resolve({ data: STATUS_SECTIONS });
      if (url.includes('/discrepancies')) return Promise.resolve({ data: discrepancies });
      if (url.startsWith('/devices')) return Promise.resolve({ data: { devices: SECTION_DEVICES } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: {} });

    renderWithProviders(<AnnualInventoryPage />);
    await user.click(await screen.findByRole('button', { name: /Vizualizare Discrepanțe/ }));

    expect(await screen.findByText('Discrepanțe Identificate')).toBeInTheDocument();
    expect(await screen.findByText('DM-X')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Verifica' }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/annual-inventory/${CURRENT_YEAR}/discrepancies/11/verify`
      );
    });
  });

  it('descarcă raportul PDF prin endpoint-ul de raport', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    api.get.mockImplementation((url) => {
      if (url.includes('/annual-inventory/years')) return Promise.resolve({ data: [CURRENT_YEAR] });
      if (url.includes('/status')) return Promise.resolve({ data: STATUS_SECTIONS });
      if (url.includes('/report-pdf')) return Promise.resolve({ data: new Blob(['pdf']) });
      if (url.includes('/discrepancies')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<AnnualInventoryPage />);
    await user.click(await screen.findByRole('button', { name: /Descarcă Raport PDF/ }));

    await waitFor(() => {
      const call = api.get.mock.calls.find(([url]) => url.includes('/report-pdf'));
      expect(call).toBeTruthy();
    });
    clickSpy.mockRestore();
  });
});
