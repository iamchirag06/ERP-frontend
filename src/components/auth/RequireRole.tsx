// src/components/auth/RequireRole.tsx
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/types/common';
import type { LoginResponse } from '@/types/auth';

interface Props {
  roles: Role[];
}

export const RequireRole = ({ roles }: Props) => {
  const raw = localStorage.getItem('erp_user');
  const user: LoginResponse | null = raw ? JSON.parse(raw) : null;

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};