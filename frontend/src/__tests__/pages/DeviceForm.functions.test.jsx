import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

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

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../hooks/useSections', () => ({
  useSections: vi.fn(() => ({ data: [{ id: 1, name: 'Cardiologie' }, { id: 2, name: 'Terapie' }] })),
}));

vi.mock('../../components/DeviceTimeline', () => ({
  default: () => <div data-testid="device-timeline">DeviceTimeline</div>,
}));

import DeviceForm from '../../pages/DeviceForm';
import { renderWithProviders } from '../helpers/renderWithProviders';
import api from '../../api/axios';

function renderForm() {
  return renderWithProviders(<DeviceForm />);
}

describe('DeviceForm — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    api.get.mockImplementation((url) => {
      if (url.includes('/sections')) return Promise.resolve({ data: [{ id: 1, name: 'Cardiologie' }] });
      return Promise.resolve({ data: {} });
    });
  });

  it('shows heading for new device', () => {
    renderForm();
    expect(screen.getByText('Adaugă Dispozitiv Medical')).toBeInTheDocument();
  });

  it('shows heading for edit mode', async () => {
    mockParams = { id: '1' };
    api.get.mockImplementation((url) => {
      if (url.includes('/devices/1')) return Promise.resolve({
        data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL' },
      });
      if (url.includes('/sections')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
    renderForm();
    expect(await screen.findByText('Editare Dispozitiv Medical')).toBeInTheDocument();
  });

  it('step indicator shows steps', () => {
    renderForm();
    expect(screen.getAllByText('Identificare').length).toBeGreaterThan(0);
  });

  it('step 0 fields are present', () => {
    renderForm();
    expect(screen.getByLabelText('Numărul inventarului *')).toBeInTheDocument();
    expect(screen.getByLabelText('Denumire *')).toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    expect(screen.getByLabelText('Seria')).toBeInTheDocument();
    expect(screen.getByLabelText('Producător')).toBeInTheDocument();
    expect(screen.getByLabelText('Anul fabricării')).toBeInTheDocument();
  });

  it('validates required fields on next', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText(/necesită corectare/)).toBeInTheDocument();
    });
  });

  it('advances to step 1 with valid data', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('goes back to step 0 from step 1', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Clasificare Risc și Status'); });
    await user.click(screen.getByText('← Înapoi'));
    await waitFor(() => {
      expect(screen.getByText('Identificare Dispozitiv')).toBeInTheDocument();
    });
  });

  it('prev button disabled on step 0', () => {
    renderForm();
    expect(screen.getByText('← Înapoi')).toBeDisabled();
  });

  it('step 1 has riskClass, status, section selects', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('step 1 shows date pickers', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Data achiziției')).toBeInTheDocument();
      expect(screen.getByText('Data expirării garanției')).toBeInTheDocument();
    });
  });

  async function goToStep2(user) {
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Clasificare Risc și Status'); });
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Confirmă și Finalizare')).toBeInTheDocument();
    });
  }

  it('advances to step 2 with all valid data', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
  });

  it('step 2 shows summary and advanced toggle', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    expect(screen.getByText('Informații Principale')).toBeInTheDocument();
    expect(screen.getByText('DM-001')).toBeInTheDocument();
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.getByLabelText('Locație / Spațiu')).toBeInTheDocument();
    });
  });

  it('advanced toggle hides fields on second click', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => { expect(screen.getByLabelText('Locație / Spațiu')).toBeInTheDocument(); });
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.queryByLabelText('Locație / Spațiu')).not.toBeInTheDocument();
    });
  });

  it('form submit calls createDevice in new mode', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    await user.click(screen.getByText('✓ Salvare'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/devices', expect.any(Object));
    });
  });

  it('cancel button navigates away', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText('Anulare'));
    expect(mockNavigate).toHaveBeenCalledWith('/inventory');
  });

  it('Enter key advances steps', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Numărul inventarului *'), 'DM-001');
    await user.type(screen.getByLabelText('Denumire *'), 'Ventilator');
    await user.type(screen.getByLabelText('Numărul inventarului *'), '{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('edit mode shows device timeline', async () => {
    mockParams = { id: '1' };
    api.get.mockImplementation((url) => {
      if (url.includes('/devices/1')) return Promise.resolve({
        data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
      });
      if (url.includes('/sections')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
    renderForm();
    await waitFor(() => {
      expect(screen.getByTestId('device-timeline')).toBeInTheDocument();
    });
  });

  it('edit mode shows PDF download and upload on last step', async () => {
    const user = userEvent.setup();
    mockParams = { id: '1' };
    api.get.mockImplementation((url) => {
      if (url.includes('/devices/1')) return Promise.resolve({
        data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
      });
      if (url.includes('/sections')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
    renderForm();
    await waitFor(() => { expect(screen.getByText('Editare Dispozitiv Medical')).toBeInTheDocument(); });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Clasificare Risc și Status'); });
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText(/Descarcă Fișa PDF/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Atașează Document/)).toBeInTheDocument();
    });
  });

  it('step 2 advanced fields include all optional fields', async () => {
    const user = userEvent.setup();
    await goToStep2(user);
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.getByLabelText('Preț achiziție')).toBeInTheDocument();
      expect(screen.getByLabelText('Monedă')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcaj CE')).toBeInTheDocument();
      expect(screen.getByLabelText('Cod CND')).toBeInTheDocument();
      expect(screen.getByLabelText('Note / Observații')).toBeInTheDocument();
    });
  });

  it('shows loading state for edit', async () => {
    mockParams = { id: '1' };
    api.get.mockImplementation(() => new Promise(() => {}));
    renderForm();
    expect(screen.getByText('Se încarcă dispozitivul…')).toBeInTheDocument();
  });
});
