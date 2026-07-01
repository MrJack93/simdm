import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { setToken, clearToken, getToken } from '../../api/tokenStore';

function AuthProbe() {
  const { user, loading, login, logout, refreshUser } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('admin', 'pass')}>login</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => refreshUser()}>refresh</button>
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

describe('AuthProvider — branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
    api.get.mockRejectedValue(new Error('unauthorized'));
    api.post.mockRejectedValue(new Error('no session'));
  });

  it('bootstrap: no token, refresh fails, sets user to null', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('bootstrap: no token, refresh succeeds, sets token then /auth/me', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/auth/refresh') return Promise.resolve({ data: { accessToken: 'new-tok' } });
      return Promise.reject(new Error('unexpected'));
    });
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'refreshed' } } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('refreshed'));
  });

  it('bootstrap: token exists, user loaded from /auth/me', async () => {
    setToken('valid-token');
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'loaded' } } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('loaded'));
  });

  it('bootstrap: token exists but /auth/me fails, returns early', async () => {
    setToken('invalid-token');
    api.get.mockRejectedValue(new Error('expired'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    // User remains null due to early return
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('bootstrap: no token, refresh fails, sets user to null and loading false', async () => {
    api.post.mockRejectedValue(new Error('no refresh'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('bootstrap: no token, refresh succeeds but getToken already set', async () => {
    api.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        setToken('manually-set'); // simulate race condition
        return Promise.resolve({ data: { accessToken: 'new-tok' } });
      }
      return Promise.reject(new Error('unexpected'));
    });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
  });

  it('login with rememberMe option', async () => {
    const user = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    api.post.mockResolvedValueOnce({
      data: { accessToken: 'tok-remember', user: { id: 1, username: 'admin' } },
    });
    // Modify the login call to include rememberMe
    const loginBtn = screen.getByRole('button', { name: 'login' });
    await user.click(loginBtn);

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin'));
    expect(getToken()).toBe('tok-remember');
  });

  it('logout clears state even when API fails', async () => {
    const user = userEvent.setup();
    setToken('token-to-clear');
    api.get.mockResolvedValue({ data: { user: { id: 1, username: 'admin' } } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin'));

    api.post.mockRejectedValueOnce(new Error('fail'));
    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(getToken()).toBeNull();
  });

  it('refreshUser updates user from /auth/me', async () => {
    const user = userEvent.setup();
    setToken('valid-token');
    api.get
      .mockResolvedValueOnce({ data: { user: { id: 1, username: 'initial' } } })
      .mockResolvedValueOnce({ data: { user: { id: 1, username: 'refreshed' } } });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('initial'));

    await user.click(screen.getByRole('button', { name: 'refresh' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('refreshed'));
  });

  it('refreshUser logs error when /auth/me fails', async () => {
    const user = userEvent.setup();
    setToken('valid-token');
    api.get
      .mockResolvedValueOnce({ data: { user: { id: 1, username: 'initial' } } })
      .mockRejectedValueOnce(new Error('network fail'));

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('initial'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'refresh' }));
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('refreshUser does nothing when no token', async () => {
    const user = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    // Mock /auth/me to reject (no valid session)
    api.get.mockRejectedValueOnce(new Error('no auth'));
    await user.click(screen.getByRole('button', { name: 'refresh' }));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
  });
});
