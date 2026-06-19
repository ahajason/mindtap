import { Section } from '../components/Section'
import { useSettings } from '@/hooks/useSettings'
import { KeyRecorder } from '../components/KeyRecorder'

export function HotkeySection() {
  const { settings, setField } = useSettings()
  if (!settings) return null
  return (
    <Section kicker="快捷键" title="显示/隐藏浮窗">
      <KeyRecorder
        value={{ modifiers: settings.hotkey.modifiers, code: settings.hotkey.code }}
        onChange={v => setField('hotkey', { modifiers: v.modifiers, code: v.code })}
      />
    </Section>
  )
}
