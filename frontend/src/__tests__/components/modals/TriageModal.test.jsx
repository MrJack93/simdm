import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import TriageModal from '../../../components/modals/TriageModal';
import api from '../../../api/axios';

const mockTicket = {
  id: 1,
  ticketNumber: 'RT-001',
  device: { name: 'Ventilator', serialNumber: 'SN-123' },
  faultDescription: 'Display defect',
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
        <TriageModal {...defaultProps} />
      </QueryClientProvider>
    ),
    ...defaultProps,
  };
}

describe('TriageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with ticket number', () => {
    renderModal();
    expect(screen.getByText(/Triaj — RT-001/)).toBeInTheDocument();
  });

  it('displays device info', () => {
    renderModal();
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText(/Defecțiune: Display defect/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Anulează clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Anulează'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows INTERN repair type by default', () => {
    renderModal();
    const radio = screen.getByDisplayValue('INTERN');
    expect(radio).toBeChecked();
  });

  it('shows EXTERN option', () => {
    renderModal();
    expect(screen.getByText('Reparație Externă')).toBeInTheDocument();
  });

  it('switches to EXTERN repair type', () => {
    renderModal();
    fireEvent.click(screen.getByText('Reparație Externă'));
    expect(screen.getByDisplayValue('EXTERN')).toBeChecked();
  });

  it('shows provider select when EXTERN is selected', () => {
    renderModal();
    fireEvent.click(screen.getByText('Reparație Externă'));
    expect(screen.getByText('Furnizor Service')).toBeInTheDocument();
    expect(screen.getByText('Selectează furnizor...')).toBeInTheDocument();
  });

  it('does not show provider select for INTERN', () => {
    renderModal();
    expect(screen.queryByText('Furnizor Service')).not.toBeInTheDocument();
  });

  it('submit button is disabled when defect cause is empty', () => {
    renderModal();
    const submitBtn = screen.getByText('Salvează Triaj');
    expect(submitBtn).toBeDisabled();
  });

  it('submits triage data successfully', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    const { onRefresh, onClose } = renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Descrieți cauza/), {
      target: { value: ' uzură normală' },
    });
    fireEvent.click(screen.getByText('Salvează Triaj'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/repair-tickets/1/triage', {
        repairType: 'INTERN',
        defectCause: ' uzură normală',
        externalProviderId: null,
      });
    });
  });

  it('includes provider ID when EXTERN is selected', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    renderModal();

    fireEvent.click(screen.getByText('Reparație Externă'));
    fireEvent.change(screen.getByPlaceholderText(/Descrieți cauza/), {
      target: { value: 'Complex repair' },
    });
    fireEvent.click(screen.getByText('Salvează Triaj'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/repair-tickets/1/triage', expect.objectContaining({
        repairType: 'EXTERN',
      }));
    });
  });

  it('shows error on triage failure', async () => {
    api.patch.mockRejectedValueOnce({
      response: { data: { error: 'Triage failed' } },
    });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Descrieți cauza/), {
      target: { value: 'Error test' },
    });
    fireEvent.click(screen.getByText('Salvează Triaj'));

    await waitFor(() => {
      expect(screen.getByText('Triage failed')).toBeInTheDocument();
    });
  });

  it('shows character count for defect cause', () => {
    renderModal();
    expect(screen.getByText('0 caractere')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Descrieți cauza/), {
      target: { value: 'test' },
    });
    expect(screen.getByText('4 caractere')).toBeInTheDocument();
  });

  it('disables submit when defect cause is empty', () => {
    renderModal();
    const submitBtn = screen.getByText('Salvează Triaj');
    expect(submitBtn).toBeDisabled();
  });
});
