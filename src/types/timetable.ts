import type { UUID } from './common';
import type { BranchLite, TeacherLite } from './users';

export type Day =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export const DAYS: Day[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

// Subject as it appears inside a timetable entry
export interface TimetableSubject {
  id: string;
  name: string;
  code: string;
  semester: number;
  credits: number | null;
  type: string | null;
  syllabusUrl: string | null;
  branch: BranchLite;
  teacher: TeacherLite | null;
}

// Full timetable entry as returned by the API
export interface TimetableEntry {
  id: string;
  day: Day;
  startTime: string;   // "09:00:00"
  endTime: string;     // "09:55:00"
  roomNumber: string;
  section: string | null;
  semester: number;
  branch: BranchLite;
  subject: TimetableSubject;
  teacher: TeacherLite;
}

// POST /api/timetable/add payload
export interface TimetableRequest {
  subjectId: UUID;
  teacherId: UUID;
  branchId: UUID;
  semester: number;
  roomNumber: string;
  day: Day;
  startTime: string;   // "09:00:00"
  endTime: string;     // "09:55:00"
}