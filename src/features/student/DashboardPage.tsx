import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  BookOpen,
  Bell,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { getDashboardStats } from '@/api/dashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export const StudentDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;

  const attendance = data?.attendancePercentage ?? 0;
  const attendanceColor =
    attendance >= 75 ? 'emerald' : attendance >= 60 ? 'amber' : 'red';

  const stats = [
    {
      label: 'Attendance',
      value: `${attendance.toFixed(1)}%`,
      icon: ClipboardCheck,
      color: attendanceColor,
      href: '/student/attendance',
      hint:
        attendance >= 75
          ? 'Above minimum requirement'
          : attendance >= 60
          ? 'Below 75% — be careful'
          : 'Critically low — contact your advisor',
    },
    {
      label: 'Pending Assignments',
      value: data?.pendingAssignments ?? 0,
      icon: BookOpen,
      color: (data?.pendingAssignments ?? 0) > 0 ? 'amber' : 'slate',
      href: '/student/assignments',
      hint:
        (data?.pendingAssignments ?? 0) > 0
          ? 'You have work to submit'
          : 'All caught up!',
    },
    {
      label: 'Active Notices',
      value: data?.activeNotices ?? 0,
      icon: Bell,
      color: 'indigo',
      href: '/student/notifications',
      hint: 'From teachers and admin',
    },
  ];

  const quickLinks = [
    {
      title: 'My Timetable',
      description: "See this week's classes",
      href: '/student/timetable',
      icon: Calendar,
      color: 'indigo',
    },
    {
      title: 'Ask a Doubt',
      description: 'Get help from teachers',
      href: '/student/doubts',
      icon: AlertCircle,
      color: 'violet',
    },
    {
      title: 'Study Materials',
      description: 'Notes, PDFs and slides',
      href: '/student/resources',
      icon: BookOpen,
      color: 'emerald',
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'Student'} 👋`}
        subtitle="Here's a quick overview of your academic activity."
      />

      {/* Stats grid */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color, href, hint }) => (
          <Link key={label} to={href} className="group">
            <Card className="transition hover:border-indigo-200 hover:shadow-md">
              <CardBody className="flex items-start gap-3 sm:gap-4">
                <div
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12',
                    color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                    color === 'amber' && 'bg-amber-50 text-amber-600',
                    color === 'red' && 'bg-red-50 text-red-600',
                    color === 'indigo' && 'bg-indigo-50 text-indigo-600',
                    color === 'slate' && 'bg-slate-50 text-slate-500'
                  )}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-500">{label}</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{hint}</p>
                </div>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500 sm:block" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Attendance progress bar */}
      <Card className="mt-5 sm:mt-6">
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-800">
                  Overall Attendance
                </h3>
                <p className="text-xs text-slate-500">
                  Minimum requirement is 75%
                </p>
              </div>
            </div>
            <p
              className={cn(
                'text-2xl font-bold sm:text-3xl',
                attendance >= 75
                  ? 'text-emerald-600'
                  : attendance >= 60
                  ? 'text-amber-600'
                  : 'text-red-600'
              )}
            >
              {attendance.toFixed(1)}%
            </p>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                attendance >= 75
                  ? 'bg-emerald-500'
                  : attendance >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${Math.min(attendance, 100)}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>0%</span>
            <span className="font-medium text-slate-500">75% threshold</span>
            <span>100%</span>
          </div>
        </CardBody>
      </Card>

      {/* Quick links */}
      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 sm:mt-8">
        Quick Actions
      </h2>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ title, description, href, icon: Icon, color }) => (
          <Link key={href} to={href} className="group">
            <Card className="transition hover:border-indigo-200 hover:shadow-md">
              <CardBody>
                <div
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-lg',
                    color === 'indigo' && 'bg-indigo-50 text-indigo-600',
                    color === 'violet' && 'bg-violet-50 text-violet-600',
                    color === 'emerald' && 'bg-emerald-50 text-emerald-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-800 group-hover:text-indigo-600">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};