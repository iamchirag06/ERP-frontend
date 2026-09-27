import { api } from '@/lib/api';
import type {
  DoubtResponse,
  DoubtRequest,
  SolutionSummaryResponse,
  SolutionEntityResponse,
  AnswerRequest,
} from '@/types/academic';

// ─── Read ────────────────────────────────────────────────────
export const getAllDoubts = () =>
  api.get<DoubtResponse[]>('/api/doubts/all').then((r) => r.data);

export const getMySubjectsDoubts = () =>
  api.get<DoubtResponse[]>('/api/doubts/my-subjects').then((r) => r.data);

export const getDoubtsBySubject = (subjectId: string) =>
  api.get<DoubtResponse[]>(`/api/doubts/subject/${subjectId}`).then((r) => r.data);

export const getMyDoubtsWithSolutions = () =>
  api
    .get<SolutionSummaryResponse[]>('/api/doubts/solutions/my')
    .then((r) => r.data);

export const getSolutionsForDoubt = (doubtId: string) =>
  api
    .get<SolutionEntityResponse[]>(`/api/doubts/${doubtId}/solutions`)
    .then((r) => r.data);

// ─── Write ───────────────────────────────────────────────────
export const askDoubt = (body: DoubtRequest) =>
  api.post('/api/doubts/ask', body).then((r) => r.data);

export const answerDoubt = (body: AnswerRequest) =>
  api.post('/api/doubts/answer', body).then((r) => r.data);

export const acceptSolution = (solutionId: string) =>
  api.post(`/api/doubts/accept/${solutionId}`).then((r) => r.data);