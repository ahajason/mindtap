// src/floating/TimerSubPanel.tsx
import { twMerge } from 'tailwind-merge'
import { Button } from './Button'

export type TimerStatus = 'active' | 'paused' | 'done'

interface Props {
  status: TimerStatus
  durationMs: number
  aggregate: { totalMs: number; segmentCount: number }
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onUndo: () => void
  className?: string
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHero(ms: number): string {
  // hero 只显示 mm:ss(D-14 spec 56px)
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerSubPanel({ status, durationMs, aggregate, onPause, onResume, onComplete, onUndo, className }: Props) {
  return (
    <div
      data-no-expand
      className={twMerge('flex flex-col items-center gap-3 p-3', className)}
    >
      {/* Hero(D-14 56px) */}
      <div
        className="text-[56px] font-bold tabular-nums tracking-[-0.02em] text-ink-900 leading-none"
        aria-label={`已专注 ${formatHero(durationMs)}`}
      >
        {formatHero(durationMs)}
      </div>

      {/* 副标题(D-06) */}
      <div className="text-xs text-ink-700">
        今日累计 {formatDuration(aggregate.totalMs)} · {aggregate.segmentCount} 段
      </div>

      {/* Action pair(D-02 mutex) */}
      <div className="flex items-center gap-2">
        {status === 'active' && (
          <>
            <Button size="sm" onClick={onPause} aria-label="暂停">
              <span aria-hidden>⏸</span> 暂停
            </Button>
            <Button size="sm" onClick={onComplete} aria-label="完成">
              <span aria-hidden>⏹</span> 完成
            </Button>
          </>
        )}
        {status === 'paused' && (
          <>
            <Button size="sm" onClick={onResume} aria-label="继续">
              <span aria-hidden>▶</span> 继续
            </Button>
            <Button size="sm" onClick={onComplete} aria-label="完成">
              <span aria-hidden>⏹</span> 完成
            </Button>
          </>
        )}
        {status === 'done' && (
          <Button size="sm" onClick={onUndo} aria-label="撤销">
            <span aria-hidden>↶</span> 撤销
          </Button>
        )}
      </div>

      {/* 快捷键 hint */}
      <div className="text-[10px] text-ink-500">
        ⌘+⇧+P 完成 · ⌘+⇧+Space 暂停
      </div>
    </div>
  )
}