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
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        ref={ref}
        {...rest}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition',
          'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
          error && 'border-red-400',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';