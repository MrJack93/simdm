import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

// Teste de integrare pentru AuthProvider + useAuth.
// AuthProvider rulează un bootstrap (checkAuth) la montare folosind instanța
// axios mockată global. Un consumator de probă expune starea contextului în DOM,
// ca să verificăm lifecycle-ul: încărcare, login, logout, expirare token.

function AuthProbe() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('bioinginer', 'parola')}>do-login</button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

describe('AuthProvider + useAuth (lifecycle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Implicit: GET /auth/me eșuează (neautentificat) dacă testul nu specifică altceva.
    api.get.mockRejectedValue(new Error('unauthorized'));
    api.post.mockRejectedValue(new Error('no session'));
  });

  it('bootstrap fără token și fără cookie => user null, loading devine false', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('bootstrap cu access token valid în sessionStorage hidratează user-ul din /auth/me', async () => {
    sessionStorage.setItem('accessToken', 'token-valid');
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'bioinginer' } } });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bioinginer'));
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('bootstrap fără token dar cu cookie valid: refresh reușit apoi /auth/me', async () => {
    // Nu există accessToken => provider-ul încearcă POST /auth/refresh.
    api.post.mockImplementation((url) => {
      if (url === '/auth/refresh') return Promise.resolve({ data: { accessToken: 'nou' } });
      return Promise.reject(new Error('unexpected'));
    });
    api.get.mockResolvedValue({ data: { user: { id: 7, username: 'refreshed' } } });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('refreshed'));
    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    expect(sessionStorage.getItem('accessToken')).toBe('nou');
  });

  it('login stochează accessToken în sessionStorage și setează user-ul', async () => {
    const user = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    api.post.mockResolvedValueOnce({
      data: { accessToken: 'tok-login', user: { id: 2, username: 'bioinginer' } },
    });

    await user.click(screen.getByRole('button', { name: 'do-login' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bioinginer'));
    expect(sessionStorage.getItem('accessToken')).toBe('tok-login');
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      username: 'bioinginer',
      password: 'parola',
    });
  });

  it('logout resetează user-ul la null și șterge accessToken-ul din sessionStorage', async () => {
    const user = userEvent.setup();
    // Pornește autentificat.
    sessionStorage.setItem('accessToken', 'token-valid');
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'bioinginer' } } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bioinginer'));

    api.post.mockResolvedValueOnce({ data: {} }); // POST /auth/logout reușește
    await user.click(screen.getByRole('button', { name: 'do-logout' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('logout curăță starea locală chiar dacă apelul către server eșuează', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'token-valid');
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'bioinginer' } } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bioinginer'));

    // POST /auth/logout eșuează (server down) — starea locală trebuie tot curățată.
    api.post.mockRejectedValueOnce(new Error('server down'));
    await user.click(screen.getByRole('button', { name: 'do-logout' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});

describe('useAuth (hook guard)', () => {
  it('aruncă o eroare descriptivă când este folosit în afara AuthProvider', () => {
    // Fără AuthProvider, contextul este undefined => hook-ul trebuie să arunce.
    // Suprimăm console.error pe care React îl emite pentru eroarea de randare.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    );
    spy.mockRestore();
  });

  it('returnează contextul intact când este folosit în interiorul AuthProvider', async () => {
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'bioinginer' } } });
    sessionStorage.setItem('accessToken', 'token-valid');

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});
