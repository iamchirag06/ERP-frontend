import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Camera,
  Save,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  CalendarDays,
  Briefcase,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getTeacherProfile,
  updateTeacherProfile,
  uploadTeacherProfileImage,
} from '@/api/teacher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { initials, cn } from '@/lib/utils';

const schema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Must be 10 digits')
    .or(z.literal(''))
    .optional(),
  cabinNumber: z.string().max(50).optional(),
  qualification: z.string().max(100).optional(),
});
type FormData = z.infer<typeof schema>;

export const TeacherProfilePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: getTeacherProfile,
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '', cabinNumber: '', qualification: '' },
  });

  // Prefill when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        phoneNumber: profile.phoneNumber ?? '',
        cabinNumber: profile.cabinNumber ?? '',
        qualification: profile.qualification ?? '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: updateTeacherProfile,
    onSuccess: () => {
      toast.success('Profile updated');
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ['teacher-profile'] });
      // Reset dirty state by reinitializing form with current values
      if (profile) {
        reset({
          phoneNumber: profile.phoneNumber ?? '',
          cabinNumber: profile.cabinNumber ?? '',
          qualification: profile.qualification ?? '',
        });
      }
    },
    onError: (e: AxiosError<{ message?: string }>) => {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadTeacherProfileImage(file);
      toast.success('Profile image updated');
      // Optimistically update the cache with the new URL
      qc.setQueryData(['teacher-profile'], (old: typeof profile) =>
        old ? { ...old, profileImageUrl: res.imageUrl } : old
      );
      qc.invalidateQueries({ queryKey: ['teacher-profile'] });
    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (isLoading) return <Loader />;
  if (!profile) return <div className="text-slate-500">Profile not found.</div>;

  const displayedName = profile.name.trim();
  const showDesignation =
    profile.designation && profile.designation !== 'N/A' ? profile.designation : null;
  const showQualification =
    profile.qualification && profile.qualification !== 'N/A'
      ? profile.qualification
      : null;

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and update your personal details."
      />

      {/* Identity header card */}
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative self-start">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={displayedName}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-50"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700 ring-4 ring-indigo-50">
                {initials(displayedName)}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn(
                'absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-white shadow-md transition',
                'hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
              )}
              title="Change photo"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{displayedName}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4" />
              {profile.email}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {showDesignation && <Badge variant="info">{showDesignation}</Badge>}
              {profile.branchName && (
                <Badge variant="default">
                  <Building2 className="mr-1 h-3 w-3" />
                  {profile.branchName}
                </Badge>
              )}
              {showQualification && (
                <Badge variant="success">
                  <GraduationCap className="mr-1 h-3 w-3" />
                  {showQualification}
                </Badge>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Read-only info */}
        <Card className="lg:col-span-1">
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Identity
            </h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="mt-0.5 break-all font-medium text-slate-800">
                  {profile.email}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Briefcase className="h-3.5 w-3.5" /> Designation
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {showDesignation ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5" /> Branch
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.branchName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5" /> Qualification
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {showQualification ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Joining Date
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.joiningDate
                    ? new Date(profile.joiningDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* Editable form */}
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Contact Information
            </h3>

            <form
              onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Input
                    label="Phone Number"
                    placeholder="9876543210"
                    {...register('phoneNumber')}
                    error={errors.phoneNumber?.message}
                  />
                  <Phone className="pointer-events-none absolute right-3 top-9 hidden h-4 w-4 text-slate-300 sm:block" />                
                </div>

                <div className="relative">
                  <Input
                    label="Cabin Number"
                    placeholder="Block C, 305"
                    {...register('cabinNumber')}
                    error={errors.cabinNumber?.message}
                  />
                <MapPin className="pointer-events-none absolute right-3 top-9 hidden h-4 w-4 text-slate-300 sm:block" />  
                </div>
              </div>
              

              <Input
                label="Qualification"
                placeholder="PhD in Machine Learning"
                {...register('qualification')}
                error={errors.qualification?.message}
              />

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                {savedAt && Date.now() - savedAt < 4000 && (
                  <span className="text-emerald-600">✓ Saved</span>
                )}
                {isDirty && !savedAt && (
                  <span className="text-amber-600">Unsaved changes</span>
                )}
              </div>

              <Button
                type="submit"
                loading={updateMutation.isPending}
                disabled={!isDirty}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};