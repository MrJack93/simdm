import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevice: vi.fn(() => ({ isLoading: false, data: null })),
  useDevices: vi.fn(() => ({ data: { devices: [] }, isLoading: false })),
}));

vi.mock('../../hooks/useSections', () => ({
  useSections: vi.fn(() => ({ data: [] })),
}));

vi.mock('../../api/devices', () => ({
  createDevice: vi.fn(),
  updateDevice: vi.fn(),
  deviceKeys: { all: ['devices'], detail: (id) => ['device', id] },
}));

vi.mock('react-signature-canvas', () => ({
  default: ({ canvasProps, ref }) => {
    const React = require('react');
    return React.createElement('canvas', { ...canvasProps, ref, 'data-testid': 'signature-canvas' });
  },
}));

import DeviceForm from '../../pages/DeviceForm';
import { useDevice } from '../../hooks/useDevices';

function renderForm(route = '/devices/new') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <DeviceForm />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DeviceForm — Extra Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/devices/dropdown/sections')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    useDevice.mockReturnValue({ isLoading: false, data: null });
  });

  it('shows step indicator', () => {
    renderForm();
    expect(screen.getAllByText('Identificare').length).toBeGreaterThan(0);
  });

  it('renders all step 0 fields', () => {
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

  it('advances to step 2 with valid data', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Numărul inventarului *'), { target: { value: 'DM-001' } });
    fireEvent.change(screen.getByLabelText('Denumire *'), { target: { value: 'Ventilator' } });
    fireEvent.click(screen.getByText('Înainte →'));
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('goes back to step 1 from step 2', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Numărul inventarului *'), { target: { value: 'DM-001' } });
    fireEvent.change(screen.getByLabelText('Denumire *'), { target: { value: 'Ventilator' } });
    fireEvent.click(screen.getByText('Înainte →'));
    await waitFor(() => screen.getByText('Clasificare Risc și Status'));
    fireEvent.click(screen.getByText('← Înapoi'));
    await waitFor(() => {
      expect(screen.getByText('Identificare Dispozitiv')).toBeInTheDocument();
    });
  });

  it('prev button disabled on first step', () => {
    renderForm();
    expect(screen.getByText('← Înapoi')).toBeDisabled();
  });

  it('shows navigation buttons', () => {
    renderForm();
    expect(screen.getByText('← Înapoi')).toBeDisabled();
    expect(screen.getByText('Înainte →')).toBeInTheDocument();
  });

  it('handles Enter key to advance steps', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Numărul inventarului *'), { target: { value: 'DM-001' } });
    fireEvent.change(screen.getByLabelText('Denumire *'), { target: { value: 'Ventilator' } });
    const input = screen.getByLabelText('Numărul inventarului *');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Clasificare Risc și Status')).toBeInTheDocument();
    });
  });

  it('shows loading state when device is loading', () => {
    useDevice.mockReturnValue({ isLoading: true, data: null });
    renderForm('/devices/1/edit');
    expect(screen.getByText('Se încarcă dispozitivul…')).toBeInTheDocument();
  });
});
