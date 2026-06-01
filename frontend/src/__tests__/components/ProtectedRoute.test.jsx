import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthContext } from '../../context/auth.context';

// Randează ProtectedRoute cu o valoare de context controlată.
// Componenta reală citește { user, loading }: dacă loading -> spinner,
// dacă !user -> Navigate către "/", altfel randează children.
function renderGuard(authValue, { children = <div>Conținut protejat</div> } = {}) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Pagina de login</div>} />
          <Route
            path="/protected"
            element={<ProtectedRoute>{children}</ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('redirecționează către "/" când nu există utilizator autentificat', () => {
    renderGuard({ user: null, loading: false });
    expect(screen.getByText('Pagina de login')).toBeInTheDocument();
    expect(screen.queryByText('Conținut protejat')).not.toBeInTheDocument();
  });

  it('randează conținutul protejat când utilizatorul este autentificat', () => {
    renderGuard({ user: { id: 1, username: 'bioinginer' }, loading: false });
    expect(screen.getByText('Conținut protejat')).toBeInTheDocument();
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument();
  });

  it('afișează spinner-ul de încărcare (role="status") în timpul verificării', () => {
    renderGuard({ user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Se încarcă…')).toBeInTheDocument();
  });

  it('nu redirecționează cât timp starea de încărcare este activă', () => {
    renderGuard({ user: null, loading: true });
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument();
  });

  it('nu afișează conținutul protejat cât timp se încarcă', () => {
    renderGuard({ user: { id: 1 }, loading: true });
    expect(screen.queryByText('Conținut protejat')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('randează corect children-ul transmis ca prop', () => {
    renderGuard(
      { user: { id: 1 }, loading: false },
      { children: <span>Dashboard bioinginer</span> }
    );
    expect(screen.getByText('Dashboard bioinginer')).toBeInTheDocument();
  });
});
