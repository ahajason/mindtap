import { Section } from '../components/Section'
import { Segmented } from '../components/Segmented'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { LogViewer } from '../components/LogViewer'
import { useSettings } from '@/hooks/useSettings'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useState } from 'react'
import type { LogLevel } from '@/settings/schema'

export function LoggingSection() {
  const { settings, setField } = useSettings()
  const { refresh } = useDiagnostics()
  const [viewerOpen, setViewerOpen] = useState(false)
  if (!settings) return null
  const l = settings.logging
  const upd = (patch: Partial<typeof l>) => setField('logging', { ...l, ...patch })
  return (
    <Section kicker="日志" title="日志与诊断">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">级别</span>
          <Segmented<LogLevel>
            value={l.level}
            options={[
              { value: 'Error', label: '错误' },
              { value: 'Warn', label: '警告' },
              { value: 'Info', label: '信息' },
              { value: 'Debug', label: '调试' },
            ]}
            onChange={v => upd({ level: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">输出到文件</span>
          <Switch checked={l.fileEnabled} onCheckedChange={v => upd({ fileEnabled: v })} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setViewerOpen(o => !o); refresh() }}>
            {viewerOpen ? '隐藏' : '查看'} 最近 200 条
          </Button>
        </div>
        {viewerOpen && <LogViewer />}
      </div>
    </Section>
  )
}
