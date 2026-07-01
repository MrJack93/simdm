import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../../api/axios';
import RepairModal from '../../components/modals/RepairModal';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { consumables: [] } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('react-signature-canvas', () => {
  const React = require('react');
  return {
    default: React.forwardRef(({ canvasProps }, ref) => {
      React.useImperativeHandle(ref, () => ({
        toDataURL: () => 'data:image/png;base64,mock',
        isEmpty: () => false,
        clear: vi.fn(),
      }));
      return React.createElement('canvas', {
        ...canvasProps,
        'data-testid': 'signature-canvas',
      });
    }),
  };
});

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

describe('RepairModal \u2014 function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { consumables: [] } });
  });

  describe('form field changes', () => {
    it('updates repairReport', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Descrie\u021bi procedurile/), { target: { value: 'New report' } });
      expect(screen.getByPlaceholderText(/Descrie\u021bi procedurile/)).toHaveValue('New report');
    });

    it('updates actionsTaken', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Descrie\u021bi ac\u021biunile/), { target: { value: 'New actions' } });
      expect(screen.getByPlaceholderText(/Descrie\u021bi ac\u021biunile/)).toHaveValue('New actions');
    });

    it('updates durationHours', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText(/Ex: 2\.5/), { target: { value: '3.5' } });
      expect(screen.getByPlaceholderText(/Ex: 2\.5/)).toHaveValue(3.5);
    });

    it('updates engineerName', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Nume inginer'), { target: { value: 'Ing. Popescu' } });
      expect(screen.getByPlaceholderText('Nume inginer')).toHaveValue('Ing. Popescu');
    });

    it('updates managerName', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Nume manager'), { target: { value: 'Mgr. Ionescu' } });
      expect(screen.getByPlaceholderText('Nume manager')).toHaveValue('Mgr. Ionescu');
    });

    it('switches functionalTest radio', () => {
      renderModal();
      fireEvent.click(screen.getByText(/Dispozitiv Nefunc\u021bional/));
      expect(screen.getByText(/Dispozitiv Nefunc\u021bional/)).toBeInTheDocument();
    });
  });

  describe('parts management', () => {
    it('adds a part', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '2' } });
      fireEvent.change(screen.getByPlaceholderText('Cost/buc'), { target: { value: '10' } });
      fireEvent.click(screen.getByText('+ Adaug\u0103 Piesa'));
      expect(screen.getByText('Cabl')).toBeInTheDocument();
    });

    it('removes a part', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('+ Adaug\u0103 Piesa'));
      expect(screen.getByText('Cabl')).toBeInTheDocument();
      fireEvent.click(screen.getByText('\u2715'));
      expect(screen.queryByText('Cabl')).not.toBeInTheDocument();
    });

    it('computes totalCost', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Filtru' } });
      fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '3' } });
      fireEvent.change(screen.getByPlaceholderText('Cost/buc'), { target: { value: '5' } });
      fireEvent.click(screen.getByText('+ Adaug\u0103 Piesa'));
      expect(screen.getAllByText('15.00 RON').length).toBeGreaterThan(0);
    });

    it('validates empty description on add', () => {
      renderModal();
      fireEvent.click(screen.getByText('+ Adaug\u0103 Piesa'));
      expect(screen.getByText(/Completa\u021bi descrierea/)).toBeInTheDocument();
    });
  });

  describe('handleSubmit validation', () => {
    it('validates all fields step by step', () => {
      renderModal();
      const saveBtn = screen.getByRole('button', { name: /Salv/ });
      fireEvent.click(saveBtn);
      expect(screen.getByText(/Raportul de repara/)).toBeInTheDocument();

      const textareas = screen.getAllByRole('textbox');
      fireEvent.change(textareas[0], { target: { value: 'Report' } });
      fireEvent.click(saveBtn);
      expect(screen.getByText(/sunt obligatorii/)).toBeInTheDocument();

      fireEvent.change(textareas[1], { target: { value: 'Actions' } });
      fireEvent.click(saveBtn);
      expect(screen.getByText(/Durata/)).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Ex: 2/), { target: { value: '2' } });
      fireEvent.click(saveBtn);
      expect(screen.getByText(/Numele/)).toBeInTheDocument();
    });
  });

  describe('other', () => {
    it('shows photo upload inputs', () => {
      renderModal();
      expect(screen.getByText('Foto Ini\u021bial\u0103')).toBeInTheDocument();
      expect(screen.getByText('Foto Final\u0103')).toBeInTheDocument();
    });

    it('renders two signature canvases', () => {
      renderModal();
      expect(screen.getAllByTestId('signature-canvas').length).toBe(2);
    });

    it('renders clear buttons', () => {
      renderModal();
      expect(screen.getAllByText(/terge Semn/).length).toBe(2);
    });

    it('calls onClose on X click', () => {
      const { onClose } = renderModal();
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Anuleaz\u0103 click', () => {
      const { onClose } = renderModal();
      fireEvent.click(screen.getByText('Anuleaz\u0103'));
      expect(onClose).toHaveBeenCalled();
    });

    it('loads consumables', async () => {
      renderModal();
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/consumables');
      });
    });

    it('shows ticket info', () => {
      renderModal();
      expect(screen.getByText('Ventilator')).toBeInTheDocument();
      expect(screen.getAllByText(/SN-123/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Display defect')).toBeInTheDocument();
      expect(screen.getByText('Cabl rupt')).toBeInTheDocument();
    });
  });
});
