import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getMySchedule } from '@/api/timetable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import type { Day } from '@/types/timetable';
import { DAYS } from '@/types/timetable';

export const MySchedulePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const { data, isLoading } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: getMySchedule,
    enabled: !!token,
  });

  const grouped: Record<Day, typeof data> = {
    MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [],
    FRIDAY: [], SATURDAY: [], SUNDAY: [],
  };

  data?.forEach((e) => {
    if (grouped[e.day]) grouped[e.day]!.push(e);
  });

  return (
    <div>
      <PageHeader title="My Timetable" subtitle="Your weekly class schedule." />

      {isLoading ? (
        <Loader />
      ) : !data?.length ? (
        <EmptyState title="No classes scheduled" subtitle="Check back later." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <div key={day} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold capitalize text-slate-800">
                  {day.toLowerCase()}
                </h3>
              </div>
              {!grouped[day]?.length ? (
                <p className="text-xs italic text-slate-400">Free day</p>
              ) : (
                <ul className="space-y-2">
                  {grouped[day]!.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                    >
                      <div className="flex items-center gap-1 text-slate-700">
                        <Clock className="h-3 w-3" />
                        {e.startTime.slice(0, 5)}–{e.endTime.slice(0, 5)}
                      </div>
                      <p className="mt-1 font-medium text-slate-800">
                        {e.subject.name.trim()}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {e.roomNumber}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};