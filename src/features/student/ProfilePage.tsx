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
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/feedback/Loader';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';

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
    onSuccess: () => {
      toast.success('Profile updated');
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ['student-profile'] });
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
      const res = await uploadMyProfileImage(file);
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
  if (!profile) return <div className="text-slate-500">Profile not found.</div>;

  const displayedName = profile.name.trim();

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and update your academic and personal information."
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
              <Badge variant="info">{profile.rollNo}</Badge>
              {profile.branchName && (
                <Badge variant="default">
                  <Building2 className="mr-1 h-3 w-3" />
                  {profile.branchName}
                </Badge>
              )}
              <Badge variant="success">Semester {profile.semester}</Badge>
              {profile.batch && <Badge variant="default">{profile.batch}</Badge>}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Read-only identity */}
        <Card className="lg:col-span-1">
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Academic
            </h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Hash className="h-3.5 w-3.5" /> Roll Number
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.rollNo}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5" /> Branch
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.branchName}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Semester
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  Semester {profile.semester}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="h-3.5 w-3.5" /> Batch
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.batch}
                </dd>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5" /> CGPA
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.cgpa != null ? profile.cgpa.toFixed(2) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Active Backlogs</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {profile.activeBacklogs != null ? profile.activeBacklogs : '0'}
                </dd>
              </div>
              {(profile.guardianName || profile.guardianPhone) && (
                <div className="border-t border-slate-100 pt-3">
                  <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5" /> Guardian
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {profile.guardianName || '—'}
                  </dd>
                  {profile.guardianPhone && (
                    <dd className="text-xs text-slate-500">
                      {profile.guardianPhone}
                    </dd>
                  )}
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Editable form */}
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Contact & Links
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
                  <Phone className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-slate-300 sm:block" />
                </div>

                <div className="relative">
                  <Input
                    label="Address"
                    placeholder="New Delhi"
                    {...register('address')}
                    error={errors.address?.message}
                  />
                  <MapPin className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-slate-300 sm:block" />
                </div>

                <div className="relative">
                  <Input
                    label="LinkedIn"
                    placeholder="https://linkedin.com/in/username"
                    {...register('linkedinProfile')}
                    error={errors.linkedinProfile?.message}
                  />
                  <LinkIcon className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-slate-300 sm:block" />
                </div>

                <div className="relative">
                  <Input
                    label="GitHub"
                    placeholder="https://github.com/username"
                    {...register('githubProfile')}
                    error={errors.githubProfile?.message}
                  />
                  <Code2 className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-slate-300 sm:block" />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Skills
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Java, React, Python"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <Button type="button" variant="secondary" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="ml-1 text-indigo-400 hover:text-indigo-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
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
    disabled={!isDirty && skills.length === (profile.skills?.length ?? 0)}
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