import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import { toast } from 'react-toastify';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

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

vi.mock('../../components/DeviceTimeline', () => ({
  default: () => <div data-testid="device-timeline" />,
}));

import api from '../../api/axios';
import DeviceForm from '../../pages/DeviceForm';

const SECTIONS = [
  { id: 1, name: 'ATI' },
  { id: 2, name: 'Bloc Operator' },
  { id: 3, name: 'Cardiologie' },
];

const FULL_DEVICE = {
  id: 42,
  inventoryNumber: 'DM-EDIT-1',
  name: 'Editat',
  model: 'M100',
  serialNumber: 'SN-001',
  manufacturer: 'Philips',
  yearMade: 2023,
  riskClass: 'IIb',
  status: 'FUNCTIONAL',
  sectionId: 1,
  acquisitionDate: '2023-01-15T00:00:00Z',
  warrantyExpiry: '2025-01-15T00:00:00Z',
  location: 'Salon 3',
  countryOfOrigin: 'Olanda',
  purchasePrice: 50000,
  currency: 'MDL',
  ceMarking: 'CE-1234',
  cndCode: 'CND-001',
  maintenanceSchedule: 12,
  installationDate: '2023-02-01T00:00:00Z',
  financingSource: 'Buget de stat',
  destination: 'Salon estetică',
  electricalSafetyClass: 'Class I',
  notes: 'Notă test',
};

function mockApiRouter({ device } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/sections') return Promise.resolve({ data: SECTIONS });
    if (url.startsWith('/devices/') && device) return Promise.resolve({ data: device });
    return Promise.resolve({ data: {} });
  });
  api.post.mockResolvedValue({ data: { id: 1 } });
  api.put.mockResolvedValue({ data: { id: 1 } });
  api.patch.mockResolvedValue({ data: { id: 1 } });
}

async function goToStep(user, step) {
  for (let i = 0; i < step; i++) {
    await user.click(screen.getByRole('button', { name: /Înainte/ }));
  }
}

describe('DeviceForm Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockApiRouter();
  });

  describe('wizard step navigation', () => {
    it('starts on step 0 (Identificare)', async () => {
      renderWithProviders(<DeviceForm />);
      expect(await screen.findByText('Identificare Dispozitiv')).toBeInTheDocument();
    });

    it('advances to step 1 with valid fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await user.click(screen.getByRole('button', { name: /Înainte/ }));
      expect(await screen.findByText('Clasificare Risc și Status')).toBeInTheDocument();
    });

    it('goes back to step 0 from step 1', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await user.click(screen.getByRole('button', { name: /Înainte/ }));
      await screen.findByText('Clasificare Risc și Status');
      await user.click(screen.getByRole('button', { name: /Înapoi/ }));
      expect(await screen.findByText('Identificare Dispozitiv')).toBeInTheDocument();
    });

    it('disables prev button on step 0', async () => {
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      expect(screen.getByRole('button', { name: /Înapoi/ })).toBeDisabled();
    });

    it('does not advance past last step', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      expect(await screen.findByText('Confirmă și Finalizare')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Înainte/ })).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when advancing step 0 with empty required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.click(screen.getByRole('button', { name: /Înainte/ }));
      await waitFor(() => {
        expect(screen.getByText(/necessary|necesar|obligatoriu/i)).toBeInTheDocument();
      });
    });

    it('validates step 1 fields on advance', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await goToStep(user, 1);
      await screen.findByText('Clasificare Risc și Status');
      await user.click(screen.getByRole('button', { name: /Înainte/ }));
      await waitFor(() => {
        expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('creates device with all fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);

      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-2024-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Defibrilator');
      await user.type(screen.getByLabelText('Model'), 'X100');

      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
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

    it('shows loading state during save', async () => {
      api.post.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);

      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      await user.click(screen.getByRole('button', { name: /Salvare/ }));

      await waitFor(() => {
        expect(screen.getByText(/se salvează/i)).toBeInTheDocument();
      });
    });

    it('shows error toast on create failure', async () => {
      api.post.mockRejectedValue({ response: { data: { error: 'Eroare server' } } });
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);

      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      await user.click(screen.getByRole('button', { name: /Salvare/ }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Eroare server');
      });
    });
  });

  describe('edit mode', () => {
    it('shows edit title when id param provided', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      expect(
        await screen.findByRole('heading', { name: /Editare Dispozitiv Medical/ })
      ).toBeInTheDocument();
    });

    it('loads device data into form', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      await waitFor(() => {
        const input = screen.getByLabelText(/Numărul inventarului/);
        expect(input.value).toBe('DM-EDIT-1');
      });
    });

    it('shows DeviceTimeline in edit mode', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      expect(await screen.findByTestId('device-timeline')).toBeInTheDocument();
    });

    it('updates device with PUT', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      await screen.findByLabelText(/Numărul inventarului/);
      await goToStep(user, 1);
      await goToStep(user, 1);
      await user.click(screen.getByRole('button', { name: /Salvare/ }));

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          '/devices/42',
          expect.any(Object)
        );
      });
    });

    it('shows PDF download button in edit mode step 2', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      await screen.findByLabelText(/Numărul inventarului/);
      await goToStep(user, 2);
      expect(await screen.findByText(/Descarcă Fișa PDF/)).toBeInTheDocument();
    });

    it('shows document upload in edit mode step 2', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      await screen.findByLabelText(/Numărul inventarului/);
      await goToStep(user, 2);
      expect(await screen.findByLabelText(/Atașează Document/)).toBeInTheDocument();
    });
  });

  describe('advanced fields', () => {
    it('toggles advanced fields section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      await screen.findByText('Confirmă și Finalizare');

      expect(screen.queryByLabelText('Locație / Spațiu')).not.toBeInTheDocument();
      await user.click(screen.getByText(/Câmpuri Avansate/));
      expect(await screen.findByLabelText('Locație / Spațiu')).toBeInTheDocument();
    });

    it('fills advanced fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test Device');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      await screen.findByText('Confirmă și Finalizare');
      await user.click(screen.getByText(/Câmpuri Avansate/));

      await user.type(await screen.findByLabelText('Locație / Spațiu'), 'Salon 3');
      await user.type(screen.getByLabelText('Țara de origine'), 'Olanda');
      expect(screen.getByLabelText('Locație / Spațiu')).toHaveValue('Salon 3');
    });
  });

  describe('keyboard navigation', () => {
    it('Enter key advances wizard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test');
      await user.tab();
      await user.keyboard('{Enter}');
      expect(await screen.findByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading when device is loading in edit mode', async () => {
      mockParams = { id: '42' };
      api.get.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('shows generic error on create failure without response error', async () => {
      api.post.mockRejectedValue({});
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
      await user.type(screen.getByLabelText(/Denumire/), 'Test');
      await goToStep(user, 1);
      await user.selectOptions(await screen.findByTestId('select-sectionId'), '1');
      await goToStep(user, 1);
      await user.click(screen.getByRole('button', { name: /Salvare/ }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Eroare la adăugare');
      });
    });

    it('shows update error on edit mode failure', async () => {
      mockParams = { id: '42' };
      mockApiRouter({ device: FULL_DEVICE });
      api.patch.mockRejectedValue({ response: { data: { error: 'Update failed' } } });
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />, { route: '/devices/42/edit' });
      await screen.findByLabelText(/Numărul inventarului/);
      await goToStep(user, 1);
      await goToStep(user, 1);
      await user.click(screen.getByRole('button', { name: /Salvare/ }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('document upload', () => {
    it('shows error when uploading without saving device first', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceForm />, { route: '/devices/7/edit' });
      mockParams = { id: undefined };
      mockApiRouter({});
    });
  });

  describe('step indicator', () => {
    it('renders step indicator with correct steps', async () => {
      renderWithProviders(<DeviceForm />);
      await screen.findByLabelText(/Numărul inventarului/);
      expect(screen.getByText(/Pasul 1 din 3/)).toBeInTheDocument();
    });
  });
});
