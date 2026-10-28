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
  Hash,
  CalendarDays,
  Users,
  Link as LinkIcon,
  Code2,
  X,
  Plus,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import {
  getMyProfile,
  updateMyProfile,
  uploadMyProfileImage,
} from '@/api/student';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';
import { SparkleIcon, SpeechBubbleTag } from '@/components/ui/Illustrations';

const schema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Must be 10 digits')
    .or(z.literal(''))
    .optional(),
  address: z.string().max(200).optional(),
  linkedinProfile: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  githubProfile: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
type FormData = z.infer<typeof schema>;

export const StudentProfilePage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Skills managed separately (array with add/remove)
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getMyProfile,
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phoneNumber: '',
      address: '',
      linkedinProfile: '',
      githubProfile: '',
    },
  });

  // Prefill when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        phoneNumber: profile.phoneNumber ?? '',
        address: profile.address ?? '',
        linkedinProfile: profile.linkedinProfile ?? '',
        githubProfile: profile.githubProfile ?? '',
      });
      setSkills(profile.skills ?? []);
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateMyProfile({
        phoneNumber: data.phoneNumber || undefined,
        address: data.address || undefined,
        linkedinProfile: data.linkedinProfile || undefined,
        githubProfile: data.githubProfile || undefined,
        skills,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(['student-profile'], updated);
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      setSavedAt(Date.now());
      toast.success('Profile updated successfully! ✨');
    },
    onError: (e: AxiosError<{ message?: string }>) => {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleFile = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMyProfileImage(f);
      toast.success('Profile image updated');
      qc.setQueryData(['student-profile'], (old: typeof profile) =>
        old ? { ...old, profileImageUrl: res.imageUrl } : old
      );
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) {
      toast.error('Skill already added');
      return;
    }
    setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  if (isLoading) return <Loader />;
  if (!profile) return <div className="font-heading font-bold text-[#302365]">Profile not found.</div>;

  const displayedName = profile.name.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile 🎓"
        subtitle="Manage personal contact details, portfolio links, and technical skill tags."
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
              <div className="grid h-24 w-24 place-items-center rounded-3xl border-2 border-[#B7A4E8] bg-[#DCD2F5] font-heading text-3xl font-extrabold text-[#302365] shadow-sm">
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
              <Badge variant="info">Roll: {profile.rollNo}</Badge>
              {profile.branchName && (
                <Badge variant="lavender">
                  <Building2 className="mr-1 h-3 w-3" />
                  {profile.branchName}
                </Badge>
              )}
              <Badge variant="success">Semester {profile.semester}</Badge>
              {profile.batch && <Badge variant="warning">Batch {profile.batch}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Read-only identity panel */}
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#302365]">
              Academic Credentials
            </h3>
            <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Hash className="h-3.5 w-3.5" /> University Roll No.
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {profile.rollNo}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Building2 className="h-3.5 w-3.5" /> Branch / Program
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {profile.branchName}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <CalendarDays className="h-3.5 w-3.5" /> Current Semester
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                Semester {profile.semester}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <Users className="h-3.5 w-3.5" /> Academic Batch
              </dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {profile.batch}
              </dd>
            </div>
            <div className="border-t-2 border-[#302365]/10 pt-3">
              <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                <GraduationCap className="h-3.5 w-3.5" /> Cumulative CGPA
              </dt>
              <dd className="mt-1 font-heading text-2xl font-extrabold text-[#62A66C]">
                {profile.cgpa != null ? profile.cgpa.toFixed(2) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-[#302365]/60">Active Backlogs</dt>
              <dd className="mt-1 font-heading text-base font-bold text-[#302365]">
                {profile.activeBacklogs != null ? profile.activeBacklogs : '0'}
              </dd>
            </div>
            {(profile.guardianName || profile.guardianPhone) && (
              <div className="border-t-2 border-[#302365]/10 pt-3">
                <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#302365]/60">
                  <Users className="h-3.5 w-3.5" /> Guardian Information
                </dt>
                <dd className="mt-1 font-heading font-bold text-[#302365]">
                  {profile.guardianName || '—'}
                </dd>
                {profile.guardianPhone && (
                  <dd className="text-xs font-semibold text-[#302365]/70">
                    {profile.guardianPhone}
                  </dd>
                )}
              </div>
            )}
          </dl>
        </div>

        {/* Editable form panel */}
        <div className="rounded-3xl border-2 border-[#302365]/12 bg-white p-6 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#302365]">
              Contact & Social Profiles
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
                  label="Phone Number"
                  placeholder="9876543210"
                  {...register('phoneNumber')}
                  error={errors.phoneNumber?.message}
                />
                <Phone className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>

              <div className="relative">
                <Input
                  label="Permanent Address"
                  placeholder="City, State"
                  {...register('address')}
                  error={errors.address?.message}
                />
                <MapPin className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>

              <div className="relative">
                <Input
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/username"
                  {...register('linkedinProfile')}
                  error={errors.linkedinProfile?.message}
                />
                <LinkIcon className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>

              <div className="relative">
                <Input
                  label="GitHub URL"
                  placeholder="https://github.com/username"
                  {...register('githubProfile')}
                  error={errors.githubProfile?.message}
                />
                <Code2 className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-[#302365]/40" />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
                Technical Skills & Tools
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, Python, Data Structures…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="h-11 flex-1 rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 font-medium text-sm text-[#302365] outline-none transition placeholder:text-[#302365]/40 focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                  Add Tag
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-[#B7A4E8] bg-[#DCD2F5] px-3 py-1 font-heading text-xs font-bold text-[#463378] shadow-[1px_1px_0px_#7860B8]"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="ml-1 rounded-full p-0.5 text-[#463378] hover:bg-[#B7A4E8] cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
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
                disabled={!isDirty && skills.length === (profile.skills?.length ?? 0)}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};