import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthContext } from '../../context/auth.context';
import api from '../../api/axios';
import App from '../../App';

// Teste de integrare pentru App.jsx — entry point + router + navigation guards.
// AuthContext este furnizat direct prin Provider, ca să controlăm cele trei
// stări de top-level: loading, neautentificat și autentificat.
//
// App montează ProtectedRoute, care citește același AuthContext — deci aceeași
// valoare de context acoperă atât App, cât și guard-ul rutelor protejate.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
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

describe('App (entry point + router)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // API generic: liste goale pentru orice pagină randată de rute protejate.
    api.get.mockImplementation((url) => {
      if (url.startsWith('/devices/dropdown/sections')) return Promise.resolve({ data: [] });
      if (url.startsWith('/consumables')) return Promise.resolve({ data: { consumables: [] } });
      if (url.startsWith('/devices')) {
        return Promise.resolve({ data: { devices: [], pagination: { total: 0, pages: 1 } } });
      }
      return Promise.resolve({ data: {} });
    });
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove('light-mode');
  });

  it('afișează spinner-ul de încărcare (role="status") cât timp auth-ul se verifică', () => {
    renderApp({ user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Se încarcă…')).toBeInTheDocument();
  });

  it('randează pagina de Login când nu există utilizator autentificat', () => {
    renderApp({ user: null, loading: false, login: vi.fn() });
    // Login afișează formularul cu câmpul de parolă.
    expect(screen.getByLabelText(/Parolă/)).toBeInTheDocument();
  });

  it('randează Dashboard-ul cu numele utilizatorului când este autentificat', async () => {
    renderApp({ user: { id: 1, username: 'bioinginer' }, loading: false, logout: vi.fn() });
    expect(await screen.findByText('bioinginer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deconectare' })).toBeInTheDocument();
  });

  it('butonul Deconectare apelează logout din context', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    renderApp({ user: { id: 1, username: 'bioinginer' }, loading: false, logout });

    await user.click(screen.getByRole('button', { name: 'Deconectare' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('guard de rută: ruta protejată "/inventory" randează conținutul când e autentificat', async () => {
    renderApp(
      { user: { id: 1, username: 'bioinginer' }, loading: false, logout: vi.fn() },
      { route: '/inventory' }
    );
    expect(await screen.findByText('Filtrare și Căutare')).toBeInTheDocument();
  });

  it('comutatorul de temă adaugă clasa light-mode pe <html> și persistă în localStorage', async () => {
    const user = userEvent.setup();
    renderApp({ user: { id: 1, username: 'bioinginer' }, loading: false, logout: vi.fn() });

    const themeToggle = await screen.findByRole('button', { name: /Comută la modul clar/ });
    await user.click(themeToggle);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light-mode')).toBe(true);
    });
    expect(localStorage.getItem('simdm_theme')).toBe('light');
  });

  it('inițializează tema din localStorage (light) la montare', async () => {
    localStorage.setItem('simdm_theme', 'light');
    renderApp({ user: { id: 1, username: 'bioinginer' }, loading: false, logout: vi.fn() });

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light-mode')).toBe(true);
    });
  });
});
