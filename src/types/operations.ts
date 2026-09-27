import type { UUID, ISODate, ISODateTime } from './common';
import type { NotificationType } from './common';

// ─── Shared ──────────────────────────────────────────────────
export type TargetGroup = 'ALL' | 'BATCH' | 'CLASS' | 'USER';

// ─── Dashboard ──────────────────────────────────────────────
export interface DashboardStats {
  attendancePercentage: number | null;
  pendingAssignments: number | null;
  totalStudents: number | null;
  activeNotices: number | null;
  ungradedAssignments: number | null;
}

// ─── Attendance ─────────────────────────────────────────────
export interface AttendanceRequest {
  subjectId: UUID;
  date: ISODate;
  presentStudentIds: UUID[];
}

export interface AttendanceSummaryResponse {
  subjectName: string;
  subjectCode: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

// ─── Notices / Notifications ─────────────────────────────────
export interface NoticeRequest {
  title: string;
  message: string;
  branchId?: UUID | null;
  semester?: number | null;
  batch?: string | null;
}

export interface NotificationResponse {
  notificationId: UUID;
  branchId: UUID | null;
  semester: number | null;
  batchYear: string | null;
  title: string;
  message: string;
  type: NotificationType;
  referenceId: UUID | null;
  read: boolean;
  createdAt: ISODateTime;
  targetGroup: TargetGroup | null;
  attachmentUrl: string | null;
}

export interface SentNotificationResponse {
  batchId: UUID;
  title: string;
  message: string;
  type: NotificationType;
  targetGroup: TargetGroup | null;
  createdAt: ISODateTime;
  recipientCount: number;
}

export interface SendNoticeResponse {
  message: string;
  id: string;
}