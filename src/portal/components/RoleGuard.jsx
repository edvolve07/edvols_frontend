import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './LoadingSkeleton';

function homeForRole(role) {
  if (role === 'master_admin') return '/master-admin/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}

export default function RoleGuard({ role, roles }) {
  const { user, loading, revoked } = useAuth();
  const location = useLocation();
  const allowedRoles = roles || (role ? [role] : null);

  if (loading) return <LoadingSkeleton label="Checking session" />;
  if (revoked) return <Navigate to="/access-revoked" replace />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <Outlet />;
}
