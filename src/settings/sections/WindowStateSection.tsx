import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { toast } from 'sonner'
import { invoke } from '@tauri-apps/api/core'
import { log } from '@/lib/log'

export function WindowStateSection() {
  const { settings, setField } = useSettings()
  if (!settings) return null
  const reset = async (which: 'main' | 'floating') => {
    try {
      await invoke('floating_toggle')  // noop placeholder, real impl uses tauri window APIs
      setField('windowState', { ...settings.windowState, [which]: null })
      toast.success(`已重置${which === 'main' ? '主窗' : '浮窗'}位置`)
    } catch (e) { log.error('reset window state failed', e) }
  }
  return (
    <Section kicker="窗口位置" title="主窗 / 浮窗 位置">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>主窗: {settings.windowState.main ? `${settings.windowState.main.x},${settings.windowState.main.y} ${settings.windowState.main.w}×${settings.windowState.main.h}` : '默认'}</span>
          <Button variant="outline" size="sm" onClick={() => reset('main')}>重置</Button>
        </div>
        <div className="flex items-center justify-between">
          <span>浮窗: {settings.windowState.floating ? `${settings.windowState.floating.x},${settings.windowState.floating.y} ${settings.windowState.floating.w}×${settings.windowState.floating.h}` : '默认'}</span>
          <Button variant="outline" size="sm" onClick={() => reset('floating')}>重置</Button>
        </div>
        <p className="text-xs text-muted-foreground">关闭应用时自动保存位置；下次启动恢复。</p>
      </div>
    </Section>
  )
}
