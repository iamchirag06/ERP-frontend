import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Menu } from 'lucide-react';
import { initials } from '@/lib/utils';
import { SparkleIcon } from '@/components/ui/Illustrations';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ['unread'],
    queryFn: getUnreadCount,
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const notificationsPath =
    user?.role === 'STUDENT'
      ? '/student/notifications'
      : user?.role === 'TEACHER'
      ? '/teacher/notices'
      : '/admin';

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b-2 border-[#302365]/10 bg-[#FFFDF7] px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="rounded-xl border-2 border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FFF6D8] md:hidden cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Decorative center pill on desktop */}
      <div className="hidden items-center gap-1.5 rounded-full border border-[#302365]/15 bg-[#FFF6D8] px-3.5 py-1 text-xs font-heading font-semibold text-[#302365] md:flex">
        <SparkleIcon className="h-3 w-3 text-amber-500" />
        <span>Campus Academic Portal</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate(notificationsPath)}
          className="relative rounded-xl border-2 border-[#302365]/15 bg-white p-2 text-[#302365] transition hover:bg-[#FFF6D8] shadow-[2px_2px_0px_rgba(48,35,101,0.05)] cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {!!unread && unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#E87999] border-2 border-white px-1 font-heading text-[10px] font-bold text-white shadow-xs">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#302365]/15 bg-white px-3 py-1.5 shadow-[2px_2px_0px_rgba(48,35,101,0.06)]">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#DCD2F5] border border-[#B7A4E8] font-heading text-xs font-bold text-[#302365]">
            {initials(user?.name ?? 'U')}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-28 truncate font-heading text-xs font-bold leading-tight text-[#302365]">
              {user?.name}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#302365]/60">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rounded-xl border-2 border-[#302365]/15 bg-white p-2 text-[#302365] transition hover:bg-[#FCE4EB] hover:text-[#C22B58] hover:border-[#F5A3BA] shadow-[2px_2px_0px_rgba(48,35,101,0.05)] cursor-pointer"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};