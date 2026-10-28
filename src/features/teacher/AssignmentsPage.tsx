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
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import type { AssignmentResponse } from '@/types/academic';
import { SubmissionsModal } from './SubmissionsModal';
import { SparkleIcon } from '@/components/ui/Illustrations';

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
    mutationFn: (d: FormData) => {
      if (!effectiveSubjectId) throw new Error('Missing subject');
      return createAssignment(
        {
          subjectId: effectiveSubjectId,
          title: d.title,
          description: d.description,
          deadline: toBackendDeadline(d.deadline),
        },
        pickedFile ?? undefined
      );
    },
    onSuccess: () => {
      toast.success('Assignment created! 📝');
      qc.invalidateQueries({ queryKey: ['assignments', effectiveSubjectId] });
      setCreateOpen(false);
      setPickedFile(null);
      reset();
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      toast.error(raw || 'Failed to create assignment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: FormData) => {
      if (!editFor) throw new Error('No assignment');
      return updateAssignment(editFor.id, {
        subjectId: editFor.subject?.id ?? effectiveSubjectId,
        title: d.title,
        description: d.description,
        deadline: toBackendDeadline(d.deadline),
      });
    },
    onSuccess: () => {
      toast.success('Assignment updated');
      qc.invalidateQueries({ queryKey: ['assignments', effectiveSubjectId] });
      setEditFor(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      toast.error(raw || 'Failed to update assignment');
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
  const onSubmitEdit = (d: FormData) => updateMutation.mutate(d);

  const openEdit = (a: AssignmentResponse) => {
    setEditFor(a);
    resetEdit({
      title: a.title,
      description: a.description ?? '',
      deadline: toInputDeadline(a.deadline),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Assignments 📝"
        subtitle="Publish tasks, collect submissions, and grade student submissions."
        action={
          <Button
            onClick={() => {
              setCreateOpen(true);
              setPickedFile(null);
              reset();
            }}
            disabled={!subjects?.length}
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        }
      />

      {/* Subject selector */}
      <div className="grid gap-4 rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:grid-cols-2">
        <Select
          label="Select Subject"
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#302365]/15 bg-[#FFF6D8] px-3.5 py-1.5 font-heading text-xs font-bold text-[#302365]">
              <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
              {currentSubject.branchName} · Semester {currentSubject.semester}
            </span>
          </div>
        )}
      </div>

      {/* List */}
      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Ask your admin to assign you a subject before managing assignments."
        />
      ) : isLoading ? (
        <Loader />
      ) : !assignments?.length ? (
        <EmptyState
          title="No assignments posted yet"
          subtitle="Click 'Create Assignment' to assign the first task for this class."
        />
      ) : (
        <div className="space-y-3.5">
          {assignments.map((a) => {
            const overdue = new Date(a.deadline).getTime() < Date.now();
            return (
              <div
                key={a.id}
                className="rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 shadow-xs ${
                        overdue
                          ? 'border-[#E87999] bg-[#FCE4EB] text-[#C22B58]'
                          : 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8]'
                      }`}
                    >
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-[#302365]">
                          {a.title}
                        </h3>
                        {overdue ? (
                          <Badge variant="danger">Closed</Badge>
                        ) : (
                          <Badge variant="success">Open ✦</Badge>
                        )}
                      </div>

                      {a.description && (
                        <p className="mt-1.5 font-medium text-sm text-[#302365]/80 line-clamp-2 leading-relaxed">
                          {a.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#302365]/70">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due: {formatDateTime(a.deadline)}
                        </span>
                        {a.attachmentUrl && (
                          <a
                            href={a.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#2587B8] hover:underline"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            Download Attachment
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1.5 sm:self-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSubmissionsFor(a)}
                    >
                      <Users className="h-4 w-4" />
                      Submissions
                    </Button>
                    <button
                      onClick={() => openEdit(a)}
                      className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#DFF2FC] hover:text-[#2587B8] transition cursor-pointer shadow-xs"
                      title="Edit Assignment"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(a)}
                      className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FCE4EB] hover:text-[#C22B58] transition cursor-pointer shadow-xs"
                      title="Delete Assignment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="text-center font-heading text-xs font-bold text-[#302365]/50">
          Syncing assignments…
        </p>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPickedFile(null);
          reset();
        }}
        title="Create New Assignment 📝"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] px-4 py-2.5 font-heading text-xs text-[#302365]">
            Target Subject:{' '}
            <strong className="text-[#2587B8]">
              {currentSubject?.code} — {currentSubject?.name?.trim()}
            </strong>
          </div>

          <Input
            label="Assignment Title"
            placeholder="e.g. Lab Experiment 4 — Graph Traversals"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Description & Instructions
            </label>
            <textarea
              rows={4}
              placeholder="Provide clear guidelines, problem statement, and submission requirements…"
              {...register('description')}
              className="w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 py-2.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-[#C22B58]">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            label="Deadline Date & Time"
            type="datetime-local"
            {...register('deadline')}
            error={errors.deadline?.message}
          />

          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Upload Attachment (optional)
            </label>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#302365] file:mr-3 file:rounded-xl file:border-2 file:border-[#302365]/15 file:bg-[#DFF2FC] file:px-4 file:py-2 file:font-heading file:text-xs file:font-bold file:text-[#2587B8] hover:file:bg-[#ccebf9] cursor-pointer"
            />
            {pickedFile && (
              <p className="mt-1.5 font-heading text-xs font-bold text-[#2587B8]">
                <Paperclip className="mr-1 inline h-3.5 w-3.5" />
                Selected: {pickedFile.name}
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
              Create Assignment
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
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Description
            </label>
            <textarea
              rows={4}
              {...registerEdit('description')}
              className="w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 py-2.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
            />
            {editErrors.description && (
              <p className="mt-1 text-xs font-medium text-[#C22B58]">
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
        message={`Permanently remove "${deleting?.title}" and all its student submissions? This cannot be undone.`}
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