import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../../../api/axios';
import RepairModal from '../../../components/modals/RepairModal';

vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { consumables: [] } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('react-signature-canvas', () => ({
  default: ({ canvasProps, ref }) => {
    const React = require('react');
    return React.createElement('canvas', { ...canvasProps, ref, 'data-testid': 'signature-canvas' });
  },
}));

const MOCK_TICKET = {
  id: 1,
  ticketNumber: 'RT-001',
  device: { name: 'Ventilator', serialNumber: 'SN-123' },
  faultDescription: 'Display defect',
  faultCause: 'Cabl rupt',
};

function renderModal(props = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const defaultProps = { ticket: MOCK_TICKET, onClose: vi.fn(), onRefresh: vi.fn(), ...props };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <RepairModal {...defaultProps} />
      </QueryClientProvider>
    ),
    ...defaultProps,
  };
}

describe('RepairModal — Extra Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { consumables: [] } });
  });

  describe('form field interactions', () => {
    it('updates repair report', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Descrieți procedurile/), { target: { value: 'New report' } });
      expect(screen.getByPlaceholderText(/Descrieți procedurile/)).toHaveValue('New report');
    });

    it('updates actions taken', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Descrieți acțiunile/), { target: { value: 'New actions' } });
      expect(screen.getByPlaceholderText(/Descrieți acțiunile/)).toHaveValue('New actions');
    });

    it('updates duration', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: '3.5' } });
      expect(screen.getByPlaceholderText(/Ex: 2.5/)).toHaveValue(3.5);
    });

    it('updates engineer name', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Nume inginer'), { target: { value: 'Ing. Popescu' } });
      expect(screen.getByPlaceholderText('Nume inginer')).toHaveValue('Ing. Popescu');
    });

    it('updates manager name', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Nume manager'), { target: { value: 'Mgr. Ionescu' } });
      expect(screen.getByPlaceholderText('Nume manager')).toHaveValue('Mgr. Ionescu');
    });

    it('switches functional test radio', () => {
      renderModal();
      fireEvent.click(screen.getByText('Dispozitiv Nefuncțional ✗'));
      expect(screen.getByText('Dispozitiv Nefuncțional ✗')).toBeInTheDocument();
    });
  });

  describe('parts management', () => {
    it('adds a part', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '2' } });
      fireEvent.change(screen.getByPlaceholderText('Cost/buc'), { target: { value: '10' } });
      fireEvent.click(screen.getByText('+ Adaugă Piesa'));

      expect(screen.getByText('Cabl')).toBeInTheDocument();
      expect(screen.getAllByText('20.00 RON').length).toBeGreaterThan(0);
    });

    it('removes a part', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('+ Adaugă Piesa'));
      expect(screen.getByText('Cabl')).toBeInTheDocument();

      fireEvent.click(screen.getByText('✕'));
      expect(screen.queryByText('Cabl')).not.toBeInTheDocument();
    });

    it('shows total cost for parts', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Filtru' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '3' } });
      fireEvent.change(screen.getByPlaceholderText('Cost/buc'), { target: { value: '5' } });
      fireEvent.click(screen.getByText('+ Adaugă Piesa'));

      expect(screen.getAllByText('15.00 RON').length).toBeGreaterThan(0);
    });
  });

  describe('photo upload', () => {
    it('shows photo upload inputs', () => {
      renderModal();
      expect(screen.getByText('Foto Inițială')).toBeInTheDocument();
      expect(screen.getByText('Foto Finală')).toBeInTheDocument();
    });
  });

  describe('signature canvases', () => {
    it('renders two signature canvases', () => {
      renderModal();
      expect(screen.getAllByTestId('signature-canvas').length).toBe(2);
    });

    it('renders clear signature buttons', () => {
      renderModal();
      const clearButtons = screen.getAllByText('Șterge Semnătura');
      expect(clearButtons.length).toBe(2);
    });
  });

  describe('submit validation complete flow', () => {
    it('validates all fields step by step', () => {
      renderModal();

      // Missing repair report
      fireEvent.click(screen.getByText('Salvează Reparație'));
      expect(screen.getByText('Raportul de reparație este obligatoriu')).toBeInTheDocument();

      // Add report
      fireEvent.change(screen.getByPlaceholderText(/Descrieți procedurile/), { target: { value: 'Report' } });
      fireEvent.click(screen.getByText('Salvează Reparație'));
      expect(screen.getByText('Acțiunile întreprinse sunt obligatorii')).toBeInTheDocument();

      // Add actions
      fireEvent.change(screen.getByPlaceholderText(/Descrieți acțiunile/), { target: { value: 'Actions' } });
      fireEvent.click(screen.getByText('Salvează Reparație'));
      expect(screen.getByText('Durata trebuie să fie un număr valid')).toBeInTheDocument();

      // Add duration
      fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: '2' } });
      fireEvent.click(screen.getByText('Salvează Reparație'));
      expect(screen.getByText('Numele inginerului este obligatoriu')).toBeInTheDocument();

      // Add engineer name
      fireEvent.change(screen.getByPlaceholderText('Nume inginer'), { target: { value: 'Ing. Test' } });
      fireEvent.click(screen.getByText('Salvează Reparație'));
      expect(screen.getByText('Semnătura inginerului este obligatorie')).toBeInTheDocument();
    });
  });

  describe('onClose behavior', () => {
    it('calls onClose when X button clicked', () => {
      const { onClose } = renderModal();
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Anulează clicked', () => {
      const { onClose } = renderModal();
      fireEvent.click(screen.getByText('Anulează'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('consumables loading', () => {
    it('loads consumables for parts datalist', async () => {
      api.get.mockResolvedValue({ data: { consumables: [{ id: 1, name: 'Filtru HEPA' }] } });
      renderModal();
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/consumables');
      });
    });
  });
});
