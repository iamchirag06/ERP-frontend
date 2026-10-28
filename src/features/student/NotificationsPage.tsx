import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bell,
  CheckCheck,
  Trash2,
  Paperclip,
  Filter,
} from 'lucide-react';
import {
  getNotifications,
  markAllRead,
  markRead,
  deleteNotification,
} from '@/api/notifications';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { NotificationResponse } from '@/types/operations';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const typeStyle = (type: string) => {
  switch (type) {
    case 'ASSIGNMENT':
      return { variant: 'info' as const, label: 'Assignment', iconBg: 'bg-[#DFF2FC] text-[#17648B] border-[#99D4F2]' };
    case 'GRADE_UPDATE':
      return { variant: 'success' as const, label: 'Grade Update', iconBg: 'bg-[#E8F5DF] text-[#226E30] border-[#A3D995]' };
    case 'DOUBT_REPLY':
      return { variant: 'lavender' as const, label: 'Doubt Reply', iconBg: 'bg-[#DCD2F5] text-[#463378] border-[#B7A4E8]' };
    case 'NOTICE':
    default:
      return { variant: 'warning' as const, label: 'Notice', iconBg: 'bg-[#FFF0C9] text-[#995E05] border-[#F7D37E]' };
  }
};

export const StudentNotificationsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: getNotifications,
    enabled: !!token,
  });

  const list = useMemo(() => {
    if (!data) return [];
    if (filter === 'unread') return data.filter((n) => !n.read);
    return data;
  }, [data, filter]);

  const unreadCount = useMemo(
    () => data?.filter((n) => !n.read).length ?? 0,
    [data]
  );

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board & Alerts 🔔"
        subtitle="Stay updated with college circulars, class announcements, and grading."
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAllMutation.mutate()}
              loading={markAllMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            filter === 'all'
              ? 'border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-[2px_2px_0px_#2587B8]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <Filter className="h-4 w-4" />
          All Notices
          {data?.length ? (
            <span className="text-xs font-semibold">({data.length})</span>
          ) : null}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-heading text-sm font-bold transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_rgba(48,35,101,0.06)]',
            filter === 'unread'
              ? 'border-[#E87999] bg-[#FCE4EB] text-[#C22B58] shadow-[2px_2px_0px_#E87999]'
              : 'border-[#302365]/15 bg-white text-[#302365]/70 hover:bg-[#FFF6D8] hover:text-[#302365]'
          )}
        >
          <Bell className="h-4 w-4" />
          Unread Only
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#E87999] text-white px-1.5 font-heading text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : !list.length ? (
        <EmptyState
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          subtitle={
            filter === 'unread'
              ? "You're all caught up with campus news! ✨"
              : 'Notices from your teachers and administration will appear here.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {list.map((n) => (
            <NotificationRow
              key={n.notificationId}
              notification={n}
              onMarkRead={() => markReadMutation.mutate(n.notificationId)}
              onDelete={() => deleteMutation.mutate(n.notificationId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────
function NotificationRow({
  notification: n,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationResponse;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const style = typeStyle(n.type);

  return (
    <div
      className={cn(
        'rounded-3xl border-2 p-5 transition-all duration-150 shadow-[3px_3px_0px_rgba(48,35,101,0.06)]',
        !n.read
          ? 'border-[#2587B8] bg-[#DFF2FC]/40'
          : 'border-[#302365]/12 bg-white'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 shadow-xs',
            style.iconBg
          )}
        >
          <Bell className="h-6 w-6" />
        </div>

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
            <Badge variant={style.variant}>{style.label}</Badge>
            {!n.read && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#E87999] ring-2 ring-white" />
            )}
          </div>

          <p className="mt-1.5 font-medium text-sm text-[#302365] whitespace-pre-wrap break-words leading-relaxed">
            {n.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#302365]/60">
            <span>{formatDateTime(n.createdAt)}</span>
            {n.targetGroup && <span>· Group: {n.targetGroup}</span>}
            {n.batchYear && <span>· Batch: {n.batchYear}</span>}
            {n.semester != null && <span>· Semester {n.semester}</span>}
          </div>

          {n.attachmentUrl && (
            <a
              href={n.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[#2587B8] hover:underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Download Notice Attachment
            </a>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!n.read && (
            <button
              onClick={onMarkRead}
              className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#E8F5DF] hover:text-[#226E30] transition cursor-pointer shadow-xs"
              title="Mark as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FCE4EB] hover:text-[#C22B58] transition cursor-pointer shadow-xs"
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}