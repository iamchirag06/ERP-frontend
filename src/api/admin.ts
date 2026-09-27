import { api } from '@/lib/api';
import type { RegisterRequest } from '@/types/auth';
import type {
  BranchRequest,
  BranchResponse,
  StudentListResponse,
  StudentUpdateRequest,
  TeacherProfileResponse,
  SubjectLiteResponse,
} from '@/types/users';


// Branches
export const getBranches = () =>
  api.get<BranchResponse[]>('/api/admin/branches').then((r) => r.data);

export const addBranch = (body: BranchRequest) =>
  api.post<BranchResponse>('/api/admin/add-branch', body).then((r) => r.data);

// Subjects
export const addSubject = (branchId: string, body: unknown) =>
  api.post(`/api/admin/add-subject/${branchId}`, body).then((r) => r.data);

export const getSubjects = (branchId: string, semester: number) =>
  api.get<SubjectLiteResponse[]>(`/api/admin/subjects/${branchId}/${semester}`).then((r) => r.data);

export const assignTeacher = (subjectId: string, teacherId: string) =>
  api.put(`/api/admin/subjects/${subjectId}/assign-teacher/${teacherId}`).then((r) => r.data);

// Students
// ─── Students ────────────────────────────────────────────────
export const addStudent = (body: RegisterRequest) =>
  api.post('/api/admin/add-student', body).then((r) => r.data);

export const getStudents = (params?: {
  branchId?: string;
  semester?: number;
  batch?: string;
}) =>
  api
    .get<StudentListResponse[]>('/api/admin/students', { params })
    .then((r) => r.data);

export const updateStudent = (id: string, body: StudentUpdateRequest) =>
  api.put(`/api/admin/student/${id}`, body).then((r) => r.data);

export const deleteStudent = (id: string) =>
  api.delete(`/api/admin/student/${id}`);

// Teachers
export const addTeacher = (body: RegisterRequest) =>
  api.post('/api/admin/add-teacher', body).then((r) => r.data);

export const getTeachers = (params?: { department?: string }) =>
  api.get<TeacherProfileResponse[]>('/api/admin/teachers', { params }).then((r) => r.data);

export const deleteTeacher = (id: string) =>
  api.delete(`/api/admin/teacher/${id}`);

// Batch promotion
export const promoteBatch = (body: { batch: string; branchId?: string }) =>
  api.post('/api/admin/promote-batch', body).then((r) => r.data);

// Timetable
export const addTimetableEntry = (body: unknown) =>
  api.post('/api/timetable/add', body).then((r) => r.data);