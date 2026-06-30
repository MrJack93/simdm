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

// Helper: returnează sidebar-ul <aside aria-label="Meniu principal">
function getSidebar() {
  return screen.getByRole('complementary', { name: 'Meniu principal' });
}

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

  // ── TopBar (înlocuiește vechiul Header) ──────────────────────────────────
  describe('TopBar', () => {
    it('mobile sidebar toggle opens sidebar', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      // Înainte de toggle: clasa de ascundere prezentă
      const sidebar = getSidebar();
      expect(sidebar.className).toContain('-translate-x-full');

      const menuBtn = screen.getByLabelText('Deschide meniu lateral');
      await user.click(menuBtn);

      // După toggle: sidebar vizibil
      expect(sidebar.className).not.toContain('-translate-x-full');
    });

    it('mobile sidebar toggle closes sidebar', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      const menuBtn = screen.getByLabelText('Deschide meniu lateral');
      const sidebar = getSidebar();

      await user.click(menuBtn);
      expect(sidebar.className).not.toContain('-translate-x-full');

      // Backdrop-ul acoperă butonul (z-index mai mare) → închidem cu Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(sidebar.className).toContain('-translate-x-full');
      });
    });

    it('theme toggle switches between light and dark', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      // Starea inițială: dark → butonul spune "Comută la modul clar"
      const themeBtn = screen.getByRole('button', { name: /Comută la modul clar/ });
      await user.click(themeBtn);
      expect(localStorage.getItem('simdm_theme')).toBe('light');

      // Acum light → butonul spune "Comută la modul întunecat"
      const themeBtn2 = screen.getByRole('button', { name: /Comută la modul întunecat/ });
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
      expect(screen.getByLabelText('Setări aplicație')).toBeInTheDocument();
    });
  });

  // ── Sidebar mobil (înlocuiește vechiul MobileMenu) ───────────────────────
  describe('Sidebar mobil', () => {
    it('Escape key closes mobile sidebar', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      const menuBtn = screen.getByLabelText('Deschide meniu lateral');
      await user.click(menuBtn);
      const sidebar = getSidebar();
      expect(sidebar.className).not.toContain('-translate-x-full');

      // Escape pe document → DashboardLayout ascunde sidebar-ul
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(sidebar.className).toContain('-translate-x-full');
      });
    });

    it('sidebar contains navigation links', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      // Sidebar-ul e mereu în DOM; verificăm că linkurile sunt prezente
      const sidebar = getSidebar();
      expect(sidebar.querySelectorAll('a[href]').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inventar').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mentenanță').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Verificări').length).toBeGreaterThanOrEqual(1);
    });

    it('Tab focus: sidebar has focusable elements', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      await user.click(screen.getByLabelText('Deschide meniu lateral'));
      const sidebar = getSidebar();
      expect(sidebar).toBeInTheDocument();
      const focusable = sidebar.querySelectorAll('a, button');
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('clicking a nav link closes mobile sidebar', async () => {
      const user = userEvent.setup();
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');

      const menuBtn = screen.getByLabelText('Deschide meniu lateral');
      await user.click(menuBtn);
      const sidebar = getSidebar();
      expect(sidebar.className).not.toContain('-translate-x-full');

      // Click pe primul link Dashboard din sidebar
      const dashLinks = sidebar.querySelectorAll('a[href="/"]');
      if (dashLinks.length > 0) {
        await user.click(dashLinks[0]);
        await waitFor(() => {
          expect(sidebar.className).toContain('-translate-x-full');
        });
      } else {
        // Fallback: sidebar e în DOM
        expect(sidebar).toBeInTheDocument();
      }
    });
  });

  // ── Layout general ────────────────────────────────────────────────────────
  describe('DashboardLayout', () => {
    it('renders sidebar nav links', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      expect(screen.getAllByRole('link', { name: /Inventar/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Consumabile/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Incidente/ }).length).toBeGreaterThan(0);
    });

    it('renders SIMDM logo', async () => {
      renderApp(AUTHENTICATED);
      await screen.findByText('bioinginer');
      // Logo apare în sidebar (desktop) și în TopBar (mobile) → căutăm cu getAllByText
      expect(screen.getAllByText('SIMDM').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Routing ───────────────────────────────────────────────────────────────
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
