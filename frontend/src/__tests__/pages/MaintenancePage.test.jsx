import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], total: 0 } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import MaintenancePage from '../../pages/MaintenancePage';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('MaintenancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance')) return Promise.resolve({ data: { data: [], total: 0 } });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it('renders page heading', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Mentenanță')).toBeInTheDocument();
  });

  it('renders hub tab by default', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Panou Control (Hub)')).toBeInTheDocument();
  });

  it('shows hub cards', () => {
    renderWithProviders(<MaintenancePage />);
    expect(screen.getByText('Planificare & Calendar MPP')).toBeInTheDocument();
    expect(screen.getByText('Execuție MPP')).toBeInTheDocument();
    expect(screen.getByText('Bilete de Reparație')).toBeInTheDocument();
  });

  it('switches to records tab', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Nu există înregistrări de mentenanță. Adăugați prima înregistrare.')).toBeInTheDocument();
    });
  });

  it('shows add button in records tab', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument();
    });
  });

  it('opens modal when add button clicked', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Adaugă Înregistrare'));
    await waitFor(() => {
      expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument();
    });
  });

  it('shows maintenance records when available', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance')) return Promise.resolve({
        data: {
          data: [{
            id: 1, deviceId: 1, type: 'PREVENTIVA', executedDate: '2025-06-14T10:00:00Z',
            scheduledDate: '2025-06-14T10:00:00Z', description: 'Schimb ulei',
            cost: 500, externalService: false,
            devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
          }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Schimb ulei')).toBeInTheDocument();
    });
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
  });

  it('shows type filter buttons', async () => {
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Toate (0)')).toBeInTheDocument();
    });
    expect(screen.getByText('Preventivă (0)')).toBeInTheDocument();
    expect(screen.getByText('Corectivă (0)')).toBeInTheDocument();
  });

  it('renders maintenance record with external service', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance')) return Promise.resolve({
        data: {
          data: [{
            id: 1, deviceId: 1, type: 'CORECTIVA', executedDate: '2025-06-14T10:00:00Z',
            description: 'Reparație externă', cost: 2000, externalService: true, serviceProvider: 'ServTech',
            devices: { name: 'Scaner', inventoryNumber: 'INV-002' },
          }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Reparație externă')).toBeInTheDocument();
    });
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows empty message when records exist but filter has no matches', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance')) return Promise.resolve({
        data: {
          data: [{ id: 1, deviceId: 1, type: 'PREVENTIVA', executedDate: '2025-06-14', description: 'Test', devices: { name: 'V1', inventoryNumber: 'I1' } }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<MaintenancePage />);
    fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Corectivă (0)'));
    await waitFor(() => {
      expect(screen.getByText('Nicio înregistrare pentru filtrul selectat.')).toBeInTheDocument();
    });
  });
});
