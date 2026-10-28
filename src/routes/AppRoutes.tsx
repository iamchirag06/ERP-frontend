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



import { DoodleLaptop, DoodleClipboard, SpeechBubbleTag, SparkleIcon } from '@/components/ui/Illustrations';

const Unauthorized = () => (
  <div className="grid min-h-screen place-items-center bg-[#FFF6D8] p-4">
    <div className="max-w-md w-full text-center rounded-3xl border-2 border-[#302365]/15 bg-white p-8 shadow-[6px_6px_0px_rgba(48,35,101,0.1)]">
      <div className="relative inline-block mb-3">
        <DoodleLaptop className="h-20 w-20" />
        <div className="absolute -top-3 -right-6">
          <SpeechBubbleTag className="bg-[#FCE4EB] text-[#C22B58]">
            Access Denied! 🚫
          </SpeechBubbleTag>
        </div>
      </div>
      <h1 className="font-heading text-3xl font-bold text-[#302365]">403 — Unauthorized</h1>
      <p className="mt-2 text-sm font-medium text-[#302365]/70">
        You don't have permission to access this campus page.
      </p>
      <a
        href="/login"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#302365] bg-[#302365] px-5 py-2.5 font-heading text-sm font-bold text-[#FFF6D8] shadow-[2px_2px_0px_rgba(48,35,101,0.3)] hover:bg-[#403085] transition"
      >
        Return to Login
      </a>
    </div>
  </div>
);

const ComingSoon = ({ title }: { title: string }) => (
  <div className="grid place-items-center py-20 px-4 text-center">
    <div className="max-w-md w-full rounded-3xl border-2 border-[#302365]/15 bg-white p-8 shadow-[4px_4px_0px_rgba(48,35,101,0.08)]">
      <div className="relative inline-block mb-3">
        <DoodleClipboard className="h-16 w-16" />
        <SparkleIcon className="absolute -top-2 -right-3 h-5 w-5 text-amber-400" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-[#302365]">{title}</h2>
      <p className="mt-2 text-sm font-medium text-[#302365]/70">
        We're working on this feature! It will be available soon.
      </p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-[#FFF6D8] p-4">
    <div className="max-w-md w-full text-center rounded-3xl border-2 border-[#302365]/15 bg-white p-8 shadow-[6px_6px_0px_rgba(48,35,101,0.1)]">
      <div className="relative inline-block mb-3">
        <DoodleLaptop className="h-20 w-20" />
        <div className="absolute -top-3 -right-8">
          <SpeechBubbleTag className="bg-[#FFF0C9] text-[#995E05]">
            Lost on campus? 🤔
          </SpeechBubbleTag>
        </div>
      </div>
      <h1 className="font-heading text-6xl font-extrabold text-[#302365]">404</h1>
      <p className="mt-2 font-heading text-lg font-bold text-[#302365]">Page Not Found</p>
      <p className="mt-1 text-sm font-medium text-[#302365]/70">
        The page you are looking for doesn't exist or has moved.
      </p>
      <a
        href="/login"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#302365] bg-[#302365] px-6 py-2.5 font-heading text-sm font-bold text-[#FFF6D8] shadow-[2px_2px_0px_rgba(48,35,101,0.3)] hover:bg-[#403085] transition"
      >
        Go to Login
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