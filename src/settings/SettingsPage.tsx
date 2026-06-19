import { StartupSection } from './sections/StartupSection'
import { HotkeySection } from './sections/HotkeySection'
import { FloatingSection } from './sections/FloatingSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { AccessibilitySection } from './sections/AccessibilitySection'
import { DataSection } from './sections/DataSection'
import { AboutSection } from './sections/AboutSection'
import { Button } from '@/components/ui/button'
import { invoke } from '@tauri-apps/api/core'
import { log } from '@/lib/log'
import { useEffect, useState } from 'react'

export function SettingsPage() {
  const [visible, setVisible] = useState<boolean | null>(null)
  async function refreshVisible() {
    try { setVisible(await invoke<boolean>('floating_is_visible')) }
    catch (e) { log.error('floating_is_visible failed', e) }
  }
  useEffect(() => { refreshVisible() }, [])
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <header className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">轻念 · Mindtap</h1>
        <p className="text-sm text-muted-foreground">v0.1.0</p>
        <Button size="lg" onClick={async () => {
          try { await invoke('floating_toggle'); refreshVisible() }
          catch (e) { log.error('toggle failed', e) }
        }}>显示浮动条</Button>
        <div className="text-xs text-muted-foreground">
          浮窗状态: {visible === null ? '检测中' : visible ? '▣ 显示中' : '▢ 隐藏'}
        </div>
      </header>
      <div className="text-center text-sm uppercase tracking-widest text-muted-foreground">— 设置 —</div>
      <StartupSection />
      <HotkeySection />
      <FloatingSection />
      <AppearanceSection />
      <AccessibilitySection />
      <DataSection />
      <AboutSection />
    </main>
  )
}
