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

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule classes by branch, semester, day and time slot."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => {
            const dayEntries = entries
              .filter((e) => e.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-semibold capitalize text-slate-800">
                    {day.toLowerCase()}
                  </h3>
                  {dayEntries.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400">
                      {dayEntries.length}
                    </span>
                  )}
                </div>

                {dayEntries.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No classes</p>
                ) : (
                  <ul className="space-y-2">
                    {dayEntries.map((e) => (
                      <li
                        key={e.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="h-3 w-3" />
                          {e.startTime.slice(0, 5)}–{e.endTime.slice(0, 5)}
                        </div>
                        <p className="mt-1 font-medium text-slate-800">
                          <Badge variant="info">{e.subject.code}</Badge>{' '}
                          {e.subject.name.trim()}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                          <UserIcon className="h-3 w-3" />
                          {e.teacher.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {e.roomNumber}
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