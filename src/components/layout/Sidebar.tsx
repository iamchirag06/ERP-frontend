import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  HelpCircle,
  Calendar,
  User,
  Upload,
  Bell,
  Users,
  GraduationCap,
  Building2,
  FileText,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navByRole: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/student/assignments', label: 'Assignments', icon: BookOpen },
    { to: '/student/resources', label: 'Study Materials', icon: FileText },
    { to: '/student/doubts', label: 'Doubts', icon: HelpCircle },
    { to: '/student/timetable', label: 'Timetable', icon: Calendar },
    { to: '/student/profile', label: 'Profile', icon: User },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/subjects', label: 'My Subjects', icon: BookOpen },
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
    { to: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { to: '/teacher/resources', label: 'Resources', icon: Upload },
    { to: '/teacher/notices', label: 'Notices', icon: Bell },
    { to: '/teacher/timetable', label: 'Timetable', icon: Calendar },
    { to: '/teacher/profile', label: 'Profile', icon: User },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/branches', label: 'Branches', icon: Building2 },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: Users },
    { to: '/admin/timetable', label: 'Timetable', icon: Calendar },
    { to: '/admin/promote', label: 'Promote Batch', icon: Upload },
  ],
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return null;
  const items = navByRole[role];

  return (
    <aside
      className={cn(
        // Base styles
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200',
        // Desktop: static, always visible
        'md:static md:translate-x-0',
        // Mobile: slide in/out
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 font-bold text-white">
          E
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">
            College ERP
          </p>
          <p className="truncate text-xs capitalize text-slate-500">
            {role.toLowerCase()} portal
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};