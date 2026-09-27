import { api } from '@/lib/api';
import type { AttendanceRequest, AttendanceSummaryResponse } from '@/types/operations';
import type { StudentLiteResponse } from '@/types/users';

export const markAttendance = (body: AttendanceRequest) =>
  api.post('/api/attendance/mark', body);

export const getStudentAttendance = (studentId: string) =>
  api.get(`/api/attendance/student/${studentId}`).then((r) => r.data);

export const getAttendanceSummary = (studentId: string) =>
  api
    .get<AttendanceSummaryResponse[]>(`/api/attendance/summary/${studentId}`)
    .then((r) => r.data);

export const updateAttendance = (id: string, body: unknown) =>
  api.put(`/api/attendance/update/${id}`, body);

export const teacherSubjects = () =>
  api.get('/api/teacher/attendance/subjects').then((r) => r.data);

export const teacherRoster = (subjectId: string) =>
  api
    .get<StudentLiteResponse[]>('/api/teacher/attendance/students', {
      params: { subjectId },
    })
    .then((r) => r.data);