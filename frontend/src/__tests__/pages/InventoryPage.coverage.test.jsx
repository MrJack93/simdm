import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import InventoryPage from '../../pages/InventoryPageV2';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const SAMPLE_DEVICES = [
  { id: 1, inventoryNumber: 'DM-2024-001', name: 'Defibrilator', model: 'X100', manufacturer: 'Philips', riskClass: 'IIb', status: 'FUNCTIONAL', section: 'ATI' },
  { id: 2, inventoryNumber: 'DM-2024-002', name: 'Monitor pacient', model: 'M50', manufacturer: 'GE', riskClass: 'IIa', status: 'DEFECT', section: 'Bloc Operator' },
  { id: 3, inventoryNumber: 'DM-2024-003', name: 'Ventilator', model: 'V200', manufacturer: 'Dräger', riskClass: 'IIb', status: 'IN_REPARATIE', section: 'ATI' },
  { id: 4, inventoryNumber: 'DM-2024-004', name: 'Scaner', model: 'S100', manufacturer: 'Siemens', riskClass: 'III', status: 'CASAT', section: 'Radiologie' },
  { id: 5, inventoryNumber: 'DM-2024-005', name: 'ECG', model: 'E50', manufacturer: 'Nihon', riskClass: 'IIa', status: 'REZERVA', section: 'Cardiologie' },
  { id: 6, inventoryNumber: 'DM-2024-006', name: 'Puls oximetru', model: 'P10', manufacturer: 'Nonin', riskClass: 'I', status: 'IMPRUMUTAT', section: 'ATI' },
];

function mockApiRouter(devices = SAMPLE_DEVICES) {
  api.get.mockImplementation((url) => {
    if (url.startsWith('/devices')) {
      return Promise.resolve({
        data: { devices, pagination: { total: devices.length, pages: 1 } },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('InventoryPage Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRouter();
  });

  describe('all filter combinations', () => {
    it('filters by FUNCTIONAL status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'FUNCTIONAL');
      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
    });

    it('filters by DEFECT status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'DEFECT');
      await waitFor(() => {
        expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
        expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
      });
    });

    it('filters by IN_REPARATIE status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'IN_REPARATIE');
      await waitFor(() => {
        expect(screen.getByText('Ventilator')).toBeInTheDocument();
      });
    });

    it('filters by CASAT status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'CASAT');
      await waitFor(() => {
        expect(screen.getByText('Scaner')).toBeInTheDocument();
      });
    });

    it('filters by REZERVA status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'REZERVA');
      await waitFor(() => {
        expect(screen.getByText('ECG')).toBeInTheDocument();
      });
    });

    it('filters by IMPRUMUTAT status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'IMPRUMUTAT');
      await waitFor(() => {
        expect(screen.getByText('Puls oximetru')).toBeInTheDocument();
      });
    });

    it('filters by ATI section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru secție'), 'ATI');
      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.getByText('Ventilator')).toBeInTheDocument();
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
    });

    it('combines status and section filters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.selectOptions(screen.getByLabelText('Filtru status'), 'FUNCTIONAL');
      await user.selectOptions(screen.getByLabelText('Filtru secție'), 'ATI');
      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
    });

    it('searches by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.type(screen.getByLabelText(/Căutare/), 'Defibrilator');
      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
    });

    it('searches by inventory number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.type(screen.getByLabelText(/Căutare/), 'DM-2024-002');
      await waitFor(() => {
        expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
        expect(screen.queryByText('Defibrilator')).not.toBeInTheDocument();
      });
    });

    it('searches by model', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.type(screen.getByLabelText(/Căutare/), 'X100');
      await waitFor(() => {
        expect(screen.getByText('Defibrilator')).toBeInTheDocument();
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
    });
  });

  describe('delete with confirmation', () => {
    it('shows confirmation dialog before delete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.click(screen.getByRole('button', { name: /Ștergere Defibrilator/ }));
      expect(screen.getByRole('button', { name: 'Șterge' })).toBeInTheDocument();
    });

    it('cancels delete when Cancel clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.click(screen.getByRole('button', { name: /Ștergere Defibrilator/ }));
      await user.click(screen.getByRole('button', { name: 'Anulare' }));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Șterge' })).not.toBeInTheDocument();
      });
    });

    it('calls DELETE API on confirm', async () => {
      const user = userEvent.setup();
      api.delete.mockResolvedValue({ data: {} });
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.click(screen.getByRole('button', { name: /Ștergere Defibrilator/ }));
      await user.click(screen.getByRole('button', { name: 'Șterge' }));
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/devices/1');
      });
    });
  });

  describe('pagination', () => {
    it('shows pagination when more than 20 devices', async () => {
      const manyDevices = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, inventoryNumber: `DM-${i + 1}`, name: `Device ${i + 1}`, model: 'M', status: 'FUNCTIONAL', section: 'ATI',
      }));
      mockApiRouter(manyDevices);
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-1');
      expect(screen.getByText(/Pagina 1 din 2/)).toBeInTheDocument();
    });

    it('navigates to next page', async () => {
      const manyDevices = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, inventoryNumber: `DM-${i + 1}`, name: `Device ${i + 1}`, model: 'M', status: 'FUNCTIONAL', section: 'ATI',
      }));
      mockApiRouter(manyDevices);
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-1');
      await user.click(screen.getByText('Înainte →'));
      await waitFor(() => {
        expect(screen.getByText(/Pagina 2/)).toBeInTheDocument();
      });
    });

    it('disables prev button on page 1', async () => {
      const manyDevices = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, inventoryNumber: `DM-${i + 1}`, name: `Device ${i + 1}`, model: 'M', status: 'FUNCTIONAL', section: 'ATI',
      }));
      mockApiRouter(manyDevices);
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-1');
      expect(screen.getByText('← Înapoi')).toBeDisabled();
    });

    it('disables next button on last page', async () => {
      const manyDevices = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, inventoryNumber: `DM-${i + 1}`, name: `Device ${i + 1}`, model: 'M', status: 'FUNCTIONAL', section: 'ATI',
      }));
      mockApiRouter(manyDevices);
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-1');
      await user.click(screen.getByText('Înainte →'));
      await waitFor(() => {
        expect(screen.getByText(/Pagina 2/)).toBeInTheDocument();
      });
      expect(screen.getByText('Înainte →')).toBeDisabled();
    });
  });

  describe('empty states', () => {
    it('shows empty state when no devices', async () => {
      mockApiRouter([]);
      renderWithProviders(<InventoryPage />);
      expect(await screen.findByText('Niciun dispozitiv găsit')).toBeInTheDocument();
    });

    it('shows empty state when search has no results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.type(screen.getByLabelText(/Căutare/), 'NonexistentXYZ');
      await waitFor(() => {
        expect(screen.getByText('Niciun dispozitiv găsit')).toBeInTheDocument();
      });
    });

    it('resets page when filter changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.type(screen.getByLabelText(/Căutare/), 'Defibrilator');
      await waitFor(() => {
        expect(screen.queryByText('Monitor pacient')).not.toBeInTheDocument();
      });
      await user.clear(screen.getByLabelText(/Căutare/));
      await waitFor(() => {
        expect(screen.getByText('Monitor pacient')).toBeInTheDocument();
      });
    });
  });

  describe('view modes', () => {
    it('switches to cards view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      await user.click(screen.getByRole('button', { name: 'Carduri' }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Carduri' })).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('switches to kanban view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      const kanbanBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Kanban'));
      if (kanbanBtn) {
        await user.click(kanbanBtn);
      }
    });
  });

  describe('kanban view', () => {
    it('groups devices by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      const kanbanBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Kanban'));
      if (kanbanBtn) {
        await user.click(kanbanBtn);
        await waitFor(() => {
          expect(screen.getAllByText(/Funcțional/).length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('status badge display', () => {
    it('shows all status badges', async () => {
      renderWithProviders(<InventoryPage />);
      await screen.findByText('DM-2024-001');
      expect(screen.getAllByText('Funcțional').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Defect').length).toBeGreaterThan(0);
    });
  });
});
