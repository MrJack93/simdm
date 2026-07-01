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

import IncidentsPage from '../../pages/IncidentsPage';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('IncidentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({ data: { data: [], total: 0 } });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it('renders page heading', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByText('Incidente')).toBeInTheDocument();
  });

  it('renders report button', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByText('Raportează Incident')).toBeInTheDocument();
  });

  it('shows empty message when no incidents', async () => {
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nu există incidente raportate. Adăugați primul incident.')).toBeInTheDocument();
    });
  });

  it('renders severity filter', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByLabelText('Severitate')).toBeInTheDocument();
  });

  it('renders status filter', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('opens modal when report button clicked', async () => {
    renderWithProviders(<IncidentsPage />);
    fireEvent.click(screen.getByText('Raportează Incident'));
    await waitFor(() => {
      expect(screen.getByText('Raportează Incident', { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('shows device select in modal', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({ data: { data: [], total: 0 } });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [{ id: 1, name: 'Ventilator', inventoryNumber: 'INV-001' }] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    fireEvent.click(screen.getByText('Raportează Incident'));
    await waitFor(() => {
      expect(screen.getByText(/Ventilator/)).toBeInTheDocument();
    });
  });

  it('opens modal with form fields', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({ data: { data: [], total: 0 } });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    fireEvent.click(screen.getByText('Raportează Incident'));
    await waitFor(() => {
      expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Data Incidentului *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descriere *')).toBeInTheDocument();
    expect(screen.getByLabelText('Pacient afectat')).toBeInTheDocument();
    expect(screen.getByLabelText('Raportat la AMDM')).toBeInTheDocument();
  });

  it('renders incident data when available', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({
        data: {
          data: [{
            id: 1,
            deviceId: 1,
            description: 'Defect display',
            severity: 'GRAV',
            status: 'DESCHIS',
            occurredAt: '2025-06-14T10:00:00Z',
            patientAffected: false,
            reportedToAmdm: false,
            devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
          }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText('Defect display')).toBeInTheDocument();
    });
    expect(screen.getByText('Ventilator')).toBeInTheDocument();
  });

  it('displays patient affected indicator', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({
        data: {
          data: [{
            id: 1, deviceId: 1, description: 'Pacient', severity: 'CRITIC',
            status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z',
            patientAffected: true, patientHarm: 'Vătămare minoră',
            reportedToAmdm: false,
            devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
          }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  it('displays AMDM reported indicator', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({
        data: {
          data: [{
            id: 1, deviceId: 1, description: 'Reportat', severity: 'MINOR',
            status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z',
            patientAffected: false, reportedToAmdm: true, amdmReportRef: 'REF-001',
            devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
          }],
          total: 1,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('filters incidents by severity', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/incidents')) return Promise.resolve({
        data: {
          data: [
            { id: 1, deviceId: 1, description: 'Minor incident', severity: 'MINOR', status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false, devices: { name: 'V1', inventoryNumber: 'I1' } },
            { id: 2, deviceId: 1, description: 'Grav incident', severity: 'GRAV', status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false, devices: { name: 'V2', inventoryNumber: 'I2' } },
          ],
          total: 2,
        },
      });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText('Minor incident')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Severitate'), { target: { value: 'GRAV' } });
    await waitFor(() => {
      expect(screen.queryByText('Minor incident')).not.toBeInTheDocument();
      expect(screen.getByText('Grav incident')).toBeInTheDocument();
    });
  });
});
