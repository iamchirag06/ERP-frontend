import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-[#302365] text-[#FFFDF5] border-2 border-[#302365] shadow-[2px_2px_0px_rgba(48,35,101,0.25)] hover:bg-[#403085] hover:shadow-[3px_3px_0px_rgba(48,35,101,0.3)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(48,35,101,0.3)]',
  secondary:
    'bg-[#FFFFFF] text-[#302365] border-2 border-[#302365]/20 shadow-[2px_2px_0px_rgba(48,35,101,0.08)] hover:bg-[#FFF6D8] hover:border-[#302365]/35 hover:shadow-[3px_3px_0px_rgba(48,35,101,0.12)] active:translate-y-0.5',
  ghost:
    'bg-transparent text-[#302365] hover:bg-[#DCD2F5]/40 active:translate-y-0.5',
  danger:
    'bg-[#E87999] text-white border-2 border-[#D1557A] shadow-[2px_2px_0px_#A53556] hover:bg-[#F087A5] active:translate-y-0.5',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs font-semibold rounded-lg',
  md: 'h-10 px-4 text-sm font-semibold rounded-xl',
  lg: 'h-12 px-6 text-base font-semibold rounded-2xl',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...rest
}: Props) => (
  <button
    {...rest}
    disabled={rest.disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-heading transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
      styles[variant],
      sizes[size],
      className
    )}
  >
    {loading && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);