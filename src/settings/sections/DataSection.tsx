import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSettings } from '@/hooks/useSettings'

export function DataSection() {
  const { reset } = useSettings()
  return (
    <Section kicker="数据" title="数据操作">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast.info('导出功能 v1.1')}>导出 JSON</Button>
        <Button variant="destructive" onClick={() => {
          if (confirm('重置全部数据？')) { reset(); toast.success('已重置') }
        }}>重置数据</Button>
      </div>
    </Section>
  )
}
