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
    <div>
      <PageHeader
        title="My Attendance"
        subtitle="Subject-wise breakdown and complete records."
      />

      {/* Overall summary banner */}
      {!loadingSummary && summary?.length ? (
        <Card className="mb-5 sm:mb-6">
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    'grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14',
                    statusColor(overall.pct) === 'emerald' && 'bg-emerald-50 text-emerald-600',
                    statusColor(overall.pct) === 'amber' && 'bg-amber-50 text-amber-600',
                    statusColor(overall.pct) === 'red' && 'bg-red-50 text-red-600'
                  )}
                >
                  {overall.pct >= 75 ? (
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : (
                    <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">Overall Attendance</p>
                  <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {overall.pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">
                    {overall.present} of {overall.total} classes attended
                  </p>
                </div>
              </div>

              {overall.pct < 75 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Below 75% threshold</p>
                    <p className="text-xs text-amber-700">
                      You need to attend more classes to qualify for exams.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  statusColor(overall.pct) === 'emerald' && 'bg-emerald-500',
                  statusColor(overall.pct) === 'amber' && 'bg-amber-500',
                  statusColor(overall.pct) === 'red' && 'bg-red-500'
                )}
                style={{ width: `${Math.min(overall.pct, 100)}%` }}
              />
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Subject-wise breakdown */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        By Subject
      </h2>

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
                  <TH>Subject</TH>
                  <TH>Present</TH>
                  <TH>Total</TH>
                  <TH className="w-48">Progress</TH>
                  <TH className="text-right">Percentage</TH>
                </TR>
              </THead>
              <TBody>
                {summary.map((s) => {
                  const color = statusColor(s.percentage);
                  return (
                    <TR key={s.subjectCode}>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{s.subjectCode}</Badge>
                          <span className="font-medium text-slate-800">
                            {s.subjectName.trim()}
                          </span>
                        </div>
                      </TD>
                      <TD className="text-slate-600">{s.presentClasses}</TD>
                      <TD className="text-slate-600">{s.totalClasses}</TD>
                      <TD>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              color === 'emerald' && 'bg-emerald-500',
                              color === 'amber' && 'bg-amber-500',
                              color === 'red' && 'bg-red-500'
                            )}
                            style={{ width: `${Math.min(s.percentage, 100)}%` }}
                          />
                        </div>
                      </TD>
                      <TD className="text-right">
                        <span
                          className={cn(
                            'font-semibold',
                            color === 'emerald' && 'text-emerald-600',
                            color === 'amber' && 'text-amber-600',
                            color === 'red' && 'text-red-600'
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
                <Card key={s.subjectCode}>
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Badge variant="info">{s.subjectCode}</Badge>
                        <p className="mt-1.5 truncate font-medium text-slate-800">
                          {s.subjectName.trim()}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {s.presentClasses} of {s.totalClasses} classes attended
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-xl font-bold',
                          color === 'emerald' && 'text-emerald-600',
                          color === 'amber' && 'text-amber-600',
                          color === 'red' && 'text-red-600'
                        )}
                      >
                        {s.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          color === 'emerald' && 'bg-emerald-500',
                          color === 'amber' && 'bg-amber-500',
                          color === 'red' && 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
                      />
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Recent records */}
      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 sm:mt-8">
        Recent Records
      </h2>

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
                  <TH className="text-right">Status</TH>
                </TR>
              </THead>
              <TBody>
                {records.slice(0, 20).map((r, i) => {
                  const subjectLabel =
                    r.subject?.code ?? r.subjectCode ?? r.subject?.name ?? '—';
                  const subjectName = r.subject?.name ?? r.subjectName ?? '';
                  return (
                    <TR key={r.id ?? i}>
                      <TD className="text-slate-600">{formatDate(r.date)}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{subjectLabel}</Badge>
                          {subjectName && (
                            <span className="text-sm text-slate-700">
                              {subjectName.trim()}
                            </span>
                          )}
                        </div>
                      </TD>
                      <TD className="text-right">
                        {r.status === 'PRESENT' ? (
                          <Badge variant="success">Present</Badge>
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
                <Card key={r.id ?? i}>
                  <CardBody className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">{formatDate(r.date)}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
                        {subjectName.trim() || subjectLabel}
                      </p>
                      {subjectName && (
                        <p className="text-xs text-slate-400">{subjectLabel}</p>
                      )}
                    </div>
                    {r.status === 'PRESENT' ? (
                      <Badge variant="success">Present</Badge>
                    ) : (
                      <Badge variant="danger">Absent</Badge>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};