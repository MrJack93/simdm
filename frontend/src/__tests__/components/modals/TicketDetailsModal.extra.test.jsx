import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../../../api/axios';
import TicketDetailsModal from '../../../components/modals/TicketDetailsModal';

vi.mock('../../../api/axios', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => mockApi),
  };
  return { default: mockApi };
});

const BASE_TICKET = {
  id: 1,
  ticketNumber: 'RT-001',
  status: 'DESCHIS',
  priority: 'MARE',
  reportedAt: '2025-06-14T10:00:00Z',
  faultDescription: 'Afisaj defect',
  device: { name: 'Ventilator', serialNumber: 'SN-123', inventoryNumber: 'INV-456' },
};

function renderModal(props = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const defaultProps = { ticket: BASE_TICKET, onClose: vi.fn(), onRefresh: vi.fn(), ...props };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <TicketDetailsModal {...defaultProps} />
      </QueryClientProvider>
    ),
    ...defaultProps,
  };
}

describe('TicketDetailsModal — Extra Coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('formular8 download', () => {
    it('downloads formular8 PDF when actionsTaken present', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      api.get.mockResolvedValueOnce({ data: mockBlob });
      const clickSpy = vi.spyOn(document.createElement('a'), 'click').mockImplementation(() => {});

      renderModal({ ticket: { ...BASE_TICKET, actionsTaken: 'Reparat display' } });
      fireEvent.click(screen.getByText('Descarcă Formular Nr. 8 (PDF)'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/repair-tickets/1/formular8-pdf', { responseType: 'blob' });
      });
      clickSpy.mockRestore();
    });

    it('shows error when PDF download fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Network'));
      renderModal({ ticket: { ...BASE_TICKET, actionsTaken: 'Reparat' } });

      fireEvent.click(screen.getByText('Descarcă Formular Nr. 8 (PDF)'));
      await waitFor(() => {
        expect(screen.getByText('Eroare la descărcare PDF')).toBeInTheDocument();
      });
    });
  });

  describe('status transitions', () => {
    it('shows INCHIS transitions (ESCALADAT only)', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'INCHIS' } });
      expect(screen.getByText('Escaladat extern')).toBeInTheDocument();
      expect(screen.queryByText('Rezolvat')).not.toBeInTheDocument();
    });

    it('shows ESCALADAT transitions', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'ESCALADAT' } });
      expect(screen.getByText('În lucru')).toBeInTheDocument();
      expect(screen.getByText('Deschis')).toBeInTheDocument();
    });

    it('shows REZOLVAT transitions', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'REZOLVAT' } });
      expect(screen.getByText('Testat')).toBeInTheDocument();
      expect(screen.getByText('În lucru')).toBeInTheDocument();
      expect(screen.getByText('Escaladat extern')).toBeInTheDocument();
    });

    it('shows TESTAT transitions', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'TESTAT' } });
      expect(screen.getByText('Închis')).toBeInTheDocument();
    });

    it('shows IN_LUCRU transitions', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'IN_LUCRU' } });
      expect(screen.getByText('Rezolvat')).toBeInTheDocument();
      expect(screen.getByText('Deschis')).toBeInTheDocument();
    });

    it('updates status via mutation', async () => {
      api.patch.mockResolvedValueOnce({ data: {} });
      renderModal();

      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'IN_LUCRU' } });
      fireEvent.click(screen.getByText('Actualizează Status'));

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/repair-tickets/1/status', { newStatus: 'IN_LUCRU' });
      });
    });

    it('shows error on status update failure', async () => {
      api.patch.mockRejectedValueOnce({ response: { data: { error: 'Invalid transition' } } });
      renderModal();

      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'IN_LUCRU' } });
      fireEvent.click(screen.getByText('Actualizează Status'));

      await waitFor(() => {
        expect(screen.getByText('Invalid transition')).toBeInTheDocument();
      });
    });

    it('shows generic error on status update failure without response', async () => {
      api.patch.mockRejectedValueOnce(new Error('Network'));
      renderModal();

      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'IN_LUCRU' } });
      fireEvent.click(screen.getByText('Actualizează Status'));

      await waitFor(() => {
        expect(screen.getByText('Eroare la actualizare')).toBeInTheDocument();
      });
    });
  });

  describe('conditional sections', () => {
    it('shows faultCause when present', () => {
      renderModal({ ticket: { ...BASE_TICKET, faultCause: 'Cabl rupt' } });
      expect(screen.getByText('Cabl rupt')).toBeInTheDocument();
    });

    it('hides faultCause when not present', () => {
      renderModal({ ticket: { ...BASE_TICKET, faultCause: undefined } });
      expect(screen.queryByText('Cauza Defecțiunii')).not.toBeInTheDocument();
    });

    it('shows externalized true', () => {
      renderModal({ ticket: { ...BASE_TICKET, externalized: true } });
      expect(screen.getByText('EXTERNĂ (Furnizor)')).toBeInTheDocument();
    });

    it('shows externalized false', () => {
      renderModal({ ticket: { ...BASE_TICKET, externalized: false } });
      expect(screen.getByText('INTERNĂ')).toBeInTheDocument();
    });

    it('hides externalized section when undefined', () => {
      renderModal({ ticket: { ...BASE_TICKET, externalized: undefined } });
      expect(screen.queryByText('Tip Reparație')).not.toBeInTheDocument();
    });

    it('shows actionsTaken when present', () => {
      renderModal({ ticket: { ...BASE_TICKET, actionsTaken: 'Reparat display' } });
      expect(screen.getByText('Reparat display')).toBeInTheDocument();
    });

    it('hides actionsTaken when not present', () => {
      renderModal({ ticket: { ...BASE_TICKET, actionsTaken: undefined } });
      expect(screen.queryByText('Acțiuni Întreprinse')).not.toBeInTheDocument();
    });

    it('shows formular8 download button only when actionsTaken present', () => {
      const { rerender } = renderModal({ ticket: { ...BASE_TICKET, actionsTaken: 'Done' } });
      expect(screen.getByText('Descarcă Formular Nr. 8 (PDF)')).toBeInTheDocument();
    });

    it('hides formular8 button when no actionsTaken', () => {
      renderModal({ ticket: { ...BASE_TICKET, actionsTaken: undefined } });
      expect(screen.queryByText('Descarcă Formular Nr. 8 (PDF)')).not.toBeInTheDocument();
    });
  });

  describe('no transitions available', () => {
    it('shows no transitions message for unknown status', () => {
      renderModal({ ticket: { ...BASE_TICKET, status: 'UNKNOWN' } });
      expect(screen.getByText('Nu sunt tranziții disponibile.')).toBeInTheDocument();
    });
  });
});
