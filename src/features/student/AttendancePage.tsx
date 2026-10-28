import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  getMyAttendanceRecords,
  getMyAttendanceSummary,
} from '@/api/student';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { SpeechBubbleTag, SparkleIcon } from '@/components/ui/Illustrations';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const StudentAttendancePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const user = useAuthStore((s) => s.user);
  const studentId = user?.userId ?? '';

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['attendance-summary', studentId],
    queryFn: () => getMyAttendanceSummary(studentId),
    enabled: !!token && !!studentId,
  });

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance-records', studentId],
    queryFn: () => getMyAttendanceRecords(studentId),
    enabled: !!token && !!studentId,
  });

  const overall = useMemo(() => {
    if (!summary?.length) return { pct: 0, total: 0, present: 0 };
    const total = summary.reduce((a, s) => a + s.totalClasses, 0);
    const present = summary.reduce((a, s) => a + s.presentClasses, 0);
    const pct = total > 0 ? (present / total) * 100 : 0;
    return { pct, total, present };
  }, [summary]);

  const statusColor = (pct: number) =>
    pct >= 75 ? 'emerald' : pct >= 60 ? 'amber' : 'red';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance 📊"
        subtitle="Subject-wise breakdown and complete records."
      />

      {/* Overall summary banner */}
      {!loadingSummary && summary?.length ? (
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 shadow-xs',
                  statusColor(overall.pct) === 'emerald' &&
                    'border-[#62A66C] bg-[#E8F5DF] text-[#226E30]',
                  statusColor(overall.pct) === 'amber' &&
                    'border-[#E89D42] bg-[#FFF0C9] text-[#995E05]',
                  statusColor(overall.pct) === 'red' &&
                    'border-[#E87999] bg-[#FCE4EB] text-[#C22B58]'
                )}
              >
                {overall.pct >= 75 ? (
                  <TrendingUp className="h-7 w-7" />
                ) : (
                  <TrendingDown className="h-7 w-7" />
                )}
              </div>
              <div>
                <p className="font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/70">
                  Total Class Attendance
                </p>
                <p className="font-heading text-3xl font-extrabold text-[#302365]">
                  {overall.pct.toFixed(1)}%
                </p>
                <p className="text-xs font-medium text-[#302365]/70">
                  {overall.present} of {overall.total} classes attended
                </p>
              </div>
            </div>

            {overall.pct < 75 ? (
              <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#E89D42]/30 bg-[#FFF0C9] p-3.5 text-xs text-[#995E05]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-heading font-bold">Below 75% target</p>
                  <p className="text-[11px] text-[#995E05]/90">
                    Attend upcoming lectures to qualify for semester finals.
                  </p>
                </div>
              </div>
            ) : (
              <SpeechBubbleTag className="bg-[#E8F5DF] text-[#226E30]">
                Exams Eligible! 🌟
              </SpeechBubbleTag>
            )}
          </div>

          <div className="mt-5 h-3.5 w-full overflow-hidden rounded-full border-2 border-[#302365]/15 bg-[#FFF6D8] p-0.5">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                statusColor(overall.pct) === 'emerald' && 'bg-[#62A66C]',
                statusColor(overall.pct) === 'amber' && 'bg-[#E89D42]',
                statusColor(overall.pct) === 'red' && 'bg-[#E87999]'
              )}
              style={{ width: `${Math.min(overall.pct, 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Subject-wise breakdown */}
      <div>
        <div className="mb-3.5 flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold text-[#302365]">
            By Subject
          </h2>
          <SparkleIcon className="h-4 w-4 text-amber-500" />
        </div>

        {loadingSummary ? (
          <Loader />
        ) : !summary?.length ? (
          <EmptyState
            title="No attendance records yet"
            subtitle="Your attendance will appear here once teachers mark it."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <TR>
                    <TH>Subject Code & Title</TH>
                    <TH>Attended</TH>
                    <TH>Total Held</TH>
                    <TH className="w-48">Progress Meter</TH>
                    <TH className="text-right">Score</TH>
                  </TR>
                </THead>
                <TBody>
                  {summary.map((s) => {
                    const color = statusColor(s.percentage);
                    return (
                      <TR key={s.subjectCode}>
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <Badge variant="info">{s.subjectCode}</Badge>
                            <span className="font-heading font-semibold text-[#302365]">
                              {s.subjectName.trim()}
                            </span>
                          </div>
                        </TD>
                        <TD className="font-medium text-[#302365]">{s.presentClasses}</TD>
                        <TD className="font-medium text-[#302365]">{s.totalClasses}</TD>
                        <TD>
                          <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#302365]/15 bg-[#FFF6D8]">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                color === 'emerald' && 'bg-[#62A66C]',
                                color === 'amber' && 'bg-[#E89D42]',
                                color === 'red' && 'bg-[#E87999]'
                              )}
                              style={{ width: `${Math.min(s.percentage, 100)}%` }}
                            />
                          </div>
                        </TD>
                        <TD className="text-right">
                          <span
                            className={cn(
                              'font-heading text-base font-bold',
                              color === 'emerald' && 'text-[#226E30]',
                              color === 'amber' && 'text-[#995E05]',
                              color === 'red' && 'text-[#C22B58]'
                            )}
                          >
                            {s.percentage.toFixed(1)}%
                          </span>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {summary.map((s) => {
                const color = statusColor(s.percentage);
                return (
                  <div
                    key={s.subjectCode}
                    className="rounded-2xl border-2 border-[#302365]/10 bg-white p-4 shadow-[2px_2px_0px_rgba(48,35,101,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Badge variant="info">{s.subjectCode}</Badge>
                        <p className="mt-1.5 truncate font-heading font-bold text-[#302365]">
                          {s.subjectName.trim()}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#302365]/70">
                          {s.presentClasses} of {s.totalClasses} classes attended
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 font-heading text-2xl font-extrabold',
                          color === 'emerald' && 'text-[#226E30]',
                          color === 'amber' && 'text-[#995E05]',
                          color === 'red' && 'text-[#C22B58]'
                        )}
                      >
                        {s.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#FFF6D8] border border-[#302365]/10">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          color === 'emerald' && 'bg-[#62A66C]',
                          color === 'amber' && 'bg-[#E89D42]',
                          color === 'red' && 'bg-[#E87999]'
                        )}
                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Recent records */}
      <div>
        <div className="mb-3.5 flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold text-[#302365]">
            Recent Daily Records
          </h2>
        </div>

        {loadingRecords ? (
          <Loader />
        ) : !records?.length ? (
          <EmptyState
            title="No individual records"
            subtitle="Detailed day-by-day records will appear here."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Subject</TH>
                    <TH className="text-right">Attendance Mark</TH>
                  </TR>
                </THead>
                <TBody>
                  {records.slice(0, 20).map((r, i) => {
                    const subjectLabel =
                      r.subject?.code ?? r.subjectCode ?? r.subject?.name ?? '—';
                    const subjectName = r.subject?.name ?? r.subjectName ?? '';
                    return (
                      <TR key={r.id ?? i}>
                        <TD className="font-medium text-[#302365]">{formatDate(r.date)}</TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Badge variant="lavender">{subjectLabel}</Badge>
                            {subjectName && (
                              <span className="font-heading font-semibold text-[#302365]">
                                {subjectName.trim()}
                              </span>
                            )}
                          </div>
                        </TD>
                        <TD className="text-right">
                          {r.status === 'PRESENT' ? (
                            <Badge variant="success">✦ Present</Badge>
                          ) : (
                            <Badge variant="danger">Absent</Badge>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {records.slice(0, 20).map((r, i) => {
                const subjectLabel =
                  r.subject?.code ?? r.subjectCode ?? r.subject?.name ?? '—';
                const subjectName = r.subject?.name ?? r.subjectName ?? '';
                return (
                  <div
                    key={r.id ?? i}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#302365]/10 bg-white p-3.5 shadow-[2px_2px_0px_rgba(48,35,101,0.05)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#302365]/60">{formatDate(r.date)}</p>
                      <p className="mt-0.5 truncate font-heading font-bold text-[#302365]">
                        {subjectName.trim() || subjectLabel}
                      </p>
                      {subjectName && (
                        <p className="text-xs text-[#302365]/60">{subjectLabel}</p>
                      )}
                    </div>
                    {r.status === 'PRESENT' ? (
                      <Badge variant="success">Present</Badge>
                    ) : (
                      <Badge variant="danger">Absent</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};