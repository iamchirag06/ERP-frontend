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
import {
  DoodleLaptop,
  SparkleIcon,
  SpeechBubbleTag,
  NumberBadge,
} from '@/components/ui/Illustrations';

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
  const isSafeAttendance = attendance >= 75;

  const stats = [
    {
      num: '01',
      badgeColor: 'green' as const,
      label: 'Overall Attendance',
      value: `${attendance.toFixed(1)}%`,
      icon: ClipboardCheck,
      cardBg: 'bg-[#E8F5DF]/60 border-[#62A66C]/30 hover:border-[#62A66C]',
      iconBg: 'bg-[#E8F5DF] text-[#226E30] border-2 border-[#A3D995]',
      href: '/student/attendance',
      hint:
        attendance >= 75
          ? 'Great job! Above threshold'
          : attendance >= 60
          ? 'Warning: Below 75% goal'
          : 'Low: Please meet your mentor',
    },
    {
      num: '02',
      badgeColor: 'yellow' as const,
      label: 'Pending Tasks',
      value: data?.pendingAssignments ?? 0,
      icon: BookOpen,
      cardBg: 'bg-[#FFF0C9]/60 border-[#E89D42]/30 hover:border-[#E89D42]',
      iconBg: 'bg-[#FFF0C9] text-[#995E05] border-2 border-[#F7D37E]',
      href: '/student/assignments',
      hint:
        (data?.pendingAssignments ?? 0) > 0
          ? 'Coursework awaiting submission'
          : 'All caught up! Excellent! 🎉',
    },
    {
      num: '03',
      badgeColor: 'purple' as const,
      label: 'Campus Notices',
      value: data?.activeNotices ?? 0,
      icon: Bell,
      cardBg: 'bg-[#DCD2F5]/60 border-[#7860B8]/30 hover:border-[#7860B8]',
      iconBg: 'bg-[#DCD2F5] text-[#463378] border-2 border-[#B7A4E8]',
      href: '/student/notifications',
      hint: 'Announcements from teachers',
    },
  ];

  const quickLinks = [
    {
      title: 'Weekly Timetable',
      description: "Class schedule & lecture halls",
      href: '/student/timetable',
      icon: Calendar,
      cardBg: 'bg-[#DFF2FC]/50 border-[#2587B8]/25 hover:border-[#2587B8]',
      badgeColor: 'bg-[#2587B8] text-white',
    },
    {
      title: 'Academic Doubts',
      description: 'Discuss with subject faculty',
      href: '/student/doubts',
      icon: AlertCircle,
      cardBg: 'bg-[#FCE4EB]/50 border-[#E87999]/25 hover:border-[#E87999]',
      badgeColor: 'bg-[#E87999] text-white',
    },
    {
      title: 'Study Repository',
      description: 'Lecture notes, slides & PDFs',
      href: '/student/resources',
      icon: BookOpen,
      cardBg: 'bg-[#E8F5DF]/50 border-[#62A66C]/25 hover:border-[#62A66C]',
      badgeColor: 'bg-[#62A66C] text-white',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`Hi, ${user?.name?.split(' ')[0] ?? 'Student'}! 👋`}
          subtitle="Here's a snapshot of your daily classes and coursework."
        />
        <div className="hidden lg:block">
          <SpeechBubbleTag className="bg-white">
            Semester in Progress 🚀
          </SpeechBubbleTag>
        </div>
      </div>

      {/* Stats grid inspired by problem cards in Reference Image 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(
          ({ num, badgeColor, label, value, icon: Icon, cardBg, iconBg, href, hint }) => (
            <Link key={label} to={href} className="group">
              <div
                className={cn(
                  'rounded-3xl border-2 p-5 transition-all duration-200 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] group-hover:-translate-y-1 group-hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]',
                  cardBg
                )}
              >
                <div className="flex items-start justify-between">
                  <NumberBadge number={num} color={badgeColor} />
                  <div
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-2xl shadow-xs',
                      iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/70">
                    {label}
                  </p>
                  <p className="mt-1 font-heading text-3xl font-extrabold text-[#302365]">
                    {value}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-[#302365]/10 pt-2.5 text-xs font-medium text-[#302365]/80">
                    <span className="truncate">{hint}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )
        )}
      </div>

      {/* Attendance meter card */}
      <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-xs">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-bold text-[#302365]">
                  Attendance Status
                </h3>
                <SparkleIcon className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xs font-medium text-[#302365]/70">
                Minimum required threshold is 75% for exam eligibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SpeechBubbleTag
              className={cn(
                isSafeAttendance
                  ? 'bg-[#E8F5DF] text-[#226E30]'
                  : 'bg-[#FCE4EB] text-[#C22B58]'
              )}
            >
              {isSafeAttendance ? 'Safe Zone! 🎉' : 'Needs Attention! ⚠️'}
            </SpeechBubbleTag>
            <span className="font-heading text-3xl font-extrabold text-[#302365]">
              {attendance.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress bar with playful borders */}
        <div className="mt-5 h-4 w-full overflow-hidden rounded-full border-2 border-[#302365]/20 bg-[#FFF6D8] p-0.5">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              attendance >= 75
                ? 'bg-[#62A66C]'
                : attendance >= 60
                ? 'bg-[#E89D42]'
                : 'bg-[#E87999]'
            )}
            style={{ width: `${Math.min(attendance, 100)}%` }}
          />
        </div>

        <div className="mt-2.5 flex justify-between text-xs font-heading font-semibold text-[#302365]/60">
          <span>0%</span>
          <span className="rounded-md border border-[#302365]/20 bg-[#FFF0C9] px-2 py-0.5 text-[#302365]">
            75% Target Mark
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Quick links inspired by Reference Image 2 pill tags */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight text-[#302365]">
            Quick Shortcuts
          </h2>
          <span className="text-xs font-medium text-[#302365]/60">
            Frequently used tools
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ title, description, href, icon: Icon, cardBg, badgeColor }) => (
            <Link key={href} to={href} className="group">
              <div
                className={cn(
                  'rounded-3xl border-2 p-5 transition-all duration-200 shadow-[3px_3px_0px_rgba(48,35,101,0.05)] group-hover:-translate-y-1 group-hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)] bg-white',
                  cardBg
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-2xl shadow-xs',
                      badgeColor
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#302365]/40 transition group-hover:translate-x-1 group-hover:text-[#302365]" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-[#302365]">
                  {title}
                </h3>
                <p className="mt-1 text-xs font-medium text-[#302365]/70">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};