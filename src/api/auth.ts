import { api } from '@/lib/api';
import type { LoginRequest, LoginResponse } from '@/types/auth';

export const login = (body: LoginRequest) =>
  api.post<LoginResponse>('/api/auth/login', body).then((r) => r.data);

export const getMe = () => api.get<LoginResponse>('/api/auth/me').then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/api/auth/forgot-password', { email });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/api/auth/reset-password', { token, newPassword });

export const logoutApi = () => api.post('/api/auth/logout');