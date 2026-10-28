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
    <div className="grid min-h-screen place-items-center bg-[#FFF6D8] p-4">
      <div className="max-w-sm w-full rounded-3xl border-2 border-[#302365]/15 bg-white p-8 text-center shadow-[6px_6px_0px_rgba(48,35,101,0.1)]">
        {error ? (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FCE4EB] border-2 border-[#F5A3BA] text-[#C22B58]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mt-4 font-heading text-base font-bold text-[#302365]">{error}</p>
            <p className="mt-1 text-xs font-medium text-[#302365]/60">Redirecting to login…</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex items-center justify-center gap-1.5 py-4">
              <span className="h-3.5 w-3.5 rounded-full bg-[#2587B8] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#62A66C] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#E87999] animate-bounce" />
            </div>
            <p className="mt-2 font-heading text-lg font-bold text-[#302365]">Signing you in…</p>
            <p className="mt-1 text-xs font-medium text-[#302365]/60">Preparing your campus dashboard ✨</p>
          </>
        )}
      </div>
    </div>
  );
};