import { DoodleClipboard, SpeechBubbleTag } from '@/components/ui/Illustrations';

export const EmptyState = ({
  title = 'Nothing here yet',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
    <div className="relative">
      <DoodleClipboard className="h-20 w-20" />
      <div className="absolute -top-3 -right-6">
        <SpeechBubbleTag className="text-[10px] py-0.5 px-2 bg-[#FFF0C9]">
          All clean! ✨
        </SpeechBubbleTag>
      </div>
    </div>
    <p className="font-heading text-lg font-bold text-[#302365] mt-1">{title}</p>
    {subtitle && (
      <p className="max-w-sm text-sm font-medium text-[#302365]/70">
        {subtitle}
      </p>
    )}
  </div>
);