import { Section } from '../components/Section'
import { useSettings } from '@/hooks/useSettings'
import { KeyRecorder } from '../components/KeyRecorder'
import type { ReactNode } from 'react'

export function HotkeySection({ advancedSlot }: { advancedSlot?: ReactNode }) {
  const { settings, setField } = useSettings()
  if (!settings) return null
  return (
    <Section kicker="快捷键" title="显示/隐藏浮窗" advanced={advancedSlot}>
      <KeyRecorder
        value={{ modifiers: settings.hotkey.modifiers, code: settings.hotkey.code }}
        onChange={v => setField('hotkey', { modifiers: v.modifiers, code: v.code })}
      />
    </Section>
  )
}

export function HotkeyAdvanced() {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>快捷键需要至少 1 个修饰键（Cmd / Ctrl / Alt / Shift）。</p>
      <p>macOS 默认 <code className="glass-l2 px-1 rounded">⌘⇧Space</code>，其他平台默认 <code className="glass-l2 px-1 rounded">Ctrl+Shift+Space</code>。</p>
      <p>录制时按 <kbd className="glass-l2 px-1 rounded">Esc</kbd> 取消。</p>
    </div>
  )
}
