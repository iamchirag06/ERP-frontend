import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  FileText,
  Trash2,
  Download,
  ExternalLink,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getResourcesBySubject,
  uploadResource,
  deleteResource,
} from '@/api/resources';
import { getAttendanceSubjects } from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import type { StudyMaterialResponse } from '@/types/academic';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  unit: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const UNITS = [
  'Unit 1',
  'Unit 2',
  'Unit 3',
  'Unit 4',
  'Unit 5',
  'Previous Year Papers',
  'Reference Material',
  'Other',
];

interface ApiError {
  error?: string;
  message?: string;
}

const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const TeacherResourcesPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();

  const [subjectId, setSubjectId] = useState<string>('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<StudyMaterialResponse | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Teacher's subjects
  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['attendance-subjects'],
    queryFn: getAttendanceSubjects,
    enabled: !!token,
  });

  const effectiveSubjectId =
    subjectId || subjects?.[0]?.subjectId || '';

  const currentSubject = subjects?.find(
    (s) => s.subjectId === effectiveSubjectId
  );

  // Resources for current subject
  const {
    data: resources,
    isLoading: loadingResources,
    isFetching,
  } = useQuery({
    queryKey: ['resources', effectiveSubjectId],
    queryFn: () => getResourcesBySubject(effectiveSubjectId),
    enabled: !!token && !!effectiveSubjectId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!pickedFile) throw new Error('Pick a file');
      return uploadResource(
        {
          subjectId: effectiveSubjectId,
          title: data.title,
          unit: data.unit,
        },
        pickedFile
      );
    },
    onSuccess: () => {
      toast.success('Material uploaded');
      qc.invalidateQueries({ queryKey: ['resources', effectiveSubjectId] });
      reset();
      setPickedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadOpen(false);
    },
    onError: (e: AxiosError<ApiError>) => {
      const raw = (e.response?.data?.error ?? e.response?.data?.message ?? '').toString();
      const msg = raw || 'Failed to upload material';
      console.error('upload-resource failed:', e.response?.data);
      toast.error(msg.length > 200 ? 'Upload failed. Check file size and type.' : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => {
      toast.success('Material deleted');
      qc.invalidateQueries({ queryKey: ['resources', effectiveSubjectId] });
      setDeleting(null);
    },
    onError: (e: AxiosError<ApiError>) => {
      toast.error(e.response?.data?.message || 'Failed to delete');
    },
  });

  const onSubmit = (data: FormData) => uploadMutation.mutate(data);

  return (
    <div>
      <PageHeader
        title="Study Resources"
        subtitle="Upload and manage study materials for your subjects."
        action={
          <Button
            onClick={() => setUploadOpen(true)}
            disabled={!effectiveSubjectId}
          >
            <Plus className="h-4 w-4" />
            Upload Material
          </Button>
        }
      />

      {/* Subject selector */}
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Select
          label="Subject"
          value={effectiveSubjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={loadingSubjects || !subjects?.length}
        >
          {!subjects?.length && <option value="">No subjects assigned</option>}
          {subjects?.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>
              {s.code} — {s.name.trim()} (Sem {s.semester})
            </option>
          ))}
        </Select>

        {currentSubject && (
          <div className="flex items-end">
            <p className="text-xs text-slate-500">
              {currentSubject.branchName} · Semester {currentSubject.semester}
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Ask your admin to assign you a subject first."
        />
      ) : loadingResources ? (
        <Loader />
      ) : !resources?.length ? (
        <EmptyState
          title="No materials yet"
          subtitle="Upload the first study material for this subject."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
        <Card key={r.id}>
            <CardBody>
            <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-800">{r.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {r.unitTag && <Badge variant="info">{r.unitTag}</Badge>}
                    <span>{formatDate(r.uploadedAt)}</span>
                </div>
                {r.description && (
  <p className="mt-1 line-clamp-2-break-words text-xs text-slate-500">
    {r.description}
  </p>
)}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="min-w-0">
                <p className="truncate text-xs text-slate-400">
  By {r.uploadedBy?.name?.trim() ?? 'Unknown'}
</p>
                </div>

                <div className="flex gap-1">
                <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Open"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
                <a
                    href={r.fileUrl}
                    download
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Download"
                >
                    <Download className="h-4 w-4" />
                </a>
                <button
                    onClick={() => setDeleting(r)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                </div>
            </div>
            </CardBody>
        </Card>
        ))}
        </div>
      )}

      {isFetching && !loadingResources && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setPickedFile(null);
          reset();
        }}
        title="Upload Study Material"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Uploading to:{' '}
            <strong>
              {currentSubject?.code} — {currentSubject?.name?.trim()}
            </strong>
          </div>

          <Input
            label="Title"
            placeholder="Chapter 3 — Sorting Algorithms"
            {...register('title')}
            error={errors.title?.message}
          />

          <Select label="Unit (optional)" {...register('unit')}>
            <option value="">— No unit —</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>

          {/* File picker */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setPickedFile(f);
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition sm:p-6',
                pickedFile
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6',
                  pickedFile ? 'text-indigo-600' : 'text-slate-400'
                )}
              />
              {pickedFile ? (
                <>
                  <p className="text-sm font-medium text-indigo-800">
                    {pickedFile.name}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {formatBytes(pickedFile.size)} · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Click to browse or drag a file here
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, PPT, DOC, or image — up to your backend limit
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPickedFile(f);
              }}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
  <Button
    type="button"
    variant="secondary"
    onClick={() => {
      setUploadOpen(false);
      setPickedFile(null);
      reset();
    }}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    loading={uploadMutation.isPending}
    disabled={!pickedFile}
  >
    Upload
  </Button>
</div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete material?"
        message={`Permanently remove "${deleting?.title}"? Students will lose access to this file.`}
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