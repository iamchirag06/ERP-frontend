import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/dashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { Users, FileText, Bell } from 'lucide-react';

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
      label: 'Total Students',
      value: data?.totalStudents ?? 0,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Ungraded Assignments',
      value: data?.ungradedAssignments ?? 0,
      icon: FileText,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Active Notices',
      value: data?.activeNotices ?? 0,
      icon: Bell,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'Teacher'}`}
        subtitle="Overview of your classes and pending work."
      />
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-4">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};