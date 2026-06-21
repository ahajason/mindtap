// src/floating/Segmented.tsx
import { twMerge } from 'tailwind-merge'

export type SegmentedValue = 'timer' | 'form'

interface Props {
  value: SegmentedValue
  onChange: (v: SegmentedValue) => void
  className?: string
}

const OPTIONS: { value: SegmentedValue; label: string; aria: string }[] = [
  { value: 'timer', label: '⏱', aria: '计时' },
  { value: 'form', label: '＋', aria: '记录' },
]

export function Segmented({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      data-no-expand
      className={twMerge(
        'inline-flex rounded-glass-sm bg-white/22 p-0.5',
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(opt.value)}
            className={twMerge(
              'flex-1 px-3 py-1 text-sm rounded-glass-sm transition-all duration-200',
              active
                ? 'bg-white/40 text-ink-900 shadow-sm'
                : 'text-ink-700 hover:text-ink-900'
            )}
          >
            <span aria-hidden>{opt.label}</span>
            <span className="sr-only">{opt.aria}</span>
          </button>
        )
      })}
    </div>
  )
}