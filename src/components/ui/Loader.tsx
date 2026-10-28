import { SparkleIcon } from './Illustrations';

export const Loader = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#302365]">
    <div className="relative flex items-center justify-center">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#2587B8] animate-bounce [animation-delay:-0.3s]" />
        <span className="h-3 w-3 rounded-full bg-[#62A66C] animate-bounce [animation-delay:-0.15s]" />
        <span className="h-3 w-3 rounded-full bg-[#E87999] animate-bounce" />
      </div>
      <SparkleIcon className="absolute -top-3 -right-4 h-4 w-4 text-[#E89D42] animate-pulse" />
    </div>
    <span className="font-heading text-sm font-semibold tracking-wide text-[#302365]/80">
      {label}
    </span>
  </div>
);