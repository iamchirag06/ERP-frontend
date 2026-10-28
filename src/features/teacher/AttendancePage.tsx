import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Save, Calendar, Users, AlertTriangle } from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getAttendanceRoster,
  getAttendanceSubjects,
  markAttendance,
} from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';
import { SparkleIcon } from '@/components/ui/Illustrations';

interface ApiError {
  error?: string;
  message?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const TeacherAttendancePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const [subjectId, setSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(today());
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['attendance-subjects'],
    queryFn: getAttendanceSubjects,
    enabled: !!token,
  });

  const effectiveSubjectId = useMemo(
    () => subjectId || subjects?.[0]?.subjectId || '',
    [subjectId, subjects]
  );

  const {
    data: roster,
    isLoading: loadingRoster,
    isFetching,
  } = useQuery({
    queryKey: ['attendance-roster', effectiveSubjectId],
    queryFn: () => getAttendanceRoster(effectiveSubjectId),
    enabled: !!token && !!effectiveSubjectId,
  });

  useEffect(() => {
    setAbsentIds(new Set());
  }, [effectiveSubjectId, roster]);

  const toggle = (id: string) => {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllPresent = () => setAbsentIds(new Set());
  const markAllAbsent = () => {
    if (!roster) return;
    setAbsentIds(new Set(roster.map((s) => s.studentId)));
  };

  const presentCount = (roster?.length ?? 0) - absentIds.size;
  const totalCount = roster?.length ?? 0;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!effectiveSubjectId || !roster) {
        throw new Error('Missing subject or roster');
      }
      const presentStudentIds = roster
        .map((s) => s.studentId)
        .filter((id) => !absentIds.has(id));

      return markAttendance({
        subjectId: effectiveSubjectId,
        date,
        presentStudentIds,
      });
    },
    onSuccess: () => {
      toast.success(
        `Attendance recorded! 🌟 ${presentCount} present, ${absentIds.size} absent`
      );
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const lower = raw.toLowerCase();

      let msg = raw || 'Failed to save attendance';

      if (lower.includes('duplicate') || lower.includes('already exists')) {
        msg = `Attendance for ${formatDate(date)} has already been recorded for this subject.`;
      } else if (lower.includes('foreign key')) {
        msg = 'Cannot save attendance — some students in the roster no longer exist.';
      } else if (raw.length > 200) {
        msg = 'Invalid attendance data. Check the date and roster, then try again.';
      }

      console.error('mark-attendance failed:', e.response?.data);
      toast.error(msg, { duration: 6000 });
    },
  });

  useEffect(() => {
    saveMutation.reset();
    setAbsentIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, effectiveSubjectId]);

  const alreadyMarked = saveMutation.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Attendance 📋"
        subtitle="Take daily roll call and record classroom presence."
      />

      {/* Select class and date */}
      <div className="grid gap-4 rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:grid-cols-2">
        <Select
          label="Subject & Class"
          value={effectiveSubjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={loadingSubjects || !subjects?.length}
        >
          {!subjects?.length && <option value="">No subjects assigned</option>}
          {subjects?.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>
              {s.code} — {s.name.trim()} (Sem {s.semester})
            </option>
          ))}
        </Select>

        <Input
          label="Attendance Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={today()}
        />
      </div>

      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Ask your admin to assign you a subject before marking attendance."
        />
      ) : loadingRoster ? (
        <Loader />
      ) : !roster?.length ? (
        <EmptyState
          title="No students enrolled"
          subtitle="This subject has no students yet."
        />
      ) : (
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.06)]">
          {alreadyMarked && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border-2 border-[#E89D42]/30 bg-[#FFF0C9] p-3.5 text-xs text-[#995E05]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-heading font-bold">Attendance already recorded</p>
                <p className="mt-0.5 text-xs text-[#995E05]/90">
                  Attendance for {formatDate(date)} has already been saved for this subject.
                </p>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#302365]/8 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-base font-bold text-[#302365]">
                  {totalCount} {totalCount === 1 ? 'Student' : 'Students'} on Roster
                </p>
                <p className="text-xs font-semibold text-[#302365]/70">
                  <span className="font-bold text-[#226E30]">
                    {presentCount} present
                  </span>{' '}
                  ·{' '}
                  <span className="font-bold text-[#C22B58]">
                    {absentIds.size} absent
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={markAllPresent}
                disabled={alreadyMarked}
                className="flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="h-4 w-4 text-[#226E30]" />
                All Present
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={markAllAbsent}
                disabled={alreadyMarked}
                className="flex-1 sm:flex-initial"
              >
                <XCircle className="h-4 w-4 text-[#C22B58]" />
                All Absent
              </Button>
            </div>
          </div>

          {/* Student list */}
          <ul className="divide-y divide-[#302365]/8">
            {roster.map((s) => {
              const isAbsent = absentIds.has(s.studentId);
              return (
                <li
                  key={s.studentId}
                  className="flex items-center gap-3.5 py-3.5 transition-colors hover:bg-[#FFF6D8]/30 px-2 rounded-xl"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#B7A4E8] bg-[#DCD2F5] font-heading text-xs font-bold text-[#302365]">
                    {initials(s.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-bold text-[#302365]">
                      {s.name}
                    </p>
                    <p className="truncate text-xs font-semibold text-[#302365]/60">
                      Roll: {s.rollNo}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(s.studentId)}
                    disabled={alreadyMarked}
                    className={cn(
                      'shrink-0 rounded-xl border-2 px-4 py-1.5 font-heading text-xs font-bold transition duration-150 cursor-pointer shadow-xs',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isAbsent
                        ? 'border-[#E87999] bg-[#FCE4EB] text-[#C22B58] hover:bg-[#fad3dd]'
                        : 'border-[#62A66C] bg-[#E8F5DF] text-[#226E30] hover:bg-[#d8edd0]'
                    )}
                  >
                    {isAbsent ? 'Absent' : 'Present ✦'}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Save bar */}
          <div className="mt-6 flex flex-col gap-3 border-t-2 border-[#302365]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#302365]/70">
              <Calendar className="h-4 w-4 text-[#2587B8]" />
              Recording roll call for {formatDate(date)}
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!roster.length || saveMutation.isSuccess || alreadyMarked}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isSuccess
                ? 'Saved Successfully!'
                : alreadyMarked
                ? 'Already Marked'
                : 'Save Attendance'}
            </Button>
          </div>

          {isFetching && !loadingRoster && (
            <p className="mt-2 text-center font-heading text-xs font-bold text-[#302365]/50">
              Refreshing class roster…
            </p>
          )}
        </div>
      )}
    </div>
  );
};