import { Section } from '../components/Section'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/useSettings'
import type { ReactNode } from 'react'

export function FloatingSection({ advancedSlot }: { advancedSlot?: ReactNode }) {
  const { settings, setField } = useSettings()
  if (!settings) return null
  return (
    <Section kicker="浮窗" title="浮动条" advanced={advancedSlot}>
      <div className="flex items-center justify-between">
        <span>启动时显示浮动条</span>
        <Switch checked={settings.floating.startVisible}
                onCheckedChange={v => setField('floating', { ...settings.floating, startVisible: v })} />
      </div>
    </Section>
  )
}
