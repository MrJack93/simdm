import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../context/auth.context';

function renderLogin(loginImpl = vi.fn().mockResolvedValue(undefined)) {
  const value = { user: null, loading: false, login: loginImpl, logout: vi.fn() };
  return {
    ...render(
      <MemoryRouter>
        <AuthContext.Provider value={value}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
    login: loginImpl,
  };
}

describe('Login — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form elements', () => {
    renderLogin();
    expect(screen.getByLabelText('Utilizator')).toBeInTheDocument();
    expect(screen.getByLabelText('Parolă')).toBeInTheDocument();
    expect(screen.getByLabelText('Ține-mă minte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conectare' })).toBeInTheDocument();
  });

  it('renders hero section with features', () => {
    renderLogin();
    expect(screen.getByText('Inventar Centralizat')).toBeInTheDocument();
    expect(screen.getByText('Planificare Mentenanță')).toBeInTheDocument();
    expect(screen.getByText('Vigilență și Incidente')).toBeInTheDocument();
  });

  it('password toggle shows/hides password', async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText('Parolă');
    expect(password).toHaveAttribute('type', 'password');
    const toggleBtn = screen.getByLabelText('Arată parola');
    await user.click(toggleBtn);
    expect(password).toHaveAttribute('type', 'text');
    const hideBtn = screen.getByLabelText('Ascunde parola');
    await user.click(hideBtn);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('password toggle aria-pressed updates', async () => {
    const user = userEvent.setup();
    renderLogin();
    const toggleBtn = screen.getByLabelText('Arată parola');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggleBtn);
    expect(screen.getByLabelText('Ascunde parola')).toHaveAttribute('aria-pressed', 'true');
  });

  it('form submits with valid credentials', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin', 'pass123', { rememberMe: false });
    });
  });

  it('form submits with rememberMe checked', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass123');
    await user.click(screen.getByLabelText('Ține-mă minte'));
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin', 'pass123', { rememberMe: true });
    });
  });

  it('validates username required', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByLabelText('Utilizator'));
    await user.tab();
    expect(screen.getByText('Utilizatorul este obligatoriu')).toBeInTheDocument();
  });

  it('validates password required', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByLabelText('Parolă'));
    await user.tab();
    expect(screen.getByText('Parola este obligatorie')).toBeInTheDocument();
  });

  it('validation clears on typing', async () => {
    const user = userEvent.setup();
    renderLogin();
    const username = screen.getByLabelText('Utilizator');
    await user.click(username);
    await user.tab();
    expect(screen.getByText('Utilizatorul este obligatoriu')).toBeInTheDocument();
    await user.type(username, 'a');
    expect(screen.queryByText('Utilizatorul este obligatoriu')).not.toBeInTheDocument();
  });

  it('shows server error on failed login', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue({ response: { data: { error: 'Credențiale greșite' } } });
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'x');
    await user.type(screen.getByLabelText('Parolă'), 'y');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Credențiale greșite');
  });

  it('shows generic error on network failure', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('Network'));
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'x');
    await user.type(screen.getByLabelText('Parolă'), 'y');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Eroare de conectare. Încearcă din nou.');
  });

  it('Enter key on password field submits', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass{Enter}');
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin', 'pass', { rememberMe: false });
    });
  });

  it('submit button shows loading state', async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const login = vi.fn(() => new Promise(r => { resolveLogin = r; }));
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    expect(screen.getByText('Se conectează…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se conectează/ })).toBeDisabled();
    resolveLogin();
  });

  it('rate limiting blocks rapid submissions', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    await waitFor(() => { expect(login).toHaveBeenCalled(); });
    await user.click(screen.getByRole('button', { name: /Conectare|Așteaptă/ }));
    await waitFor(() => {
      expect(screen.getByText('Prea multe încercări. Așteaptă 3 secunde.')).toBeInTheDocument();
    });
  });

  it('skip link for accessibility', () => {
    renderLogin();
    expect(screen.getByText('Sari la conținut')).toBeInTheDocument();
  });

  it('username field has autoFocus', () => {
    renderLogin();
    expect(screen.getByLabelText('Utilizator')).toHaveFocus();
  });

  it('features section displays icons', () => {
    renderLogin();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('🔧')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('username field has correct autocomplete', () => {
    renderLogin();
    expect(screen.getByLabelText('Utilizator')).toHaveAttribute('autocomplete', 'username');
  });

  it('password field has correct autocomplete', () => {
    renderLogin();
    expect(screen.getByLabelText('Parolă')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('submit button shows Așteaptă when rate limited', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'a');
    await user.type(screen.getByLabelText('Parolă'), 'b');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    await waitFor(() => { expect(login).toHaveBeenCalled(); });
    await user.click(screen.getByRole('button', { name: /Conectare|Așteaptă/ }));
    expect(await screen.findByText('Așteaptă…')).toBeInTheDocument();
  });

  it('disabled state during submission', async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const login = vi.fn(() => new Promise(r => { resolveLogin = r; }));
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'admin');
    await user.type(screen.getByLabelText('Parolă'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    expect(screen.getByLabelText('Utilizator')).toBeDisabled();
    expect(screen.getByLabelText('Parolă')).toBeDisabled();
    resolveLogin();
  });
});
