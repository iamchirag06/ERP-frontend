import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  BookOpen,
  Clock,
  Paperclip,
  ExternalLink,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getAssignmentsBySubject,
  getMySubmissions,
  submitAssignment,
} from '@/api/assignments';
import { getMySubjects } from '@/api/student';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { AssignmentResponse } from '@/types/academic';
import { SparkleIcon } from '@/components/ui/Illustrations';

const submitSchema = z.object({
  submissionLink: z.string().url('Must be a valid URL (e.g. Google Drive link)'),
});
type SubmitForm = z.infer<typeof submitSchema>;

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

export const StudentAssignmentsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [tab, setTab] = useState<'assignments' | 'submissions'>('assignments');
  const [subjectId, setSubjectId] = useState<string>('');
  const [submittingFor, setSubmittingFor] = useState<AssignmentResponse | null>(null);

  const { data: subjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: getMySubjects,
    enabled: !!token,
  });

  const effectiveSubjectId = subjectId || subjects?.[0]?.id || '';

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', effectiveSubjectId],
    queryFn: () => getAssignmentsBySubject(effectiveSubjectId),
    enabled: !!token && !!effectiveSubjectId && tab === 'assignments',
  });

  const { data: mySubmissions, isLoading: loadingSubs } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: getMySubmissions,
    enabled: !!token && tab === 'submissions',
  });

  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitForm>({ resolver: zodResolver(submitSchema) });

  const submitMutation = useMutation({
    mutationFn: (data: SubmitForm) => {
      if (!submittingFor) throw new Error('No assignment');
      return submitAssignment({
        assignmentId: submittingFor.id,
        submissionLink: data.submissionLink,
      });
    },
    onSuccess: () => {
      toast.success('Assignment submitted successfully! 🎉');
      if (submittingFor) {
        setSubmittedIds((prev) => new Set(prev).add(submittingFor.id));
      }
      setSubmittingFor(null);
      reset();
      qc.invalidateQueries({ queryKey: ['my-submissions'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: AxiosError<ApiError>) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit assignment';
      toast.error(msg);
    },
  });

  const onSubmit = (data: SubmitForm) => submitMutation.mutate(data);

  const stats = useMemo(() => {
    if (!assignments?.length) return { open: 0, closed: 0 };
    const now = Date.now();
    let open = 0;
    let closed = 0;
    assignments.forEach((a) => {
      if (new Date(a.deadline).getTime() > now) open++;
      else closed++;
    });
    return { open, closed };
  }, [assignments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & Submissions 📝"
        subtitle="View course assignments, track deadlines, and submit your homework."
      />

      {/* Tabs styled as playful pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('assignments')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'assignments'
              ? 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-[2px_2px_0px_#2587B8]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Active Assignments
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'submissions'
              ? 'border-[#62A66C] bg-[#E8F5DF] text-[#226E30] shadow-[2px_2px_0px_#62A66C]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <FileText className="h-4 w-4" />
          My Submissions History
        </button>
      </div>

      {/* ─── Assignments tab ──────────────────────────────── */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md w-full">
              <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
                Filter by Subject
              </label>
              <select
                value={effectiveSubjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-11 w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 font-heading text-sm font-medium text-[#302365] outline-none transition focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
              >
                {!subjects?.length && <option value="">No subjects found</option>}
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name.trim()}
                  </option>
                ))}
              </select>
            </div>

            {assignments?.length ? (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="success">✦ {stats.open} Open</Badge>
                <Badge variant="danger">{stats.closed} Closed</Badge>
              </div>
            ) : null}
          </div>

          {loadingAssignments ? (
            <Loader />
          ) : !assignments?.length ? (
            <EmptyState
              title="No assignments for this subject"
              subtitle="Nothing assigned yet — check back later."
            />
          ) : (
            <div className="space-y-3.5">
              {assignments.map((a) => {
                const overdue = new Date(a.deadline).getTime() < Date.now();
                const submitted = submittedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className="rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(48,35,101,0.1)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 shadow-xs',
                            overdue
                              ? 'border-[#E87999] bg-[#FCE4EB] text-[#C22B58]'
                              : 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8]'
                          )}
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
                              <Badge variant="success">Open</Badge>
                            )}
                            {submitted && (
                              <Badge variant="info">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Submitted
                              </Badge>
                            )}
                          </div>

                          {a.description && (
                            <p className="mt-1.5 text-sm font-medium text-[#302365]/80 leading-relaxed">
                              {a.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#302365]/70">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1',
                                overdue && 'text-[#C22B58]'
                              )}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Due: {formatDateTime(a.deadline)}
                            </span>
                            {a.teacher && (
                              <span>Faculty: {a.teacher.name.trim()}</span>
                            )}
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

                      <div className="shrink-0 sm:ml-auto">
                        <Button
                          size="md"
                          onClick={() => {
                            setSubmittingFor(a);
                            reset({ submissionLink: '' });
                          }}
                          disabled={overdue && !submitted}
                          variant={submitted ? 'secondary' : 'primary'}
                          className="w-full sm:w-auto"
                        >
                          {submitted ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Resubmit Link
                            </>
                          ) : overdue ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              Closed
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit Work
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── My Submissions tab ──────────────────────────── */}
      {tab === 'submissions' && (
        <>
          {loadingSubs ? (
            <Loader />
          ) : !mySubmissions?.length ? (
            <EmptyState
              title="No submissions yet"
              subtitle="Submit an assignment to see it here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Submission ID</TH>
                      <TH>Timestamp</TH>
                      <TH>Evaluation / Grade</TH>
                      <TH>Teacher Remarks</TH>
                      <TH className="text-right">Public Link</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {mySubmissions.map((s) => (
                      <TR key={s.submissionId}>
                        <TD>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#302365]/50" />
                            <span className="font-heading font-semibold text-[#302365]">
                              #{s.submissionId.slice(0, 8)}
                            </span>
                            {s.late && <Badge variant="warning">Late</Badge>}
                          </div>
                        </TD>
                        <TD className="font-medium text-[#302365]">
                          {formatDateTime(s.submittedAt)}
                        </TD>
                        <TD>
                          {s.grade && s.grade !== 'Not Graded' ? (
                            <Badge variant="success">
                              <Trophy className="mr-1 h-3.5 w-3.5" />
                              {s.grade}
                            </Badge>
                          ) : (
                            <span className="text-xs italic text-[#302365]/50">
                              Pending Review
                            </span>
                          )}
                        </TD>
                        <TD className="max-w-xs font-medium text-sm text-[#302365]">
                          {s.feedback ? (
                            <p className="line-clamp-2">{s.feedback}</p>
                          ) : (
                            <span className="text-xs italic text-[#302365]/40">—</span>
                          )}
                        </TD>
                        <TD className="text-right">
                          <a
                            href={s.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-heading font-bold text-sm text-[#2587B8] hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Work
                          </a>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {mySubmissions.map((s) => (
                  <div
                    key={s.submissionId}
                    className="rounded-2xl border-2 border-[#302365]/10 bg-white p-4 shadow-[2px_2px_0px_rgba(48,35,101,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-[#302365]/50" />
                          <span className="font-heading font-bold text-sm text-[#302365]">
                            #{s.submissionId.slice(0, 8)}
                          </span>
                          {s.late && <Badge variant="warning">Late</Badge>}
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#302365]/60">
                          {formatDateTime(s.submittedAt)}
                        </p>
                      </div>
                      {s.grade && s.grade !== 'Not Graded' ? (
                        <Badge variant="success" className="shrink-0">
                          <Trophy className="mr-1 h-3 w-3" />
                          {s.grade}
                        </Badge>
                      ) : (
                        <span className="shrink-0 text-xs italic text-[#302365]/50">
                          Pending
                        </span>
                      )}
                    </div>

                    {s.feedback && (
                      <div className="mt-3 rounded-xl border border-[#F7D37E] bg-[#FFF0C9] p-3 text-xs text-[#995E05]">
                        <strong className="font-heading font-bold">Feedback:</strong>{' '}
                        <span>{s.feedback}</span>
                      </div>
                    )}

                    <a
                      href={s.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#2587B8] bg-[#DFF2FC] px-4 py-2 font-heading text-sm font-bold text-[#2587B8] hover:bg-[#c9eaf9]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Submission
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Submit Modal ────────────────────────────────── */}
      <Modal
        open={!!submittingFor}
        onClose={() => {
          setSubmittingFor(null);
          reset();
        }}
        title={`Submit Work — ${submittingFor?.title ?? ''}`}
      >
        {submittingFor && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] p-4 text-sm">
              <p className="font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/70">
                Deadline
              </p>
              <p className="font-heading text-base font-bold text-[#302365]">
                {formatDateTime(submittingFor.deadline)}
              </p>
              {new Date(submittingFor.deadline).getTime() < Date.now() && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#C22B58]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Past deadline — submission will be recorded as late.
                </p>
              )}
            </div>

            <Input
              label="Shareable Link (Google Drive / GitHub / Docs)"
              placeholder="https://drive.google.com/file/d/..."
              {...register('submissionLink')}
              error={errors.submissionLink?.message}
            />

            <p className="text-xs font-medium text-[#302365]/70">
              Ensure permissions are set so your course instructor can review the link.
            </p>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSubmittingFor(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitMutation.isPending}>
                <Send className="h-4 w-4" />
                Submit Assignment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};