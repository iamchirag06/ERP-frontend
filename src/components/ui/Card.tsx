import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...rest}
    className={cn(
      'rounded-2xl border-2 border-[#302365]/10 bg-white shadow-[3px_3px_0px_rgba(48,35,101,0.06)] transition-all duration-200 overflow-hidden',
      className
    )}
  />
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...rest}
    className={cn(
      'border-b-2 border-[#302365]/8 bg-[#FFFDF7] px-5 py-3.5 font-heading text-[#302365]',
      className
    )}
  />
);

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cn('p-5 text-[#302365]', className)} />
);