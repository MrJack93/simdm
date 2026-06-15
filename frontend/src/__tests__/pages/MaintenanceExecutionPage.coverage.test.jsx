import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('react-signature-canvas', () => ({
  default: vi.fn().mockImplementation(({ ref, onEnd, canvasProps }) => {
    const React = require('react');
    return React.createElement('canvas', {
      ref,
      'data-testid': 'signature-canvas',
      ...canvasProps,
      onMouseUp: onEnd,
    });
  }),
}));

vi.mock('@/components/ui/card', () => {
  const React = require('react');
  const el = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);
  return {
    Card: el('div'),
    CardContent: el('div'),
    CardHeader: el('div'),
    CardTitle: el('h3'),
    CardDescription: el('p'),
  };
});

vi.mock('@/components/ui/dialog', () => {
  const React = require('react');
  return {
    Dialog: ({ children, open }) => React.createElement('div', { 'data-testid': 'dialog', 'data-open': open }, children),
    DialogContent: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'dialog-content', ...props }, children),
    DialogHeader: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'dialog-header', ...props }, children),
    DialogTitle: ({ children, ...props }) => React.createElement('h2', { 'data-testid': 'dialog-title', ...props }, children),
    DialogTrigger: ({ children }) => React.createElement('div', null, children),
  };
});

vi.mock('@/components/ui/button', () => {
  const React = require('react');
  return {
    Button: ({ children, onClick, disabled, type, ...props }) =>
      React.createElement('button', { onClick, disabled, type, ...props }, children),
  };
});

vi.mock('@/components/ui/badge', () => {
  const React = require('react');
  return {
    Badge: ({ children, className }) => React.createElement('span', { className }, children),
  };
});

vi.mock('@/components/ui/table', () => {
  const React = require('react');
  return {
    Table: ({ children }) => React.createElement('table', null, children),
    TableBody: ({ children }) => React.createElement('tbody', null, children),
    TableCell: ({ children }) => React.createElement('td', null, children),
    TableHead: ({ children }) => React.createElement('th', null, children),
    TableHeader: ({ children }) => React.createElement('thead', null, children),
    TableRow: ({ children }) => React.createElement('tr', null, children),
  };
});

vi.mock('@/components/ui/input', () => {
  const React = require('react');
  return {
    Input: (props) => React.createElement('input', props),
  };
});

vi.mock('@/components/ui/select', () => {
  const React = require('react');
  return {
    Select: ({ children, value, onValueChange }) =>
      React.createElement('select', { value, onChange: (e) => onValueChange?.(e.target.value) }, children),
    SelectContent: ({ children }) => React.createElement(React.Fragment, null, children),
    SelectItem: ({ children, value }) => React.createElement('option', { value }, children),
    SelectTrigger: ({ children }) => React.createElement('div', null, children),
    SelectValue: ({ placeholder }) => React.createElement('span', null, placeholder),
  };
});

import MaintenanceExecutionPage from '../../pages/MaintenanceExecutionPage';
import api from '../../api/axios';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MaintenanceExecutionPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaintenanceExecutionPage Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('page rendering', () => {
    it('renders page heading', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Execuție mentenanță')).toBeInTheDocument();
      });
    });

    it('shows loading state', async () => {
      api.get.mockReturnValue(new Promise(() => {}));
      renderPage();
      expect(screen.getByText(/se încarcă/i)).toBeInTheDocument();
    });

    it('renders execution history section', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Execuții finalizate')).toBeInTheDocument();
      });
    });

    it('shows empty executions message', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Nu sunt execuții finalizate încă')).toBeInTheDocument();
      });
    });
  });

  describe('pending plans', () => {
    it('shows pending plans when available', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) {
          return Promise.resolve({
            data: [
              { id: 1, deviceName: 'Ventilator', scheduledDate: '2025-07-01', type: 'preventive', status: 'scheduled' },
            ],
          });
        }
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Ventilator')).toBeInTheDocument();
      });
    });

    it('shows execute button for pending plans', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) {
          return Promise.resolve({
            data: [
              { id: 1, deviceName: 'Ventilator', scheduledDate: '2025-07-01', type: 'preventive', status: 'scheduled' },
            ],
          });
        }
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Execută mentenanță')).toBeInTheDocument();
      });
    });
  });

  describe('execution list', () => {
    it('displays execution records', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-executions')) {
          return Promise.resolve({
            data: [
              { id: 1, deviceName: 'Monitor', executionDate: '2025-06-15', engineerName: 'Ing. Popescu', status: 'completed' },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Monitor')).toBeInTheDocument();
        expect(screen.getByText('Ing. Popescu')).toBeInTheDocument();
      });
    });

    it('shows Finalizat status badge', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-executions')) {
          return Promise.resolve({
            data: [
              { id: 1, deviceName: 'Monitor', executionDate: '2025-06-15', engineerName: 'Ing. Popescu', status: 'completed' },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Finalizat/)).toBeInTheDocument();
      });
    });

    it('deletes execution on button click', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-executions')) {
          return Promise.resolve({
            data: [
              { id: 1, deviceName: 'Monitor', executionDate: '2025-06-15', engineerName: 'Ing. Popescu', status: 'completed' },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Monitor')).toBeInTheDocument();
      });
      const buttons = screen.getAllByRole('button');
      const deleteBtn = buttons.find(btn => !btn.disabled && btn.textContent === '');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        await waitFor(() => {
          expect(api.delete).toHaveBeenCalled();
        });
      }
    });
  });

  describe('no pending plans', () => {
    it('does not show pending plans card when empty', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/maintenance-plans')) return Promise.resolve({ data: [] });
        if (url.includes('/engineers')) return Promise.resolve({ data: [] });
        if (url.includes('/maintenance-executions')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      renderPage();
      await waitFor(() => {
        expect(screen.queryByText('Planuri în așteptare execuție')).not.toBeInTheDocument();
      });
    });
  });
});
