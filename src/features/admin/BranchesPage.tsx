import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { addBranch, getBranches } from '@/api/admin';
import type { BranchResponse } from '@/types/users';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Branch name is required'),
  code: z
    .string()
    .min(2, 'Short code is required (e.g. CSE)')
    .max(10)
    .regex(/^[A-Z0-9-]+$/i, 'Only letters, digits and hyphens'),
});
type FormData = z.infer<typeof schema>;

interface ErrorBody {
  error?: string;
  message?: string;
}

const branchKey = (b: BranchResponse, fallbackIdx: number) =>
  b.id ?? b.code ?? `branch-${fallbackIdx}`;

export const AdminBranchesPage = () => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const { data: branches, isLoading } = useQuery({
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

  const mutation = useMutation({
    mutationFn: addBranch,
    onSuccess: () => {
      toast.success('Branch added');
      qc.invalidateQueries({ queryKey: ['branches'] });
      reset();
      setOpen(false);
    },
    onError: (e: AxiosError<ErrorBody>) => {
      const body = e.response?.data;
      const raw = (body?.error ?? body?.message ?? '').toString();
      let msg = raw || 'Failed to add branch';

      const dup = raw.match(/Key \(code\)=\(([^)]+)\) already exists/);
      if (dup) {
        msg = `Branch code "${dup[1]}" already exists. Try a different code.`;
      } else if (raw.toLowerCase().includes('duplicate')) {
        msg = 'A branch with this code already exists.';
      } else if (raw.length > 200) {
        msg = 'Invalid data. Please check the fields and try again.';
      }

      console.error('add-branch failed:', { status: e.response?.status, body });
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormData) => {
    const codeTaken = branches?.some(
      (b) => b.code.toLowerCase() === data.code.toLowerCase()
    );
    if (codeTaken) {
      toast.error(`Branch code "${data.code}" already exists.`);
      return;
    }
    mutation.mutate(data);
  };

  const renderMobileCards = () => (
    <div className="space-y-3 md:hidden">
      {branches!.map((b, idx) => (
        <Card key={branchKey(b, idx)}>
          <CardBody className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="info">{b.code}</Badge>
              <p className="mt-1.5 truncate font-medium text-slate-800">
                {b.name}
              </p>
            </div>
            <button
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => toast.error('Delete not supported by backend yet')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="hidden md:block">
      <Table>
        <THead>
          <TR>
            <TH>Code</TH>
            <TH>Name</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {branches!.map((b, idx) => (
            <TR key={branchKey(b, idx)}>
              <TD>
                <Badge variant="info">{b.code}</Badge>
              </TD>
              <TD className="font-medium">{b.name}</TD>
              <TD className="text-right">
                <button
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() =>
                    toast.error('Delete not supported by backend yet')
                  }
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

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Departments and streams (e.g. CSE, ECE, MECH)"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        }
      />

      {isLoading ? (
        <Loader />
      ) : !branches?.length ? (
        <EmptyState
          title="No branches yet"
          subtitle="Add your first department to get started."
        />
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileCards()}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Branch">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Branch Name"
            placeholder="Computer Science"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Short Code"
            placeholder="CSE"
            {...register('code')}
            error={errors.code?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};