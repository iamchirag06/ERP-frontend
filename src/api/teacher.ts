import { api } from '@/lib/api';
import type {
  TeacherSubjectResponse,
  StudentLiteResponse,
  AttendanceSubjectLite,
  TeacherSelfProfile,
} from '@/types/users';

import type { AttendanceRequest } from '@/types/operations';

// ─── Subjects ────────────────────────────────────────────────
export const getMySubjects = () =>
  api.get<TeacherSubjectResponse[]>('/api/subjects/me').then((r) => r.data);

export const getSubjectStudents = (subjectId: string) =>
  api
    .get<StudentLiteResponse[]>(`/api/subjects/${subjectId}/students`)
    .then((r) => r.data);

// ─── Profile ─────────────────────────────────────────────────
export const getTeacherProfile = () =>
  api.get<TeacherSelfProfile>('/api/teacher/profile').then((r) => r.data);

// PUT returns plain text
export const updateTeacherProfile = (body: {
  phoneNumber?: string;
  cabinNumber?: string;
  qualification?: string;
}) =>
  api
    .put<string>('/api/teacher/profile', body, { responseType: 'text' })
    .then((r) => r.data);

// POST returns { imageUrl }
export const uploadTeacherProfileImage = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api
    .post<{ imageUrl: string }>('/api/teacher/profile/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// ─── Attendance ─────────────────────────────────────────────
export const getAttendanceSubjects = () =>
  api
    .get<AttendanceSubjectLite[]>('/api/teacher/attendance/subjects')
    .then((r) => r.data);

export const getAttendanceRoster = (subjectId: string) =>
  api
    .get<StudentLiteResponse[]>('/api/teacher/attendance/students', {
      params: { subjectId },
    })
    .then((r) => r.data);

export const markAttendance = (body: AttendanceRequest) =>
  api.post('/api/attendance/mark', body).then((r) => r.data);