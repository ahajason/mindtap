// src/floating/SharedHeader.tsx
import { twMerge } from 'tailwind-merge'

interface Props {
  activeTaskContent?: string
  className?: string
}

export function SharedHeader({ activeTaskContent, className }: Props) {
  const hasActive = Boolean(activeTaskContent)

  return (
    <header
      data-no-expand
      className={twMerge(
        'flex items-center gap-2 px-1 py-1.5',
        'border-b border-white/4',
        className
      )}
    >
      <span aria-hidden className="text-base">
        {hasActive ? '📄' : '✚'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900 truncate">
          {hasActive ? activeTaskContent : '新记录'}
        </div>
        <div className="text-[11px] text-ink-700">
          {hasActive ? '当前 Focus' : '轻念 · Mindtap'}
        </div>
      </div>
    </header>
  )
}