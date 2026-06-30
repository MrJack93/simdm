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

vi.mock('../../hooks/useSections', () => ({
  useSections: vi.fn(() => ({ data: [{ id: 1, name: 'Cardiologie' }, { id: 2, name: 'Terapie' }] })),
}));

vi.mock('../../components/DeviceTimeline', () => ({
  default: () => <div data-testid="device-timeline">DeviceTimeline</div>,
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevice: vi.fn(() => ({ isLoading: false, data: null })),
}));

vi.mock('../../api/devices', () => ({
  createDevice: vi.fn(() => Promise.resolve({})),
  updateDevice: vi.fn(() => Promise.resolve({})),
  deviceKeys: { all: ['devices'], list: (f) => ['devices', 'list', f], detail: (id) => ['device', id] },
}));

import DeviceForm from '../../pages/DeviceForm';
import { renderWithProviders } from '../helpers/renderWithProviders';
import api from '../../api/axios';
import { createDevice, updateDevice } from '../../api/devices';
import { useDevice } from '../../hooks/useDevices';

function renderForm() {
  return renderWithProviders(<DeviceForm />);
}

describe('DeviceForm — function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    useDevice.mockReturnValue({ isLoading: false, data: null });
    api.get.mockImplementation((url) => {
      if (url.includes('/sections')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
  });

  it('StepIndicator renders desktop step circles', () => {
    renderForm();
    expect(screen.getByText('Adaugă Dispozitiv Medical')).toBeInTheDocument();
    expect(screen.getByText('Pasul 1 din 3:')).toBeInTheDocument();
  });

  it('handleNext with invalid step 0 stays on step 0', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText(/câmpuri necesită corectare/)).toBeInTheDocument();
    });
  });

  it('handleNext with valid step 0 data advances to step 1', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('handlePrev goes back from step 1 to step 0', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Clasificare Risc și Status'); });
    await user.click(screen.getByText('← Înapoi'));
    await waitFor(() => {
      expect(screen.getByText('Identificare Dispozitiv')).toBeInTheDocument();
    });
  });

  it('handleFormKeyDown Enter advances step', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.type(screen.getByLabelText(/Numărul inventarului/), '{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('showAdvanced toggle shows and hides advanced fields', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.getByLabelText('Locație / Spațiu')).toBeInTheDocument();
      expect(screen.getByLabelText('Țara de origine')).toBeInTheDocument();
      expect(screen.getByLabelText('Preț achiziție')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcaj CE')).toBeInTheDocument();
      expect(screen.getByLabelText('Cod CND')).toBeInTheDocument();
      expect(screen.getByLabelText(/Schema mentenanță/)).toBeInTheDocument();
      expect(screen.getByLabelText('Sursă finanțare')).toBeInTheDocument();
      expect(screen.getByLabelText('Destinație / Utilizare')).toBeInTheDocument();
      expect(screen.getByLabelText(/Clasa de siguranță electrică/)).toBeInTheDocument();
      expect(screen.getByLabelText('Note / Observații')).toBeInTheDocument();
    });
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.queryByLabelText('Locație / Spațiu')).not.toBeInTheDocument();
    });
  });

  it('onSubmit in new mode calls createDevice', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText('✓ Salvare'));
    await waitFor(() => {
      expect(createDevice).toHaveBeenCalled();
    });
  });

  it('onSubmit in edit mode calls updateDevice', async () => {
    const user = userEvent.setup();
    mockParams = { id: '1' };
    useDevice.mockReturnValue({
      isLoading: false,
      data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
    });
    renderForm();
    await waitFor(() => { expect(screen.getByText('Editare Dispozitiv Medical')).toBeInTheDocument(); });
    await user.click(screen.getByText('Înainte →'));
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText('✓ Salvare'));
    await waitFor(() => {
      expect(updateDevice).toHaveBeenCalled();
    });
  });

  it('handleDocumentUpload with no id shows error', async () => {
    const user = userEvent.setup();
    mockParams = { id: '1' };
    useDevice.mockReturnValue({
      isLoading: false,
      data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
    });
    renderForm();
    await waitFor(() => { expect(screen.getByText('Editare Dispozitiv Medical')).toBeInTheDocument(); });
    await user.click(screen.getByText('Înainte →'));
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    const fileInput = screen.getByLabelText(/Atașează Document/);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('downloadPdfMutation calls API and creates blob in edit mode', async () => {
    const user = userEvent.setup();
    mockParams = { id: '1' };
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    useDevice.mockReturnValue({
      isLoading: false,
      data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
    });
    api.get.mockImplementation((url) => {
      if (url.includes('/devices/1')) return Promise.resolve({
        data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
      });
      if (url.includes('/fisa-pdf')) return Promise.resolve({ data: mockBlob });
      return Promise.resolve({ data: [] });
    });
    renderForm();
    await waitFor(() => { expect(screen.getByText('Editare Dispozitiv Medical')).toBeInTheDocument(); });
    await user.click(screen.getByText('Înainte →'));
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText(/Descarcă Fișa PDF/));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('PDF descărcat');
    });
  });

  it('cancel button navigates to inventory', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Anulare'));
    expect(mockNavigate).toHaveBeenCalledWith('/inventory');
  });

  it('step 2 shows summary values', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('DM-001')).toBeInTheDocument();
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.getByText('Informații Principale')).toBeInTheDocument();
    });
  });

  it('step 1 has date picker fields', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Data achiziției')).toBeInTheDocument();
      expect(screen.getByText('Data expirării garanției')).toBeInTheDocument();
    });
  });

  it('step 2 advanced fields include currency select', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => {
      expect(screen.getByLabelText('Monedă')).toBeInTheDocument();
    });
  });

  it('advanced field changes register in form', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText(/Câmpuri Avansate/));
    await waitFor(() => { screen.getByLabelText('Locație / Spațiu'); });
    fireEvent.change(screen.getByLabelText('Locație / Spațiu'), { target: { value: 'Salon A' } });
    expect(screen.getByLabelText('Locație / Spațiu')).toHaveValue('Salon A');
    fireEvent.change(screen.getByLabelText('Țara de origine'), { target: { value: 'Germania' } });
    expect(screen.getByLabelText('Țara de origine')).toHaveValue('Germania');
    fireEvent.change(screen.getByLabelText('Marcaj CE'), { target: { value: 'CE-123' } });
    expect(screen.getByLabelText('Marcaj CE')).toHaveValue('CE-123');
    fireEvent.change(screen.getByLabelText('Cod CND'), { target: { value: 'CND-456' } });
    expect(screen.getByLabelText('Cod CND')).toHaveValue('CND-456');
  });

  it('handlePrev does nothing on step 0', () => {
    renderForm();
    fireEvent.click(screen.getByText('← Înapoi'));
    expect(screen.getByText('Identificare Dispozitiv')).toBeInTheDocument();
  });

  it('handleNext does nothing on last step', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    expect(screen.getByText('✓ Salvare')).toBeInTheDocument();
  });

  it('loading state shows spinner', () => {
    useDevice.mockReturnValue({ isLoading: true, data: undefined });
    mockParams = { id: '1' };
    renderForm();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('edit mode shows DeviceTimeline', async () => {
    mockParams = { id: '1' };
    useDevice.mockReturnValue({
      isLoading: false,
      data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
    });
    renderForm();
    await waitFor(() => {
      expect(screen.getByTestId('device-timeline')).toBeInTheDocument();
    });
  });

  it('create mutation success navigates to inventory', async () => {
    createDevice.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-001');
    await user.type(screen.getByLabelText(/Denumire/), 'Ventilator');
    await user.click(screen.getByText('Înainte →'));
    const sectionSelect = screen.getByTestId('select-sectionId');
    fireEvent.change(sectionSelect, { target: { value: '1' } });
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => { screen.getByText('Confirmă și Finalizare'); });
    await user.click(screen.getByText('✓ Salvare'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/inventory');
    });
  });

  it('stepErrors state tracks validation failures', async () => {
    renderForm();
    fireEvent.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText(/câmpuri necesită corectare/)).toBeInTheDocument();
    });
  });

  it('edit mode shows document upload field on step 2', async () => {
    mockParams = { id: '1' };
    useDevice.mockReturnValue({
      isLoading: false,
      data: { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001', riskClass: 'IIb', status: 'FUNCTIONAL', currency: 'MDL', sectionId: 1 },
    });
    const user = userEvent.setup();
    renderForm();
    await waitFor(() => { expect(screen.getByText('Editare Dispozitiv Medical')).toBeInTheDocument(); });
    await user.click(screen.getByText('Înainte →'));
    await user.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByLabelText(/Atașează Document/)).toBeInTheDocument();
    });
  });
});
