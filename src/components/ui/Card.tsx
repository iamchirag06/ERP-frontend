import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...rest}
    className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
  />
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cn('border-b border-slate-200 px-5 py-4', className)} />
);

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cn('p-5', className)} />
);