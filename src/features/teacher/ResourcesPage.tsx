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
import { useAuthStore } from '@/store/authStore';
import type { StudyMaterialResponse } from '@/types/academic';
import { cn } from '@/lib/utils';
import { SparkleIcon } from '@/components/ui/Illustrations';

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
      toast.success('Study material uploaded! 📚');
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
    <div className="space-y-6">
      <PageHeader
        title="Course Resources & Materials 📑"
        subtitle="Upload and manage lecture notes, slides, and syllabus files for your classes."
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
      <div className="grid gap-4 rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:grid-cols-2">
        <Select
          label="Target Subject"
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#302365]/15 bg-[#FFF6D8] px-3.5 py-1.5 font-heading text-xs font-bold text-[#302365]">
              <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
              {currentSubject.branchName} · Semester {currentSubject.semester}
            </span>
          </div>
        )}
      </div>

      {/* List */}
      {!subjects?.length ? (
        <EmptyState
          title="No subjects assigned"
          subtitle="Ask your admin to assign you a subject first before uploading materials."
        />
      ) : loadingResources ? (
        <Loader />
      ) : !resources?.length ? (
        <EmptyState
          title="No study materials yet"
          subtitle="Click 'Upload Material' to share the first file with your students."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-[#2587B8] bg-[#DFF2FC] text-[#2587B8] shadow-xs">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-base font-bold text-[#302365]">
                      {r.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#302365]/70">
                      {r.unitTag && <Badge variant="lavender">{r.unitTag}</Badge>}
                      <span>{formatDate(r.uploadedAt)}</span>
                    </div>
                    {r.description && (
                      <p className="mt-1.5 line-clamp-2 break-words text-xs font-medium text-[#302365]/70 leading-relaxed">
                        {r.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 text-xs font-semibold text-[#302365]/60">
                  Uploaded by {r.uploadedBy?.name?.trim() ?? 'Faculty'}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t-2 border-[#302365]/8 pt-3.5">
                <div className="flex items-center gap-1.5">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#302365]/15 bg-[#DFF2FC] p-2 text-[#2587B8] hover:bg-[#ccebf9] transition shadow-xs"
                    title="Open Document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={r.fileUrl}
                    download
                    className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FFF6D8] transition shadow-xs"
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>

                <button
                  onClick={() => setDeleting(r)}
                  className="rounded-xl border border-[#302365]/15 bg-white p-2 text-[#302365] hover:bg-[#FCE4EB] hover:text-[#C22B58] transition cursor-pointer shadow-xs"
                  title="Delete Material"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFetching && !loadingResources && (
        <p className="text-center font-heading text-xs font-bold text-[#302365]/50">
          Syncing course files…
        </p>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setPickedFile(null);
          reset();
        }}
        title="Upload Study Material 📤"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-2xl border-2 border-[#302365]/10 bg-[#FFF6D8] px-4 py-2 text-xs font-semibold text-[#302365]">
            Target Subject:{' '}
            <strong className="text-[#2587B8]">
              {currentSubject?.code} — {currentSubject?.name?.trim()}
            </strong>
          </div>

          <Input
            label="Material Title"
            placeholder="e.g. Unit 3 — Binary Search Trees & AVL Trees"
            {...register('title')}
            error={errors.title?.message}
          />

          <Select label="Course Unit / Section" {...register('unit')}>
            <option value="">— Select unit or category —</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>

          {/* File picker */}
          <div>
            <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
              Choose Document File
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
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition',
                pickedFile
                  ? 'border-[#2587B8] bg-[#DFF2FC]/50'
                  : 'border-[#302365]/20 bg-[#FFFDF7] hover:border-[#2587B8] hover:bg-[#DFF2FC]/30'
              )}
            >
              <Upload
                className={cn(
                  'h-8 w-8',
                  pickedFile ? 'text-[#2587B8]' : 'text-[#302365]/50'
                )}
              />
              {pickedFile ? (
                <>
                  <p className="font-heading text-sm font-bold text-[#302365]">
                    {pickedFile.name}
                  </p>
                  <p className="text-xs font-semibold text-[#2587B8]">
                    {formatBytes(pickedFile.size)} · Click to change file
                  </p>
                </>
              ) : (
                <>
                  <p className="font-heading text-sm font-bold text-[#302365]">
                    Click to browse or drop file here
                  </p>
                  <p className="text-xs font-medium text-[#302365]/60">
                    PDF, PPT, DOC, or image files
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
              Upload Material
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