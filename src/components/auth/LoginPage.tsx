import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type FormData = z.infer<typeof schema>;

// Read stored user once, safely — used for both the redirect and the form
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

  // ─── ALL HOOKS MUST BE CALLED UNCONDITIONALLY ───
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
      const msg =
        err?.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  // ─── CONDITIONAL REDIRECT — AFTER all hooks ───
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

          <p className="mt-6 text-center text-xs text-slate-400">
            {import.meta.env.VITE_API_URL}
          </p>
        </div>
      </div>
    </div>
  );
};