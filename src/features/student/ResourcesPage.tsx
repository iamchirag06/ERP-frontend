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
import { Card, CardBody } from '@/components/ui/Card';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import type { StudyMaterialResponse } from '@/types/academic';
import { cn } from '@/lib/utils';

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

// Friendly file type label from MIME
const fileTypeLabel = (mime: string | null): string => {
  if (!mime) return 'File';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('image')) return 'Image';
  if (mime.includes('zip')) return 'Archive';
  return 'File';
};

const fileTypeColor = (mime: string | null): string => {
  if (!mime) return 'bg-slate-100 text-slate-600';
  if (mime.includes('pdf')) return 'bg-red-50 text-red-600';
  if (mime.includes('presentation') || mime.includes('powerpoint'))
    return 'bg-orange-50 text-orange-600';
  if (mime.includes('word') || mime.includes('document'))
    return 'bg-blue-50 text-blue-600';
  if (mime.includes('image')) return 'bg-emerald-50 text-emerald-600';
  return 'bg-slate-100 text-slate-600';
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
    <div>
      <PageHeader
        title="Study Materials"
        subtitle="Notes, slides and reference material from your teachers."
      />

      {/* Filters */}
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Subject
          </label>
          <select
            value={effectiveSubjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!subjects?.length}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {!subjects?.length && <option value="">No subjects</option>}
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name.trim()}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, unit or teacher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
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
        </div>
      </div>

      {/* Header line */}
      {!isLoading && resources?.length ? (
  <p className="mb-3 truncate text-xs text-slate-500">
    {filtered.length} of {resources.length} material
    {resources.length === 1 ? '' : 's'}
    {currentSubject && (
      <>
        {' '}
        · {currentSubject.code}
      </>
    )}
  </p>
) : null}

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : !resources?.length ? (
        <EmptyState
          title="No materials for this subject"
          subtitle="Your teacher hasn't uploaded anything yet."
        />
      ) : !filtered.length ? (
        <EmptyState
          title="No matching materials"
          subtitle="Try a different search term."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([unit, items]) => (
            <div key={unit}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <BookOpen className="h-4 w-4" />
                {unit}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({items.length})
                </span>
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Card key={r.id} className="group transition hover:shadow-md">
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-bold',
                            fileTypeColor(r.fileType)
                          )}
                        >
                          {fileTypeLabel(r.fileType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-800">
                            {r.title}
                          </h3>
                          {r.description && (
  <p className="mt-0.5 line-clamp-2-break-words text-xs text-slate-500">
    {r.description}
  </p>
)}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{formatDate(r.uploadedAt)}</span>
                        {r.uploadedBy?.name && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.uploadedBy.name.trim()}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                        <a
                          href={r.fileUrl}
                          download
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="mt-2 text-center text-xs text-slate-400">Refreshing…</p>
      )}
    </div>
  );
};