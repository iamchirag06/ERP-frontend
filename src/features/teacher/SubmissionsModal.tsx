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
import { initials } from '@/lib/utils';

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
      toast.success('Grade recorded successfully! 🌟');
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
        title={`Student Submissions — ${assignment.title}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] px-4 py-2 text-xs font-semibold text-[#302365]">
            <Clock className="mr-1 inline h-3.5 w-3.5 text-[#2587B8]" />
            Deadline was: {formatDateTime(assignment.deadline)}
          </div>

          {isLoading ? (
            <Loader />
          ) : !submissions?.length ? (
            <EmptyState
              title="No submissions received yet"
              subtitle="Student submissions for this assignment will appear here."
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {submissions.map((s) => (
                <div
                  key={s.submissionId}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-[#302365]/12 bg-white p-4 shadow-[2px_2px_0px_rgba(48,35,101,0.05)] sm:flex-row sm:items-start"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#B7A4E8] bg-[#DCD2F5] font-heading text-xs font-bold text-[#302365]">
                      {initials(s.studentName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-heading text-sm font-bold text-[#302365]">{s.studentName}</p>
                        <Badge variant="info">{s.rollNo}</Badge>
                        {s.late && <Badge variant="warning">Late</Badge>}
                        {s.grade != null && (
                          <Badge variant="success">Grade: {s.grade}</Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#302365]/60">
                        <span>Submitted {formatDateTime(s.submittedAt)}</span>
                        <a
                          href={s.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-[#2587B8] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Work
                        </a>
                      </div>

                      {s.feedback && (
                        <p className="mt-2 rounded-xl border border-[#F7D37E] bg-[#FFF0C9] px-3 py-1.5 text-xs text-[#995E05]">
                          <strong className="font-heading font-bold">Feedback:</strong> {s.feedback}
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
                    {s.grade ? 'Revise Grade' : 'Score Submission'}
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
        title={`Evaluation — ${gradingFor?.studentName}`}
      >
        <form onSubmit={handleSubmit((d) => gradeMutation.mutate(d))} className="space-y-4">
          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] px-4 py-2 text-xs font-semibold text-[#302365]">
            <p className="text-[#302365]/70">Student Roll Number</p>
            <p className="font-heading text-sm font-bold text-[#302365]">{gradingFor?.rollNo}</p>
          </div>

          <Input
            label="Score (0–100 Points)"
            type="number"
            min={0}
            max={100}
            {...register('grade', { valueAsNumber: true })}
            error={errors.grade?.message}
          />

          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Instructor Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Highlight strengths, corrections, or suggestions for improvement…"
              {...register('feedback')}
              className="w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 py-2.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
            />
            {errors.feedback && (
              <p className="mt-1 text-xs font-medium text-[#C22B58]">{errors.feedback.message}</p>
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