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
import {
  DoodleLaptop,
  DoodleClipboard,
  DoodleHeart,
  DoodleMascot,
  SparkleIcon,
  SpeechBubbleTag,
} from '@/components/ui/Illustrations';

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
  const [searchParams] = useSearchParams();

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
    <div className="grid min-h-screen bg-[#FFF6D8] lg:grid-cols-12">
      {/* Left panel — Illustrated Educational Scrapbook Inspiration */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-[#302365]/15 bg-[#FFFDF7] p-8 lg:col-span-7 lg:flex xl:p-12">
        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <DoodleLaptop className="h-12 w-12" />
              <SparkleIcon className="absolute -top-2 -right-2 h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#302365]">
                COLLEGE ERP
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2587B8]">
                Interactive Campus Hub
              </p>
            </div>
          </div>

          {/* Hero Banner inspired by the "PROGRAMS" header in the reference image */}
          <div className="mt-8 rounded-3xl border-2 border-[#302365]/15 bg-[#DFF2FC]/70 p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.08)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-3xl font-extrabold tracking-wide text-[#302365] sm:text-4xl">
                    ✏️ LEARN & GROW
                  </h2>
                  <SparkleIcon className="h-5 w-5 text-amber-500" />
                </div>
                <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-[#302365]/80">
                  A cheerful, all-in-one portal designed for students, teachers,
                  and faculty to seamlessly collaborate on coursework, timetable,
                  and attendance.
                </p>
              </div>
              <div className="hidden sm:block">
                <DoodleClipboard className="h-20 w-20" />
              </div>
            </div>

            {/* Pill chips inspired by Reference Image 2 */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-[#99D4F2] bg-[#DFF2FC] px-3 py-1 font-heading text-xs font-bold text-[#17648B] shadow-[1px_1px_0px_#2587B8]">
                ✦ Attendance
              </span>
              <span className="rounded-full border-2 border-[#A3D995] bg-[#E8F5DF] px-3 py-1 font-heading text-xs font-bold text-[#226E30] shadow-[1px_1px_0px_#62A66C]">
                ✦ Timetable
              </span>
              <span className="rounded-full border-2 border-[#F7D37E] bg-[#FFF0C9] px-3 py-1 font-heading text-xs font-bold text-[#995E05] shadow-[1px_1px_0px_#E89D42]">
                ✦ Assignments
              </span>
              <span className="rounded-full border-2 border-[#F5A3BA] bg-[#FCE4EB] px-3 py-1 font-heading text-xs font-bold text-[#C22B58] shadow-[1px_1px_0px_#E87999]">
                ✦ Doubts & QA
              </span>
              <span className="rounded-full border-2 border-[#B7A4E8] bg-[#DCD2F5] px-3 py-1 font-heading text-xs font-bold text-[#463378] shadow-[1px_1px_0px_#7860B8]">
                ✦ Study Notes
              </span>
            </div>
          </div>

          {/* Educational Showcase Cards inspired by Reference Image 1 problem cards */}
          <div className="mt-6 space-y-3.5">
            <div className="flex items-center gap-4 rounded-2xl border-2 border-[#62A66C]/30 bg-[#E8F5DF]/70 p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.05)]">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#62A66C] font-heading font-bold text-white shadow-xs">
                01
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-sm font-bold text-[#302365]">
                  Real-time Attendance Tracking
                </h3>
                <p className="text-xs text-[#302365]/70">
                  Stay updated on required class credits and attendance quotas.
                </p>
              </div>
              <SpeechBubbleTag className="bg-white text-[10px]">
                Always on track! 🎯
              </SpeechBubbleTag>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border-2 border-[#E89D42]/30 bg-[#FFF0C9]/70 p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.05)]">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E89D42] font-heading font-bold text-white shadow-xs">
                02
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-sm font-bold text-[#302365]">
                  Instant Assignment Submissions
                </h3>
                <p className="text-xs text-[#302365]/70">
                  Direct submission links, grading reviews, and teacher feedback.
                </p>
              </div>
              <DoodleMascot className="h-10 w-10 shrink-0" />
            </div>
          </div>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-10 mt-8 flex items-center justify-between border-t-2 border-[#302365]/10 pt-4 text-xs font-medium text-[#302365]/70">
          <div className="flex items-center gap-2">
            <DoodleHeart className="h-5 w-5" />
            <span>Built for academic excellence & collaborative learning</span>
          </div>
          <span className="font-heading font-bold">© {new Date().getFullYear()} College ERP</span>
        </div>
      </div>

      {/* Right panel — Form in cozy scrapbook card */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:col-span-5">
        <div className="w-full max-w-md rounded-3xl border-2 border-[#302365]/15 bg-white p-6 shadow-[6px_6px_0px_rgba(48,35,101,0.1)] sm:p-8">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#302365]/15 bg-[#FFF6D8] px-3 py-1 font-heading text-xs font-bold text-[#302365]">
              <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>Campus Gateway</span>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-[#302365] sm:text-3xl">
              Sign In 🎒
            </h2>
            <p className="mt-1 text-sm font-medium text-[#302365]/70">
              Welcome back! Enter your college credentials.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="College Email"
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

            <div className="flex items-center justify-between text-xs">
              <a
                href="/forgot-password"
                className="font-heading font-bold text-[#2587B8] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              className="w-full text-base py-2.5"
            >
              Sign In to Portal →
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#302365]/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="rounded-full border border-[#302365]/15 bg-[#FFFDF7] px-3 py-0.5 font-heading font-bold text-[#302365]/60">
                OR
              </span>
            </div>
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={() => {
              const base = import.meta.env.VITE_API_URL as string;
              window.location.href = `${base}/oauth2/authorization/google`;
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#302365]/20 bg-white px-4 py-2.5 font-heading text-sm font-bold text-[#302365] transition hover:bg-[#FFF6D8] hover:border-[#302365]/40 shadow-[2px_2px_0px_rgba(48,35,101,0.06)] active:translate-y-0.5 cursor-pointer"
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

          {import.meta.env.VITE_API_URL && (
            <p className="mt-5 text-center text-[11px] font-medium text-[#302365]/40 truncate">
              Connecting to {import.meta.env.VITE_API_URL}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};