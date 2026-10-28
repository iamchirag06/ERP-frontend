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
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { initials, cn } from '@/lib/utils';
import { SparkleIcon } from '@/components/ui/Illustrations';

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
      toast.success('Profile updated successfully! ✨');
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ['teacher-profile'] });
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
  if (!profile) return <div className="font-heading font-bold text-[#302365]">Profile not found.</div>;

  const displayedName = profile.name.trim();
  const showDesignation =
    profile.designation && profile.designation !== 'N/A' ? profile.designation : null;
  const showQualification =
    profile.qualification && profile.qualification !== 'N/A'
      ? profile.qualification
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Profile 🎓"
        subtitle="Manage faculty credentials, cabin office location, and contact information."
      />

      {/* Identity header card */}
      <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[4px_4px_0px_rgba(48,35,101,0.06)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative self-start">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={displayedName}
                className="h-24 w-24 rounded-3xl border-2 border-[#302365]/15 object-cover shadow-sm"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-3xl border-2 border-[#A3D995] bg-[#E8F5DF] font-heading text-3xl font-extrabold text-[#226E30] shadow-sm">
                {initials(displayedName)}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn(
                'absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-xl border-2 border-[#302365] bg-[#302365] text-white shadow-xs transition hover:bg-[#403085] cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-50'
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
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-extrabold text-[#302365] sm:text-3xl">
                {displayedName}
              </h2>
              <SparkleIcon className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#302365]/70">
              <Mail className="h-4 w-4 text-[#2587B8]" />
              {profile.email}
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {showDesignation && <Badge variant="info">{showDesignation}</Badge>}
              {profile.branchName && (
                <Badge variant="lavender">
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Read-only info */}
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#302365]">
              Faculty Designation
            </h3>
            <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Mail className="h-3.5 w-3.5" /> Official Email
              </dt>
              <dd className="mt-1 font-heading font-semibold text-sm text-[#302365] break-all">
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Briefcase className="h-3.5 w-3.5" /> Department Role
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {showDesignation ?? 'Faculty Member'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Building2 className="h-3.5 w-3.5" /> Teaching Branch
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {profile.branchName ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <GraduationCap className="h-3.5 w-3.5" /> Academic Qualification
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {showQualification ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <CalendarDays className="h-3.5 w-3.5" /> Joining Date
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
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
        </div>

        {/* Editable form */}
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#302365]">
              Contact & Cabin Location
            </h3>
            <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
          </div>

          <form
            onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="Contact Phone"
                  placeholder="9876543210"
                  {...register('phoneNumber')}
                  error={errors.phoneNumber?.message}
                />
                <Phone className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>

              <div className="relative">
                <Input
                  label="Office Cabin Number"
                  placeholder="Block B, Room 204"
                  {...register('cabinNumber')}
                  error={errors.cabinNumber?.message}
                />
                <MapPin className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>
            </div>

            <Input
              label="Higher Qualification / Degrees"
              placeholder="e.g. M.Tech, Ph.D in Computer Science"
              {...register('qualification')}
              error={errors.qualification?.message}
            />

            <div className="flex flex-col gap-3 border-t-2 border-[#302365]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-heading font-bold">
                {savedAt && Date.now() - savedAt < 4000 && (
                  <span className="text-[#226E30]">✓ Profile saved successfully!</span>
                )}
                {isDirty && !savedAt && (
                  <span className="text-[#995E05]">Unsaved changes in form</span>
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
        </div>
      </div>
    </div>
  );
};