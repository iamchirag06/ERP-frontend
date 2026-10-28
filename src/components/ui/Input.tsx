import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block font-heading text-xs font-semibold uppercase tracking-wider text-[#302365]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...rest}
        className={cn(
          'h-11 w-full rounded-xl border-2 border-[#302365]/20 bg-white px-3.5 text-sm font-medium text-[#302365] placeholder:text-[#302365]/40 outline-none transition shadow-[2px_2px_0px_rgba(48,35,101,0.05)]',
          'focus:border-[#302365] focus:ring-2 focus:ring-[#DCD2F5] focus:bg-[#FFFDF7]',
          error && 'border-[#E87999] focus:border-[#E87999] focus:ring-[#FCE4EB]',
          className
        )}
      />
      {error && <p className="mt-1 text-xs font-medium text-[#C22B58]">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';