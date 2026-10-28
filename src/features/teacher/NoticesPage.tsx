import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Paperclip,
  Users,
  BookOpen,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getNotifications,
  getSentNotifications,
  markAllRead,
  markRead,
  deleteNotification,
  sendNotice,
} from '@/api/notifications';
import { getAttendanceSubjects } from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type {
  NotificationResponse,
  SentNotificationResponse,
} from '@/types/operations';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  target: z.enum(['ALL', 'CLASS', 'BATCH']),
  branchId: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
  batch: z.string().optional(),
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
    hour: '2-digit',
    minute: '2-digit',
  });

export const TeacherNoticesPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [sendOpen, setSendOpen] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  // ─── Inbox ────────────────────────────────────────────────
  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: getNotifications,
    enabled: !!token && tab === 'inbox',
  });

  // ─── Sent ─────────────────────────────────────────────────
  const { data: sent, isLoading: loadingSent } = useQuery({
    queryKey: ['notifications-sent'],
    queryFn: getSentNotifications,
    enabled: !!token && tab === 'sent',
  });

  // ─── Branches from teacher's subjects ─────────────────────
  const { data: subjects } = useQuery({
    queryKey: ['attendance-subjects'],
    queryFn: getAttendanceSubjects,
    enabled: !!token && sendOpen,
  });

  const myBranches = useMemo(() => {
    if (!subjects) return [];
    const seen = new Map<string, { id: string; name: string }>();
    subjects.forEach((s) => {
      if (s.branchId && !seen.has(s.branchId)) {
        seen.set(s.branchId, { id: s.branchId, name: s.branchName });
      }
    });
    return Array.from(seen.values());
  }, [subjects]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'ALL' },
  });

  const target = watch('target');

  const sendMutation = useMutation({
    mutationFn: (data: FormData) =>
      sendNotice(
        {
          title: data.title,
          message: data.message,
          branchId: data.target === 'CLASS' ? data.branchId : undefined,
          semester: data.target === 'CLASS' ? data.semester : undefined,
          batch: data.target === 'BATCH' ? data.batch : undefined,
        },
        pickedFile ?? undefined
      ),
    onSuccess: () => {
      toast.success('Notice published to students! 📢');
      qc.invalidateQueries({ queryKey: ['notifications-sent'] });
      setSendOpen(false);
      setPickedFile(null);
      reset({ target: 'ALL' });
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      toast.error(raw || 'Failed to send notice');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] });
      qc.invalidateQueries({ queryKey: ['unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      toast.success('All marked as read');
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] });
      qc.invalidateQueries({ queryKey: ['unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] });
      qc.invalidateQueries({ queryKey: ['unread'] });
      toast.success('Notification removed');
    },
  });

  const unreadCount = useMemo(
    () => inbox?.filter((n) => !n.read).length ?? 0,
    [inbox]
  );

  const isLoading = tab === 'inbox' ? loadingInbox : loadingSent;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board & Broadcasts 📢"
        subtitle="Publish notices to batches or classes, and view faculty notifications."
        action={
          <Button
            onClick={() => {
              setSendOpen(true);
              setPickedFile(null);
              reset({ target: 'ALL' });
            }}
          >
            <Plus className="h-4 w-4" />
            Post Notice
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('inbox')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'inbox'
              ? 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-[2px_2px_0px_#2587B8]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <Bell className="h-4 w-4" />
          Received Inbox
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#E87999] px-1.5 font-heading text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            tab === 'sent'
              ? 'border-[#62A66C] bg-[#E8F5DF] text-[#226E30] shadow-[2px_2px_0px_#62A66C]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <BellRing className="h-4 w-4" />
          Broadcasted Sent
        </button>

        {tab === 'inbox' && unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
            className="ml-auto shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all as read</span>
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : tab === 'inbox' ? (
        !inbox?.length ? (
          <EmptyState
            title="No incoming notifications"
            subtitle="Campus notices and administrative updates will appear here."
          />
        ) : (
          <div className="space-y-3.5">
            {inbox.map((n) => (
              <NotificationCard
                key={n.notificationId}
                notification={n}
                isSentView={false}
                onMarkRead={() => markReadMutation.mutate(n.notificationId)}
                onDelete={() => deleteMutation.mutate(n.notificationId)}
              />
            ))}
          </div>
        )
      ) : !sent?.length ? (
        <EmptyState
          title="No sent notices"
          subtitle="Notices you broadcast to your students will be listed here."
        />
      ) : (
        <div className="space-y-3.5">
          {sent.map((n) => (
            <SentCard key={n.batchId} notification={n} />
          ))}
        </div>
      )}

      {/* Send Notice modal */}
      <Modal
        open={sendOpen}
        onClose={() => {
          setSendOpen(false);
          setPickedFile(null);
          reset({ target: 'ALL' });
        }}
        title="Broadcast a New Notice 📢"
        size="lg"
      >
        <form
          onSubmit={handleSubmit((d) => sendMutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Notice Subject / Headline"
            placeholder="e.g. Mid-semester practical exam schedule"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Notice Message
            </label>
            <textarea
              rows={4}
              placeholder="Enter full announcement details, timings, instructions, and room numbers…"
              {...register('message')}
              className="w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 py-2.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
            />
            {errors.message && (
              <p className="mt-1 text-xs font-medium text-[#C22B58]">{errors.message.message}</p>
            )}
          </div>

          {/* Target selection */}
          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] p-4">
            <p className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/80">
              Recipient Target Group
            </p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#302365]/15 bg-white p-3 font-heading text-xs font-bold text-[#302365] transition hover:bg-[#DFF2FC]">
                <input type="radio" value="ALL" {...register('target')} />
                <Users className="h-4 w-4 shrink-0 text-[#2587B8]" />
                <span className="truncate">All Students</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#302365]/15 bg-white p-3 font-heading text-xs font-bold text-[#302365] transition hover:bg-[#DFF2FC]">
                <input type="radio" value="CLASS" {...register('target')} />
                <BookOpen className="h-4 w-4 shrink-0 text-[#62A66C]" />
                <span className="truncate">Specific Class</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#302365]/15 bg-white p-3 font-heading text-xs font-bold text-[#302365] transition hover:bg-[#DFF2FC]">
                <input type="radio" value="BATCH" {...register('target')} />
                <Bell className="h-4 w-4 shrink-0 text-[#E89D42]" />
                <span className="truncate">Graduation Batch</span>
              </label>
            </div>
          </div>

          {/* Conditional fields */}
          {target === 'CLASS' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Branch" {...register('branchId')}>
                <option value="">— Select branch —</option>
                {myBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Semester"
                {...register('semester', { valueAsNumber: true })}
              >
                <option value="">— Select semester —</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {target === 'BATCH' && (
            <Input label="Graduation Batch Year" placeholder="e.g. 2024-2028" {...register('batch')} />
          )}

          {/* Attachment */}
          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Circular Attachment (optional PDF/Image)
            </label>
            <input
              type="file"
              onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#302365] file:mr-3 file:rounded-xl file:border-2 file:border-[#302365]/15 file:bg-[#DFF2FC] file:px-4 file:py-2 file:font-heading file:text-xs file:font-bold file:text-[#2587B8] hover:file:bg-[#cbe9f9] cursor-pointer"
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
                setSendOpen(false);
                setPickedFile(null);
                reset({ target: 'ALL' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={sendMutation.isPending}>
              Send Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ─── Inbox notification card ────────────────────────────────
interface CardProps {
  notification: NotificationResponse;
  isSentView: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
}

const NotificationCard = ({
  notification: n,
  isSentView,
  onMarkRead,
  onDelete,
}: CardProps) => (
  <div
    className={cn(
      'rounded-3xl border-2 p-5 transition-all shadow-[3px_3px_0px_rgba(48,35,101,0.06)]',
      !n.read
        ? 'border-[#2587B8] bg-[#DFF2FC]/40'
        : 'border-[#302365]/12 bg-white'
    )}
  >
    <div className="flex items-start gap-4">
      <div
        className={cn(
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 shadow-xs',
          n.read
            ? 'border-[#302365]/15 bg-[#FFF6D8] text-[#302365]/60'
            : 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8]'
        )}
      >
        <Bell className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'font-heading text-lg',
                  n.read
                    ? 'font-bold text-[#302365]'
                    : 'font-extrabold text-[#302365]'
                )}
              >
                {n.title}
              </h3>
              {n.type && <Badge variant="info">{n.type}</Badge>}
              {!n.read && !isSentView && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#E87999] ring-2 ring-white" />
              )}
            </div>
            <p className="mt-1.5 font-medium text-sm text-[#302365] whitespace-pre-wrap break-words leading-relaxed">
              {n.message}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#302365]/60">
              <span>{formatDateTime(n.createdAt)}</span>
              {n.targetGroup && <span>· Target: {n.targetGroup}</span>}
              {n.batchYear && <span>· Batch: {n.batchYear}</span>}
              {n.semester != null && <span>· Sem {n.semester}</span>}
            </div>

            {n.attachmentUrl && (
              <a
                href={n.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[#2587B8] hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                View attachment
              </a>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!isSentView && !n.read && (
              <button
                onClick={onMarkRead}
                className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#E8F5DF] hover:text-[#226E30] transition cursor-pointer shadow-xs"
                title="Mark as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {!isSentView && (
              <button
                onClick={onDelete}
                className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FCE4EB] hover:text-[#C22B58] transition cursor-pointer shadow-xs"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Sent card ──────────────────────────────────────────────
interface SentCardProps {
  notification: SentNotificationResponse;
}

const SentCard = ({ notification: n }: SentCardProps) => (
  <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)]">
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#62A66C] bg-[#E8F5DF] text-[#226E30] shadow-xs">
        <BellRing className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg font-bold text-[#302365]">{n.title}</h3>
          {n.type && <Badge variant="info">{n.type}</Badge>}
          <Badge variant="success">
            {n.recipientCount}{' '}
            {n.recipientCount === 1 ? 'recipient' : 'recipients reached'}
          </Badge>
        </div>

        <p className="mt-1.5 font-medium text-sm text-[#302365] whitespace-pre-wrap break-words leading-relaxed">
          {n.message}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#302365]/60">
          <span>{formatDateTime(n.createdAt)}</span>
          {n.targetGroup && <span>· Target: {n.targetGroup}</span>}
        </div>
      </div>
    </div>
  </div>
);