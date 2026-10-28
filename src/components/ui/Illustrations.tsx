import React from 'react';
import { cn } from '@/lib/utils';

export const SparkleIcon = ({ className = 'h-4 w-4 text-amber-400' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn('inline-block shrink-0', className)}
    aria-hidden="true"
  >
    <path d="M12 0L14.4 8.6L23 11L14.4 13.4L12 22L9.6 13.4L1 11L9.6 8.6L12 0Z" />
  </svg>
);

export const DoodleLaptop = ({ className = 'h-16 w-16' }: { className?: string }) => (
  <svg
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0 drop-shadow-sm', className)}
  >
    {/* Screen outer */}
    <rect x="20" y="10" width="80" height="55" rx="8" fill="#DCD2F5" stroke="#302365" strokeWidth="3" />
    {/* Screen inner */}
    <rect x="26" y="16" width="68" height="43" rx="5" fill="#FFFFFF" stroke="#302365" strokeWidth="2" />
    {/* Screen content </> */}
    <text x="60" y="34" textAnchor="middle" fill="#2587B8" fontFamily="Fredoka, sans-serif" fontWeight="bold" fontSize="14">&lt;/&gt;</text>
    {/* Cute face */}
    <circle cx="52" cy="44" r="2.5" fill="#302365" />
    <circle cx="68" cy="44" r="2.5" fill="#302365" />
    <ellipse cx="48" cy="47" rx="3" ry="1.5" fill="#FCE4EB" />
    <ellipse cx="72" cy="47" rx="3" ry="1.5" fill="#FCE4EB" />
    <path d="M57 48 Q60 52 63 48" stroke="#302365" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Base keyboard */}
    <path d="M10 70 L24 65 L96 65 L110 70 Q112 75 106 75 L14 75 Q8 75 10 70 Z" fill="#DFF2FC" stroke="#302365" strokeWidth="3" strokeLinejoin="round" />
    <rect x="50" y="68" width="20" height="4" rx="2" fill="#302365" />
  </svg>
);

export const DoodleClipboard = ({ className = 'h-16 w-16' }: { className?: string }) => (
  <svg
    viewBox="0 0 100 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0 drop-shadow-sm', className)}
  >
    {/* Board */}
    <rect x="15" y="20" width="70" height="85" rx="12" fill="#DFF2FC" stroke="#302365" strokeWidth="3" />
    {/* Clip top */}
    <rect x="35" y="10" width="30" height="18" rx="6" fill="#FFF0C9" stroke="#302365" strokeWidth="3" />
    <circle cx="50" cy="18" r="4" fill="#302365" />
    {/* Paper */}
    <rect x="23" y="28" width="54" height="68" rx="6" fill="#FFFFFF" stroke="#302365" strokeWidth="2" />
    {/* Cute face */}
    <circle cx="43" cy="42" r="2.5" fill="#302365" />
    <circle cx="57" cy="42" r="2.5" fill="#302365" />
    <ellipse cx="38" cy="45" rx="2.5" ry="1.5" fill="#FCE4EB" />
    <ellipse cx="62" cy="45" rx="2.5" ry="1.5" fill="#FCE4EB" />
    <path d="M47 46 Q50 50 53 46" stroke="#302365" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Checkmarks */}
    <path d="M30 60 L34 64 L42 56" stroke="#62A66C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="47" y1="60" x2="68" y2="60" stroke="#302365" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 74 L34 78 L42 70" stroke="#62A66C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="47" y1="74" x2="68" y2="74" stroke="#302365" strokeWidth="2" strokeLinecap="round" />
    {/* Little pencil at angle */}
    <g transform="translate(68, 62) rotate(25)">
      <rect x="0" y="0" width="10" height="26" rx="2" fill="#FFF0C9" stroke="#302365" strokeWidth="2" />
      <polygon points="0,26 10,26 5,34" fill="#E87999" stroke="#302365" strokeWidth="1.5" />
      <polygon points="3,31 7,31 5,34" fill="#302365" />
      <rect x="0" y="0" width="10" height="6" fill="#FCE4EB" stroke="#302365" strokeWidth="1.5" />
    </g>
  </svg>
);

export const DoodleHeart = ({ className = 'h-10 w-10' }: { className?: string }) => (
  <svg
    viewBox="0 0 80 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
  >
    <path
      d="M40 62 C15 45 4 30 4 18 C4 7 14 0 24 0 C32 0 38 6 40 10 C42 6 48 0 56 0 C66 0 76 7 76 18 C76 30 65 45 40 62 Z"
      fill="#FCE4EB"
      stroke="#E87999"
      strokeWidth="3.5"
    />
    <circle cx="31" cy="24" r="2" fill="#302365" />
    <circle cx="49" cy="24" r="2" fill="#302365" />
    <ellipse cx="26" cy="27" rx="2" ry="1" fill="#E87999" />
    <ellipse cx="54" cy="27" rx="2" ry="1" fill="#E87999" />
    <path d="M37 28 Q40 32 43 28" stroke="#302365" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

export const DoodleMascot = ({ className = 'h-16 w-16' }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
  >
    {/* Body */}
    <ellipse cx="50" cy="55" rx="30" ry="28" fill="#FFF0C9" stroke="#302365" strokeWidth="3" />
    {/* Headband */}
    <path d="M22 45 C35 38 65 38 78 45" stroke="#7860B8" strokeWidth="7" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="40" r="3" fill="#FFFFFF" />
    {/* Eyes & smile */}
    <circle cx="42" cy="54" r="3" fill="#302365" />
    <circle cx="58" cy="54" r="3" fill="#302365" />
    <ellipse cx="36" cy="58" rx="3" ry="1.5" fill="#FCE4EB" />
    <ellipse cx="64" cy="58" rx="3" ry="1.5" fill="#FCE4EB" />
    <path d="M47 60 Q50 64 53 60" stroke="#302365" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Feet */}
    <rect x="36" y="80" width="12" height="7" rx="3.5" fill="#2587B8" stroke="#302365" strokeWidth="2" />
    <rect x="52" y="80" width="12" height="7" rx="3.5" fill="#2587B8" stroke="#302365" strokeWidth="2" />
  </svg>
);

export const SpeechBubbleTag = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'relative inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#302365] bg-white px-3 py-1.5 text-xs font-bold text-[#302365] shadow-[2px_2px_0px_#302365]',
      className
    )}
  >
    {children}
  </div>
);

export const NumberBadge = ({
  number,
  color = 'blue',
  className,
}: {
  number: string | number;
  color?: 'blue' | 'green' | 'yellow' | 'pink' | 'purple';
  className?: string;
}) => {
  const colorStyles = {
    blue: 'bg-[#2587B8] text-white',
    green: 'bg-[#62A66C] text-white',
    yellow: 'bg-[#E89D42] text-white',
    pink: 'bg-[#E87999] text-white',
    purple: 'bg-[#302365] text-white',
  };

  return (
    <div
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-lg font-heading text-sm font-bold shadow-[1px_1px_0px_#302365]',
        colorStyles[color],
        className
      )}
    >
      {number}
    </div>
  );
};
