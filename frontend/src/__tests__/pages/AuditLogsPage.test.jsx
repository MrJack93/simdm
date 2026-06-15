import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [], total: 0, page: 1, totalPages: 0 } })),
  },
}));

import AuditLogsPage from '../../pages/AuditLogsPage';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      },
    });
  });

  it('renders page heading', async () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByText('Jurnal de Audit')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByText('Se încarcă…')).toBeInTheDocument();
  });

  it('renders filter inputs', async () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByLabelText('Entitate')).toBeInTheDocument();
    expect(screen.getByLabelText('Acțiune')).toBeInTheDocument();
    expect(screen.getByLabelText('De la dată')).toBeInTheDocument();
    expect(screen.getByLabelText('Până la dată')).toBeInTheDocument();
  });

  it('renders export CSV button', () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('shows empty message when no logs', async () => {
    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nu există înregistrări pentru filtrele selectate')).toBeInTheDocument();
    });
  });

  it('renders table headers', () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByText('Data/Ora')).toBeInTheDocument();
    expect(screen.getByText('Utilizator')).toBeInTheDocument();
    expect(screen.getAllByText('Acțiune').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Entitate').length).toBeGreaterThan(0);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Modificări')).toBeInTheDocument();
    expect(screen.getByText('IP')).toBeInTheDocument();
  });

  it('renders log entries when data is available', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            timestamp: '2025-06-14T10:30:00Z',
            action: 'CREATE',
            entity: 'Device',
            entityId: 42,
            changes: { name: 'Test Device' },
            ipAddress: '192.168.1.1',
            users: { username: 'admin' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
    expect(screen.getByText('Device')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows "sistem" for null user', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 2,
            timestamp: '2025-06-14T11:00:00Z',
            action: 'LOGIN',
            entity: 'User',
            entityId: null,
            changes: null,
            ipAddress: '10.0.0.1',
            users: null,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('sistem')).toBeInTheDocument();
    });
  });

  it('displays action labels', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 3,
            timestamp: '2025-06-14T12:00:00Z',
            action: 'CREATE',
            entity: 'Device',
            entityId: 1,
            changes: null,
            ipAddress: null,
            users: { username: 'admin' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Creare')).toBeInTheDocument();
    });
  });

  it('shows dash for entityId when null', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 4,
            timestamp: '2025-06-14T13:00:00Z',
            action: 'DELETE',
            entity: 'Device',
            entityId: null,
            changes: null,
            ipAddress: null,
            users: { username: 'admin' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('handles CSV export success', async () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    api.get.mockResolvedValueOnce({ data: mockBlob });

    renderWithProviders(<AuditLogsPage />);
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Fișier CSV descărcat');
    });
  });

  it('handles CSV export error', async () => {
    renderWithProviders(<AuditLogsPage />);
    await screen.findByText('Nu există înregistrări pentru filtrele selectate');
    api.get.mockRejectedValueOnce(new Error('Network error'));
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la exportul CSV');
    });
  });

  it('does not show pagination for single page', async () => {
    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.queryByText('Înapoi')).not.toBeInTheDocument();
    });
  });

  it('shows pagination for multiple pages', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          timestamp: '2025-06-14T10:00:00Z',
          action: 'CREATE',
          entity: 'Device',
          entityId: i,
          changes: null,
          ipAddress: null,
          users: { username: 'admin' },
        })),
        total: 100,
        page: 1,
        totalPages: 2,
      },
    });

    renderWithProviders(<AuditLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Pagina 1 din 2 (100 total)')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /înapoi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /înainte/i })).toBeInTheDocument();
  });

  it('handles filter change and resets page', async () => {
    renderWithProviders(<AuditLogsPage />);
    fireEvent.change(screen.getByLabelText('Entitate'), { target: { value: 'Device' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('entity=Device')
      );
    });
  });
});
