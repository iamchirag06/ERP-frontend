import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  Trash2,
  Users,
  Clock,
  Pencil,
  Paperclip,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  createAssignment,
  deleteAssignment,
  getAssignmentsBySubject,
  updateAssignment,
} from '@/api/assignments';
import { getAttendanceSubjects } from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import type { AssignmentResponse } from '@/types/academic';
import { SubmissionsModal } from './SubmissionsModal';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  deadline: z.string().min(1, 'Deadline is required'),
});
type FormData = z.infer<typeof schema>;

interface ApiError {
  error?: string;
  message?: string;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const toBackendDeadline = (d: string) => (d.length === 16 ? `${d}:00` : d);
const toInputDeadline = (d: string) => d.slice(0, 16);

export const TeacherAssignmentsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [subjectId, setSubjectId] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editFor, setEditFor] = useState<AssignmentResponse | null>(null);
  const [deleting, setDeleting] = useState<AssignmentResponse | null>(null);
  const [submissionsFor, setSubmissionsFor] =
    useState<AssignmentResponse | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: subjects } = useQuery({
    queryKey: ['attendance-subjects'],
    queryFn: getAttendanceSubjects,
    enabled: !!token,
  });

  const effectiveSubjectId = subjectId || subjects?.[0]?.subjectId || '';
  const currentSubject = subjects?.find((s) => s.subjectId === effectiveSubjectId);

  const {
    data: assignments,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['assignments', effectiveSubjectId],
    queryFn: () => getAssignmentsBySubject(effectiveSubjectId),
    enabled: !!token && !!effectiveSubjectId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      createAssignment(
        {
          title: data.title,
          description: data.description,
          deadline: toBackendDeadline(data.deadline),
          subjectId: effectiveSubjectId,
        },
        pickedFile ?? undefined
      ),
    onSuccess: () => {
      toast.success('Assignment created');
      qc.invalidateQueries({ queryKey: ['assignments', effectiveSubjectId] });
      reset();
      setPickedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setCreateOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      console.error('create-assignment failed:', e.response?.data);
      toast.error(
        raw.length > 200
          ? 'Failed to create assignment.'
          : raw || 'Failed to create assignment'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      updateAssignment(id, {
        title: data.title,
        description: data.description,
        deadline: toBackendDeadline(data.deadline),
        subjectId: effectiveSubjectId,
      }),
    onSuccess: () => {
      toast.success('Assignment updated');
      qc.invalidateQueries({ queryKey: ['assignments', effectiveSubjectId] });
      setEditFor(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      toast.error(
        raw.length > 200 ? 'Failed to update assignment.' : raw || 'Failed to update'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      toast.success('Assignment deleted');
      qc.invalidateQueries({ queryKey: ['assignments', effectiveSubjectId] });
      setDeleting(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to delete assignment');
    },
  });

  const onSubmitCreate = (d: FormData) => createMutation.mutate(d);
  const onSubmitEdit = (d: FormData) => {
    if (!editFor) return;
    updateMutation.mutate({ id: editFor.id, data: d });
  };

  const openEdit = (a: AssignmentResponse) => {
    setEditFor(a);
    resetEdit({
      title: a.title,
      description: a.description ?? '',
      deadline: toInputDeadline(a.deadline),
    });
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your subjects."
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!effectiveSubjectId}
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        }
      />

      {/* Subject selector */}
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:mb-5 sm:grid-cols-2">
        <Select
          label="Subject"
          value={effectiveSubjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={!subjects?.length}
        >
          {!subjects?.length && <option value="">No subjects assigned</option>}
          {subjects?.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>
              {s.code} — {s.name.trim()} (Sem {s.semester})
            </option>
          ))}
        </Select>
        {currentSubject && (
          <div className="flex items-end">
            <p className="text-xs text-slate-500">
              {currentSubject.branchName} · Semester {currentSubject.semester}
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Ask your admin to assign you a subject."
        />
      ) : isLoading ? (
        <Loader />
      ) : !assignments?.length ? (
        <EmptyState
          title="No assignments yet"
          subtitle="Create the first assignment for this subject."
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const overdue = new Date(a.deadline).getTime() < Date.now();
            return (
              <Card key={a.id}>
                <CardBody className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    {/* Icon + title (mobile-friendly) */}
                    <div className="flex items-start gap-3 sm:contents">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-11 sm:w-11">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{a.title}</h3>
                          {overdue ? (
                            <Badge variant="danger">Closed</Badge>
                          ) : (
                            <Badge variant="success">Open</Badge>
                          )}
                        </div>

                        {a.description && (
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                            {a.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {formatDateTime(a.deadline)}
                          </span>
                          {a.attachmentUrl && (
                            <a
                              href={a.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-1 sm:flex-col sm:items-stretch">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSubmissionsFor(a)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Submissions
                      </Button>
                      <button
                        onClick={() => openEdit(a)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(a)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPickedFile(null);
          reset();
        }}
        title="Create Assignment"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            For:{' '}
            <strong>
              {currentSubject?.code} — {currentSubject?.name?.trim()}
            </strong>
          </div>

          <Input
            label="Title"
            placeholder="Chapter 5 — Neural Networks"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Instructions for the students…"
              {...register('description')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            label="Deadline"
            type="datetime-local"
            {...register('deadline')}
            error={errors.deadline?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Attachment (optional)
            </label>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 sm:file:px-4 sm:file:text-sm"
            />
            {pickedFile && (
              <p className="mt-1 text-xs text-slate-500">
                <Paperclip className="mr-1 inline h-3 w-3" />
                {pickedFile.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setPickedFile(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editFor}
        onClose={() => setEditFor(null)}
        title="Edit Assignment"
        size="lg"
      >
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
          <Input
            label="Title"
            {...registerEdit('title')}
            error={editErrors.title?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={4}
              {...registerEdit('description')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {editErrors.description && (
              <p className="mt-1 text-xs text-red-600">
                {editErrors.description.message}
              </p>
            )}
          </div>

          <Input
            label="Deadline"
            type="datetime-local"
            {...registerEdit('deadline')}
            error={editErrors.deadline?.message}
          />

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditFor(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete assignment?"
        message={`Permanently remove "${deleting?.title}" and all its submissions? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return;
          deleteMutation.mutate(deleting.id);
        }}
      />

      {/* Submissions modal */}
      {submissionsFor && (
        <SubmissionsModal
          open={!!submissionsFor}
          assignment={submissionsFor}
          onClose={() => setSubmissionsFor(null)}
        />
      )}
    </div>
  );
};