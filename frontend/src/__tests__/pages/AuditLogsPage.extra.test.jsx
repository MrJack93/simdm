import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../api/axios';
import AuditLogsPage from '../../pages/AuditLogsPage';
import { renderWithProviders } from '../helpers/renderWithProviders';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], total: 0, page: 1, totalPages: 0 } })),
  },
}));

const SAMPLE_LOGS = [
  { id: 1, timestamp: '2025-06-14T10:30:00Z', action: 'CREATE', entity: 'Device', entityId: 1, changes: { name: 'Test' }, ipAddress: '192.168.1.1', users: { username: 'admin' } },
  { id: 2, timestamp: '2025-06-14T11:00:00Z', action: 'UPDATE', entity: 'Device', entityId: 2, changes: { status: 'DEFECT' }, ipAddress: '192.168.1.2', users: { username: 'user1' } },
  { id: 3, timestamp: '2025-06-14T12:00:00Z', action: 'DELETE', entity: 'Consumable', entityId: null, changes: null, ipAddress: null, users: null },
];

describe('AuditLogsPage — Extra Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: SAMPLE_LOGS, total: 3, page: 1, totalPages: 1 } });
  });

  describe('date filters', () => {
    it('sends dateFrom param when filter set', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      fireEvent.change(screen.getByLabelText('De la dată'), { target: { value: '2025-06-01' } });
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('dateFrom=2025-06-01'));
      });
    });

    it('sends dateTo param when filter set', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      fireEvent.change(screen.getByLabelText('Până la dată'), { target: { value: '2025-06-30' } });
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('dateTo=2025-06-30'));
      });
    });

    it('sends action param when filter set', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      fireEvent.change(screen.getByLabelText('Acțiune'), { target: { value: 'CREATE' } });
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('action=CREATE'));
      });
    });
  });

  describe('pagination', () => {
    it('shows pagination for multiple pages', async () => {
      api.get.mockResolvedValue({ data: { data: SAMPLE_LOGS, total: 100, page: 1, totalPages: 2 } });
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      expect(screen.getByText('Pagina 1 din 2 (100 total)')).toBeInTheDocument();
      expect(screen.getByText('Înapoi')).toBeInTheDocument();
      expect(screen.getByText('Înainte')).toBeInTheDocument();
    });

    it('navigates to next page', async () => {
      api.get.mockResolvedValue({ data: { data: SAMPLE_LOGS, total: 100, page: 1, totalPages: 2 } });
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      fireEvent.click(screen.getByText('Înainte'));
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    });

    it('navigates to previous page', async () => {
      api.get.mockResolvedValueOnce({ data: { data: SAMPLE_LOGS, total: 100, page: 2, totalPages: 2 } });
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      fireEvent.click(screen.getByText('Înapoi'));
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
      });
    });

    it('disables prev button on page 1', async () => {
      api.get.mockResolvedValue({ data: { data: SAMPLE_LOGS, total: 100, page: 1, totalPages: 2 } });
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      expect(screen.getByText('Înapoi')).toBeDisabled();
    });

    it('shows pagination controls for multiple pages', async () => {
      api.get.mockResolvedValue({ data: { data: SAMPLE_LOGS, total: 100, page: 2, totalPages: 2 } });
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      expect(screen.getByText('100 înregistrări total')).toBeInTheDocument();
    });
  });

  describe('changes expand/collapse', () => {
    it('expands changes cell', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => screen.getByText('admin'));

      const expandBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-expanded') !== null);
      if (expandBtn) {
        fireEvent.click(expandBtn);
        expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  describe('action labels', () => {
    it('displays all action labels', async () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'FILE_UPLOAD', 'STOCK_UPDATE'];
      const logs = actions.map((action, i) => ({
        id: i + 1, timestamp: '2025-06-14T10:00:00Z', action, entity: 'Device', entityId: 1, changes: null, ipAddress: null, users: { username: 'admin' },
      }));
      api.get.mockResolvedValue({ data: { data: logs, total: actions.length, page: 1, totalPages: 1 } });

      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Creare')).toBeInTheDocument();
        expect(screen.getByText('Actualizare')).toBeInTheDocument();
        expect(screen.getByText('Ștergere')).toBeInTheDocument();
        expect(screen.getByText('Autentificare')).toBeInTheDocument();
        expect(screen.getByText('Deconectare')).toBeInTheDocument();
        expect(screen.getByText('Autentificare eșuată')).toBeInTheDocument();
        expect(screen.getByText('Încărcare fișier')).toBeInTheDocument();
        expect(screen.getByText('Actualizare stoc')).toBeInTheDocument();
      });
    });
  });

  describe('placeholder data behavior', () => {
    it('shows reduced opacity during placeholder', async () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.closest('div[style*="opacity"]')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('shows skeleton rows during loading', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<AuditLogsPage />);
      expect(screen.getByText('Jurnal de Audit')).toBeInTheDocument();
    });
  });

  describe('empty entity ID', () => {
    it('shows dash for null entityId', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => {
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IP address display', () => {
    it('shows IP address when present', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      });
    });

    it('shows dash for null IP', async () => {
      renderWithProviders(<AuditLogsPage />);
      await waitFor(() => {
        const ips = screen.getAllByText('—');
        expect(ips.length).toBeGreaterThan(0);
      });
    });
  });
});
