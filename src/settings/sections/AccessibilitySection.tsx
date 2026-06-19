import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { useAccessibility } from '@/hooks/useAccessibility'
import { cn } from '@/lib/utils'

export function AccessibilitySection() {
  const { status, request, openSettings } = useAccessibility()
  return (
    <Section kicker="辅助功能" title="macOS 授权">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full',
            status === true ? 'bg-green-500' : status === false ? 'bg-red-500' : 'bg-gray-400')} />
          <span>{status === true ? '已授权' : status === false ? '未授权' : '检测中'}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => request()}>请求授权</Button>
          <Button variant="outline" size="sm" onClick={() => openSettings()}>打开系统设置</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">浮窗出现在其他应用之上需要辅助功能授权。</p>
    </Section>
  )
}
