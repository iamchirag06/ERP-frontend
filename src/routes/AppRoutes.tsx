import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RequireRole } from '@/components/auth/RequireRole';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { StudentDashboard } from '@/features/student/DashboardPage';
import { TeacherDashboard } from '@/features/teacher/DashboardPage';
import { AdminDashboard } from '@/features/admin/DashboardPage';
import { AdminBranchesPage } from '@/features/admin/BranchesPage';
import { AdminSubjectsPage } from '@/features/admin/SubjectsPage';
import { AdminStudentsPage } from '@/features/admin/StudentsPage';
import { AdminTimetablePage } from '@/features/admin/TimetablePage';
import { MySchedulePage } from '@/features/shared/MySchedulePage';
import { TeacherSubjectsPage } from '@/features/teacher/SubjectsPage';
import { TeacherProfilePage } from '@/features/teacher/ProfilePage';
import { TeacherAttendancePage } from '@/features/teacher/AttendancePage';
import { TeacherResourcesPage } from '@/features/teacher/ResourcesPage';
import { TeacherNoticesPage } from '@/features/teacher/NoticesPage';
import { TeacherAssignmentsPage } from '@/features/teacher/AssignmentsPage';
import { StudentAttendancePage } from '@/features/student/AttendancePage';
import { StudentAssignmentsPage } from '@/features/student/AssignmentsPage';
import { StudentResourcesPage } from '@/features/student/ResourcesPage';
import { StudentDoubtsPage } from '@/features/student/DoubtsPage';
import { StudentProfilePage } from '@/features/student/ProfilePage';
import { StudentNotificationsPage } from '@/features/student/NotificationsPage';
import { AdminPromoteBatchPage } from '@/features/admin/PromoteBatchPage';
import { OAuthCallbackPage } from '@/features/auth/OAuthCallbackPage';
import { AdminTeachersPage } from '@/features/admin/TeachersPage';



const Unauthorized = () => (
  <div className="grid min-h-screen place-items-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold">403 — Unauthorized</h1>
      <p className="mt-2 text-slate-500">You don't have access to this page.</p>
    </div>
  </div>
);

const ComingSoon = ({ title }: { title: string }) => (
  <div className="grid place-items-center py-24 text-center">
    <div>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">This page is coming soon.</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-slate-50">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">Page not found.</p>
      <a
        href="/login"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Go to login
      </a>
    </div>
  </div>
);

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />

    <Route element={<RequireAuth />}>
      <Route element={<AppShell />}>
        {/* ─── Student ─────────────────────────── */}
        <Route path="/student" element={<RequireRole roles={['STUDENT']} />}>
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="doubts" element={<StudentDoubtsPage />} />
          <Route path="resources" element={<StudentResourcesPage />} />
          <Route path="timetable" element={<MySchedulePage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>

        {/* ─── Teacher ─────────────────────────── */}
        <Route path="/teacher" element={<RequireRole roles={['TEACHER']} />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="subjects" element={<TeacherSubjectsPage />} />
        <Route path="attendance" element={<TeacherAttendancePage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="resources" element={<TeacherResourcesPage />} />
        <Route path="notices" element={<TeacherNoticesPage />} />
        <Route path="timetable" element={<MySchedulePage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
      </Route>

        {/* ─── Admin ───────────────────────────── */}
        <Route path="/admin" element={<RequireRole roles={['ADMIN']} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="branches" element={<AdminBranchesPage />} />
          <Route path="subjects" element={<AdminSubjectsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="timetable" element={<AdminTimetablePage />} />
          <Route path="promote" element={<AdminPromoteBatchPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);