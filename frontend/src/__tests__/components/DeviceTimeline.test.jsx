import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  },
}));

import DeviceTimeline from '../../components/DeviceTimeline';
import api from '../../api/axios';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('DeviceTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no deviceId', () => {
    const { container } = renderWithProviders(<DeviceTimeline />);
    expect(container.innerHTML).toBe('');
  });

  it('renders timeline heading when deviceId provided', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    expect(screen.getByText('Istoric Modificări')).toBeInTheDocument();
  });

  it('shows empty message when no logs', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Nu există înregistrări în jurnal pentru acest dispozitiv.')).toBeInTheDocument();
    });
  });

  it('shows log count', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1 }] } });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('1 intrări')).toBeInTheDocument();
    });
  });

  it('renders log entries with CREATE action', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          action: 'CREATE',
          timestamp: '2025-06-14T10:00:00Z',
          changes: { name: 'Ventilator' },
          users: { username: 'admin' },
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Creat')).toBeInTheDocument();
    });
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('renders UPDATE action', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 2,
          action: 'UPDATE',
          timestamp: '2025-06-14T11:00:00Z',
          changes: { status: 'DEFECT' },
          users: { username: 'bioinginer' },
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Actualizat')).toBeInTheDocument();
    });
  });

  it('renders DELETE action', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 3,
          action: 'DELETE',
          timestamp: '2025-06-14T12:00:00Z',
          changes: null,
          users: null,
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Șters')).toBeInTheDocument();
    });
  });

  it('renders FILE_UPLOAD action', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 4,
          action: 'FILE_UPLOAD',
          timestamp: '2025-06-14T13:00:00Z',
          changes: { fileName: 'cert.pdf' },
          users: { username: 'admin' },
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Fișier încărcat')).toBeInTheDocument();
    });
  });

  it('shows changes list when changes present', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 5,
          action: 'UPDATE',
          timestamp: '2025-06-14T14:00:00Z',
          changes: { name: 'New Name', status: 'FUNCTIONAL' },
          users: { username: 'admin' },
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/name:/)).toBeInTheDocument();
    });
  });

  it('filters out updatedAt and createdAt from changes', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 6,
          action: 'UPDATE',
          timestamp: '2025-06-14T15:00:00Z',
          changes: { name: 'Test', updatedAt: '2025-06-14', createdAt: '2025-06-01' },
          users: { username: 'admin' },
        }],
      },
    });
    renderWithProviders(<DeviceTimeline deviceId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/name:/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/updatedAt/)).not.toBeInTheDocument();
    expect(screen.queryByText(/createdAt/)).not.toBeInTheDocument();
  });
});
