import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, UserPlus, BookOpen } from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  addSubject,
  assignTeacher,
  getBranches,
  getSubjects,
  getTeachers,
} from '@/api/admin';
import type { BranchResponse, SubjectLiteResponse } from '@/types/users';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z
    .string()
    .min(2, 'Subject code is required')
    .max(12)
    .regex(/^[A-Z0-9-]+$/i, 'Only letters, digits and hyphens'),
  credits: z.number().min(0).max(10).optional(),
});
type FormData = z.infer<typeof schema>;

const branchIdOf = (b: BranchResponse) => b.id;
const subjectIdOf = (s: SubjectLiteResponse) => s.id;

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface ApiError {
  error?: string;
  message?: string;
}

export const AdminSubjectsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [branchId, setBranchId] = useState<string>('');
  const [semester, setSemester] = useState<number>(1);
  const [addOpen, setAddOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<SubjectLiteResponse | null>(null);
  const [pickedTeacher, setPickedTeacher] = useState<string>('');

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!token,
  });

  const effectiveBranchId = useMemo(
    () => branchId || (branches?.[0] ? branchIdOf(branches[0]) : ''),
    [branchId, branches]
  );

  const {
    data: subjects,
    isLoading: loadingSubjects,
    isFetching,
  } = useQuery({
    queryKey: ['subjects', effectiveBranchId, semester],
    queryFn: () => getSubjects(effectiveBranchId, semester),
    enabled: !!token && !!effectiveBranchId,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      addSubject(effectiveBranchId, {
        name: data.name,
        code: data.code,
        semester,
        credits: data.credits,
      }),
    onSuccess: () => {
      toast.success('Subject added');
      qc.invalidateQueries({ queryKey: ['subjects', effectiveBranchId, semester] });
      reset();
      setAddOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const msg = raw.toLowerCase().includes('duplicate')
        ? 'A subject with this code already exists for this branch.'
        : raw || 'Failed to add subject';
      console.error('add-subject failed:', e.response?.data);
      toast.error(msg);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ subjectId, teacherId }: { subjectId: string; teacherId: string }) =>
      assignTeacher(subjectId, teacherId),
    onSuccess: () => {
      toast.success('Teacher assigned');
      qc.invalidateQueries({ queryKey: ['subjects', effectiveBranchId, semester] });
      setAssignFor(null);
      setPickedTeacher('');
    },
    onError: (e: AxiosError<ApiError>) => {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Failed to assign teacher';
      toast.error(String(msg));
    },
  });

  const onSubmit = (data: FormData) => {
    if (!effectiveBranchId) {
      toast.error('Pick a branch first');
      return;
    }
    addMutation.mutate(data);
  };

  const handleAssignConfirm = () => {
    if (!assignFor || !pickedTeacher) {
      toast.error('Pick a teacher');
      return;
    }
    assignMutation.mutate({
      subjectId: subjectIdOf(assignFor),
      teacherId: pickedTeacher,
    });
  };

  const renderDesktopTable = () => (
    <div className="hidden md:block">
      <Table>
        <THead>
          <TR>
            <TH>Code</TH>
            <TH>Name</TH>
            <TH>Teacher</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {subjects!.map((s) => (
            <TR key={s.id}>
              <TD>
                <Badge variant="info">{s.code}</Badge>
              </TD>
              <TD className="font-medium">{s.name}</TD>
              <TD>
                {s.teacher ? (
                  <div className="flex flex-col">
                    <span className="text-slate-700">{s.teacher.name}</span>
                    <span className="text-xs text-slate-400">
                      {s.teacher.employeeId ?? s.teacher.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-400">Unassigned</span>
                )}
              </TD>
              <TD className="text-right">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAssignFor(s);
                    setPickedTeacher(s.teacher?.id ?? '');
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-3 md:hidden">
      {subjects!.map((s) => (
        <Card key={s.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Badge variant="info">{s.code}</Badge>
                <p className="mt-1.5 truncate font-semibold text-slate-800">
                  {s.name.trim()}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAssignFor(s);
                  setPickedTeacher(s.teacher?.id ?? '');
                }}
                className="shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign
              </Button>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2">
              {s.teacher ? (
                <div className="flex items-center gap-2 text-sm">
                  <UserPlus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-700">
                      {s.teacher.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {s.teacher.employeeId ?? s.teacher.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">No teacher assigned</p>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects per branch and semester, and assign teachers."
        action={
          <Button onClick={() => setAddOpen(true)} disabled={!effectiveBranchId}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Branch"
          value={effectiveBranchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          {branches?.map((b, i) => (
            <option key={branchIdOf(b) || i} value={branchIdOf(b)}>
              {b.code} — {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Semester"
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value))}
        >
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </Select>
      </div>

      {loadingSubjects ? (
        <Loader />
      ) : !subjects?.length ? (
        <EmptyState
          title="No subjects yet"
          subtitle="Add the first subject for this branch and semester."
        />
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileCards()}
        </>
      )}

      {isFetching && !loadingSubjects && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Subject">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <BookOpen className="mr-1 inline h-3 w-3" />
            Adding to:{' '}
            <strong>
              {branches?.find((b) => branchIdOf(b) === effectiveBranchId)?.code} · Semester{' '}
              {semester}
            </strong>
          </div>

          <Input
            label="Subject Name"
            placeholder="Java Programming"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Subject Code"
            placeholder="CS-301"
            {...register('code')}
            error={errors.code?.message}
          />
          <Input
            label="Credits (optional)"
            type="number"
            placeholder="4"
            {...register('credits', { valueAsNumber: true })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!assignFor}
        onClose={() => {
          setAssignFor(null);
          setPickedTeacher('');
        }}
        title="Assign Teacher"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="text-slate-500">Subject</p>
            <p className="font-medium text-slate-800">
              {assignFor?.code} — {assignFor?.name}
            </p>
          </div>

          <Select
            label="Teacher"
            value={pickedTeacher}
            onChange={(e) => setPickedTeacher(e.target.value)}
          >
            <option value="">— Select teacher —</option>
            {teachers?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.designation ? ` · ${t.designation}` : ''}
                {t.department ? ` (${t.department})` : ''}
              </option>
            ))}
          </Select>

          {!teachers?.length && (
            <p className="text-xs text-amber-600">
              No teachers found. Add teachers first from the Teachers page.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAssignFor(null);
                setPickedTeacher('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignConfirm}
              loading={assignMutation.isPending}
              disabled={!pickedTeacher}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};