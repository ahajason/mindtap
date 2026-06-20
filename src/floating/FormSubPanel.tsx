// src/floating/FormSubPanel.tsx
import { useState, type FormEvent } from 'react'
import { twMerge } from 'tailwind-merge'
import { SharedHeader } from './SharedHeader'
import { Button } from './Button'

export type RecordKind = 'task' | 'idea' | 'check_in'

interface Props {
  activeTaskContent?: string
  onSubmit: (kind: RecordKind, content: string) => void
  className?: string
}

const KINDS: { value: RecordKind; label: string }[] = [
  { value: 'task', label: 'task' },
  { value: 'idea', label: 'idea' },
  { value: 'check_in', label: 'check_in' },
]

export function FormSubPanel({ activeTaskContent, onSubmit, className }: Props) {
  const [kind, setKind] = useState<RecordKind>('task')
  const [content, setContent] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(kind, content)
    setContent('')  // D-04:保存后清空,浮窗仍展开(可继续记录)
  }

  return (
    <form
      data-no-expand
      onSubmit={handleSubmit}
      className={twMerge('flex flex-col gap-2 p-2', className)}
    >
      <SharedHeader activeTaskContent={activeTaskContent} />

      {/* type chips */}
      <div role="tablist" className="inline-flex gap-1">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={kind === k.value}
            data-no-expand
            onClick={() => setKind(k.value)}
            className={twMerge(
              'px-2 py-0.5 text-xs rounded-full transition-colors',
              'bg-white/22',
              kind === k.value
                ? 'ring-1 ring-white/60 text-ink-900'
                : 'text-ink-700 hover:text-ink-900'
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="3 秒记录..."
        className="min-h-12 resize-none rounded-glass-sm bg-white/22 px-2 py-1.5 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-white/40"
      />

      <div className="flex justify-end">
        <Button type="submit" size="sm">
          保存(⌘S)
        </Button>
      </div>
    </form>
  )
}