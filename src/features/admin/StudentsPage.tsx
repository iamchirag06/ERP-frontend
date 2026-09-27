import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Pencil } from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  addStudent,
  deleteStudent,
  getBranches,
  getStudents,
  updateStudent,
} from '@/api/admin';
import type {
  BranchResponse,
  StudentListResponse,
  StudentUpdateRequest,
} from '@/types/users';
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

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const createSchema = z.object({
  name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  rollNo: z.string().min(1, 'Roll number required'),
  branchId: z.string().uuid('Select a branch'),
  semester: z.number().min(1).max(8),
  batch: z.string().min(4, 'e.g. 2023-2027'),
  cgpa: z.number().min(0).max(10).optional(),
  activeBacklogs: z.number().min(0).optional(),
  phoneNumber: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2).optional(),
  rollNo: z.string().min(1).optional(),
  semester: z.number().min(1).max(8).optional(),
  batch: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  activeBacklogs: z.number().min(0).optional(),
  phoneNumber: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

interface ApiError {
  error?: string;
  message?: string;
}

export const AdminStudentsPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<number | ''>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editFor, setEditFor] = useState<StudentListResponse | null>(null);
  const [deleting, setDeleting] = useState<StudentListResponse | null>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!token,
  });

  const { data: allStudents, isLoading, isFetching } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
    enabled: !!token,
  });

  const filtered = useMemo(() => {
    if (!allStudents) return [];
    let list = allStudents;

    if (filterBranch) list = list.filter((s) => s.branch?.id === filterBranch);
    if (filterSemester !== '')
      list = list.filter((s) => s.semester === filterSemester);
    if (filterBatch.trim())
      list = list.filter((s) =>
        s.batch.toLowerCase().includes(filterBatch.toLowerCase().trim())
      );

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allStudents, filterBranch, filterSemester, filterBatch, search]);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { semester: 1 },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) =>
      addStudent({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'STUDENT',
        rollNo: data.rollNo,
        branchId: data.branchId,
        semester: data.semester,
        batch: data.batch,
        cgpa: data.cgpa,
        activeBacklogs: data.activeBacklogs,
        phoneNumber: data.phoneNumber,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        address: data.address,
      }),
    onSuccess: () => {
      toast.success('Student added');
      qc.invalidateQueries({ queryKey: ['students'] });
      createForm.reset({ semester: 1 });
      setAddOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      let msg = raw || 'Failed to add student';
      if (raw.toLowerCase().includes('duplicate')) {
        if (raw.includes('email')) msg = 'A user with this email already exists.';
        else if (raw.includes('roll')) msg = 'This roll number is already taken.';
        else msg = 'Duplicate entry — check email, roll number.';
      }
      console.error('add-student failed:', e.response?.data);
      toast.error(msg);
    },
  });

  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdateRequest }) =>
      updateStudent(id, data),
    onSuccess: () => {
      toast.success('Student updated');
      qc.invalidateQueries({ queryKey: ['students'] });
      setEditFor(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to update student');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      toast.success('Student deleted');
      qc.invalidateQueries({ queryKey: ['students'] });
      setDeleting(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      let msg = raw || 'Failed to delete student';
      if (raw.includes('foreign key')) {
        msg = 'Cannot delete this student — they have records tied to them.';
      } else if (raw.length > 250) {
        msg = 'Database constraint error.';
      }
      console.error('delete-student failed:', e.response?.data);
      toast.error(msg);
    },
  });

  const openEdit = (s: StudentListResponse) => {
    setEditFor(s);
    editForm.reset({
      name: s.name,
      rollNo: s.rollNo,
      semester: s.semester,
      batch: s.batch,
      cgpa: s.cgpa ?? undefined,
      activeBacklogs: s.activeBacklogs ?? undefined,
      phoneNumber: s.phoneNumber ?? undefined,
      guardianName: s.guardianName ?? undefined,
      guardianPhone: s.guardianPhone ?? undefined,
      address: s.address ?? undefined,
    });
  };

  const renderDesktopTable = () => (
    <div className="hidden md:block">
      <Table>
        <THead>
          <TR>
            <TH>Roll No</TH>
            <TH>Name</TH>
            <TH>Branch</TH>
            <TH>Sem</TH>
            <TH>Batch</TH>
            <TH>CGPA</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {filtered.map((s) => (
            <TR key={s.id}>
              <TD>
                <Badge variant="info">{s.rollNo}</Badge>
              </TD>
              <TD>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.email}</span>
                </div>
              </TD>
              <TD className="text-slate-600">{s.branch?.code ?? '—'}</TD>
              <TD className="text-slate-600">{s.semester}</TD>
              <TD className="text-slate-600">{s.batch}</TD>
              <TD className="text-slate-600">
                {s.cgpa != null ? s.cgpa.toFixed(2) : '—'}
              </TD>
              <TD className="text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(s)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-3 md:hidden">
      {filtered.map((s) => (
        <Card key={s.id}>
          <CardBody>
            <div className="flex items-start gap-3">
              {s.profileImageUrl ? (
                <img
                  src={s.profileImageUrl}
                  alt={s.name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials(s.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.rollNo}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(s)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-1 truncate text-xs text-slate-500">{s.email}</p>

                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {s.branch && <Badge variant="info">{s.branch.code}</Badge>}
                  <Badge variant="default">Sem {s.semester}</Badge>
                  <Badge variant="default">{s.batch}</Badge>
                  {s.cgpa != null && (
                    <Badge variant="success">CGPA {s.cgpa.toFixed(2)}</Badge>
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
        title="Students"
        subtitle="Manage student records across branches and batches."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Branch"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
        >
          <option value="">All branches</option>
          {branches?.map((b: BranchResponse) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Semester"
          value={filterSemester}
          onChange={(e) =>
            setFilterSemester(e.target.value === '' ? '' : Number(e.target.value))
          }
        >
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </Select>

        <Input
          label="Batch"
          placeholder="e.g. 2024-2028"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setFilterBranch('');
              setFilterSemester('');
              setFilterBatch('');
              setSearch('');
            }}
            className="h-10 text-sm text-slate-500 hover:text-slate-800"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder="Search by name, email or roll number…"
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

      <p className="mb-3 text-xs text-slate-400">
        Showing {filtered.length} of {allStudents?.length ?? 0} students
      </p>

      {isLoading ? (
        <Loader />
      ) : !filtered.length ? (
        <EmptyState
          title="No students match"
          subtitle="Try different filters or clear them."
        />
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileCards()}
        </>
      )}

      {isFetching && !isLoading && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}

      {/* Add Student Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Student"
        size="lg"
      >
        <form
          onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="Chirag Singh"
              {...createForm.register('name')}
              error={createForm.formState.errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="chirag@college.edu"
              {...createForm.register('email')}
              error={createForm.formState.errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...createForm.register('password')}
              error={createForm.formState.errors.password?.message}
            />
            <Input
              label="Roll Number"
              placeholder="CSE22-045"
              {...createForm.register('rollNo')}
              error={createForm.formState.errors.rollNo?.message}
            />
            <Select
              label="Branch"
              {...createForm.register('branchId')}
              error={createForm.formState.errors.branchId?.message}
            >
              <option value="">— Select branch —</option>
              {branches?.map((b: BranchResponse) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </Select>
            <Select
              label="Semester"
              {...createForm.register('semester', { valueAsNumber: true })}
              error={createForm.formState.errors.semester?.message}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </Select>
            <Input
              label="Batch"
              placeholder="2023-2027"
              {...createForm.register('batch')}
              error={createForm.formState.errors.batch?.message}
            />
            <Input
              label="CGPA (optional)"
              type="number"
              step="0.01"
              placeholder="8.5"
              {...createForm.register('cgpa', { valueAsNumber: true })}
            />
            <Input
              label="Backlogs (optional)"
              type="number"
              placeholder="0"
              {...createForm.register('activeBacklogs', { valueAsNumber: true })}
            />
            <Input
              label="Phone (optional)"
              placeholder="+91 98765 43210"
              {...createForm.register('phoneNumber')}
            />
            <Input
              label="Guardian Name (optional)"
              placeholder="Mr. Vikram Singh"
              {...createForm.register('guardianName')}
            />
            <Input
              label="Guardian Phone (optional)"
              placeholder="+91 98765 43210"
              {...createForm.register('guardianPhone')}
            />
          </div>

          <Input
            label="Address (optional)"
            placeholder="123, Sector 4, Delhi"
            {...createForm.register('address')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        open={!!editFor}
        onClose={() => setEditFor(null)}
        title="Edit Student"
        size="lg"
      >
        <form
          onSubmit={editForm.handleSubmit((d) => {
            if (!editFor) return;
            const payload: StudentUpdateRequest = {};
            if (d.name) payload.name = d.name;
            if (d.rollNo) payload.rollNo = d.rollNo;
            if (d.semester != null) payload.semester = d.semester;
            if (d.batch) payload.batch = d.batch;
            if (d.cgpa != null) payload.cgpa = d.cgpa;
            if (d.activeBacklogs != null) payload.activeBacklogs = d.activeBacklogs;
            if (d.phoneNumber) payload.phoneNumber = d.phoneNumber;
            if (d.guardianName) payload.guardianName = d.guardianName;
            if (d.guardianPhone) payload.guardianPhone = d.guardianPhone;
            if (d.address) payload.address = d.address;
            editMutation.mutate({ id: editFor.id, data: payload });
          })}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full Name" {...editForm.register('name')} />
            <Input label="Roll Number" {...editForm.register('rollNo')} />
            <Select
              label="Semester"
              {...editForm.register('semester', { valueAsNumber: true })}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </Select>
            <Input label="Batch" {...editForm.register('batch')} />
            <Input
              label="CGPA"
              type="number"
              step="0.01"
              {...editForm.register('cgpa', { valueAsNumber: true })}
            />
            <Input
              label="Backlogs"
              type="number"
              {...editForm.register('activeBacklogs', { valueAsNumber: true })}
            />
            <Input label="Phone" {...editForm.register('phoneNumber')} />
            <Input label="Guardian Name" {...editForm.register('guardianName')} />
            <Input label="Guardian Phone" {...editForm.register('guardianPhone')} />
          </div>
          <Input label="Address" {...editForm.register('address')} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditFor(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={editMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete student?"
        message={`Permanently remove ${deleting?.name} (${deleting?.rollNo})? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) {
            toast.error('Missing student ID');
            return;
          }
          deleteMutation.mutate(deleting.id);
        }}
      />
    </div>
  );
};