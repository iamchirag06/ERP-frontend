import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getMySchedule } from '@/api/timetable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import type { Day } from '@/types/timetable';
import { DAYS } from '@/types/timetable';
import { SparkleIcon, SpeechBubbleTag } from '@/components/ui/Illustrations';

const DAY_COLORS: Record<string, { headerBg: string; border: string; text: string }> = {
  MONDAY: { headerBg: 'bg-[#DFF2FC]', border: 'border-[#2587B8]', text: 'text-[#2587B8]' },
  TUESDAY: { headerBg: 'bg-[#E8F5DF]', border: 'border-[#62A66C]', text: 'text-[#226E30]' },
  WEDNESDAY: { headerBg: 'bg-[#FFF0C9]', border: 'border-[#E89D42]', text: 'text-[#995E05]' },
  THURSDAY: { headerBg: 'bg-[#FCE4EB]', border: 'border-[#E87999]', text: 'text-[#C22B58]' },
  FRIDAY: { headerBg: 'bg-[#DCD2F5]', border: 'border-[#7860B8]', text: 'text-[#463378]' },
  SATURDAY: { headerBg: 'bg-[#D0F0EE]', border: 'border-[#0E6862]', text: 'text-[#0E6862]' },
  SUNDAY: { headerBg: 'bg-[#FFF6D8]', border: 'border-[#302365]', text: 'text-[#302365]' },
};

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Weekly Timetable 📅"
          subtitle="Your scheduled class periods, lecture rooms, and timings."
        />
        <div className="hidden lg:block">
          <SpeechBubbleTag className="bg-white">
            Semester Schedule ✨
          </SpeechBubbleTag>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : !data?.length ? (
        <EmptyState
          title="No classes scheduled yet"
          subtitle="The timetable will appear here once published by the academic office."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => {
            const styling = DAY_COLORS[day] ?? DAY_COLORS.MONDAY;
            const entries = grouped[day] ?? [];

            return (
              <div
                key={day}
                className="flex flex-col justify-between rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b-2 border-[#302365]/8 pb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1 font-heading text-xs font-bold uppercase tracking-wider ${styling.headerBg} ${styling.border} ${styling.text} shadow-[1px_1px_0px_rgba(48,35,101,0.1)]`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {day}
                    </span>
                    <SparkleIcon className="h-3.5 w-3.5 text-amber-400" />
                  </div>

                  {!entries.length ? (
                    <div className="rounded-2xl border-2 border-dashed border-[#302365]/15 bg-[#FFFDF7] p-5 text-center">
                      <p className="font-heading text-xs font-bold text-[#302365]/60">
                        No lectures — Free day! 🌿
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {entries.map((e) => (
                        <li
                          key={e.id}
                          className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFFDF7] p-3 text-xs transition-colors hover:bg-[#FFF6D8]/40"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-[#2587B8]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {e.startTime.slice(0, 5)} – {e.endTime.slice(0, 5)}
                            </span>
                          </div>
                          <p className="mt-1 font-heading text-sm font-bold text-[#302365]">
                            {e.subject.name.trim()}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[#302365]/70">
                            <MapPin className="h-3.5 w-3.5 text-[#E87999]" />
                            <span className="font-semibold">Room {e.roomNumber}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};