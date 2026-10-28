import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl border-2 border-[#302365]/12 bg-white shadow-[3px_3px_0px_rgba(48,35,101,0.06)]">
    <table className="w-full text-left text-sm text-[#302365]">{children}</table>
  </div>
);

export const THead = ({ children }: { children: ReactNode }) => (
  <thead className="border-b-2 border-[#302365]/10 bg-[#DFF2FC]/60 font-heading text-xs font-bold uppercase tracking-wider text-[#302365]">
    {children}
  </thead>
);

export const TBody = ({ children }: { children: ReactNode }) => (
  <tbody className="divide-y divide-[#302365]/8 bg-white">{children}</tbody>
);

export const TR = ({ children, className }: { children: ReactNode; className?: string }) => (
  <tr className={cn('transition-colors hover:bg-[#FFF6D8]/40', className)}>{children}</tr>
);

export const TH = ({ children, className }: { children: ReactNode; className?: string }) => (
  <th className={cn('px-4 py-3.5 font-bold text-[#302365]', className)}>{children}</th>
);

export const TD = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cn('px-4 py-3.5 text-sm text-[#302365]', className)}>{children}</td>
);