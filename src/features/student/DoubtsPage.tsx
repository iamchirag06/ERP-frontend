import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  Trophy,
  Search,
  Send,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  acceptSolution,
  answerDoubt,
  askDoubt,
  getAllDoubts,
  getMySubjectsDoubts,
  getSolutionsForDoubt,
} from '@/api/doubts';
import { getMySubjects } from '@/api/student';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { DoubtResponse, SolutionEntityResponse } from '@/types/academic';

const askSchema = z.object({
  subjectId: z.string().uuid('Select a subject'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Describe your doubt in detail'),
  bountyPoints: z.number().min(0).max(100).optional(),
});
type AskForm = z.infer<typeof askSchema>;

const answerSchema = z.object({
  content: z.string().min(5, 'Answer must be at least 5 characters'),
});
type AnswerForm = z.infer<typeof answerSchema>;

interface ApiError {
  error?: string;
  message?: string;
}

export const StudentDoubtsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [openDoubt, setOpenDoubt] = useState<DoubtResponse | null>(null);

  // ─── Data ─────────────────────────────────────────────────
  const { data: subjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: getMySubjects,
    enabled: !!token,
  });

  const { data: mine, isLoading: loadingMine } = useQuery({
    queryKey: ['doubts-mine'],
    queryFn: getMySubjectsDoubts,
    enabled: !!token && tab === 'mine',
  });

  const { data: all, isLoading: loadingAll } = useQuery({
    queryKey: ['doubts-all'],
    queryFn: getAllDoubts,
    enabled: !!token && tab === 'all',
  });

  // ─── Ask form ─────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AskForm>({ resolver: zodResolver(askSchema) });

  const askMutation = useMutation({
    mutationFn: askDoubt,
    onSuccess: () => {
      toast.success('Doubt posted');
      qc.invalidateQueries({ queryKey: ['doubts-mine'] });
      qc.invalidateQueries({ queryKey: ['doubts-all'] });
      reset();
      setAskOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      console.error('ask-doubt failed:', e.response?.data);
      toast.error(
        raw.length > 200 ? 'Failed to post doubt.' : raw || 'Failed to post doubt'
      );
    },
  });

  // Filter
  const filtered = useMemo(() => {
    const list = tab === 'mine' ? mine : all;
    if (!list) return [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subjectName.toLowerCase().includes(q) ||
        d.askerName.toLowerCase().includes(q)
    );
  }, [mine, all, tab, search]);

  const isLoading = tab === 'mine' ? loadingMine : loadingAll;

  return (
    <div>
      <PageHeader
        title="Doubts"
        subtitle="Ask questions and help your peers by answering theirs."
        action={
          <Button onClick={() => setAskOpen(true)}>
            <Plus className="h-4 w-4" />
            Ask a Doubt
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setTab('mine')}
          className={cn(
             'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'mine'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <HelpCircle className="h-4 w-4" />
          My Doubts
        </button>
        <button
          onClick={() => setTab('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'all'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          All Doubts
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title, subject or asker…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : !filtered.length ? (
        <EmptyState
          title={tab === 'mine' ? "You haven't asked any doubts" : 'No doubts yet'}
          subtitle={
            tab === 'mine'
              ? 'Ask a doubt to get help from your teachers and peers.'
              : 'Once someone asks a doubt it will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DoubtCard
              key={d.id}
              doubt={d}
              isMine={d.askerId === user?.userId}
              onOpen={() => setOpenDoubt(d)}
            />
          ))}
        </div>
      )}

      {/* Ask modal */}
      <Modal
        open={askOpen}
        onClose={() => {
          setAskOpen(false);
          reset();
        }}
        title="Ask a Doubt"
      >
        <form
          onSubmit={handleSubmit((d) => askMutation.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <select
              {...register('subjectId')}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">— Select subject —</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name.trim()}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="mt-1 text-xs text-red-600">{errors.subjectId.message}</p>
            )}
          </div>

          <Input
            label="Title"
            placeholder="Short summary of your question"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Details
            </label>
            <textarea
              rows={5}
              placeholder="Explain your doubt in detail. Include what you've tried so far…"
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
            label="Bounty Points (optional)"
            type="number"
            placeholder="5"
            {...register('bountyPoints', { valueAsNumber: true })}
            error={errors.bountyPoints?.message}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Offer points to encourage others to answer. Leave blank for none.
          </p>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
  <Button
    type="button"
    variant="secondary"
    onClick={() => {
      setAskOpen(false);
      reset();
    }}
  >
    Cancel
  </Button>
  <Button type="submit" loading={askMutation.isPending}>
    Post Doubt
  </Button>
</div>
        </form>
      </Modal>

      {/* Doubt detail modal */}
      {openDoubt && (
        <DoubtDetailModal
          doubt={openDoubt}
          onClose={() => setOpenDoubt(null)}
          canAccept={openDoubt.askerId === user?.userId}
        />
      )}
    </div>
  );
};

// ─── Doubt card ───────────────────────────────────────────────
function DoubtCard({
  doubt: d,
  isMine,
  onOpen,
}: {
  doubt: DoubtResponse;
  isMine: boolean;
  onOpen: () => void;
}) {
  const solved = d.status === 'SOLVED';
  return (
    <Card
      className="cursor-pointer transition hover:border-indigo-200 hover:shadow-md"
      onClick={onOpen}
    >
      <CardBody>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-lg',
              solved
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            )}
          >
            {solved ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <HelpCircle className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-800">{d.title}</h3>
              <Badge variant={solved ? 'success' : 'warning'}>{d.status}</Badge>
              {isMine && <Badge variant="info">Mine</Badge>}
              {d.bountyPoints > 0 && (
                <Badge variant="default">
                  <Trophy className="mr-1 h-3 w-3" />
                  {d.bountyPoints} pts
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Badge variant="info">{d.subjectName.trim()}</Badge>
              <span>By {d.askerName.trim()}</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Doubt detail modal ───────────────────────────────────────
function DoubtDetailModal({
  doubt,
  onClose,
  canAccept,
}: {
  doubt: DoubtResponse;
  onClose: () => void;
  canAccept: boolean;
}) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const { data: solutions, isLoading } = useQuery({
    queryKey: ['solutions', doubt.id],
    queryFn: () => getSolutionsForDoubt(doubt.id),
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnswerForm>({ resolver: zodResolver(answerSchema) });

  const answerMutation = useMutation({
    mutationFn: (data: AnswerForm) =>
      answerDoubt({ doubtId: doubt.id, content: data.content }),
    onSuccess: () => {
      toast.success('Answer posted');
      qc.invalidateQueries({ queryKey: ['solutions', doubt.id] });
      reset();
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to post answer');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (solutionId: string) => acceptSolution(solutionId),
    onSuccess: () => {
      toast.success('Solution accepted');
      qc.invalidateQueries({ queryKey: ['solutions', doubt.id] });
      qc.invalidateQueries({ queryKey: ['doubts-mine'] });
      qc.invalidateQueries({ queryKey: ['doubts-all'] });
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to accept solution');
    },
  });

  // Show description from either the doubt prop or the first solution's nested doubt
  const description =
    doubt.description ?? solutions?.[0]?.doubt?.description ?? null;

  return (
    <Modal open onClose={onClose} title={doubt.title} size="lg">
      <div className="space-y-4">
        {/* Doubt summary */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{doubt.subjectName.trim()}</Badge>
            <Badge variant={doubt.status === 'SOLVED' ? 'success' : 'warning'}>
              {doubt.status}
            </Badge>
            {doubt.bountyPoints > 0 && (
              <Badge variant="default">
                <Trophy className="mr-1 h-3 w-3" />
                {doubt.bountyPoints} pts
              </Badge>
            )}
          </div>

          {description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
              {description}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Asked by {doubt.askerName.trim()}
          </p>
        </div>

        {/* Solutions */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            {solutions?.length ?? 0}{' '}
            {solutions?.length === 1 ? 'Answer' : 'Answers'}
          </h3>

          {isLoading ? (
            <Loader />
          ) : !solutions?.length ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm italic text-slate-500">
              No answers yet. Be the first to help!
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {solutions.map((s) => (
                <SolutionRow
                  key={s.id}
                  solution={s}
                  canAccept={canAccept && !s.accepted}
                  onAccept={() => acceptMutation.mutate(s.id)}
                  accepting={acceptMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Answer form */}
        <form
          onSubmit={handleSubmit((d) => answerMutation.mutate(d))}
          className="border-t border-slate-200 pt-4"
        >
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Post your answer
          </label>
          <textarea
            rows={3}
            placeholder="Share your solution or explanation…"
            {...register('content')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
  <Button
    type="submit"
    loading={answerMutation.isPending}
    className="w-full sm:w-auto"
  >
    <Send className="h-4 w-4" />
    Post Answer
  </Button>
</div>
        </form>
      </div>
    </Modal>
  );
}

// ─── Solution row ─────────────────────────────────────────────
function SolutionRow({
  solution: s,
  canAccept,
  onAccept,
  accepting,
}: {
  solution: SolutionEntityResponse;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const solverName = s.solver?.name?.trim() ?? 'Unknown';
  const initials = solverName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        s.accepted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        {s.solver?.profileImageUrl ? (
          <img
            src={s.solver.profileImageUrl}
            alt={solverName}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-800">{solverName}</p>
            {s.solver?.rollNo && (
              <span className="text-xs text-slate-400">{s.solver.rollNo}</span>
            )}
            {s.accepted && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Accepted
              </Badge>
            )}
          </div>

          <p className="mt-1 whitespace-pre-wrap-break-words text-sm text-slate-600">
  {s.content}
</p>

          {s.createdAt && (
            <p className="mt-1 text-xs text-slate-400">
              {new Date(s.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

       {canAccept && (
  <Button
    size="sm"
    variant="secondary"
    onClick={onAccept}
    loading={accepting}
    className="mt-2 w-full sm:mt-0 sm:w-auto"
  >
    <CheckCircle2 className="h-3.5 w-3.5" />
    Accept
  </Button>
)}
      </div>
    </div>
  );
}