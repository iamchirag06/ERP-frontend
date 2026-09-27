import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Menu } from 'lucide-react';
import { initials } from '@/lib/utils';

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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop alignment */}
      <div className="hidden md:block" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <button
          onClick={() => navigate(notificationsPath)}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {!!unread && unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {initials(user?.name ?? 'U')}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-25 truncate text-xs font-semibold leading-tight text-slate-800">
              {user?.name}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};