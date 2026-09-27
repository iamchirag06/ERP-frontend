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

  const renderDesktopTable = () => (
    <div className="hidden md:block">
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
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
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {initials(t.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800">{t.name.trim()}</p>
                    {t.employeeId && (
                      <p className="text-xs text-slate-400">{t.employeeId}</p>
                    )}
                  </div>
                </div>
              </TD>
              <TD className="text-slate-600">{t.email}</TD>
              <TD>
                {t.department ? (
                  <Badge variant="info">{t.department}</Badge>
                ) : (
                  <span className="text-xs italic text-slate-400">—</span>
                )}
              </TD>
              <TD className="text-slate-600">
                {t.designation && t.designation !== 'N/A' ? (
                  t.designation
                ) : (
                  <span className="text-xs italic text-slate-400">—</span>
                )}
              </TD>
              <TD className="text-right">
                <button
                  onClick={() => setDeleting(t)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
      {filtered.map((t) => (
        <Card key={t.id}>
          <CardBody>
            <div className="flex items-start gap-3">
              {t.profileImageUrl ? (
                <img
                  src={t.profileImageUrl}
                  alt={t.name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials(t.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {t.name.trim()}
                    </p>
                    {t.employeeId && (
                      <p className="text-xs text-slate-400">{t.employeeId}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleting(t)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 truncate text-xs text-slate-500">{t.email}</p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.department && <Badge variant="info">{t.department}</Badge>}
                  {t.designation && t.designation !== 'N/A' && (
                    <Badge variant="default">{t.designation}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="Manage faculty members across all branches."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            clear
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