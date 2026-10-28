import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  Download,
  Search,
  BookOpen,
  User,
} from 'lucide-react';
import { getResourcesBySubject } from '@/api/resources';
import { getMySubjects } from '@/api/student';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import type { StudyMaterialResponse } from '@/types/academic';
import { cn } from '@/lib/utils';
import { SparkleIcon } from '@/components/ui/Illustrations';

const UNITS_ORDER = [
  'Unit 1',
  'Unit 2',
  'Unit 3',
  'Unit 4',
  'Unit 5',
  'Previous Year Papers',
  'Reference Material',
  'Other',
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fileTypeLabel = (mime: string | null): string => {
  if (!mime) return 'FILE';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('image')) return 'IMG';
  if (mime.includes('zip')) return 'ZIP';
  return 'FILE';
};

const fileTypeColor = (mime: string | null): string => {
  if (!mime) return 'bg-[#F4EFE0] text-[#302365] border-[#302365]/20';
  if (mime.includes('pdf')) return 'bg-[#FCE4EB] text-[#C22B58] border-[#F5A3BA]';
  if (mime.includes('presentation') || mime.includes('powerpoint'))
    return 'bg-[#FFF0C9] text-[#995E05] border-[#F7D37E]';
  if (mime.includes('word') || mime.includes('document'))
    return 'bg-[#DFF2FC] text-[#17648B] border-[#99D4F2]';
  if (mime.includes('image')) return 'bg-[#E8F5DF] text-[#226E30] border-[#A3D995]';
  return 'bg-[#DCD2F5] text-[#463378] border-[#B7A4E8]';
};

export const StudentResourcesPage = () => {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('erp_token');

  const [subjectId, setSubjectId] = useState<string>('');
  const [search, setSearch] = useState('');

  // My subjects
  const { data: subjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: getMySubjects,
    enabled: !!token,
  });

  const effectiveSubjectId = subjectId || subjects?.[0]?.id || '';
  const currentSubject = subjects?.find((s) => s.id === effectiveSubjectId);

  // Resources for current subject
  const {
    data: resources,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['resources', effectiveSubjectId],
    queryFn: () => getResourcesBySubject(effectiveSubjectId),
    enabled: !!token && !!effectiveSubjectId,
  });

  // Filter by search
  const filtered = useMemo(() => {
    if (!resources) return [];
    const q = search.toLowerCase().trim();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.unitTag ?? '').toLowerCase().includes(q) ||
        (r.uploadedBy?.name ?? '').toLowerCase().includes(q)
    );
  }, [resources, search]);

  // Group by unitTag
  const grouped = useMemo(() => {
    const map = new Map<string, StudyMaterialResponse[]>();
    filtered.forEach((r) => {
      const unit = r.unitTag || 'Other';
      if (!map.has(unit)) map.set(unit, []);
      map.get(unit)!.push(r);
    });
    // Sort groups by predefined order
    const entries = Array.from(map.entries()).sort((a, b) => {
      const ia = UNITS_ORDER.indexOf(a[0]);
      const ib = UNITS_ORDER.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return entries;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials & Notes 📚"
        subtitle="Download lecture slides, syllabus notes, and exam reference sheets."
      />

      {/* Filters box */}
      <div className="grid gap-4 rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
            Select Subject
          </label>
          <select
            value={effectiveSubjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!subjects?.length}
            className="h-11 w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 font-heading text-sm font-medium text-[#302365] outline-none transition focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5]"
          >
            {!subjects?.length && <option value="">No subjects found</option>}
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name.trim()}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-1.5 block font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
            Search Resources
          </label>
          <div className="flex h-11 items-center gap-2.5 rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 shadow-xs">
            <Search className="h-4 w-4 shrink-0 text-[#302365]/50" />
            <input
              type="text"
              placeholder="Search by topic, unit name, or teacher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent font-medium text-sm text-[#302365] placeholder:text-[#302365]/40 outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded-lg border border-[#302365]/20 bg-[#FFF6D8] px-2 py-0.5 font-heading text-xs font-bold text-[#302365] hover:bg-[#FCE4EB]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header counter */}
      {!isLoading && resources?.length ? (
        <p className="font-heading text-xs font-semibold text-[#302365]/70">
          Showing {filtered.length} of {resources.length} resource
          {resources.length === 1 ? '' : 's'}
          {currentSubject && (
            <span className="ml-1 text-[#2587B8]">
              · {currentSubject.code} ({currentSubject.name.trim()})
            </span>
          )}
        </p>
      ) : null}

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : !resources?.length ? (
        <EmptyState
          title="No study materials for this subject"
          subtitle="Your teachers haven't uploaded files for this class yet."
        />
      ) : !filtered.length ? (
        <EmptyState
          title="No matching materials found"
          subtitle="Try checking for another keyword or unit name."
        />
      ) : (
        <div className="space-y-7">
          {grouped.map(([unit, items]) => (
            <div key={unit}>
              <div className="mb-3.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#2587B8] bg-[#DFF2FC] px-3.5 py-1 font-heading text-xs font-bold text-[#2587B8] shadow-[1px_1px_0px_#2587B8]">
                  <BookOpen className="h-3.5 w-3.5" />
                  {unit} ({items.length})
                </span>
                <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col justify-between rounded-3xl border-2 border-[#302365]/12 bg-white p-5 shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(48,35,101,0.1)]"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 font-heading text-xs font-bold shadow-xs',
                            fileTypeColor(r.fileType)
                          )}
                        >
                          {fileTypeLabel(r.fileType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading text-base font-bold text-[#302365] line-clamp-2">
                            {r.title}
                          </h3>
                          {r.description && (
                            <p className="mt-1 text-xs font-medium text-[#302365]/70 line-clamp-2 break-words leading-relaxed">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#302365]/60">
                        <span>Uploaded {formatDate(r.uploadedAt)}</span>
                        {r.uploadedBy?.name && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.uploadedBy.name.trim()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t-2 border-[#302365]/8 pt-3.5">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#2587B8] bg-[#DFF2FC] px-3 py-2 font-heading text-xs font-bold text-[#2587B8] transition hover:bg-[#cbeaf9] shadow-[1px_1px_0px_#2587B8]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </a>
                      <a
                        href={r.fileUrl}
                        download
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#302365]/20 bg-white px-3 py-2 font-heading text-xs font-bold text-[#302365] transition hover:bg-[#FFF6D8] shadow-[1px_1px_0px_rgba(48,35,101,0.08)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="text-center font-heading text-xs font-bold text-[#302365]/50">
          Syncing latest course materials…
        </p>
      )}
    </div>
  );
};