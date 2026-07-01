import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../api/axios';
import IncidentsPage from '../../pages/IncidentsPage';
import { renderWithProviders } from '../helpers/renderWithProviders';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], total: 0 } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const SAMPLE_INCIDENTS = [
  { id: 1, deviceId: 1, description: 'Defect display', severity: 'GRAV', status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false, devices: { name: 'Ventilator', inventoryNumber: 'INV-001' } },
  { id: 2, deviceId: 2, description: 'Scurgere aer', severity: 'MINOR', status: 'IN_LUCRU', occurredAt: '2025-06-15T14:00:00Z', patientAffected: true, patientHarm: 'Vătămare minoră', reportedToAmdm: true, amdmReportRef: 'REF-001', amdmReportDate: '2025-06-16', devices: { name: 'Echograf', inventoryNumber: 'INV-002' } },
];

const DEVICES = [
  { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001' },
  { id: 2, name: 'Echograf', inventoryNumber: 'INV-002' },
];

function setupApi(incidents = SAMPLE_INCIDENTS, devices = DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.includes('/incidents')) return Promise.resolve({ data: { data: incidents, total: incidents.length } });
    if (url.includes('/devices')) return Promise.resolve({ data: { devices } });
    return Promise.resolve({ data: {} });
  });
}

describe('IncidentsPage — Extra Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApi();
  });

  describe('modal open/close', () => {
    it('opens modal when report button clicked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => {
        expect(screen.getByLabelText('Dispozitiv *')).toBeInTheDocument();
      });
    });

    it('closes modal when cancel button clicked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => screen.getByLabelText('Dispozitiv *'));

      fireEvent.click(screen.getByText('Anulare'));
      await waitFor(() => {
        expect(screen.queryByLabelText('Dispozitiv *')).not.toBeInTheDocument();
      });
    });
  });

  describe('patient affected and AMDM toggles', () => {
    it('shows patient harm field when patient affected checked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => screen.getByLabelText('Pacient afectat'));

      fireEvent.click(screen.getByLabelText('Pacient afectat'));
      expect(screen.getByLabelText('Descriere vătămare pacient')).toBeInTheDocument();
    });

    it('shows AMDM fields when reported to AMDM checked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => screen.getByLabelText('Raportat la AMDM'));

      fireEvent.click(screen.getByLabelText('Raportat la AMDM'));
      expect(screen.getByLabelText('Data raportului AMDM')).toBeInTheDocument();
      expect(screen.getByLabelText('Nr. referință AMDM')).toBeInTheDocument();
    });

    it('hides patient harm when unchecked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => screen.getByLabelText('Pacient afectat'));

      fireEvent.click(screen.getByLabelText('Pacient afectat'));
      expect(screen.getByLabelText('Descriere vătămare pacient')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Pacient afectat'));
      expect(screen.queryByLabelText('Descriere vătămare pacient')).not.toBeInTheDocument();
    });

    it('hides AMDM fields when unchecked', async () => {
      renderWithProviders(<IncidentsPage />);
      fireEvent.click(screen.getByText('Raportează Incident'));
      await waitFor(() => screen.getByLabelText('Raportat la AMDM'));

      fireEvent.click(screen.getByLabelText('Raportat la AMDM'));
      expect(screen.getByLabelText('Data raportului AMDM')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Raportat la AMDM'));
      expect(screen.queryByLabelText('Data raportului AMDM')).not.toBeInTheDocument();
    });
  });

  describe('status changer', () => {
    it('opens status dropdown', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      const statusBtn = screen.getAllByLabelText('Schimbă status')[0];
      fireEvent.click(statusBtn);

      await waitFor(() => {
        expect(screen.getAllByText('În lucru').length).toBeGreaterThan(0);
      });
    });
  });

  describe('delete flow', () => {
    it('shows confirmation when delete clicked', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      const deleteBtns = screen.getAllByLabelText('Șterge');
      fireEvent.click(deleteBtns[0]);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Nu')).toBeInTheDocument();
    });

    it('cancels delete when No clicked', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      const deleteBtns = screen.getAllByLabelText('Șterge');
      fireEvent.click(deleteBtns[0]);
      fireEvent.click(screen.getByText('Nu'));
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });
  });

  describe('severity and status badges', () => {
    it('renders severity badges', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      expect(screen.getAllByText('Grav').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Minor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Critic').length).toBeGreaterThan(0);
    });

    it('renders status badges', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      expect(screen.getAllByText('Deschis').length).toBeGreaterThan(0);
      expect(screen.getAllByText('În lucru').length).toBeGreaterThan(0);
    });
  });

  describe('filtering', () => {
    it('filters by status and shows matching results', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'IN_LUCRU' } });
      await waitFor(() => {
        expect(screen.getByText('Scurgere aer')).toBeInTheDocument();
        expect(screen.queryByText('Defect display')).not.toBeInTheDocument();
      });
    });

    it('filters by severity', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      fireEvent.change(screen.getByLabelText('Severitate'), { target: { value: 'MINOR' } });
      await waitFor(() => {
        expect(screen.getByText('Scurgere aer')).toBeInTheDocument();
        expect(screen.queryByText('Defect display')).not.toBeInTheDocument();
      });
    });
  });

  describe('patient and AMDM indicators in table', () => {
    it('shows patient affected warning icon', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getAllByText('⚠️').length).toBeGreaterThan(0);
      });
    });

    it('shows AMDM reported checkmark', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getAllByText('✓').length).toBeGreaterThan(0);
      });
    });
  });

  describe('pagination', () => {
    it('shows page count and navigation', async () => {
      const manyIncidents = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1, deviceId: 1, description: `Incident ${i + 1}`, severity: 'MINOR', status: 'DESCHIS',
        occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false,
        devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
      }));
      setupApi(manyIncidents);
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Incident 1'));

      expect(screen.getByText('Pagina 1 din 2')).toBeInTheDocument();
      expect(screen.getByText('Înapoi')).toBeDisabled();
    });
  });

  describe('empty states', () => {
    it('shows empty message when no incidents', async () => {
      setupApi([]);
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => {
        expect(screen.getByText('Nu există incidente raportate. Adăugați primul incident.')).toBeInTheDocument();
      });
    });

    it('shows filtered empty message', async () => {
      setupApi([{ id: 1, deviceId: 1, description: 'X', severity: 'MINOR', status: 'DESCHIS', occurredAt: '2025-06-14T10:00:00Z', patientAffected: false, reportedToAmdm: false, devices: { name: 'V', inventoryNumber: 'I' } }]);
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('X'));

      fireEvent.change(screen.getByLabelText('Severitate'), { target: { value: 'CRITIC' } });
      await waitFor(() => {
        expect(screen.getByText('Niciun incident pentru filtrele selectate.')).toBeInTheDocument();
      });
    });
  });

  describe('edit incident', () => {
    it('opens modal in edit mode', async () => {
      renderWithProviders(<IncidentsPage />);
      await waitFor(() => screen.getByText('Defect display'));

      const editBtns = screen.getAllByLabelText('Editează');
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Editează Incident', { selector: 'h2' })).toBeInTheDocument();
      });
    });
  });
});
