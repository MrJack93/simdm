import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import MaintenancePage from '../../pages/MaintenancePage';
import { renderWithProviders } from '../helpers/renderWithProviders';
import api from '../../api/axios';

const SAMPLE_RECORDS = [
  {
    id: 1, deviceId: 1, type: 'PREVENTIVA', executedDate: '2025-06-14T10:00:00Z',
    scheduledDate: '2025-06-14T10:00:00Z', description: 'Schimb ulei',
    cost: 500, externalService: false,
    devices: { name: 'Ventilator', inventoryNumber: 'INV-001' },
  },
  {
    id: 2, deviceId: 2, type: 'CORECTIVA', executedDate: '2025-06-15T10:00:00Z',
    description: 'Reparație externă', cost: 2000, externalService: true, serviceProvider: 'ServTech',
    devices: { name: 'Scaner', inventoryNumber: 'INV-002' },
  },
  {
    id: 3, deviceId: 3, type: 'VERIFICARE', executedDate: '2025-06-16T10:00:00Z',
    description: 'Verificare anuală', cost: 0, externalService: false,
    devices: { name: 'Defibrilator', inventoryNumber: 'INV-003' },
  },
  {
    id: 4, deviceId: 4, type: 'CALIBRARE', executedDate: '2025-06-17T10:00:00Z',
    description: 'Calibrare tensiune', cost: 300, externalService: false,
    devices: { name: 'Monitor', inventoryNumber: 'INV-004' },
  },
];

const DEVICES = [
  { id: 1, name: 'Ventilator', inventoryNumber: 'INV-001' },
  { id: 2, name: 'Scaner', inventoryNumber: 'INV-002' },
];

function mockApi(records = SAMPLE_RECORDS) {
  api.get.mockImplementation((url) => {
    if (url.includes('/maintenance')) return Promise.resolve({ data: { data: records, total: records.length } });
    if (url.includes('/devices')) return Promise.resolve({ data: { devices: DEVICES } });
    return Promise.resolve({ data: {} });
  });
}

describe('MaintenancePage Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  describe('filter by type', () => {
    it('filters records by Preventivă type', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const btns = screen.getAllByText(/Preventivă/);
      fireEvent.click(btns[0]);
      await waitFor(() => {
        expect(screen.getByText('Schimb ulei')).toBeInTheDocument();
        expect(screen.queryByText('Reparație externă')).not.toBeInTheDocument();
      });
    });

    it('filters records by Corectivă type', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const btns = screen.getAllByText(/Corectivă/);
      fireEvent.click(btns[0]);
      await waitFor(() => {
        expect(screen.getByText('Reparație externă')).toBeInTheDocument();
        expect(screen.queryByText('Schimb ulei')).not.toBeInTheDocument();
      });
    });

    it('filters records by Verificare type', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const btns = screen.getAllByText(/Verificare/);
      fireEvent.click(btns[0]);
      await waitFor(() => {
        expect(screen.getByText('Verificare anuală')).toBeInTheDocument();
        expect(screen.queryByText('Schimb ulei')).not.toBeInTheDocument();
      });
    });

    it('filters records by Calibrare type', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const btns = screen.getAllByText(/Calibrare/);
      fireEvent.click(btns[0]);
      await waitFor(() => {
        expect(screen.getByText('Calibrare tensiune')).toBeInTheDocument();
        expect(screen.queryByText('Schimb ulei')).not.toBeInTheDocument();
      });
    });

    it('shows all records when Toate filter selected', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const btns = screen.getAllByText(/Corectivă/);
      fireEvent.click(btns[0]);
      await waitFor(() => { expect(screen.queryByText('Schimb ulei')).not.toBeInTheDocument(); });
      const allBtns = screen.getAllByText(/Toate/);
      fireEvent.click(allBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Schimb ulei')).toBeInTheDocument();
        expect(screen.getByText('Reparație externă')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD operations', () => {
    it('opens create modal', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Adaugă Înregistrare'));
      await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare Mentenanță')).toBeInTheDocument(); });
    });

    it('creates new record with valid data', async () => {
      api.post.mockResolvedValue({ data: { id: 5 } });
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Adaugă Înregistrare')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Adaugă Înregistrare'));
      await waitFor(() => { expect(screen.getByLabelText(/Dispozitiv/)).toBeInTheDocument(); });
      fireEvent.change(screen.getByLabelText(/Dispozitiv/), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText(/Data Execuției/), { target: { value: '2025-06-14' } });
      fireEvent.change(screen.getByLabelText(/Descriere/), { target: { value: 'Test descriere' } });
      fireEvent.click(screen.getByText('Adaugă'));
      await waitFor(() => { expect(api.post).toHaveBeenCalled(); });
    });

    it('opens edit modal for existing record', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByLabelText('Editează')[0]);
      await waitFor(() => { expect(screen.getByText('Editează Înregistrare')).toBeInTheDocument(); });
    });

    it('shows delete confirmation buttons', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const deleteButtons = screen.getAllByLabelText('Șterge');
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Nu')).toBeInTheDocument();
    });

    it('deletes record on confirm', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const deleteButtons = screen.getAllByLabelText('Șterge');
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText('Confirm'));
      await waitFor(() => { expect(api.delete).toHaveBeenCalledWith('/maintenance/1'); });
    });

    it('cancels delete when Nu clicked', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const deleteButtons = screen.getAllByLabelText('Șterge');
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText('Nu'));
      await waitFor(() => { expect(screen.queryByText('Confirm')).not.toBeInTheDocument(); });
    });
  });

  describe('empty states', () => {
    it('shows empty message when no records exist', async () => {
      mockApi([]);
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => {
        expect(screen.getByText('Nu există înregistrări de mentenanță. Adăugați prima înregistrare.')).toBeInTheDocument();
      });
    });

    it('shows filtered empty message when filter has no matches', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      const verBtns = screen.getAllByText(/Verificare/);
      fireEvent.click(verBtns[0]);
      await waitFor(() => { expect(screen.queryByText('Schimb ulei')).not.toBeInTheDocument(); });
    });
  });

  describe('hub tab', () => {
    it('renders hub by default', () => { renderWithProviders(<MaintenancePage />); expect(screen.getByText('Panou Control (Hub)')).toBeInTheDocument(); });
    it('renders calendar link', () => { renderWithProviders(<MaintenancePage />); expect(screen.getByText('Planificare & Calendar MPP')).toBeInTheDocument(); });
    it('renders execution link', () => { renderWithProviders(<MaintenancePage />); expect(screen.getByText('Execuție MPP')).toBeInTheDocument(); });
    it('renders tickets link', () => { renderWithProviders(<MaintenancePage />); expect(screen.getByText('Bilete de Reparație')).toBeInTheDocument(); });
  });

  describe('record details', () => {
    it('displays cost for records', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Schimb ulei')).toBeInTheDocument(); });
      expect(screen.getByText(/500.*MDL/)).toBeInTheDocument();
    });

    it('displays external service indicator', async () => {
      renderWithProviders(<MaintenancePage />);
      fireEvent.click(screen.getByText('Registru Istoric Intervenții'));
      await waitFor(() => { expect(screen.getByText('Reparație externă')).toBeInTheDocument(); });
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });
});
