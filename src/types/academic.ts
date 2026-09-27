import type { UUID, ISODateTime } from './common';
import type { TeacherLite, SubjectLiteResponse } from './users';

// ─── Resources ───────────────────────────────────────────────
export interface StudyMaterialResponse {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string | null;
  unitTag: string | null;
  uploadedAt: string;
  subject: SubjectLiteResponse;
  uploadedBy: TeacherLite;
}

export interface ResourceUploadRequest {
  subjectId: string;
  title: string;
  unit?: string;
}

// ─── Assignments ─────────────────────────────────────────────
export interface AssignmentRequest {
  title: string;
  description: string;
  deadline: ISODateTime;
  subjectId: UUID;
}

export interface AssignmentResponse {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  attachmentUrl: string | null;
  subject: SubjectLiteResponse;
  teacher: TeacherLite;
}

export interface SubmissionRequest {
  assignmentId: UUID;
  submissionLink: string;
}

export interface SubmissionResponse {
  submissionId: UUID;
  studentName: string;
  rollNo: string;
  submissionLink: string;
  grade: string | null;
  feedback: string | null;
  late: boolean;
  submittedAt: ISODateTime;
}

export interface GradeRequest {
  submissionId: UUID;
  grade: number;
  feedback: string;
}

// ─── Doubts ──────────────────────────────────────────────────
export type DoubtStatus = 'OPEN' | 'SOLVED' | 'CLOSED';

export interface DoubtResponse {
  id: string;
  title: string;
  description?: string | null;
  status: DoubtStatus;
  bountyPoints: number;
  subjectId: string;
  subjectName: string;
  askerId: string;
  askerName: string;
}

export interface DoubtRequest {
  subjectId: string;
  title: string;
  description: string;
  bountyPoints?: number;
}

/**
 * Flat summary shape from /api/doubts/solutions/my
 * (one row per solution — no nested objects)
 */
export interface SolutionSummaryResponse {
  solutionId: string;
  doubtId: string;
  doubtTitle: string;
  content: string;
  isAccepted: boolean;
  solverId: string;
  solverName: string;
  subjectId: string;
  subjectName: string;
}

// ─── Nested entity shapes (from /api/doubts/{doubtId}/solutions) ───
export interface StudentEntity {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  semester: number;
  batch: string;
  profileImageUrl: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

export interface DoubtEntity {
  id: string;
  title: string;
  description: string;
  status: DoubtStatus;
  bountyPoints: number;
  createdAt: string;
  asker: StudentEntity;
  subject: SubjectLiteResponse;
}

export interface SolutionEntityResponse {
  id: string;
  content: string;
  accepted: boolean;
  createdAt: string;
  doubt: DoubtEntity;
  solver: StudentEntity;
}

export interface AnswerRequest {
  doubtId: string;
  content: string;
}