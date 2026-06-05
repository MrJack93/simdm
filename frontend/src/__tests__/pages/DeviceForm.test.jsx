import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

// useParams / useNavigate sunt mockate pentru a controla modul (create vs edit)
// și pentru a verifica navigarea la Anulare.
const mockNavigate = vi.fn();
let mockParams = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Import după mock-uri, ca să le preia.
import DeviceForm from '../../pages/DeviceForm';

const SECTIONS = [
  { id: 1, name: 'ATI' },
  { id: 2, name: 'Bloc Operator' },
];

function mockApiRouter({ device } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/sections') return Promise.resolve({ data: SECTIONS });
    if (url.startsWith('/devices/') && device) return Promise.resolve({ data: device });
    return Promise.resolve({ data: {} });
  });
  api.post.mockResolvedValue({ data: { id: 1 } });
  api.put.mockResolvedValue({ data: { id: 1 } });
}

// Navighează prin wizard până la un anumit pas apăsând "Înainte →".
async function goToStep(user, step) {
  for (let i = 0; i < step; i++) {
    await user.click(screen.getByRole('button', { name: /Înainte/ }));
  }
}

describe('DeviceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockApiRouter();
  });

  it('randează inputurile obligatorii din primul pas (Nr. inventar, Denumire)', async () => {
    renderWithProviders(<DeviceForm />);
    expect(await screen.findByLabelText(/Numărul inventarului/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Denumire/)).toBeInTheDocument();
  });

  it('randează dropdown-ul de secții populat din API la pasul de clasificare', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);
    await goToStep(user, 1);

    const sectionSelect = await screen.findByTestId('select-sectionId');
    expect(sectionSelect).toBeInTheDocument();
    expect(within(sectionSelect).getByRole('option', { name: 'ATI' })).toBeInTheDocument();
  });

  it('expune câmpurile de clasificare obligatorii: clasa de risc, status și secție', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);
    await goToStep(user, 1);

    expect(await screen.findByTestId('select-riskClass')).toBeInTheDocument();
    expect(screen.getByTestId('select-status')).toBeInTheDocument();
    expect(screen.getByTestId('select-sectionId')).toBeInTheDocument();
  });

  it('trimite un POST la /devices cu date valide la salvare', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);

    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-2024-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Defibrilator');

    await goToStep(user, 1);
    await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');

    // Navighează până la ultimul pas (pasul 2 din 3) și salvează
    await goToStep(user, 1);
    await user.click(screen.getByRole('button', { name: /Salvare/ }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/devices',
        expect.objectContaining({
          inventoryNumber: 'DM-2024-001',
          name: 'Defibrilator',
          sectionId: 1,
        })
      );
    });
  });

  it('în modul editare afișează titlul de editare și încarcă dispozitivul (PUT, nu POST)', async () => {
    mockParams = { id: '42' };
    const device = {
      id: 42,
      inventoryNumber: 'DM-EDIT-1',
      name: 'Editat',
      riskClass: 'IIb',
      status: 'FUNCTIONAL',
      sectionId: 1,
    };
    mockApiRouter({ device });

    renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });

    expect(
      await screen.findByRole('heading', { name: /Editare Dispozitiv Medical/ })
    ).toBeInTheDocument();
    await waitFor(() => {
      const call = api.get.mock.calls.find(([url]) => url === '/devices/42');
      expect(call).toBeTruthy();
    });
  });

  it('butonul Anulare navighează înapoi la /inventory', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);

    await user.click(screen.getByRole('button', { name: 'Anulare' }));
    expect(mockNavigate).toHaveBeenCalledWith('/inventory');
  });

  it('randează câmpul de upload document în modul editare, la pasul de confirmare', async () => {
    mockParams = { id: '7' };
    mockApiRouter({ device: { id: 7, inventoryNumber: 'DM-7', name: 'Dispozitiv 7', riskClass: 'IIb', status: 'FUNCTIONAL', sectionId: 1 } });
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />, { route: '/devices/7/edit' });

    await screen.findByLabelText(/Numărul inventarului/);
    // Pasul de confirmare e pasul 2 (ultimul din 3)
    await goToStep(user, 2);

    expect(await screen.findByLabelText(/Atașează Document/)).toBeInTheDocument();
  });
});
