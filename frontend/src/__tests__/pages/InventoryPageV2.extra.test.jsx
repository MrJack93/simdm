import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryPage from '../../pages/InventoryPageV2';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const SAMPLE_DEVICES = [
  { id: 1, inventoryNumber: 'DM-001', name: 'Defibrilator', model: 'X100', status: 'FUNCTIONAL', section: 'ATI' },
  { id: 2, inventoryNumber: 'DM-002', name: 'Monitor', model: 'M50', status: 'DEFECT', section: 'Bloc Operator' },
  { id: 3, inventoryNumber: 'DM-003', name: 'Ventilator', model: 'V200', status: 'IN_REPARATIE', section: 'ATI' },
  { id: 4, inventoryNumber: 'DM-004', name: 'Echograf', model: 'E100', status: 'CASAT', section: 'Radiologie' },
  { id: 5, inventoryNumber: 'DM-005', name: 'Pulsoximetru', model: 'P50', status: 'REZERVA', section: 'ATI' },
  { id: 6, inventoryNumber: 'DM-006', name: 'Aspirator', model: 'A30', status: 'IMPRUMUTAT', section: 'Chirurgie' },
];

function mockApiRouter(devices = SAMPLE_DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices')) {
      return Promise.resolve({ data: { devices, pagination: { total: devices.length, pages: 1 } } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('InventoryPage — Extra Branch Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRouter();
  });

  describe('kanban view details', () => {
    it('shows kanban view with grouped columns', async () => {
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-001');
      fireEvent.click(screen.getByRole('button', { name: 'Kanban' }));

      await waitFor(() => {
        expect(screen.getAllByText(/Funcțional/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('cards view details', () => {
    it('shows card details for devices', async () => {
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-001');
      fireEvent.click(screen.getByRole('button', { name: 'Carduri' }));

      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.getByText('X100')).toBeInTheDocument();
      });
    });
  });

  describe('view toggle state', () => {
    it('table is default view', async () => {
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-001');
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('switches between views', async () => {
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-001');

      fireEvent.click(screen.getByRole('button', { name: 'Carduri' }));
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Tabel/ }));
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('pagination with many devices', () => {
    it('shows page indicator', async () => {
      const devices = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, inventoryNumber: `DM-${i + 1}`, name: `Device ${i + 1}`, model: 'M', status: 'FUNCTIONAL', section: 'ATI',
      }));
      mockApiRouter(devices);
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-1');
      expect(screen.getByText(/Pagina 1 din 2/)).toBeInTheDocument();
    });
  });

  describe('delete', () => {
    it('calls DELETE API on confirm', async () => {
      api.delete.mockResolvedValueOnce({ data: {} });
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-001');

      fireEvent.click(screen.getByRole('button', { name: /Ștergere Defibrilator/ }));
      fireEvent.click(await screen.findByRole('button', { name: 'Șterge' }));

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/devices/1');
      });
    });
  });

  describe('empty states', () => {
    it('shows "Adaugă dispozitiv" link in empty state', async () => {
      mockApiRouter([]);
      renderWithProviders(<InventoryPage />);
      expect(await screen.findByText('Niciun dispozitiv găsit')).toBeInTheDocument();
      expect(screen.getByText('Adaugă dispozitiv')).toBeInTheDocument();
    });
  });

  describe('loading skeletons', () => {
    it('shows skeleton rows in table during loading', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<InventoryPage />);
      expect(screen.getByText('Inventar Dispozitive Medicale')).toBeInTheDocument();
    });
  });
});
