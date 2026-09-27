import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { getMySubjects } from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';

export const TeacherSubjectsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: getMySubjects,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      <PageHeader
        title="My Subjects"
        subtitle="Subjects assigned to you this semester."
      />

      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Contact your admin to assign you a subject."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <Badge variant="info">{s.code}</Badge>
                    <h3 className="mt-2 truncate font-semibold text-slate-800">
                      {s.name.trim()}
                    </h3>
                  </div>
                  <BookOpen className="h-5 w-5 shrink-0 text-slate-300" />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Semester {s.semester}</span>
                  <span>·</span>
                  <span>
                    {s.branchCode} — {s.branchName}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};