import { Section } from '../components/Section'
import { Segmented } from '../components/Segmented'
import { useSettings } from '@/hooks/useSettings'
import type { Theme, Dispersion } from '@/settings/schema'
import type { ReactNode } from 'react'

export function AppearanceSection({ advancedSlot }: { advancedSlot?: ReactNode }) {
  const { settings, setField } = useSettings()
  if (!settings) return null
  return (
    <Section kicker="外观" title="主题" advanced={advancedSlot}>
      <Segmented<Theme>
        value={settings.appearance.theme}
        options={[
          { value: 'Light', label: '浅色' },
          { value: 'Dark', label: '深色' },
          { value: 'Auto', label: '跟随系统' },
        ]}
        onChange={v => setField('appearance', { ...settings.appearance, theme: v })}
      />
    </Section>
  )
}

export function AppearanceAdvanced() {
  const { settings, setField } = useSettings()
  if (!settings) return null
  const a = settings.appearance
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">色散</div>
      <Segmented<Dispersion>
        value={a.dispersion}
        options={[
          { value: 'Subtle', label: '极淡' },
          { value: 'Vivid', label: '鲜明' },
        ]}
        onChange={v => setField('appearance', { ...a, dispersion: v })}
      />
      <p className="text-xs text-muted-foreground">v1.1 启用鲜明模式（v1 留接口）。</p>
    </div>
  )
}
