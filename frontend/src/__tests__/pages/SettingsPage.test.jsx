import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

vi.mock('../../hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api/axios', () => ({
  default: {
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import SettingsPage from '../../pages/SettingsPage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

function renderPage(overrides = {}) {
  useTheme.mockReturnValue({
    theme: 'light',
    toggleTheme: vi.fn(),
    ...overrides,
  });
  useAuth.mockReturnValue({
    user: { username: 'bioinginer' },
    logout: vi.fn(),
    ...overrides,
  });
  return render(<SettingsPage />);
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    useAuth.mockReturnValue({ user: { username: 'bioinginer' }, logout: vi.fn() });
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Setări')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderPage();
    expect(screen.getByText(/Gestionează preferințele/)).toBeInTheDocument();
  });

  it('displays user profile initial', () => {
    renderPage();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('displays username', () => {
    renderPage();
    expect(screen.getAllByText('bioinginer').length).toBeGreaterThan(0);
  });

  it('displays role text', () => {
    renderPage();
    expect(screen.getByText('Bioinginer Medical')).toBeInTheDocument();
  });

  it('calls toggleTheme when Comută button is clicked', () => {
    const toggleTheme = vi.fn();
    useTheme.mockReturnValue({ theme: 'light', toggleTheme });
    renderPage({ toggleTheme });
    const toggle = screen.getByRole('switch', { name: /Comută/ });
    fireEvent.click(toggle);
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('shows light mode label when theme is light', () => {
    renderPage();
    expect(screen.getByText('Mod clar')).toBeInTheDocument();
  });

  it('shows dark mode label when theme is dark', () => {
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
    render(<SettingsPage />);
    expect(screen.getByText('Mod întunecat')).toBeInTheDocument();
  });

  it('calls logout when Deconectare is clicked', async () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { username: 'test' }, logout });
    renderPage({ logout });
    fireEvent.click(screen.getByText('Deconectare'));
    await waitFor(() => {
      expect(screen.getByText('Confirmare deconectare')).toBeInTheDocument();
    });
    const confirmBtns = screen.getAllByText('Deconectare');
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it('renders the password change form', () => {
    renderPage();
    expect(screen.getByLabelText('Parolă curentă')).toBeInTheDocument();
    expect(screen.getByLabelText('Parolă nouă')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmare parolă')).toBeInTheDocument();
  });

  it('shows submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /schimbă parolă/i })).toBeInTheDocument();
  });

  it('submits password change successfully', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });
    renderPage();

    fireEvent.change(screen.getByLabelText('Parolă curentă'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText('Parolă nouă'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirmare parolă'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /schimbă parolă/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Parolă schimbată cu succes');
  });

  it('shows error toast on password change failure', async () => {
    api.patch.mockRejectedValueOnce({
      response: { data: { error: 'Parolă curentă incorectă' } },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText('Parolă curentă'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Parolă nouă'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirmare parolă'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /schimbă parolă/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Parolă curentă incorectă');
    });
  });

  it('shows generic error message when API returns no error', async () => {
    api.patch.mockRejectedValueOnce({ response: { data: {} } });
    renderPage();

    fireEvent.change(screen.getByLabelText('Parolă curentă'), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText('Parolă nouă'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirmare parolă'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /schimbă parolă/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Eroare la schimbarea parolei');
    });
  });

  it('shows accessibility checkboxes', () => {
    renderPage();
    expect(screen.getByText('Inele de focus mai evidente')).toBeInTheDocument();
    expect(screen.getByText('Respectare preferință animații')).toBeInTheDocument();
    expect(screen.getByText('Contrast mai înalt')).toBeInTheDocument();
  });

  it('shows system information', () => {
    renderPage();
    expect(screen.getByText('Versiune SIMDM')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
    expect(screen.getByText('Faza implementare')).toBeInTheDocument();
  });

  it('shows password validation error when short', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Parolă nouă'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /schimbă parolă/i }));

    await waitFor(() => {
      expect(screen.getByText('Parolă nouă trebuie să aibă minim 8 caractere')).toBeInTheDocument();
    });
  });

  it('shows mismatch error when passwords differ', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Parolă curentă'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText('Parolă nouă'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirmare parolă'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: /schimbă parolă/i }));

    await waitFor(() => {
      expect(screen.getByText('Parolele nu coincid')).toBeInTheDocument();
    });
  });
});
