import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

import TicketDetailsModal from '../../../components/modals/TicketDetailsModal';
import api from '../../../api/axios';

const mockTicket = {
  id: 1,
  ticketNumber: 'RT-001',
  status: 'DESCHIS',
  priority: 'MARE',
  reportedAt: '2025-06-14T10:00:00Z',
  faultDescription: 'Afisaj defect',
  faultCause: 'Cabl rupt',
  device: { name: 'Ventilator', serialNumber: 'SN-123', inventoryNumber: 'INV-456' },
};

function renderModal(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const defaultProps = {
    ticket: mockTicket,
    onClose: vi.fn(),
    onRefresh: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <TicketDetailsModal {...defaultProps} />
      </QueryClientProvider>
    ),
    ...defaultProps,
  };
}

describe('TicketDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ticket number', () => {
    renderModal();
    expect(screen.getByText('RT-001')).toBeInTheDocument();
  });

  it('displays ticket status', () => {
    renderModal();
    expect(screen.getByText('Status: DESCHIS')).toBeInTheDocument();
  });

  it('displays device name', () => {
    renderModal();
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
  });

  it('displays serial number', () => {
    renderModal();
    expect(screen.getByText(/Serie: SN-123/)).toBeInTheDocument();
  });

  it('displays inventory number', () => {
    renderModal();
    expect(screen.getByText(/Inventar: INV-456/)).toBeInTheDocument();
  });

  it('displays priority', () => {
    renderModal();
    expect(screen.getByText('MARE')).toBeInTheDocument();
  });

  it('displays fault description', () => {
    renderModal();
    expect(screen.getByText('Afisaj defect')).toBeInTheDocument();
  });

  it('displays fault cause', () => {
    renderModal();
    expect(screen.getByText('Cabl rupt')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Închide button clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Închide'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows status transition select for DESCHIS status', () => {
    renderModal();
    expect(screen.getByText('Tranziție Status')).toBeInTheDocument();
    expect(screen.getByText('Selectează nouul status')).toBeInTheDocument();
  });

  it('shows valid transitions for DESCHIS status', () => {
    renderModal();
    const select = screen.getByText('Selectează nouul status').closest('select');
    expect(select).toBeInTheDocument();
  });

  it('updates status transition', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    renderModal();

    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'IN_LUCRU' } });

    const updateBtn = screen.getByText('Actualizează Status');
    expect(updateBtn).not.toBeDisabled();
  });

  it('shows ESCALADAT as only transition for INCHIS status', () => {
    renderModal({ ticket: { ...mockTicket, status: 'INCHIS' } });
    expect(screen.getByText('ESCALADAT')).toBeInTheDocument();
  });

  it('shows actions taken section when present', () => {
    renderModal({ ticket: { ...mockTicket, actionsTaken: 'Reparat display' } });
    expect(screen.getByText('Reparat display')).toBeInTheDocument();
  });

  it('shows externalized repair type', () => {
    renderModal({ ticket: { ...mockTicket, externalized: true } });
    expect(screen.getByText('EXTERNĂ (Furnizor)')).toBeInTheDocument();
  });

  it('shows internal repair type', () => {
    renderModal({ ticket: { ...mockTicket, externalized: false } });
    expect(screen.getByText('INTERNĂ')).toBeInTheDocument();
  });

  it('does not show actions taken when not present', () => {
    renderModal({ ticket: { ...mockTicket, actionsTaken: undefined } });
    expect(screen.queryByText('Acțiuni Întreprinse')).not.toBeInTheDocument();
  });

  it('shows status transition section with update button', () => {
    renderModal();
    expect(screen.getByText('Tranziție Status')).toBeInTheDocument();
    expect(screen.getByText('Actualizează Status')).toBeInTheDocument();
  });
});
