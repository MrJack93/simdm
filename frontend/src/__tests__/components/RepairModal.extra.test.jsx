import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { consumables: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('react-signature-canvas', () => ({
  default: ({ ref, ...props }) => {
    const React = require('react');
    const Comp = React.forwardRef((_, innerRef) => {
      React.useImperativeHandle(innerRef, () => ({
        clear: vi.fn(),
        isEmpty: () => true,
        toDataURL: () => 'data:image/png;base64,mock',
      }));
      return React.createElement('canvas', { ref: innerRef, 'data-testid': 'signature-canvas', ...props });
    });
    return React.createElement(Comp, { ref });
  },
}));

import RepairModal from '../../components/modals/RepairModal';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

const TICKET = {
  id: 1,
  ticketNumber: 'TK-2025-001',
  faultDescription: 'Dispozitivul nu pornește',
  faultCause: 'Baterie descărcată',
  device: { name: 'Ventilator', serialNumber: 'SN-12345' },
};

describe('RepairModal — extra', () => {
  const onClose = vi.fn();
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { consumables: [{ id: 1, name: 'Filtru' }] } });
    api.put.mockResolvedValue({ data: {} });
  });

  it('renders modal title with ticket number', () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    expect(screen.getByText(/Formular de Reparație/)).toBeInTheDocument();
    expect(screen.getByText(/TK-2025-001/)).toBeInTheDocument();
  });

  it('shows device info', () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
    expect(screen.getByText(/Serie: SN-12345/)).toBeInTheDocument();
  });

  it('shows fault description and cause', () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    expect(screen.getByText('Dispozitivul nu pornește')).toBeInTheDocument();
    expect(screen.getByText('Baterie descărcată')).toBeInTheDocument();
  });

  it('shows "Nu a fost stabilit" when no faultCause', () => {
    const ticketNoCause = { ...TICKET, faultCause: null };
    renderWithProviders(
      <RepairModal ticket={ticketNoCause} onClose={onClose} onRefresh={onRefresh} />
    );
    expect(screen.getByText('(Nu a fost stabilit)')).toBeInTheDocument();
  });

  it('all form fields are editable', () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getByPlaceholderText('Descrieți procedurile de reparație...'), { target: { value: 'Reparat complet' } });
    fireEvent.change(screen.getByPlaceholderText('Descrieți acțiunile executate...'), { target: { value: 'Schimb baterie' } });
    fireEvent.change(screen.getByPlaceholderText('Ex: 2.5'), { target: { value: '3' } });
    fireEvent.change(screen.getByPlaceholderText('Nume inginer'), { target: { value: 'Ing. Popescu' } });
    fireEvent.change(screen.getByPlaceholderText('Nume manager'), { target: { value: 'Manager Ion' } });

    expect(screen.getByPlaceholderText('Descrieți procedurile de reparație...')).toHaveValue('Reparat complet');
    expect(screen.getByPlaceholderText('Descrieți acțiunile executate...')).toHaveValue('Schimb baterie');
    expect(screen.getByPlaceholderText('Ex: 2.5').value).toBe('3');
  });

  it('submit validation - no repairReport', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.click(screen.getByText('Salvează Reparație'));
    await waitFor(() => {
      expect(screen.getByText('Raportul de reparație este obligatoriu')).toBeInTheDocument();
    });
  });

  it('submit validation - no actionsTaken', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getByPlaceholderText('Descrieți procedurile de reparație...'), { target: { value: 'Raport test' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    await waitFor(() => {
      expect(screen.getByText('Acțiunile întreprinse sunt obligatorii')).toBeInTheDocument();
    });
  });

  it('submit validation - no duration', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getByPlaceholderText('Descrieți procedurile de reparație...'), { target: { value: 'Raport' } });
    fireEvent.change(screen.getByPlaceholderText('Descrieți acțiunile executate...'), { target: { value: 'Actiuni' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    await waitFor(() => {
      expect(screen.getByText('Durata trebuie să fie un număr valid')).toBeInTheDocument();
    });
  });

  it('submit validation - no engineer name', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getByPlaceholderText('Descrieți procedurile de reparație...'), { target: { value: 'Raport' } });
    fireEvent.change(screen.getByPlaceholderText('Descrieți acțiunile executate...'), { target: { value: 'Actiuni' } });
    fireEvent.change(screen.getByPlaceholderText('Ex: 2.5'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Salvează Reparație'));
    await waitFor(() => {
      expect(screen.getByText('Numele inginerului este obligatoriu')).toBeInTheDocument();
    });
  });

  it('add part validation - empty description', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    await waitFor(() => {
      expect(screen.getByText('Completați descrierea și cantitatea')).toBeInTheDocument();
    });
  });

  it('add part works with valid data', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getAllByPlaceholderText('Descriere')[0], { target: { value: 'Filtru nou' } });
    fireEvent.change(screen.getAllByPlaceholderText('Cantitate')[0], { target: { value: '2' } });
    fireEvent.change(screen.getAllByPlaceholderText('Cost/buc')[0], { target: { value: '50' } });
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    expect(screen.getByText('Filtru nou')).toBeInTheDocument();
    expect(screen.getAllByText('100.00 RON').length).toBeGreaterThan(0);
  });

  it('remove part', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getAllByPlaceholderText('Descriere')[0], { target: { value: 'Filtru' } });
    fireEvent.change(screen.getAllByPlaceholderText('Cantitate')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByText('+ Adaugă Piesa'));
    expect(screen.getByText('Filtru')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('Filtru')).not.toBeInTheDocument();
  });

  it('functional test radio buttons', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
    fireEvent.click(radios[1]);
    expect(radios[1].checked).toBe(true);
  });

  it('cancel button calls onClose', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.click(screen.getByText('Anulează'));
    expect(onClose).toHaveBeenCalled();
  });

  it('close button (×) calls onClose', async () => {
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('save error shows error message', async () => {
    api.put.mockRejectedValueOnce({ response: { data: { error: 'Save failed' } } });
    renderWithProviders(
      <RepairModal ticket={TICKET} onClose={onClose} onRefresh={onRefresh} />
    );
    fireEvent.change(screen.getByPlaceholderText('Descrieți procedurile de reparație...'), { target: { value: 'Raport' } });
    fireEvent.change(screen.getByPlaceholderText('Descrieți acțiunile executate...'), { target: { value: 'Actiuni' } });
    fireEvent.change(screen.getByPlaceholderText('Ex: 2.5'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Nume inginer'), { target: { value: 'Ing. Test' } });
    // Mock signature as non-empty
    fireEvent.click(screen.getByText('Salvează Reparație'));
    await waitFor(() => {
      expect(screen.getByText('Semnătura inginerului este obligatorie')).toBeInTheDocument();
    });
  });
});
