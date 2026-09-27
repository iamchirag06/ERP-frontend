import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ExternalLink, Save, FileText, Clock } from 'lucide-react';
import type { AxiosError } from 'axios';
import { getSubmissions, gradeSubmission } from '@/api/assignments';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import type { AssignmentResponse, SubmissionResponse } from '@/types/academic';

interface Props {
  open: boolean;
  assignment: AssignmentResponse;
  onClose: () => void;
}

const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().min(1, 'Feedback is required'),
});
type GradeForm = z.infer<typeof gradeSchema>;

interface ApiError {
  error?: string;
  message?: string;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const SubmissionsModal = ({ open, assignment, onClose }: Props) => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();
  const [gradingFor, setGradingFor] = useState<SubmissionResponse | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', assignment.id],
    queryFn: () => getSubmissions(assignment.id),
    enabled: !!token && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradeForm>({ resolver: zodResolver(gradeSchema) });

  const gradeMutation = useMutation({
    mutationFn: (data: GradeForm) => {
      if (!gradingFor) throw new Error('No submission selected');
      return gradeSubmission({
        submissionId: gradingFor.submissionId,
        grade: data.grade,
        feedback: data.feedback,
      });
    },
    onSuccess: () => {
      toast.success('Grade saved');
      qc.invalidateQueries({ queryKey: ['submissions', assignment.id] });
      setGradingFor(null);
      reset();
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      console.error('grade-submission failed:', e.response?.data);
      toast.error(raw.length > 200 ? 'Failed to save grade.' : raw || 'Failed to save grade');
    },
  });

  const openGrade = (s: SubmissionResponse) => {
    setGradingFor(s);
    const existing = s.grade ? Number(s.grade) : 0;
    reset({
      grade: Number.isFinite(existing) ? existing : 0,
      feedback: s.feedback ?? '',
    });
  };

  return (
    <>
      <Modal
        open={open && !gradingFor}
        onClose={onClose}
        title={`Submissions — ${assignment.title}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Clock className="mr-1 inline h-3 w-3" />
            Due {formatDateTime(assignment.deadline)}
          </div>

          {isLoading ? (
            <Loader />
          ) : !submissions?.length ? (
            <EmptyState
              title="No submissions yet"
              subtitle="Students haven't submitted anything for this assignment."
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.map((s) => (
                <div
  key={s.submissionId}
  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start"
>
  <div className="flex min-w-0 flex-1 items-start gap-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
      {s.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate font-medium text-slate-800">{s.studentName}</p>
        <Badge variant="info">{s.rollNo}</Badge>
        {s.late && <Badge variant="warning">Late</Badge>}
        {s.grade != null && (
          <Badge variant="success">Graded: {s.grade}</Badge>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>Submitted {formatDateTime(s.submittedAt)}</span>
        <a
          href={s.submissionLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View submission
        </a>
      </div>

      {s.feedback && (
        <p className="mt-2-break-words rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
          <strong>Your feedback:</strong> {s.feedback}
        </p>
      )}
    </div>
  </div>

  <Button
    size="sm"
    variant={s.grade ? 'secondary' : 'primary'}
    onClick={() => openGrade(s)}
    className="w-full sm:w-auto"
  >
    <FileText className="h-3.5 w-3.5" />
    {s.grade ? 'Update' : 'Grade'}
  </Button>
</div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Grade sub-modal */}
      <Modal
        open={!!gradingFor}
        onClose={() => {
          setGradingFor(null);
          reset();
        }}
        title={`Grade — ${gradingFor?.studentName}`}
      >
        <form onSubmit={handleSubmit((d) => gradeMutation.mutate(d))} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="text-slate-500">Roll No</p>
            <p className="font-medium text-slate-800">{gradingFor?.rollNo}</p>
          </div>

          <Input
            label="Grade (0–100)"
            type="number"
            min={0}
            max={100}
            {...register('grade', { valueAsNumber: true })}
            error={errors.grade?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Good work, but check the last section…"
              {...register('feedback')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.feedback && (
              <p className="mt-1 text-xs text-red-600">{errors.feedback.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
  <Button
    type="button"
    variant="secondary"
    onClick={() => {
      setGradingFor(null);
      reset();
    }}
  >
    Cancel
  </Button>
  <Button type="submit" loading={gradeMutation.isPending}>
    <Save className="h-4 w-4" />
    Save Grade
  </Button>
</div>
        </form>
      </Modal>
    </>
  );
};