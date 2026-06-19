import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function GlassCard({ tier = 1, className, children }: { tier?: 1 | 2 | 3; className?: string; children: ReactNode }) {
  return <div className={cn(`glass-l${tier} rounded-glass p-5`, className)}>{children}</div>
}
