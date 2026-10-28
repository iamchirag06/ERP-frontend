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
import { DoodleLaptop, DoodleHeart, SparkleIcon } from '@/components/ui/Illustrations';

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

  const rolePillColor =
    role === 'STUDENT'
      ? 'bg-[#DFF2FC] text-[#2587B8] border-[#99D4F2]'
      : role === 'TEACHER'
      ? 'bg-[#E8F5DF] text-[#62A66C] border-[#A3D995]'
      : 'bg-[#FFF0C9] text-[#E89D42] border-[#F7D37E]';

  return (
    <aside
      className={cn(
        // Base styles
        'fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r-2 border-[#302365]/12 bg-[#FFFDF7] transition-transform duration-200 shadow-[4px_0px_0px_rgba(48,35,101,0.04)]',
        // Desktop: static, always visible
        'md:static md:translate-x-0',
        // Mobile: slide in/out
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center gap-3 border-b-2 border-[#302365]/10 px-4 bg-[#FFFDF7]">
        <div className="relative shrink-0">
          <DoodleLaptop className="h-10 w-10" />
          <SparkleIcon className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h2 className="truncate font-heading text-lg font-bold tracking-wide text-[#302365]">
              College ERP
            </h2>
          </div>
          <span
            className={cn(
              'inline-block rounded-full border px-2 py-0.2 text-[10px] font-bold tracking-wide uppercase',
              rolePillColor
            )}
          >
            {role.toLowerCase()} portal
          </span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="rounded-xl border border-[#302365]/20 p-1.5 text-[#302365] hover:bg-[#FCE4EB] md:hidden cursor-pointer"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav list */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-heading text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#DFF2FC] text-[#2587B8] border-2 border-[#99D4F2] shadow-[2px_2px_0px_#2587B8] translate-x-1'
                  : 'text-[#302365]/80 border-2 border-transparent hover:bg-[#FFF6D8] hover:text-[#302365]'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer doodle accent */}
      <div className="border-t-2 border-[#302365]/10 p-3 bg-[#FFFDF7]/80">
        <div className="flex items-center justify-between rounded-xl border border-[#302365]/10 bg-[#FFF6D8] p-2.5">
          <div className="flex items-center gap-2">
            <DoodleHeart className="h-6 w-6" />
            <div>
              <p className="font-heading text-xs font-bold text-[#302365]">
                Happy Learning!
              </p>
              <p className="text-[10px] text-[#302365]/70">Campus ERP Portal</p>
            </div>
          </div>
          <SparkleIcon className="h-4 w-4 text-amber-500" />
        </div>
      </div>
    </aside>
  );
};