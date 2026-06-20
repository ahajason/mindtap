// src/floating/FoldedBar.tsx
import { twMerge } from 'tailwind-merge'
import { StatusDot } from './StatusDot'
import { Button } from './Button'

interface Props {
  status: 'active' | 'paused' | 'done'
  title: string
  durationMs: number
  onTogglePause: () => void
  onOpenForm: () => void
  className?: string
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FoldedBar({ status, title, durationMs, onTogglePause, onOpenForm, className }: Props) {
  const isPaused = status === 'paused'
  return (
    <div
      className={twMerge(
        'flex items-center gap-2 px-2.5 h-9 w-[240px]',
        className
      )}
    >
      <StatusDot status={status} />
      <span className="flex-1 min-w-0 text-sm text-ink-900 truncate">{title}</span>
      <span className="text-xs tabular-nums text-ink-700">{formatTime(durationMs)}</span>
      <Button size="icon-sm" onClick={onTogglePause} aria-label={isPaused ? '继续' : '暂停'}>
        <span aria-hidden>{isPaused ? '▶' : '⏸'}</span>
      </Button>
      <Button size="icon-sm" onClick={onOpenForm} aria-label="新记录">
        <span aria-hidden>＋</span>
      </Button>
    </div>
  )
}