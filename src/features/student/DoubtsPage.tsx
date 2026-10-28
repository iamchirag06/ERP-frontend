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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { DoubtResponse, SolutionEntityResponse } from '@/types/academic';
import { SparkleIcon, SpeechBubbleTag } from '@/components/ui/Illustrations';

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
      toast.success('Doubt posted successfully! 💡');
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
    <div className="space-y-6">
      <PageHeader
        title="Doubts & Discussions 💬"
        subtitle="Ask academic questions and collaborate with classmates and faculty."
        action={
          <Button onClick={() => setAskOpen(true)}>
            <Plus className="h-4 w-4" />
            Ask a Doubt
          </Button>
        }
      />

      {/* Tabs as playful pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('mine')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'mine'
              ? 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-[2px_2px_0px_#2587B8]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <HelpCircle className="h-4 w-4" />
          My Questions
        </button>
        <button
          onClick={() => setTab('all')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'all'
              ? 'border-[#62A66C] bg-[#E8F5DF] text-[#226E30] shadow-[2px_2px_0px_#62A66C]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          All Campus Doubts
        </button>
      </div>

      {/* Search box with friendly borders */}
      <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#302365]/15 bg-white px-4 py-2.5 shadow-[2px_2px_0px_rgba(48,35,101,0.05)]">
        <Search className="h-4 w-4 text-[#302365]/50" />
        <input
          type="text"
          placeholder="Search by question title, subject, or student name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent font-medium text-sm text-[#302365] placeholder:text-[#302365]/40 outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="rounded-lg border border-[#302365]/20 bg-[#FFF6D8] px-2 py-0.5 font-heading text-xs font-bold text-[#302365] hover:bg-[#FCE4EB]"
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : !filtered.length ? (
        <EmptyState
          title={tab === 'mine' ? "You haven't asked any doubts yet" : 'No doubts found'}
          subtitle={
            tab === 'mine'
              ? 'Click "Ask a Doubt" to get help from your teachers and peers.'
              : 'Doubts posted by peers will appear here.'
          }
        />
      ) : (
        <div className="space-y-3.5">
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
        title="Ask a New Academic Doubt 💡"
      >
        <form
          onSubmit={handleSubmit((d) => askMutation.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Select Subject
            </label>
            <select
              {...register('subjectId')}
              className="h-11 w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 font-heading text-sm font-medium text-[#302365] outline-none transition focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
            >
              <option value="">— Select subject —</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name.trim()}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="mt-1 text-xs font-medium text-[#C22B58]">{errors.subjectId.message}</p>
            )}
          </div>

          <Input
            label="Question Title"
            placeholder="Briefly state your doubt (e.g. Recursion base condition in QuickSort)"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Detailed Explanation
            </label>
            <textarea
              rows={5}
              placeholder="Explain where you are stuck, what you expected, and what you've tried…"
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
            label="Bounty Points (optional reward)"
            type="number"
            placeholder="5"
            {...register('bountyPoints', { valueAsNumber: true })}
            error={errors.bountyPoints?.message}
          />
          <p className="-mt-2 text-xs font-medium text-[#302365]/60">
            Award points to encourage classmates and peers to answer quickly.
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
              Post Doubt →
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
    <div
      className="cursor-pointer rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 shadow-xs',
            solved
              ? 'border-[#62A66C] bg-[#E8F5DF] text-[#226E30]'
              : 'border-[#E89D42] bg-[#FFF0C9] text-[#995E05]'
          )}
        >
          {solved ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <HelpCircle className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-[#302365] hover:text-[#2587B8]">
              {d.title}
            </h3>
            <Badge variant={solved ? 'success' : 'warning'}>
              {solved ? '✦ Solved' : 'Open'}
            </Badge>
            {isMine && <Badge variant="lavender">My Post</Badge>}
            {d.bountyPoints > 0 && (
              <Badge variant="warning">
                <Trophy className="mr-1 h-3 w-3" />
                {d.bountyPoints} pts
              </Badge>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#302365]/70">
            <Badge variant="info">{d.subjectName.trim()}</Badge>
            <span>Asked by {d.askerName.trim()}</span>
          </div>
        </div>
      </div>
    </div>
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
      toast.success('Answer posted successfully! 🌟');
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
      toast.success('Solution accepted as best answer! 🏆');
      qc.invalidateQueries({ queryKey: ['solutions', doubt.id] });
      qc.invalidateQueries({ queryKey: ['doubts-mine'] });
      qc.invalidateQueries({ queryKey: ['doubts-all'] });
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to accept solution');
    },
  });

  const description =
    doubt.description ?? solutions?.[0]?.doubt?.description ?? null;

  return (
    <Modal open onClose={onClose} title={doubt.title} size="lg">
      <div className="space-y-5">
        {/* Doubt summary card */}
        <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFFDF7] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{doubt.subjectName.trim()}</Badge>
            <Badge variant={doubt.status === 'SOLVED' ? 'success' : 'warning'}>
              {doubt.status}
            </Badge>
            {doubt.bountyPoints > 0 && (
              <Badge variant="warning">
                <Trophy className="mr-1 h-3 w-3" />
                {doubt.bountyPoints} pts
              </Badge>
            )}
          </div>

          {description && (
            <p className="mt-3 font-medium text-sm text-[#302365] leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          )}

          <p className="mt-3 text-xs font-semibold text-[#302365]/60">
            Asked by {doubt.askerName.trim()}
          </p>
        </div>

        {/* Solutions section */}
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-[#302365]">
              {solutions?.length ?? 0}{' '}
              {solutions?.length === 1 ? 'Answer' : 'Answers'}
            </h3>
            <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
          </div>

          {isLoading ? (
            <Loader />
          ) : !solutions?.length ? (
            <div className="rounded-2xl border-2 border-dashed border-[#302365]/15 bg-[#FFF6D8]/50 p-4 text-center text-sm font-medium italic text-[#302365]/70">
              No solutions submitted yet. Be the first to help! ✏️
            </div>
          ) : (
            <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
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
          className="border-t-2 border-[#302365]/10 pt-4"
        >
          <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
            Post your solution
          </label>
          <textarea
            rows={3}
            placeholder="Share step-by-step guidance or code snippet…"
            {...register('content')}
            className="w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 py-2.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
          />
          {errors.content && (
            <p className="mt-1 text-xs font-medium text-[#C22B58]">{errors.content.message}</p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              loading={answerMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Submit Answer
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
        'rounded-2xl border-2 p-3.5 transition shadow-xs',
        s.accepted
          ? 'border-[#62A66C] bg-[#E8F5DF]/70'
          : 'border-[#302365]/12 bg-white'
      )}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
        {s.solver?.profileImageUrl ? (
          <img
            src={s.solver.profileImageUrl}
            alt={solverName}
            className="h-10 w-10 shrink-0 rounded-xl border border-[#302365]/20 object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#B7A4E8] bg-[#DCD2F5] font-heading text-xs font-bold text-[#302365]">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading font-bold text-sm text-[#302365]">{solverName}</p>
            {s.solver?.rollNo && (
              <span className="text-xs font-semibold text-[#302365]/50">#{s.solver.rollNo}</span>
            )}
            {s.accepted && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Accepted Solution
              </Badge>
            )}
          </div>

          <p className="mt-1 font-medium text-sm text-[#302365] whitespace-pre-wrap break-words leading-relaxed">
            {s.content}
          </p>

          {s.createdAt && (
            <p className="mt-1.5 text-xs text-[#302365]/50">
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
            <CheckCircle2 className="h-3.5 w-3.5 text-[#226E30]" />
            Accept as Best
          </Button>
        )}
      </div>
    </div>
  );
}