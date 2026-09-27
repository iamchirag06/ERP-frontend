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
import { Card, CardBody } from '@/components/ui/Card';
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
      return { bg: 'bg-blue-50 text-blue-600', label: 'Assignment' };
    case 'GRADE_UPDATE':
      return { bg: 'bg-emerald-50 text-emerald-600', label: 'Grade' };
    case 'DOUBT_REPLY':
      return { bg: 'bg-violet-50 text-violet-600', label: 'Doubt' };
    case 'NOTICE':
    default:
      return { bg: 'bg-indigo-50 text-indigo-600', label: 'Notice' };
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
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Notices, assignment updates and grade announcements."
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAllMutation.mutate()}
              loading={markAllMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition',
            filter === 'all'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Filter className="h-4 w-4" />
          All
          {data?.length ? (
            <span className="text-xs text-slate-400">({data.length})</span>
          ) : null}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition',
            filter === 'unread'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Bell className="h-4 w-4" />
          Unread
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
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
              ? "You're all caught up!"
              : 'Notices from your teachers and admin will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
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
    <Card
      className={cn(
        'transition',
        !n.read && 'border-indigo-200 bg-indigo-50/30'
      )}
    >
<CardBody className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
            style.bg
          )}
        >
          <Bell className="h-5 w-5" />
        </div>

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
            <Badge variant="info">{style.label}</Badge>
            {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
          </div>

          <p className="mt-1 whitespace-pre-wrap-break-words text-sm text-slate-600">
  {n.message}
</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
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
          {!n.read && (
            <button
              onClick={onMarkRead}
              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
              title="Mark as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardBody>
    </Card>
  );
}