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
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        ref={ref}
        {...rest}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition',
          'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
          className
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';