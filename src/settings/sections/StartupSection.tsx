import { Section } from '../components/Section'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/useSettings'

export function StartupSection() {
  const { settings, setField } = useSettings()
  if (!settings) return null
  return (
    <Section kicker="启动" title="开机自启">
      <div className="flex items-center justify-between">
        <span>登录时启动轻念</span>
        <Switch checked={settings.startup.autostart}
                onCheckedChange={v => setField('startup', { ...settings.startup, autostart: v })} />
      </div>
    </Section>
  )
}
