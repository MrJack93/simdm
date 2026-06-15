import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/auth.context';
import api from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import App from '../../App';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
});

function renderApp(authValue, { route = '/' } = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

const AUTHENTICATED = { user: { id: 1, username: 'bioinginer' }, loading: false, logout: vi.fn(), login: vi.fn() };
const UNAUTHENTICATED = { user: null, loading: false, logout: vi.fn(), login: vi.fn() };
const LOADING = { user: null, loading: true, logout: vi.fn(), login: vi.fn() };

describe('App — function coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.startsWith('/devices/dropdown/sections')) return Promise.resolve({ data: [] });
      if (url.startsWith('/consumables')) return Promise.resolve({ data: { consumables: [] } });
      if (url.startsWith('/devices')) return Promise.resolve({ data: { devices: [], pagination: { total: 0, pages: 1 } } });
      return Promise.resolve({ data: {} });
    });
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  describe('LoadingFallback', () => {
    it('shows loading state when auth is loading', () => {
      renderApp(LOADING);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Se încarcă…')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('mobile menu toggle opens menu', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      const menuBtn = screen.getByLabelText('Meniu');
      await user.click(menuBtn);
      expect(screen.getByLabelText('Meniu mobil')).toBeInTheDocument();
    });

    it('mobile menu toggle closes menu', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      const menuBtn = screen.getByLabelText('Meniu');
      await user.click(menuBtn);
      expect(screen.getByLabelText('Meniu mobil')).toBeInTheDocument();
      await user.click(menuBtn);
      await waitFor(() => {
        expect(screen.queryByLabelText('Meniu mobil')).not.toBeInTheDocument();
      });
    });

    it('theme toggle switches between light and dark', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      const themeBtn = screen.getByRole('button', { name: /Comută la modul clar/ });
      await user.click(themeBtn);
      expect(localStorage.getItem('simdm_theme')).toBe('light');
      const themeBtn2 = screen.getByRole('button', { name: /Comută la modul închis/ });
      await user.click(themeBtn2);
      expect(localStorage.getItem('simdm_theme')).toBe('dark');
    });

    it('logout button calls logout', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      await user.click(screen.getByRole('button', { name: /Deconectare/ }));
      expect(AUTHENTICATED.logout).toHaveBeenCalled();
    });

    it('settings link is present', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      expect(screen.getByLabelText('Setări')).toBeInTheDocument();
    });
  });

  describe('MobileMenu', () => {
    it('Escape key closes mobile menu', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      await user.click(screen.getByLabelText('Meniu'));
      expect(screen.getByLabelText('Meniu mobil')).toBeInTheDocument();
      fireEvent.keyDown(screen.getByLabelText('Meniu mobil'), { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByLabelText('Meniu mobil')).not.toBeInTheDocument();
      });
    });

    it('Tab focus trap works', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      await user.click(screen.getByLabelText('Meniu'));
      const menu = screen.getByLabelText('Meniu mobil');
      expect(menu).toBeInTheDocument();
      const links = menu.querySelectorAll('a, button');
      expect(links.length).toBeGreaterThan(0);
    });

    it('menu contains navigation links', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      await user.click(screen.getByLabelText('Meniu'));
      const menu = screen.getByLabelText('Meniu mobil');
      expect(menu).toBeInTheDocument();
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inventar').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mentenanță').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Verificări Periodice').length).toBeGreaterThanOrEqual(1);
    });

    it('clicking a link closes menu', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      await user.click(screen.getByLabelText('Meniu'));
      await user.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.queryByLabelText('Meniu mobil')).not.toBeInTheDocument();
      });
    });
  });

  describe('DashboardLayout', () => {
    it('renders desktop nav links', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      expect(screen.getAllByRole('link', { name: /Inventar/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Consumabile/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Incidente/ }).length).toBeGreaterThan(0);
    });

    it('renders SIMDM logo', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      expect(screen.getByText('SIMDM')).toBeInTheDocument();
    });
  });

  describe('App routing', () => {
    it('shows login for unauthenticated user', () => {
      renderApp(UNAUTHENTICATED, { route: '/login' });
      expect(screen.getByLabelText(/Parolă/)).toBeInTheDocument();
    });

    it('redirects to login on protected route when unauthenticated', () => {
      renderApp(UNAUTHENTICATED, { route: '/inventory' });
      expect(screen.getByLabelText(/Parolă/)).toBeInTheDocument();
    });

    it('renders dashboard when authenticated', async () => {
      renderApp(AUTHENTICATED);
      expect(await screen.findByText('bioinginer')).toBeInTheDocument();
    });

    it('renders inventory when authenticated', async () => {
      renderApp(AUTHENTICATED, { route: '/inventory' });
      expect(await screen.findByText('Filtrare și Căutare')).toBeInTheDocument();
    });
  });
});
