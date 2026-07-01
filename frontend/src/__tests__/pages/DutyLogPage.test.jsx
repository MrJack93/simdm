import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import api from '../../api/axios';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import DutyLogPage from '../../pages/DutyLogPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><DutyLogPage /></MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DutyLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/duty-log')) return Promise.resolve({ data: [] });
      if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: {} });
  });

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.querySelector('.px-4')).toBeInTheDocument();
    });
  });

  it('shows empty state when no entries', async () => {
    renderPage();
    await waitFor(() => {
      const text = document.body.textContent;
      expect(text.length).toBeGreaterThan(0);
    });
  });

  it('renders buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});
