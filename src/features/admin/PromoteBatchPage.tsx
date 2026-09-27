import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowUpCircle,
  AlertTriangle,
  Users,
  CheckCircle2,
  Info,
  GraduationCap,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { getStudents, promoteBatch } from '@/api/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const CONFIRM_WORD = 'PROMOTE';

interface ApiError {
  error?: string;
  message?: string;
}

export const AdminPromoteBatchPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [batch, setBatch] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Load all students so we can preview what will change
  const {
    data: students,
    isLoading,
  } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
    enabled: !!token,
  });

  // Distinct batches
  const batches = useMemo(() => {
    if (!students) return [];
    return [...new Set(students.map((s) => s.batch).filter(Boolean))].sort();
  }, [students]);

  // Distinct branches (for optional filter)
  const branches = useMemo(() => {
    if (!students) return [];
    const map = new Map<string, { id: string; name: string; code: string }>();
    students.forEach((s) => {
      if (s.branch && !map.has(s.branch.id)) {
        map.set(s.branch.id, s.branch);
      }
    });
    return Array.from(map.values());
  }, [students]);

  // What will be promoted?
  const affected = useMemo(() => {
    if (!students || !batch) return [];
    return students.filter((s) => {
      if (s.batch !== batch) return false;
      if (branchId && s.branch?.id !== branchId) return false;
      return true;
    });
  }, [students, batch, branchId]);

  // Group affected students by current semester
  const bySemester = useMemo(() => {
    const map = new Map<number, number>();
    affected.forEach((s) => {
      map.set(s.semester, (map.get(s.semester) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [affected]);

  // Students who would exceed semester 8 (edge case)
  const overflowCount = useMemo(() => {
    return affected.filter((s) => s.semester >= 8).length;
  }, [affected]);

  const promoteMutation = useMutation({
    mutationFn: () =>
      promoteBatch({
        batch,
        branchId: branchId || undefined,
      }),
    onSuccess: (data) => {
      toast.success('Batch promoted successfully');
      console.log('promote-batch result:', data);
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmOpen(false);
      setConfirmText('');
      setBatch('');
      setBranchId('');
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      console.error('promote-batch failed:', e.response?.data);
      toast.error(
        raw.length > 200 ? 'Promotion failed. Check the batch and try again.' : raw || 'Promotion failed'
      );
    },
  });

  const canConfirm =
    confirmText.trim() === CONFIRM_WORD && affected.length > 0 && batch !== '';

  return (
    <div>
      <PageHeader
        title="Promote Batch"
        subtitle="Move an entire batch to the next semester at end of academic year."
      />

      {/* Warning banner */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">This action cannot be undone</p>
          <p className="mt-1 text-amber-700">
            Promoting a batch will increment every matching student's semester by 1.
            Students currently in semester 8 will not be promoted (they should be
            graduated instead).
          </p>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left — selection */}
          <Card className="lg:col-span-2">
            <CardBody>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Select Batch
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Batch"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                >
                  <option value="">— Select batch —</option>
                  {batches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Branch (optional)"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </Select>
              </div>

              {!batches.length && (
                <p className="mt-4 text-sm text-slate-500">
                  No batches found. Add students first from the Students page.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Right — preview */}
          <Card>
            <CardBody>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Preview
              </h3>

              {!batch ? (
                <p className="text-sm italic text-slate-400">
                  Select a batch to see the impact.
                </p>
              ) : affected.length === 0 ? (
                <p className="text-sm italic text-slate-400">
                  No students match these filters.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-indigo-50 p-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Affected students</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {affected.length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Semester change
                    </p>
                    <div className="space-y-1.5">
                      {bySemester.map(([sem, count]) => {
                        const isOverflow = sem >= 8;
                        return (
                          <div
                            key={sem}
                            className={cn(
                              'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                              isOverflow
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-slate-200 bg-white'
                            )}
                          >
                            <span className="text-slate-700">
                              <Badge variant={isOverflow ? 'warning' : 'info'}>
                                Sem {sem}
                              </Badge>
                            </span>
                            <span className="text-xs text-slate-500">
                              {count} student{count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-medium text-slate-800">
                              {isOverflow ? 'stays' : `Sem ${sem + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {overflowCount > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>
                        {overflowCount} student{overflowCount !== 1 ? 's' : ''} in
                        semester 8 will be skipped. Consider graduating them instead.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => setConfirmOpen(true)}
                    variant="danger"
                    className="w-full"
                    disabled={affected.length === 0}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Promote {affected.length} Students
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmText('');
        }}
        title="Confirm Promotion"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">This is a destructive action</p>
                <p className="mt-1">
                  You are about to promote{' '}
                  <strong>{affected.length} students</strong> in batch{' '}
                  <strong>{batch}</strong>
                  {branchId ? ' (filtered by branch)' : ''} to their next semester.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Summary</p>
            <ul className="mt-2 space-y-1 text-slate-800">
              <li>
                <span className="text-slate-500">Batch:</span>{' '}
                <strong>{batch}</strong>
              </li>
              <li>
                <span className="text-slate-500">Students:</span>{' '}
                <strong>{affected.length}</strong>
              </li>
              <li>
                <span className="text-slate-500">Skipped (Sem 8):</span>{' '}
                <strong>{overflowCount}</strong>
              </li>
            </ul>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type <strong className="text-red-600">{CONFIRM_WORD}</strong> to confirm
            </label>
            <Input
              placeholder={CONFIRM_WORD}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!canConfirm}
              loading={promoteMutation.isPending}
              onClick={() => promoteMutation.mutate()}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Promotion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};