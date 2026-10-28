import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Search } from 'lucide-react';
import type { AxiosError } from 'axios';
import { addTeacher, deleteTeacher, getBranches, getTeachers } from '@/api/admin';
import type { BranchResponse, TeacherProfileResponse } from '@/types/users';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { initials } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Min 6 characters'),
  branchId: z.string().uuid('Select a branch'),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  cabinNumber: z.string().optional(),
  joiningDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ApiError {
  error?: string;
  message?: string;
}

export const AdminTeachersPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<TeacherProfileResponse | null>(null);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
    enabled: !!token,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      addTeacher({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'TEACHER',
        branchId: data.branchId,
        designation: data.designation,
        qualification: data.qualification,
        cabinNumber: data.cabinNumber,
        joiningDate: data.joiningDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Teacher added');
      qc.invalidateQueries({ queryKey: ['teachers'] });
      reset();
      setAddOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const msg = raw.toLowerCase().includes('duplicate')
        ? 'A teacher with this email already exists.'
        : raw || 'Failed to add teacher';
      console.error('add-teacher failed:', e.response?.data);
      toast.error(msg.length > 200 ? 'Failed to add teacher.' : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => {
      toast.success('Teacher deleted');
      qc.invalidateQueries({ queryKey: ['teachers'] });
      setDeleting(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const msg = raw.includes('foreign key')
        ? 'Cannot delete — this teacher has assignments or classes. Remove those first.'
        : raw || 'Failed to delete teacher';
      toast.error(msg.length > 200 ? 'Failed to delete teacher.' : msg);
    },
  });

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = search.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.department ?? '').toLowerCase().includes(q) ||
        (t.designation ?? '').toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const PASTEL_BG = [
    'bg-[#DFF2FC]/50 border-[#2587B8]/30',
    'bg-[#E8F5DF]/50 border-[#62A66C]/30',
    'bg-[#FFF0C9]/50 border-[#E89D42]/30',
    'bg-[#FCE4EB]/50 border-[#E87999]/30',
    'bg-[#DCD2F5]/50 border-[#7860B8]/30',
  ];

  const renderDesktopTable = () => (
    <div className="hidden md:block overflow-hidden rounded-2xl border-2 border-[#302365]/10 bg-white shadow-[3px_3px_0px_rgba(48,35,101,0.06)]">
      <Table>
        <THead>
          <TR>
            <TH>Faculty Member</TH>
            <TH>Email Address</TH>
            <TH>Department</TH>
            <TH>Designation</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {filtered.map((t) => (
            <TR key={t.id}>
              <TD>
                <div className="flex items-center gap-3">
                  {t.profileImageUrl ? (
                    <img
                      src={t.profileImageUrl}
                      alt={t.name}
                      className="h-10 w-10 rounded-2xl border-2 border-[#302365]/15 object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-2 border-[#302365]/15 bg-[#DCD2F5] font-heading text-xs font-bold text-[#302365]">
                      {initials(t.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-heading font-semibold text-[#302365]">{t.name.trim()}</p>
                    {t.employeeId && (
                      <p className="text-xs text-[#302365]/60">{t.employeeId}</p>
                    )}
                  </div>
                </div>
              </TD>
              <TD className="text-[#302365]/80">{t.email}</TD>
              <TD>
                {t.department ? (
                  <Badge variant="info">{t.department}</Badge>
                ) : (
                  <span className="text-xs italic text-[#302365]/40">—</span>
                )}
              </TD>
              <TD className="text-[#302365]/80">
                {t.designation && t.designation !== 'N/A' ? (
                  t.designation
                ) : (
                  <span className="text-xs italic text-[#302365]/40">—</span>
                )}
              </TD>
              <TD className="text-right">
                <button
                  onClick={() => setDeleting(t)}
                  className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-3 md:hidden">
      {filtered.map((t, idx) => (
        <div
          key={t.id}
          className={`rounded-2xl border-2 p-4 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] ${
            PASTEL_BG[idx % PASTEL_BG.length]
          }`}
        >
          <div className="flex items-start gap-3">
            {t.profileImageUrl ? (
              <img
                src={t.profileImageUrl}
                alt={t.name}
                className="h-12 w-12 shrink-0 rounded-2xl border-2 border-[#302365]/15 object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#302365]/15 bg-[#DCD2F5] font-heading text-sm font-bold text-[#302365]">
                {initials(t.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-heading font-bold text-[#302365]">
                    {t.name.trim()}
                  </p>
                  {t.employeeId && (
                    <p className="text-xs font-medium text-[#302365]/60">{t.employeeId}</p>
                  )}
                </div>
                <button
                  onClick={() => setDeleting(t)}
                  className="shrink-0 rounded-xl border border-transparent bg-white/70 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-red-600 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-1 truncate text-xs text-[#302365]/70">{t.email}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {t.department && <Badge variant="info">{t.department}</Badge>}
                {t.designation && t.designation !== 'N/A' && (
                  <Badge variant="default">{t.designation}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="Manage faculty members across all departments."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#302365]/10 bg-white px-4 py-2.5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)]">
        <Search className="h-4 w-4 text-[#302365]/40" />
        <input
          className="w-full bg-transparent text-sm font-medium text-[#302365] outline-none placeholder:text-[#302365]/40"
          placeholder="Search faculty by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs font-semibold text-[#302365]/50 hover:text-[#302365]"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <Loader />
      ) : !filtered.length ? (
        <EmptyState
          title={search ? 'No matches' : 'No teachers yet'}
          subtitle={
            search
              ? 'Try a different search term.'
              : 'Add your first faculty member to get started.'
          }
        />
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileCards()}
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Teacher" size="lg">
        <form
          onSubmit={handleSubmit((d) => addMutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="Dr. Jane Doe"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@college.edu"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <Select label="Branch" {...register('branchId')} error={errors.branchId?.message}>
              <option value="">— Select branch —</option>
              {branches?.map((b: BranchResponse) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </Select>
            <Input
              label="Designation"
              placeholder="ASSISTANT_PROFESSOR"
              {...register('designation')}
            />
            <Input
              label="Qualification"
              placeholder="PhD in AI"
              {...register('qualification')}
            />
            <Input
              label="Cabin Number"
              placeholder="Block B, 204"
              {...register('cabinNumber')}
            />
            <Input label="Joining Date" type="date" {...register('joiningDate')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete teacher?"
        message={`Permanently remove ${deleting?.name}? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return;
          deleteMutation.mutate(deleting.id);
        }}
      />
    </div>
  );
};