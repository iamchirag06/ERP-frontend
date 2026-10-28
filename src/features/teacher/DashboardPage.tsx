import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '@/api/dashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { Users, FileText, Bell, ClipboardCheck, Upload, BookOpen, ArrowRight } from 'lucide-react';
import { NumberBadge, SparkleIcon, SpeechBubbleTag } from '@/components/ui/Illustrations';

export const TeacherDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;

  const stats = [
    {
      num: '01',
      badgeColor: 'blue' as const,
      label: 'Enrolled Students',
      value: data?.totalStudents ?? 0,
      icon: Users,
      cardBg: 'border-[#2587B8]/30 bg-[#DFF2FC]/60 hover:border-[#2587B8]',
      iconBg: 'border-[#99D4F2] bg-[#DFF2FC] text-[#2587B8]',
      href: '/teacher/subjects',
      hint: 'Across all assigned subjects',
    },
    {
      num: '02',
      badgeColor: 'yellow' as const,
      label: 'Pending Submissions',
      value: data?.ungradedAssignments ?? 0,
      icon: FileText,
      cardBg: 'border-[#E89D42]/30 bg-[#FFF0C9]/60 hover:border-[#E89D42]',
      iconBg: 'border-[#F7D37E] bg-[#FFF0C9] text-[#995E05]',
      href: '/teacher/assignments',
      hint: 'Awaiting evaluation & marks',
    },
    {
      num: '03',
      badgeColor: 'green' as const,
      label: 'Active Notices',
      value: data?.activeNotices ?? 0,
      icon: Bell,
      cardBg: 'border-[#62A66C]/30 bg-[#E8F5DF]/60 hover:border-[#62A66C]',
      iconBg: 'border-[#A3D995] bg-[#E8F5DF] text-[#226E30]',
      href: '/teacher/notices',
      hint: 'Broadcasted to your batches',
    },
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      desc: 'Take roll call for today',
      icon: ClipboardCheck,
      to: '/teacher/attendance',
      badgeBg: 'bg-[#62A66C] text-white',
    },
    {
      title: 'Assignments & Grading',
      desc: 'Create tasks & review student work',
      icon: FileText,
      to: '/teacher/assignments',
      badgeBg: 'bg-[#2587B8] text-white',
    },
    {
      title: 'Upload Study Material',
      desc: 'Share lecture notes, slides & PDFs',
      icon: Upload,
      to: '/teacher/resources',
      badgeBg: 'bg-[#E87999] text-white',
    },
    {
      title: 'Class Notice Board',
      desc: 'Post updates and exam schedules',
      icon: Bell,
      to: '/teacher/notices',
      badgeBg: 'bg-[#E89D42] text-white',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`Welcome, Prof. ${user?.name?.split(' ')[0] ?? 'Teacher'}! 📚`}
          subtitle="Overview of your classroom lectures, attendance, and coursework review."
        />
        <div className="hidden lg:block">
          <SpeechBubbleTag className="bg-white">
            Faculty Workspace ✨
          </SpeechBubbleTag>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ num, badgeColor, label, value, icon: Icon, cardBg, iconBg, href, hint }) => (
          <Link key={label} to={href} className="group">
            <div
              className={`rounded-3xl border-2 p-5 transition-all duration-200 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] group-hover:-translate-y-1 group-hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)] ${cardBg}`}
            >
              <div className="flex items-start justify-between">
                <NumberBadge number={num} color={badgeColor} />
                <div
                  className={`grid h-10 w-10 place-items-center rounded-2xl border-2 shadow-xs ${iconBg}`}
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
        ))}
      </div>

      {/* Quick classroom actions */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold tracking-tight text-[#302365]">
              Teaching Shortcuts
            </h2>
            <SparkleIcon className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xs font-semibold text-[#302365]/60">
            Daily faculty workflow
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ title, desc, icon: Icon, to, badgeBg }) => (
            <Link key={to} to={to} className="group">
              <div className="flex flex-col justify-between rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.05)] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]">
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl shadow-xs ${badgeBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#302365]/40 transition group-hover:translate-x-1 group-hover:text-[#302365]" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-[#302365]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[#302365]/70">
                    {desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};