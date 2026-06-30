import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/auth.context';
import api from '../../api/axios';
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

describe('App — Extra Coverage', () => {
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

  describe('loading state', () => {
    it('shows loading spinner when auth is loading', () => {
      renderApp(LOADING);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Se încarcă…')).toBeInTheDocument();
    });
  });

  describe('unauthenticated routes', () => {
    it('shows login form on /login', () => {
      renderApp(UNAUTHENTICATED, { route: '/login' });
      expect(screen.getByLabelText(/Parolă/)).toBeInTheDocument();
    });

    it('redirects to login on protected route', () => {
      renderApp(UNAUTHENTICATED, { route: '/inventory' });
      expect(screen.getByLabelText(/Parolă/)).toBeInTheDocument();
    });
  });

  describe('authenticated routes', () => {
    it('renders dashboard on /', async () => {
      renderApp(AUTHENTICATED);
      expect(await screen.findByText('bioinginer')).toBeInTheDocument();
    });

    it('renders inventory page on /inventory', async () => {
      renderApp(AUTHENTICATED, { route: '/inventory' });
      expect(await screen.findByText('Filtrare și Căutare')).toBeInTheDocument();
    });

    it('renders incidents page on /incidents', async () => {
      api.get.mockImplementation((url) => {
        if (url.includes('/incidents')) return Promise.resolve({ data: { data: [], total: 0 } });
        if (url.includes('/devices')) return Promise.resolve({ data: { devices: [] } });
        return Promise.resolve({ data: {} });
      });
      renderApp(AUTHENTICATED, { route: '/incidents' });
      expect(await screen.findByText('Incidente')).toBeInTheDocument();
    });

    it('renders audit logs page on /audit-logs', async () => {
      api.get.mockResolvedValue({ data: { data: [], total: 0, page: 1, totalPages: 0 } });
      renderApp(AUTHENTICATED, { route: '/audit-logs' });
      expect(await screen.findByText('Jurnal de Audit')).toBeInTheDocument();
    });
  });

  // ── Sidebar mobil (înlocuiește vechiul MobileMenu) ───────────────────────
  describe('mobile sidebar', () => {
    it('opens and closes mobile sidebar via toggle button', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      const sidebar = screen.getByRole('complementary', { name: 'Meniu principal' });

      // Sidebar ascuns implicit pe mobile
      expect(sidebar.className).toContain('-translate-x-full');

      // Click deschide
      const menuBtn = screen.getByLabelText('Deschide meniu lateral');
      await user.click(menuBtn);
      expect(sidebar.className).not.toContain('-translate-x-full');

      // Backdrop-ul acoperă butonul când e deschis → închidem cu Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(sidebar.className).toContain('-translate-x-full');
      });
    });
  });

  // ── Theme toggle ─────────────────────────────────────────────────────────
  describe('theme toggle', () => {
    it('toggles between light and dark', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      // Stare inițială: dark → buton "Comută la modul clar"
      const themeBtn = screen.getByRole('button', { name: /Comută la modul clar/ });
      await user.click(themeBtn);
      expect(localStorage.getItem('simdm_theme')).toBe('light');

      // Acum light → buton "Comută la modul întunecat"
      const themeBtn2 = screen.getByRole('button', { name: /Comută la modul întunecat/ });
      await user.click(themeBtn2);
      expect(localStorage.getItem('simdm_theme')).toBe('dark');
    });
  });

  // ── Navigation links ─────────────────────────────────────────────────────
  describe('navigation links', () => {
    it('renders sidebar nav links', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      expect(screen.getAllByRole('link', { name: /Inventar/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Consumabile/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Incidente/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Jurnal/ }).length).toBeGreaterThan(0);
    });

    it('renders settings link', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      // TopBar are aria-label="Setări aplicație" pe link-ul de settings
      expect(screen.getByLabelText('Setări aplicație')).toBeInTheDocument();
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('calls logout function', async () => {
      const user = userEvent.setup();
      const logout = vi.fn();
      renderApp({ ...AUTHENTICATED, logout });
      await screen.findByText('bioinginer');

      await user.click(screen.getByRole('button', { name: /Deconectare/ }));
      expect(logout).toHaveBeenCalled();
    });
  });

  // ── Error boundary ────────────────────────────────────────────────────────
  describe('error boundary', () => {
    it('renders ErrorBoundary wrapper', async () => {
      renderApp(AUTHENTICATED);
      expect(await screen.findByText('bioinginer')).toBeInTheDocument();
    });
  });
});
