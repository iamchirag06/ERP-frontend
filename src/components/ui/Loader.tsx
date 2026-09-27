export const Loader = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-600" />
    <span className="text-sm">{label}</span>
  </div>
);