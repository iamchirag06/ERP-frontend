import { create } from 'zustand';
import type { LoginResponse } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: LoginResponse | null;
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
  /** Re-read from localStorage — safe to call anytime */
  rehydrate: () => void;
}

const readToken = () => localStorage.getItem('erp_token');
const readUser = (): LoginResponse | null => {
  const raw = localStorage.getItem('erp_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  user: readUser(),
  setAuth: (data) => {
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data));
    set({ token: data.token, user: data });
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    set({ token: null, user: null });
  },
  rehydrate: () => {
    set({ token: readToken(), user: readUser() });
  },
}));