import type { UUID } from './common';


// ─────────────────────────────────────────────────────────────
// Branches
// ─────────────────────────────────────────────────────────────
export interface BranchLite {
  id: string;
  name: string;
  code: string;
}

export type BranchResponse = BranchLite;

export interface BranchRequest {
  name: string;
  code: string;
}

// ─────────────────────────────────────────────────────────────
// Teachers
// ─────────────────────────────────────────────────────────────

/**
 * Full teacher record as returned by:
 *   - GET /api/admin/teachers
 *   - nested inside SubjectLiteResponse.teacher
 *   - nested inside TimetableEntry.teacher
 */
export interface TeacherLite {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  qualification: string | null;
  cabinNumber: string | null;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  joiningDate: string | null;
  role: 'TEACHER' | 'ADMIN';
  branch: BranchLite | null;
  createdAt: string;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
}

/**
 * Alias used by the admin Teachers page.
 * Same shape as TeacherLite.
 */
export type TeacherProfileResponse = TeacherLite;

/**
 * Trimmed teacher profile as returned by GET /api/teacher/profile
 * (the teacher looking at their own profile). Flat shape, no id/branch object.
 */
export interface TeacherSelfProfile {
  name: string;
  email: string;
  profileImageUrl: string | null;
  designation: string | null;
  qualification: string | null;
  branchName: string | null;
  joiningDate: string | null;
  phoneNumber: string | null;
  cabinNumber: string | null;
}

// ─────────────────────────────────────────────────────────────
// Subjects
// ─────────────────────────────────────────────────────────────

/**
 * Subject as returned by admin endpoints:
 *   - GET /api/admin/subjects/{branchId}/{semester}
 * Nested branch + teacher objects.
 */
export interface SubjectLiteResponse {
  id: string;
  name: string;
  code: string;
  semester: number;
  credits?: number | null;
  type?: string | null;
  syllabusUrl?: string | null;
  branch: BranchLite;
  teacher: TeacherLite | null;
}

/**
 * Subject as returned by GET /api/subjects/me (teacher's own subjects).
 * Flat shape, no nested branch/teacher.
 */
export interface TeacherSubjectResponse {
  id: string;
  name: string;
  code: string;
  semester: number;
  branchId: string;
  branchName: string;
  branchCode: string;
}

export interface SubjectRequest {
  name: string;
  code: string;
  semester: number;
  credits?: number;
  type?: string;
}
/**
 * Subject as returned by GET /api/teacher/attendance/subjects
 * (lightweight, uses `subjectId` not `id`).
 */
export interface AttendanceSubjectLite {
  subjectId: string;
  name: string;
  code: string;
  semester: number;
  branchId: string;
  branchName: string;
}

// ─────────────────────────────────────────────────────────────
// Students
// ─────────────────────────────────────────────────────────────

/**
 * Student's own subject as returned by GET /api/student/profile/subjects.
 * Minimal shape — id, name, code only.
 */
export interface StudentSubjectResponse {
  id: string;
  name: string;
  code: string;
}
/**
 * Lightweight student, e.g. roster row in attendance.
 */
export interface StudentLiteResponse {
  studentId: UUID;
  name: string;
  rollNo: string;
}

/**
 * Student profile as returned by GET /api/student/profile
 * (the student viewing their own profile).
 */
export interface StudentProfileResponse {
  name: string;
  email: string;
  rollNo: string;
  profileImageUrl: string | null;
  branchName: string;
  semester: number;
  batch: string;
  cgpa: number | null;
  activeBacklogs: number | null;
  phoneNumber: string | null;
  address: string | null;
  skills: string[] | null;
  linkedinProfile: string | null;
  githubProfile: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
}

/**
 * Full student record as returned by GET /api/admin/students.
 * Nested branch object.
 */
export interface StudentListResponse {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  semester: number;
  batch: string;
  cgpa: number | null;
  activeBacklogs: number | null;
  totalPoints: number;
  phoneNumber: string | null;
  address: string | null;
  dob: string | null;
  admissionDate: string | null;
  linkedinProfile: string | null;
  githubProfile: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  profileImageUrl: string | null;
  skills: string[];
  role: 'STUDENT';
  createdAt: string;
  branch: BranchLite;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
}

export interface StudentUpdateRequest {
  name?: string;
  rollNo?: string;
  semester?: number;
  batch?: string;
  cgpa?: number;
  activeBacklogs?: number;
  phoneNumber?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
}

