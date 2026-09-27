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
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';

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
        `Attendance saved — ${presentCount} present, ${absentIds.size} absent`
      );
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const lower = raw.toLowerCase();

      let msg = raw || 'Failed to save attendance';

      if (lower.includes('duplicate') || lower.includes('already exists')) {
        msg = `Attendance for ${formatDate(date)} has already been marked for this subject.`;
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
    <div>
      <PageHeader
        title="Mark Attendance"
        subtitle="Take roll call for your classes."
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:mb-5 sm:grid-cols-2">
        <Select
          label="Subject"
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
          label="Date"
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
        <Card>
          <CardBody>
            {alreadyMarked && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Attendance already recorded</p>
                  <p className="mt-0.5 text-amber-700">
                    Attendance for {formatDate(date)} has already been saved.
                  </p>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {totalCount} {totalCount === 1 ? 'student' : 'students'}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-emerald-600">
                      {presentCount} present
                    </span>{' '}
                    ·{' '}
                    <span className="font-medium text-red-600">
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
                  <CheckCircle2 className="h-4 w-4" />
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={markAllAbsent}
                  disabled={alreadyMarked}
                  className="flex-1 sm:flex-initial"
                >
                  <XCircle className="h-4 w-4" />
                  All Absent
                </Button>
              </div>
            </div>

            {/* Student list */}
            <ul className="divide-y divide-slate-100">
              {roster.map((s) => {
                const isAbsent = absentIds.has(s.studentId);
                return (
                  <li
                    key={s.studentId}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {s.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {s.rollNo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(s.studentId)}
                      disabled={alreadyMarked}
                      className={cn(
                        'shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isAbsent
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      )}
                    >
                      {isAbsent ? 'Absent' : 'Present'}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Save bar */}
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Marking for {formatDate(date)}
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!roster.length || saveMutation.isSuccess || alreadyMarked}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isSuccess
                  ? 'Saved'
                  : alreadyMarked
                  ? 'Already Marked'
                  : 'Save Attendance'}
              </Button>
            </div>

            {isFetching && !loadingRoster && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Refreshing…
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};