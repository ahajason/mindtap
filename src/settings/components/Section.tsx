import { Collapsible } from '@base-ui/react/collapsible'
import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { cn } from '@/lib/utils'

export function Section({
  kicker, title, children, advanced,
}: { kicker?: string; title: string; children: ReactNode; advanced?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <GlassCard>
      {kicker && <div className="text-xs uppercase tracking-wider text-primary-500 mb-1">{kicker}</div>}
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div>{children}</div>
      {advanced && (
        <Collapsible.Root open={open} onOpenChange={setOpen} className="mt-3 border-t border-white/10 pt-3">
          <Collapsible.Trigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRight className={cn('size-4 transition-transform', open && 'rotate-90')} />
            高级
          </Collapsible.Trigger>
          <Collapsible.Panel className="pt-3">{advanced}</Collapsible.Panel>
        </Collapsible.Root>
      )}
    </GlassCard>
  )
}
