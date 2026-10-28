import { SparkleIcon } from '@/components/ui/Illustrations';

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h1 className="truncate font-heading text-2xl font-bold text-[#302365] sm:text-3xl tracking-tight">
          {title}
        </h1>
        <SparkleIcon className="h-4 w-4 text-amber-400 shrink-0" />
      </div>
      {subtitle && (
        <p className="mt-1 text-sm font-medium text-[#302365]/75">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);