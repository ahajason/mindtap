import { cn } from '@/lib/utils';

interface LivePreviewProps {
  children: React.ReactNode;
  className?: string;
}

export default function LivePreview({ children, className }: LivePreviewProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-dashed border-white/40 p-6',
        'bg-gradient-to-br from-white/15 to-white/5',
        'flex flex-wrap items-center gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}