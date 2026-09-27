import { api } from '@/lib/api';
import type { StudentSubjectResponse, StudentProfileResponse } from '@/types/users';
import type { AttendanceSummaryResponse } from '@/types/operations';

// ─── Subjects ────────────────────────────────────────────────
export const getMySubjects = () =>
  api
    .get<StudentSubjectResponse[]>('/api/student/profile/subjects')
    .then((r) => r.data);

// ─── Attendance ──────────────────────────────────────────────
export const getMyAttendanceSummary = (studentId: string) =>
  api
    .get<AttendanceSummaryResponse[]>(
      `/api/attendance/summary/${studentId}`
    )
    .then((r) => r.data);

export const getMyAttendanceRecords = (studentId: string) =>
  api
    .get<AttendanceRecord[]>(`/api/attendance/student/${studentId}`)
    .then((r) => r.data);

// ─── Profile ─────────────────────────────────────────────────
export const getMyProfile = () =>
  api.get<StudentProfileResponse>('/api/student/profile').then((r) => r.data);

// PUT returns plain text, not JSON
export const updateMyProfile = (body: {
  phoneNumber?: string;
  address?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  skills?: string[];
}) =>
  api
    .put<string>('/api/student/profile', body, { responseType: 'text' })
    .then((r) => r.data);

// Branches returns a single object, not an array
export const getMyBranch = () =>
  api
    .get<{ id: string; name: string }>('/api/student/profile/branches')
    .then((r) => r.data);

export const uploadMyProfileImage = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api
    .post<{ imageUrl: string }>('/api/student/profile/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// ─── Attendance record shape ─────────────────────────────────
export interface AttendanceRecord {
  id?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  subject?: { id: string; name: string; code: string };
  subjectName?: string;
  subjectCode?: string;
}