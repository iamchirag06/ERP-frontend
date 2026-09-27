import { api } from '@/lib/api';
import type {
  AssignmentRequest,
  AssignmentResponse,
  GradeRequest,
  SubmissionResponse,
} from '@/types/academic';

// ─── List ────────────────────────────────────────────────────
export const getAssignmentsBySubject = (subjectId: string) =>
  api
    .get<AssignmentResponse[]>(`/api/assignments/subject/${subjectId}`)
    .then((r) => r.data);

// ─── Create ──────────────────────────────────────────────────
export const createAssignment = (data: AssignmentRequest, file?: File) => {
  const fd = new FormData();
  fd.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  );
  if (file) fd.append('file', file);

  return api
    .post<AssignmentResponse>('/api/assignments/create', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// ─── Update ──────────────────────────────────────────────────
export const updateAssignment = (id: string, data: AssignmentRequest) =>
  api.put<AssignmentResponse>(`/api/assignments/${id}`, data).then((r) => r.data);

// ─── Delete ──────────────────────────────────────────────────
export const deleteAssignment = (id: string) =>
  api.delete(`/api/assignments/${id}`).then((r) => r.data);

// ─── Submissions ─────────────────────────────────────────────
export const getSubmissions = (assignmentId: string) =>
  api
    .get<SubmissionResponse[]>(`/api/assignments/${assignmentId}/submissions`)
    .then((r) => r.data);

// ─── Grade ───────────────────────────────────────────────────
export const gradeSubmission = (body: GradeRequest) =>
  api.post('/api/assignments/grade', body).then((r) => r.data);

// ─── Student submissions ─────────────────────────────────────
export const submitAssignment = (body: { assignmentId: string; submissionLink: string }, file?: File) => {
  const fd = new FormData();
  fd.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  if (file) fd.append('file', file);
  return api
    .post('/api/assignments/submit', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const getMySubmissions = () =>
  api
    .get<SubmissionResponse[]>('/api/assignments/my-submissions')
    .then((r) => r.data);