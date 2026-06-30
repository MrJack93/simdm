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
          <Route path="/login" element={<div>Pagina de login</div>} />
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
  it('redirecționează către "/login" când nu există utilizator autentificat', () => {
    renderGuard({ user: null, loading: false });
    expect(screen.getByText('Pagina de login')).toBeInTheDocument();
    expect(screen.queryByText('Conținut protejat')).not.toBeInTheDocument();
  });

  it('randează conținutul protejat când utilizatorul este autentificat', () => {
    renderGuard({ user: { id: 1, username: 'bioinginer' }, loading: false });
    expect(screen.getByText('Conținut protejat')).toBeInTheDocument();
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument();
  });

  it('afișează skeleton-ul de încărcare în timpul verificării', () => {
    renderGuard({ user: null, loading: true });
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('nu redirecționează cât timp starea de încărcare este activă', () => {
    renderGuard({ user: null, loading: true });
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument();
  });

  it('nu afișează conținutul protejat cât timp se încarcă', () => {
    renderGuard({ user: { id: 1 }, loading: true });
    expect(screen.queryByText('Conținut protejat')).not.toBeInTheDocument();
  });

  it('randează corect children-ul transmis ca prop', () => {
    renderGuard(
      { user: { id: 1 }, loading: false },
      { children: <span>Dashboard bioinginer</span> }
    );
    expect(screen.getByText('Dashboard bioinginer')).toBeInTheDocument();
  });

  it('redirecționează spre /settings când mustChangePassword=true', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 1, mustChangePassword: true }, loading: false }}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>} />
            <Route path="/settings" element={<div>Setări</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Setări')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('nu redirecționează când mustChangePassword=true dar suntem pe /settings', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 1, mustChangePassword: true }, loading: false }}>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<ProtectedRoute><div>Setări</div></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Setări')).toBeInTheDocument();
  });

  it('randează children când mustChangePassword=false', () => {
    renderGuard({ user: { id: 1, mustChangePassword: false }, loading: false });
    expect(screen.getByText('Conținut protejat')).toBeInTheDocument();
  });
});
