import { api } from '@/lib/api';
import type {
  NotificationResponse,
  SentNotificationResponse,
  NoticeRequest,
  SendNoticeResponse,
} from '@/types/operations';

// ─── Read (any authenticated user) ───────────────────────────
export const getNotifications = () =>
  api.get<NotificationResponse[]>('/api/notifications').then((r) => r.data);

export const getUnreadCount = () =>
  api.get<number>('/api/notifications/unread-count').then((r) => r.data);

export const markRead = (id: string) =>
  api.put(`/api/notifications/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  api.put('/api/notifications/read-all').then((r) => r.data);

export const deleteNotification = (id: string) =>
  api.delete(`/api/notifications/${id}`).then((r) => r.data);


// ─── Send (teacher/admin) ────────────────────────────────────
export const sendNotice = (data: NoticeRequest, file?: File) => {
  const fd = new FormData();
  fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (file) fd.append('file', file);

  return api
    .post<SendNoticeResponse>('/api/notifications/send', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// ─── Sent history (teacher/admin) ────────────────────────────
export const getSentNotifications = () =>
  api
    .get<SentNotificationResponse[]>('/api/notifications/admin/sent')
    .then((r) => r.data);

