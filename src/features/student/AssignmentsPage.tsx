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
import { Card, CardBody } from '@/components/ui/Card';
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
      toast.success('Assignment submitted!');
      setSubmittedIds((prev) => new Set(prev).add(submittingFor!.id));
      qc.invalidateQueries({ queryKey: ['my-submissions'] });
      reset();
      setSubmittingFor(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      let msg = raw || 'Failed to submit assignment';
      if (raw.toLowerCase().includes('duplicate')) {
        msg = 'You have already submitted this assignment.';
      } else if (raw.length > 200) {
        msg = 'Submission failed. Check the link and try again.';
      }
      console.error('submit-assignment failed:', e.response?.data);
      toast.error(msg);
    },
  });

  const onSubmit = (data: SubmitForm) => submitMutation.mutate(data);

  const stats = useMemo(() => {
    if (!assignments) return { open: 0, closed: 0 };
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
    <div>
      <PageHeader
        title="Assignments"
        subtitle="View, submit and track your assignments."
      />

      {/* Tabs — horizontally scrollable */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setTab('assignments')}
          className={cn(
            'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'assignments'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Assignments
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={cn(
            'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'submissions'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <FileText className="h-4 w-4" />
          My Submissions
        </button>
      </div>

      {/* ─── Assignments tab ──────────────────────────────── */}
      {tab === 'assignments' && (
        <>
          <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Subject
              </label>
              <select
                value={effectiveSubjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {!subjects?.length && <option value="">No subjects</option>}
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name.trim()}
                  </option>
                ))}
              </select>
            </div>

            {assignments?.length ? (
              <div className="flex items-end gap-3 text-xs">
                <Badge variant="success">{stats.open} open</Badge>
                <Badge variant="default">{stats.closed} closed</Badge>
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
            <div className="space-y-3">
              {assignments.map((a) => {
                const overdue = new Date(a.deadline).getTime() < Date.now();
                const submitted = submittedIds.has(a.id);
                return (
                  <Card key={a.id}>
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                        <div className="flex items-start gap-3 sm:contents">
                          <div
                            className={cn(
                              'grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11',
                              overdue
                                ? 'bg-red-50 text-red-600'
                                : 'bg-indigo-50 text-indigo-600'
                            )}
                          >
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-800">
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
                              <p className="mt-1 text-sm text-slate-600">
                                {a.description}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  overdue && 'font-medium text-red-600'
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                Due {formatDateTime(a.deadline)}
                              </span>
                              {a.teacher && <span>By {a.teacher.name.trim()}</span>}
                              {a.attachmentUrl && (
                                <a
                                  href={a.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  View attachment
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 sm:ml-auto">
                          <Button
                            size="sm"
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
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Resubmit
                              </>
                            ) : overdue ? (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                Closed
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                Submit
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
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
                      <TH>Submission</TH>
                      <TH>Submitted At</TH>
                      <TH>Grade</TH>
                      <TH>Feedback</TH>
                      <TH className="text-right">Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {mySubmissions.map((s) => (
                      <TR key={s.submissionId}>
                        <TD>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              #{s.submissionId.slice(0, 8)}
                            </span>
                            {s.late && <Badge variant="warning">Late</Badge>}
                          </div>
                        </TD>
                        <TD className="text-slate-600">
                          {formatDateTime(s.submittedAt)}
                        </TD>
                        <TD>
                          {s.grade && s.grade !== 'Not Graded' ? (
                            <Badge variant="success">
                              <Trophy className="mr-1 h-3 w-3" />
                              {s.grade}
                            </Badge>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              Not graded
                            </span>
                          )}
                        </TD>
                        <TD className="max-w-xs">
                          {s.feedback ? (
                            <p className="line-clamp-2 text-sm text-slate-600">
                              {s.feedback}
                            </p>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              —
                            </span>
                          )}
                        </TD>
                        <TD className="text-right">
                          <a
                            href={s.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
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
                  <Card key={s.submissionId}>
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate text-sm font-medium text-slate-800">
                              Submission #{s.submissionId.slice(0, 8)}
                            </span>
                            {s.late && <Badge variant="warning">Late</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(s.submittedAt)}
                          </p>
                        </div>
                        {s.grade && s.grade !== 'Not Graded' ? (
                          <Badge variant="success" className="shrink-0">
                            <Trophy className="mr-1 h-3 w-3" />
                            {s.grade}
                          </Badge>
                        ) : (
                          <span className="shrink-0 text-xs italic text-slate-400">
                            Not graded
                          </span>
                        )}
                      </div>

                      {s.feedback && (
                        <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                          <strong className="font-medium">Feedback:</strong>{' '}
                          <span className="break-words">{s.feedback}</span>
                        </div>
                      )}

                      <a
                        href={s.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open submission
                      </a>
                    </CardBody>
                  </Card>
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
        title={`Submit — ${submittingFor?.title ?? ''}`}
      >
        {submittingFor && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Deadline</p>
              <p className="font-medium text-slate-800">
                {formatDateTime(submittingFor.deadline)}
              </p>
              {new Date(submittingFor.deadline).getTime() < Date.now() && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Past deadline — your submission will be marked late.
                </p>
              )}
            </div>

            <Input
              label="Submission Link"
              placeholder="https://docs.google.com/document/d/..."
              {...register('submissionLink')}
              error={errors.submissionLink?.message}
            />

            <p className="text-xs text-slate-500">
              Paste a public link to your work. Make sure it's viewable by your
              teacher.
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
                Submit
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};