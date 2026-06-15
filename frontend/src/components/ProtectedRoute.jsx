import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Skeleton from './Skeleton';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        role="status"
      >
        <div className="w-full max-w-md">
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
