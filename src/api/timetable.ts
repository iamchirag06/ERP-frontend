import { api } from '@/lib/api';
import type { TimetableRequest, TimetableEntry } from '@/types/timetable';

// Any authenticated user: their own schedule
export const getMySchedule = () =>
  api.get<TimetableEntry[]>('/api/timetable/my-schedule').then((r) => r.data);

// Admin: add an entry
export const addTimetableEntry = (body: TimetableRequest) =>
  api.post('/api/timetable/add', body).then((r) => r.data);

// Admin/any: entries for a branch + semester
export const getTimetableByBranchAndSemester = (
  branchId: string,
  semester: number
) =>
  api
    .get<TimetableEntry[]>(
      `/api/timetable/branch/${branchId}/semester/${semester}`
    )
    .then((r) => r.data);