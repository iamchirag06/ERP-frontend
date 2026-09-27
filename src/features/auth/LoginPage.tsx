import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const readStoredUser = () => {
  const token = localStorage.getItem('erp_token');
  const raw = localStorage.getItem('erp_user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as { role: 'STUDENT' | 'TEACHER' | 'ADMIN' };
  } catch {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    return null;
  }
};

const dashboardPathFor = (role: string) =>
  role === 'STUDENT' ? '/student' : role === 'TEACHER' ? '/teacher' : '/admin';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [searchParams] = useSearchParams();          // ← moved up

  // ─── ALL HOOKS FIRST ──────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`Welcome back, ${data.name.split(' ')[0]}!`);
      navigate(dashboardPathFor(data.role), { replace: true });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    },
  });

  // Show OAuth error from URL (?oauthError=...)
  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const onSubmit = (data: FormData) => mutation.mutate(data);

  // ─── CONDITIONAL RENDER AFTER ALL HOOKS ────────────
  const stored = readStoredUser();
  if (stored) {
    return <Navigate to={dashboardPathFor(stored.role)} replace />;
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between bg-linear-to-br from-indigo-600 to-violet-700 p-12 text-white md:flex">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 text-2xl font-bold">
            E
          </div>
          <h1 className="mt-6 text-4xl font-bold">College ERP</h1>
          <p className="mt-3 max-w-sm text-white/80">
            One portal for students, teachers and administration — attendance,
            assignments, resources, notices, and more.
          </p>
        </div>
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} College ERP
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your college email and password.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              type="email"
              placeholder="you@college.edu"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between text-sm">
              <a
                href="/forgot-password"
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={() => {
              const base = import.meta.env.VITE_API_URL as string;
              window.location.href = `${base}/oauth2/authorization/google`;
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.25 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.61z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.7 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            {import.meta.env.VITE_API_URL}
          </p>
        </div>
      </div>
    </div>
  );
};