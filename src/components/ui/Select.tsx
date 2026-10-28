import { cn } from '@/lib/utils';
import { forwardRef, type SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className, children, ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block font-heading text-xs font-semibold uppercase tracking-wider text-[#302365]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        {...rest}
        className={cn(
          'h-11 w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 text-sm font-medium text-[#302365] outline-none transition shadow-[2px_2px_0px_rgba(48,35,101,0.05)] cursor-pointer',
          'focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5] focus:bg-[#FFFDF7]',
          error && 'border-[#E87999] focus:border-[#E87999] focus:ring-[#FCE4EB]',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-[#C22B58]">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';