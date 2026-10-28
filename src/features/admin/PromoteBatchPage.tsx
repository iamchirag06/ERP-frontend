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
    <div className="space-y-6">
      <PageHeader
        title="Promote Batch"
        subtitle="Move an entire batch to the next semester at the completion of an academic term."
      />

      {/* Warning banner */}
      <div className="flex items-start gap-3.5 rounded-2xl border-2 border-[#E89D42]/40 bg-[#FFF0C9] p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.06)]">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E89D42]" />
        <div className="text-sm text-[#302365]">
          <p className="font-heading font-bold text-[#302365]">Please Note: Irreversible Academic Step</p>
          <p className="mt-1 font-medium text-[#302365]/80">
            Promoting a batch will increment every matching student's current semester by 1.
            Students currently in semester 8 will not be promoted (they should be
            graduated instead).
          </p>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left — selection */}
          <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.08)] lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#302365] font-heading text-xs font-bold text-[#FFF6D8]">
                01
              </span>
              <h3 className="font-heading text-base font-bold text-[#302365]">
                Select Target Batch & Branch
              </h3>
            </div>

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
                label="Branch (optional filter)"
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
              <p className="mt-4 text-sm text-[#302365]/60">
                No batches found. Add students first from the Students page.
              </p>
            )}
          </div>

          {/* Right — preview */}
          <div className="rounded-3xl border-2 border-[#302365]/12 bg-[#DFF2FC]/40 p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.08)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2587B8] font-heading text-xs font-bold text-white">
                02
              </span>
              <h3 className="font-heading text-base font-bold text-[#302365]">
                Impact Preview
              </h3>
            </div>

            {!batch ? (
              <p className="py-6 text-center text-sm italic text-[#302365]/50">
                Select a batch to preview the semester impact.
              </p>
            ) : affected.length === 0 ? (
              <p className="py-6 text-center text-sm italic text-[#302365]/50">
                No students match these criteria.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl border-2 border-[#2587B8]/30 bg-white p-4 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#DFF2FC] text-[#2587B8]">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#302365]/60">
                      Eligible Students
                    </p>
                    <p className="font-heading text-3xl font-extrabold text-[#302365]">
                      {affected.length}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                    Semester Transition
                  </p>
                  <div className="space-y-2">
                    {bySemester.map(([sem, count]) => {
                      const isOverflow = sem >= 8;
                      return (
                        <div
                          key={sem}
                          className={cn(
                            'flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-sm shadow-sm',
                            isOverflow
                              ? 'border-[#E89D42]/40 bg-[#FFF0C9]'
                              : 'border-[#302365]/10 bg-white'
                          )}
                        >
                          <Badge variant={isOverflow ? 'warning' : 'info'}>
                            Sem {sem}
                          </Badge>
                          <span className="text-xs font-medium text-[#302365]/70">
                            {count} student{count !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[#302365]/40 font-bold">→</span>
                          <span className="font-heading font-bold text-[#302365]">
                            {isOverflow ? 'Retained (Sem 8)' : `Sem ${sem + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {overflowCount > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#E89D42]/40 bg-[#FFF0C9] p-3 text-xs text-[#302365]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E89D42]" />
                    <p>
                      {overflowCount} student{overflowCount !== 1 ? 's' : ''} in
                      semester 8 will be skipped. Graduate them separately.
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => setConfirmOpen(true)}
                  variant="primary"
                  className="w-full justify-center !bg-[#E87999] hover:!bg-[#D06082] text-white"
                  disabled={affected.length === 0}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Promote {affected.length} Students
                </Button>
              </div>
            )}
          </div>
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
          <div className="rounded-2xl border-2 border-red-200 bg-[#FCE4EB]/60 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm text-[#302365]">
                <p className="font-heading font-bold text-red-700">Permanent Action</p>
                <p className="mt-1 font-medium">
                  You are about to promote{' '}
                  <strong className="text-red-700">{affected.length} students</strong> in batch{' '}
                  <strong>{batch}</strong>
                  {branchId ? ' (filtered by branch)' : ''} to their next semester.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF0C9]/40 p-3.5 text-sm">
            <p className="font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/60">Summary</p>
            <ul className="mt-2 space-y-1 font-medium text-[#302365]">
              <li>
                <span className="text-[#302365]/60">Batch:</span>{' '}
                <strong>{batch}</strong>
              </li>
              <li>
                <span className="text-[#302365]/60">Total Students:</span>{' '}
                <strong>{affected.length}</strong>
              </li>
              <li>
                <span className="text-[#302365]/60">Skipped (Sem 8):</span>{' '}
                <strong>{overflowCount}</strong>
              </li>
            </ul>
          </div>

          <div>
            <label className="mb-1 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]/70">
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