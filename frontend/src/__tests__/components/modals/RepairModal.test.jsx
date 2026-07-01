import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    return React.createElement('canvas', {
      ...canvasProps,
      ref,
      'data-testid': 'signature-canvas',
    });
  },
}));

import RepairModal from '../../../components/modals/RepairModal';
import api from '../../../api/axios';

const mockTicket = {
  id: 1,
  ticketNumber: 'RT-001',
  device: { name: 'Ventilator', serialNumber: 'SN-123' },
  faultDescription: 'Display nu functioneaza',
  faultCause: 'Cabl deteriorat',
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
        <RepairModal {...defaultProps} />
      </QueryClientProvider>
    ),
    ...defaultProps,
  };
}

describe('RepairModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { consumables: [] } });
  });

  it('renders modal with ticket number', () => {
    renderModal();
    expect(screen.getByText(/Formular de Reparație — RT-001/)).toBeInTheDocument();
  });

  it('displays device info', () => {
    renderModal();
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText(/Serie: SN-123/)).toBeInTheDocument();
  });

  it('displays fault description', () => {
    renderModal();
    expect(screen.getByText('Display nu functioneaza')).toBeInTheDocument();
  });

  it('displays fault cause from triage', () => {
    renderModal();
    expect(screen.getByText('Cabl deteriorat')).toBeInTheDocument();
  });

  it('shows "Nu a fost stabilit" when no faultCause', () => {
    renderModal({ ticket: { ...mockTicket, faultCause: null } });
    expect(screen.getByText('(Nu a fost stabilit)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Anulează is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Anulează'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when submitting empty form', () => {
    renderModal();
    fireEvent.click(screen.getByText('Salvează Reparație'));
    expect(screen.getByText('Raportul de reparație este obligatoriu')).toBeInTheDocument();
  });

  it('shows error when repair report is missing', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Descrieți acțiunile/), { target: { value: 'Actions' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    expect(screen.getByText('Raportul de reparație este obligatoriu')).toBeInTheDocument();
  });

  it('shows error when actions taken is missing', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Descrieți procedurile/), { target: { value: 'Report' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    expect(screen.getByText('Acțiunile întreprinse sunt obligatorii')).toBeInTheDocument();
  });

  it('shows error when duration is not a number', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Descrieți procedurile/), { target: { value: 'Report' } });
    fireEvent.change(screen.getByPlaceholderText(/Descrieți acțiunile/), { target: { value: 'Actions' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    expect(screen.getByText('Durata trebuie să fie un număr valid')).toBeInTheDocument();
  });

  it('shows error when engineer name is missing', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Descrieți procedurile/), { target: { value: 'Report' } });
    fireEvent.change(screen.getByPlaceholderText(/Descrieți acțiunile/), { target: { value: 'Actions' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 2.5/), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    expect(screen.getByText('Numele inginerului este obligatoriu')).toBeInTheDocument();
  });

  it('renders functional test radio buttons', () => {
    renderModal();
    expect(screen.getByText('Dispozitiv Funcțional ✓')).toBeInTheDocument();
    expect(screen.getByText('Dispozitiv Nefuncțional ✗')).toBeInTheDocument();
  });

  it('renders engineer and manager name inputs', () => {
    renderModal();
    expect(screen.getByPlaceholderText('Nume inginer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nume manager')).toBeInTheDocument();
  });

  it('renders photo upload inputs', () => {
    renderModal();
    expect(screen.getByText('Foto Inițială')).toBeInTheDocument();
    expect(screen.getByText('Foto Finală')).toBeInTheDocument();
  });

  it('renders parts section', () => {
    renderModal();
    expect(screen.getByText('Piese Folosite')).toBeInTheDocument();
    expect(screen.getByText('+ Adaugă Piesa')).toBeInTheDocument();
  });

  it('adds a part to the list', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl USB' } });
    fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Cost/buc'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    expect(screen.getByText('Cabl USB')).toBeInTheDocument();
    expect(screen.getAllByText('20.00 RON').length).toBeGreaterThan(0);
  });

  it('shows error when adding part without description', () => {
    renderModal();
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    expect(screen.getByText('Completați descrierea și cantitatea')).toBeInTheDocument();
  });

  it('removes a part from the list', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('Descriere'), { target: { value: 'Cabl' } });
    fireEvent.change(screen.getByPlaceholderText('Cantitate'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    expect(screen.getByText('Cabl')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('Cabl')).not.toBeInTheDocument();
  });

  it('renders canvas elements for signatures', () => {
    renderModal();
    const canvases = screen.getAllByTestId('signature-canvas');
    expect(canvases.length).toBe(2);
  });

  it('renders clear signature buttons', () => {
    renderModal();
    const clearButtons = screen.getAllByText('Șterge Semnătura');
    expect(clearButtons.length).toBe(2);
  });
});
