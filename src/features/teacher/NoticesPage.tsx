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
import { Card, CardBody } from '@/components/ui/Card';
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
      if (!seen.has(s.branchId)) {
        seen.set(s.branchId, { id: s.branchId, name: s.branchName });
      }
    });
    return Array.from(seen.values());
  }, [subjects]);

  // ─── Form ─────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'ALL' },
  });

  const target = watch('target');

  const sendMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        title: data.title,
        message: data.message,
        branchId: data.target === 'ALL' ? null : data.branchId || null,
        semester: data.target === 'CLASS' ? data.semester ?? null : null,
        batch: data.target === 'BATCH' ? data.batch || null : null,
      };
      return sendNotice(payload, pickedFile ?? undefined);
    },
    onSuccess: () => {
      toast.success('Notice sent');
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['notifications-sent'] });
      }, 300);
      qc.invalidateQueries({ queryKey: ['unread'] });
      reset({ target: 'ALL' });
      setPickedFile(null);
      setSendOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      console.error('send-notice failed:', e.response?.data);
      toast.error(
        raw.length > 200 ? 'Failed to send notice.' : raw || 'Failed to send notice'
      );
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
      toast.success('Notification deleted');
    },
  });

  const unreadCount = useMemo(
    () => inbox?.filter((n) => !n.read).length ?? 0,
    [inbox]
  );

  const isLoading = tab === 'inbox' ? loadingInbox : loadingSent;

  return (
    <div>
      <PageHeader
        title="Notices"
        subtitle="Send and receive notifications."
        action={
          <Button onClick={() => setSendOpen(true)}>
            <Plus className="h-4 w-4" />
            Send Notice
          </Button>
        }
      />

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setTab('inbox')}
          className={cn(
            'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'inbox'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Bell className="h-4 w-4" />
          Inbox
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={cn(
            'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            tab === 'sent'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <BellRing className="h-4 w-4" />
          Sent
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
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : tab === 'inbox' ? (
        !inbox?.length ? (
          <EmptyState
            title="No notifications"
            subtitle="You have no notifications right now."
          />
        ) : (
          <div className="space-y-3">
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
          subtitle="Notices you send will appear here."
        />
      ) : (
        <div className="space-y-3">
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
        title="Send Notice"
        size="lg"
      >
        <form
          onSubmit={handleSubmit((d) => sendMutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Title"
            placeholder="Mid-semester exam schedule"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              rows={4}
              placeholder="Details of the notice…"
              {...register('message')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.message && (
              <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
            )}
          </div>

          {/* Target selection */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Send to
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200 has-[:checked:ring-2 has-checked]:ring-indigo-500">
                <input type="radio" value="ALL" {...register('target')} />
                <Users className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">Everyone</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200 has-[:checked:ring-2 has-checked]:ring-indigo-500">
                <input type="radio" value="CLASS" {...register('target')} />
                <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">A class</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200 has-[:checked:ring-2 has-checked]:ring-indigo-500">
                <input type="radio" value="BATCH" {...register('target')} />
                <Bell className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">A batch</span>
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
            <Input label="Batch" placeholder="2023-2027" {...register('batch')} />
          )}

          {/* Attachment */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Attachment (optional)
            </label>
            <input
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

          {/* Footer — stacks on mobile */}
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
              Send
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
  <Card>
    <CardBody className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
          n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
        )}
      >
        <Bell className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'truncate',
                  n.read
                    ? 'font-medium text-slate-700'
                    : 'font-semibold text-slate-900'
                )}
              >
                {n.title}
              </h3>
              {n.type && <Badge variant="info">{n.type}</Badge>}
              {!n.read && !isSentView && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap-break-words text-sm text-slate-600">
              {n.message}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>{formatDateTime(n.createdAt)}</span>
              {n.targetGroup && <span>· {n.targetGroup}</span>}
              {n.batchYear && <span>· Batch {n.batchYear}</span>}
              {n.semester != null && <span>· Sem {n.semester}</span>}
            </div>

            {n.attachmentUrl && (
              <a
                href={n.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                <Paperclip className="h-3 w-3" />
                View attachment
              </a>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            {!isSentView && !n.read && (
              <button
                onClick={onMarkRead}
                className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                title="Mark as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {!isSentView && (
              <button
                onClick={onDelete}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

// ─── Sent card ──────────────────────────────────────────────
interface SentCardProps {
  notification: SentNotificationResponse;
}

const SentCard = ({ notification: n }: SentCardProps) => (
  <Card>
    <CardBody className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
        <BellRing className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-slate-900">{n.title}</h3>
          {n.type && <Badge variant="info">{n.type}</Badge>}
          <Badge variant="success">
            {n.recipientCount}{' '}
            {n.recipientCount === 1 ? 'recipient' : 'recipients'}
          </Badge>
        </div>

        <p className="mt-1 whitespace-pre-wrap-break-words text-sm text-slate-600">
          {n.message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{formatDateTime(n.createdAt)}</span>
          {n.targetGroup && <span>· {n.targetGroup}</span>}
        </div>
      </div>
    </CardBody>
  </Card>
);