import { Section } from '../components/Section'
import { Segmented } from '../components/Segmented'
import { useSettings } from '@/hooks/useSettings'
import type { Theme } from '@/settings/schema'
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
