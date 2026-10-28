import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, MapPin, User as UserIcon } from 'lucide-react';
import type { AxiosError } from 'axios';
import { addTimetableEntry, getTimetableByBranchAndSemester } from '@/api/timetable';
import { getBranches, getSubjects, getTeachers } from '@/api/admin';
import type { BranchResponse, SubjectLiteResponse, TeacherProfileResponse } from '@/types/users';
import type { Day } from '@/types/timetable';
import { DAYS } from '@/types/timetable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const schema = z
  .object({
    branchId: z.string().uuid('Select a branch'),
    semester: z.number().min(1).max(8),
    subjectId: z.string().uuid('Select a subject'),
    teacherId: z.string().uuid('Select a teacher'),
    day: z.enum([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    roomNumber: z.string().min(1, 'Room number required'),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });
type FormData = z.infer<typeof schema>;

interface ApiError {
  error?: string;
  message?: string;
}

// "09:00" → "09:00:00"
const toBackendTime = (t: string) => (t.length === 5 ? `${t}:00` : t);

export const AdminTimetablePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  // Filters — what the admin wants to view in the grid
  const [viewBranch, setViewBranch] = useState<string>('');
  const [viewSemester, setViewSemester] = useState<number>(1);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!token,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
    enabled: !!token,
  });

  // Effective view branch — default to first branch once loaded
  const effectiveViewBranch = viewBranch || branches?.[0]?.id || '';

  // Real API call for entries in the current view
  const {
    data: entries = [],
    isLoading: loadingEntries,
    isFetching,
  } = useQuery({
    queryKey: ['timetable', effectiveViewBranch, viewSemester],
    queryFn: () =>
      getTimetableByBranchAndSemester(effectiveViewBranch, viewSemester),
    enabled: !!token && !!effectiveViewBranch,
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { semester: 1, day: 'MONDAY' },
  });

  const watchedBranch = watch('branchId');
  const watchedSemester = watch('semester');

  const { data: subjects } = useQuery({
    queryKey: ['subjects', watchedBranch, watchedSemester],
    queryFn: () => getSubjects(watchedBranch, watchedSemester),
    enabled: !!token && !!watchedBranch && !!watchedSemester,
  });

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      addTimetableEntry({
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        branchId: data.branchId,
        semester: data.semester,
        roomNumber: data.roomNumber,
        day: data.day,
        startTime: toBackendTime(data.startTime),
        endTime: toBackendTime(data.endTime),
      }),
    onSuccess: (_res, variables) => {
      toast.success('Timetable entry added');

      // If the admin is currently viewing the branch+semester they just added to,
      // refetch the grid immediately.
      if (
        variables.branchId === effectiveViewBranch &&
        variables.semester === viewSemester
      ) {
        qc.invalidateQueries({
          queryKey: ['timetable', effectiveViewBranch, viewSemester],
        });
      } else {
        // Otherwise, just announce that it was added elsewhere
        toast.info(
          `Entry added for Semester ${variables.semester}. Switch the view to see it.`
        );
      }

      reset({ semester: 1, day: 'MONDAY' });
      setAddOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      let msg = raw || 'Failed to add timetable entry';
      if (raw.toLowerCase().includes('duplicate')) {
        msg = 'This time slot conflicts with an existing entry.';
      } else if (raw.length > 200) {
        msg = 'Invalid timetable entry.';
      }
      console.error('add-timetable failed:', e.response?.data);
      toast.error(msg);
    },
  });

  const onSubmit = (d: FormData) => addMutation.mutate(d);

  const DAY_THEMES: Record<string, { bg: string; border: string; pill: string }> = {
    MONDAY: { bg: 'bg-[#DFF2FC]/40', border: 'border-[#2587B8]/30', pill: 'bg-[#DFF2FC] text-[#2587B8]' },
    TUESDAY: { bg: 'bg-[#E8F5DF]/40', border: 'border-[#62A66C]/30', pill: 'bg-[#E8F5DF] text-[#62A66C]' },
    WEDNESDAY: { bg: 'bg-[#FFF0C9]/40', border: 'border-[#E89D42]/30', pill: 'bg-[#FFF0C9] text-[#B87114]' },
    THURSDAY: { bg: 'bg-[#FCE4EB]/40', border: 'border-[#E87999]/30', pill: 'bg-[#FCE4EB] text-[#E87999]' },
    FRIDAY: { bg: 'bg-[#DCD2F5]/40', border: 'border-[#7860B8]/30', pill: 'bg-[#DCD2F5] text-[#7860B8]' },
    SATURDAY: { bg: 'bg-[#FFF6D8]/60', border: 'border-[#302365]/20', pill: 'bg-[#FFF6D8] text-[#302365]' },
    SUNDAY: { bg: 'bg-[#E8F5DF]/40', border: 'border-[#62A66C]/30', pill: 'bg-[#E8F5DF] text-[#62A66C]' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Schedule weekly classes by branch, semester, day and room assignment."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="grid gap-3 rounded-2xl border-2 border-[#302365]/10 bg-white p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Branch"
          value={effectiveViewBranch}
          onChange={(e) => setViewBranch(e.target.value)}
        >
          {branches?.map((b: BranchResponse) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Semester"
          value={viewSemester}
          onChange={(e) => setViewSemester(Number(e.target.value))}
        >
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      {loadingEntries ? (
        <Loader />
      ) : !entries.length ? (
        <EmptyState
          title="No classes scheduled"
          subtitle="Add the first entry for this branch and semester."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => {
            const dayEntries = entries
              .filter((e) => e.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const theme = DAY_THEMES[day] ?? { bg: 'bg-white', border: 'border-[#302365]/10', pill: 'bg-slate-100' };

            return (
              <div
                key={day}
                className={`rounded-2xl border-2 p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] ${theme.bg} ${theme.border}`}
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#302365]" />
                    <h3 className="font-heading font-bold capitalize text-[#302365]">
                      {day.toLowerCase()}
                    </h3>
                  </div>
                  {dayEntries.length > 0 && (
                    <span className="rounded-full border border-[#302365]/15 bg-white/80 px-2 py-0.5 font-heading text-xs font-bold text-[#302365]">
                      {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                    </span>
                  )}
                </div>

                {dayEntries.length === 0 ? (
                  <p className="py-4 text-center text-xs italic text-[#302365]/50">No classes scheduled</p>
                ) : (
                  <ul className="space-y-2.5">
                    {dayEntries.map((e) => (
                      <li
                        key={e.id}
                        className="rounded-xl border border-[#302365]/10 bg-white/90 p-3 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 font-heading font-semibold text-[#2587B8]">
                          <Clock className="h-3.5 w-3.5" />
                          {e.startTime.slice(0, 5)} – {e.endTime.slice(0, 5)}
                        </div>
                        <p className="mt-1.5 font-heading font-bold text-[#302365]">
                          <Badge variant="info">{e.subject.code}</Badge>{' '}
                          <span className="ml-1">{e.subject.name.trim()}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[#302365]/70">
                          <UserIcon className="h-3.5 w-3.5 text-[#302365]/50" />
                          <span>{e.teacher.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[#302365]/70">
                          <MapPin className="h-3.5 w-3.5 text-[#302365]/50" />
                          <span>Room: {e.roomNumber}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isFetching && !loadingEntries && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}

      {/* Add Entry modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Timetable Entry"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Branch"
              {...register('branchId')}
              error={errors.branchId?.message}
            >
              <option value="">— Select branch —</option>
              {branches?.map((b: BranchResponse) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </Select>

            <Select
              label="Semester"
              {...register('semester', { valueAsNumber: true })}
              error={errors.semester?.message}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </Select>

            <Select
              label="Subject"
              {...register('subjectId')}
              error={errors.subjectId?.message}
              disabled={!watchedBranch}
            >
              <option value="">
                {!watchedBranch ? 'Pick a branch first' : '— Select subject —'}
              </option>
              {subjects?.map((s: SubjectLiteResponse) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>

            <Select
              label="Teacher"
              {...register('teacherId')}
              error={errors.teacherId?.message}
            >
              <option value="">— Select teacher —</option>
              {teachers?.map((t: TeacherProfileResponse) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.employeeId ? ` (${t.employeeId})` : ''}
                </option>
              ))}
            </Select>

            <Select label="Day" {...register('day')} error={errors.day?.message}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>

            <Input
              label="Room Number"
              placeholder="CR 303"
              {...register('roomNumber')}
              error={errors.roomNumber?.message}
            />

            <Input
              label="Start Time"
              type="time"
              {...register('startTime')}
              error={errors.startTime?.message}
            />

            <Input
              label="End Time"
              type="time"
              {...register('endTime')}
              error={errors.endTime?.message}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending}>
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};