import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/common';

export const OAuthCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const token = params.get('token');
  const role = params.get('role') as Role | null;
  const userId = params.get('userId');
  const name = params.get('name');
  const email = params.get('email');
  const profileImageUrl = params.get('profileImageUrl');

  if (!token || !role) {
    setError('Google sign-in failed. Missing token or role.');
    toast.error('Google sign-in failed');
    setTimeout(() => navigate('/login', { replace: true }), 2000);
    return;
  }

  // ⚠️ CRITICAL: write token to localStorage FIRST,
  // then setAuth, then wait a tick, then navigate.
  localStorage.setItem('erp_token', token);
  localStorage.setItem(
    'erp_user',
    JSON.stringify({ token, role, userId: userId ?? '', name: name ?? '', email: email ?? '', profileImageUrl: profileImageUrl ?? null })
  );

  setAuth({
    token,
    role,
    userId: userId ?? '',
    name: name ?? '',
    email: email ?? '',
    profileImageUrl: profileImageUrl ?? null,
  });

  toast.success(`Welcome${name ? `, ${name.split(' ')[0]}` : ''}!`);

  // Give localStorage + Zustand a moment to settle before mounting protected pages
  const path =
    role === 'STUDENT' ? '/student' : role === 'TEACHER' ? '/teacher' : '/admin';

  setTimeout(() => {
    navigate(path, { replace: true });
  }, 100);
}, [params, navigate, setAuth]);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="text-center">
        {error ? (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">{error}</p>
            <p className="mt-1 text-xs text-slate-500">Redirecting to login…</p>
          </>
        ) : (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-sm text-slate-500">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
};