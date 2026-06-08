import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../context/auth.context';

// Helper: randează Login cu un context Auth controlat de test.
// Componenta folosește useNavigate() → necesită MemoryRouter.
function renderLogin(loginImpl = vi.fn().mockResolvedValue(undefined)) {
  const value = { user: null, loading: false, login: loginImpl, logout: vi.fn() };
  render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { login: loginImpl };
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randează inputurile de utilizator și parolă plus butonul de conectare', () => {
    renderLogin();
    expect(screen.getByLabelText('Utilizator')).toBeInTheDocument();
    expect(screen.getByLabelText('Parolă')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conectare' })).toBeInTheDocument();
  });

  it('afișează placeholder-ul și titlul corecte în limba română', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('bioinginer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Conectare' })
    ).toBeInTheDocument();
  });

  it('inputul de parolă este de tip password', () => {
    renderLogin();
    const password = screen.getByLabelText('Parolă');
    expect(password).toHaveAttribute('type', 'password');
  });

  it('actualizează valorile inputurilor pe măsură ce utilizatorul tastează', async () => {
    const user = userEvent.setup();
    renderLogin();
    const username = screen.getByLabelText('Utilizator');
    await user.type(username, 'bioinginer');
    expect(username).toHaveValue('bioinginer');
  });

  it('la submit valid apelează login(username, password)', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'bioinginer');
    await user.type(screen.getByLabelText('Parolă'), 'parola123');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('bioinginer', 'parola123');
    });
  });

  it('afișează mesajul de eroare din răspunsul serverului (role="alert")', async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue({ response: { data: { error: 'Credențiale invalide' } } });
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'x');
    await user.type(screen.getByLabelText('Parolă'), 'y');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Credențiale invalide');
  });

  it('afișează mesaj generic când eroarea nu are răspuns de la server', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('Network down'));
    renderLogin(login);
    await user.type(screen.getByLabelText('Utilizator'), 'x');
    await user.type(screen.getByLabelText('Parolă'), 'y');
    await user.click(screen.getByRole('button', { name: 'Conectare' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Eroare de conectare. Încearcă din nou.');
  });

  it('trimite formularul la apăsarea tastei Enter în câmpul parolă', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Utilizator'), 'bioinginer');
    await user.type(screen.getByLabelText('Parolă'), 'parola123{Enter}');
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('bioinginer', 'parola123');
    });
  });
});
