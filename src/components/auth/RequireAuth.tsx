// src/components/auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isTokenValid } from '@/lib/jwt';

export const RequireAuth = () => {
  const location = useLocation();
  const token = localStorage.getItem('erp_token');

  if (!isTokenValid(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;   // only reached when token is valid
};