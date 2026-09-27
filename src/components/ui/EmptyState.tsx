import { Inbox } from 'lucide-react';

export const EmptyState = ({
  title = 'Nothing here yet',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <Inbox className="h-10 w-10 text-slate-400" />
    <p className="font-medium text-slate-700">{title}</p>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);