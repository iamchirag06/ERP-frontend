import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const variants = {
  default: 'bg-[#F4EFE0] text-[#302365] border-[#302365]/20',
  success: 'bg-[#E8F5DF] text-[#226E30] border-[#A3D995]',
  warning: 'bg-[#FFF0C9] text-[#995E05] border-[#F7D37E]',
  danger: 'bg-[#FCE4EB] text-[#C22B58] border-[#F5A3BA]',
  info: 'bg-[#DFF2FC] text-[#17648B] border-[#99D4F2]',
  lavender: 'bg-[#DCD2F5] text-[#463378] border-[#B7A4E8]',
  teal: 'bg-[#D0F0EE] text-[#0E6862] border-[#70D2CB]',
} as const;

interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shadow-[1px_1px_0px_rgba(48,35,101,0.06)]',
      variants[variant] ?? variants.default,
      className
    )}
  >
    {children}
  </span>
);