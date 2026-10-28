import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export const Modal = ({ open, onClose, title, children, size = 'md' }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#302365]/45 backdrop-blur-[2px] p-0 sm:items-center sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full rounded-t-3xl sm:rounded-3xl border-2 border-[#302365]/15 bg-[#FFFDF7] shadow-[6px_6px_0px_rgba(48,35,101,0.15)]',
          'max-h-[92vh] overflow-y-auto',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#302365]/10 bg-[#DFF2FC]/50 px-5 py-3.5">
          <h3 className="truncate font-heading text-lg font-bold text-[#302365]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-[#302365]/20 bg-white p-1.5 text-[#302365] hover:bg-[#FCE4EB] hover:text-[#C22B58] transition shadow-[1px_1px_0px_rgba(48,35,101,0.1)] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 text-[#302365]">{children}</div>
      </div>
    </div>
  );
};