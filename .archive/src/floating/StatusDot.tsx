// src/floating/StatusDot.tsx
type StatusKind = 'active' | 'paused' | 'done'

const statusClass: Record<StatusKind, string> = {
  active: 'bg-status-active animate-pulse-v6',
  paused: 'bg-status-paused animate-pulse-v6',
  done: 'bg-status-done',
}

interface Props {
  status: StatusKind
  className?: string
}

export function StatusDot({ status, className }: Props) {
  return (
    <span
      data-no-expand
      className={`inline-block h-2 w-2 rounded-full ${statusClass[status]} ${className ?? ''}`}
      aria-label={`status-${status}`}
    />
  )
}