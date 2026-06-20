import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSettings } from '@/hooks/useSettings'
import type { ReactNode } from 'react'

export function DataSection({ advancedSlot }: { advancedSlot?: ReactNode }) {
  const { reset } = useSettings()
  return (
    <Section kicker="数据" title="数据操作" advanced={advancedSlot}>
      <Button variant="destructive" onClick={() => {
        if (confirm('重置全部数据？')) { reset(); toast.success('已重置') }
      }}>重置数据</Button>
    </Section>
  )
}

export function DataAdvanced() {
  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => toast.info('导出功能 v1.1')}>导出 JSON</Button>
      <p className="text-xs text-muted-foreground">v1 不提供导出。v1.1 将支持完整数据库快照。</p>
    </div>
  )
}
