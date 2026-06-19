import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}): ReactNode {
  return <div className="inline-flex rounded-glass p-1 glass-l1">
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)} className={cn(
        'px-3 py-1 rounded-glass-sm text-sm transition',
        value === o.value ? 'bg-primary-500 text-white' : 'text-muted-foreground'
      )}>{o.label}</button>
    ))}
  </div>
}
