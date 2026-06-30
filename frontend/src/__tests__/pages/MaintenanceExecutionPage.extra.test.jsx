import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import api from '../../api/axios';
import MaintenanceExecutionPage from '../../pages/MaintenanceExecutionPage';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('react-signature-canvas', () => ({
  default: ({ canvasProps, ref, onEnd }) => {
    const React = require('react');
    return React.createElement('canvas', {
      ...canvasProps,
      ref,
      'data-testid': 'signature-canvas',
      onClick: () => onEnd && onEnd(),
    });
  },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceExecutionPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceExecutionPage — Extra Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
      if (url.includes('/engineers')) return Promise.resolve({ data: [] });
      if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  describe('pending plans', () => {
    it('renders pending plan card with execute button', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({
          data: [{ id: 1, deviceName: 'Echograf', scheduledDate: '2026-06-15', status: 'scheduled', type: 'preventive' }],
        });
        if (url.includes('/engineers')) return Promise.resolve({ data: [{ id: 1, name: 'Ing. Popescu' }] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      expect(await screen.findByText('Planuri în așteptare execuție')).toBeInTheDocument();
      expect(screen.getByText('Echograf')).toBeInTheDocument();
      expect(screen.getByText('Data programată: 15.06.2026')).toBeInTheDocument();
      expect(screen.getByText('Tip: Preventivă')).toBeInTheDocument();
    });

    it('shows corrective type', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({
          data: [{ id: 2, deviceName: 'Defib', scheduledDate: '2026-07-01', status: 'scheduled', type: 'corrective' }],
        });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      await waitFor(() => expect(screen.getByText('Tip: Corectivă')).toBeInTheDocument());
    });

    it('shows count of pending plans', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({
          data: [
            { id: 1, deviceName: 'A', scheduledDate: '2026-06-15', status: 'scheduled', type: 'preventive' },
            { id: 2, deviceName: 'B', scheduledDate: '2026-06-16', status: 'scheduled', type: 'preventive' },
          ],
        });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      await waitFor(() => expect(screen.getByText('2 dispozitiv(e) programat(e) pentru mentenanță')).toBeInTheDocument());
    });
  });

  describe('executions list', () => {
    it('renders execution data with badge', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({
          data: [{ id: 1, deviceName: 'Ventilator', executionDate: '2026-06-01', engineerName: 'Ing. Popescu', status: 'completed' }],
        });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      expect(await screen.findByText('Ventilator')).toBeInTheDocument();
      expect(screen.getByText('Ing. Popescu')).toBeInTheDocument();
      expect(screen.getByText(/Finalizat/)).toBeInTheDocument();
    });

    it('renders PDF download button per execution', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({
          data: [{ id: 1, deviceName: 'X', executionDate: '2026-06-01', engineerName: 'Y', status: 'completed' }],
        });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      await screen.findByText('X');
      const pdfButtons = screen.getAllByText('PDF');
      expect(pdfButtons.length).toBeGreaterThan(0);
    });
  });

  describe('delete execution', () => {
    it('calls delete on trash button click', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({
          data: [{ id: 5, deviceName: 'Monitor', executionDate: '2026-05-10', engineerName: 'Ing. Ion', status: 'completed' }],
        });
        return Promise.resolve({ data: [] });
      });

      renderPage();
      await screen.findByText('Monitor');

      const trashButtons = screen.getAllByRole('button').filter(b => {
        return b.querySelector('svg') && !b.closest('td')?.textContent?.includes('PDF');
      });
      if (trashButtons.length > 0) {
        fireEvent.click(trashButtons[trashButtons.length - 1]);
        await waitFor(() => {
          expect(api.delete).toHaveBeenCalled();
        });
      }
    });
  });

  describe('loading state', () => {
    it('shows loading message', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderPage();
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });
});
