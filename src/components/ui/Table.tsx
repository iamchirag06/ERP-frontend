import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full text-left text-sm">{children}</table>
  </div>
);

export const THead = ({ children }: { children: ReactNode }) => (
  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
    {children}
  </thead>
);

export const TBody = ({ children }: { children: ReactNode }) => (
  <tbody className="divide-y divide-slate-100">{children}</tbody>
);

export const TR = ({ children, className }: { children: ReactNode; className?: string }) => (
  <tr className={cn('hover:bg-slate-50', className)}>{children}</tr>
);

export const TH = ({ children, className }: { children: ReactNode; className?: string }) => (
  <th className={cn('px-4 py-3 font-medium', className)}>{children}</th>
);

export const TD = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cn('px-4 py-3 text-slate-700', className)}>{children}</td>
);