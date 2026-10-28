import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { getMySubjects } from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { SparkleIcon } from '@/components/ui/Illustrations';

export const TeacherSubjectsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: getMySubjects,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Subjects 📖"
        subtitle="Course curriculum and departments assigned to your teaching schedule."
      />

      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned yet"
          subtitle="Contact your department head or admin to map subjects to your schedule."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="info">{s.code}</Badge>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#302365]/15 bg-[#FFF6D8] text-[#302365]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="mt-3 font-heading text-lg font-bold text-[#302365]">
                  {s.name.trim()}
                </h3>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#302365]/70">
                  <Badge variant="success">Sem {s.semester}</Badge>
                  <Badge variant="lavender">
                    {s.branchCode} — {s.branchName}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};