import { Section } from '../components/Section'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/useSettings'
import type { ReactNode } from 'react'

function NumField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input type="number" value={value} min={min} max={max} step={1}
             onChange={e => onChange(Number(e.target.value))}
             className="w-20 glass-l2" />
    </div>
  )
}

export function FloatingSection({ advancedSlot }: { advancedSlot?: ReactNode }) {
  const { settings, setField } = useSettings()
  if (!settings) return null
  const f = settings.floating
  const upd = (patch: Partial<typeof f>) => setField('floating', { ...f, ...patch })
  return (
    <Section kicker="浮窗" title="浮动条" advanced={advancedSlot}>
      <div className="flex items-center justify-between">
        <span>启动时显示浮动条</span>
        <Switch checked={f.startVisible}
                onCheckedChange={v => upd({ startVisible: v })} />
      </div>
    </Section>
  )
}

export function FloatingAdvanced() {
  const { settings, setField } = useSettings()
  if (!settings) return null
  const f = settings.floating
  const upd = (patch: Partial<typeof f>) => setField('floating', { ...f, ...patch })
  return (
    <div className="space-y-3">
      <NumField label="折叠宽 (px)" value={f.foldW} min={200} max={800} onChange={v => upd({ foldW: v })} />
      <NumField label="折叠高 (px)" value={f.foldH} min={28} max={80} onChange={v => upd({ foldH: v })} />
      <NumField label="展开宽 (px)" value={f.expandW} min={300} max={800} onChange={v => upd({ expandW: v })} />
      <NumField label="展开高 (px)" value={f.expandH} min={120} max={500} onChange={v => upd({ expandH: v })} />
      <NumField label="最大宽 (px)" value={f.maxW} min={400} max={1200} onChange={v => upd({ maxW: v })} />
      <NumField label="最大高 (px)" value={f.maxH} min={200} max={800} onChange={v => upd({ maxH: v })} />
      <NumField label="hover-out 延迟 (ms)" value={f.hoverOutDelayMs} min={0} max={2000} onChange={v => upd({ hoverOutDelayMs: v })} />
      <NumField label="动画时长 (ms)" value={f.animationMs} min={50} max={1000} onChange={v => upd({ animationMs: v })} />
      <p className="text-xs text-muted-foreground">尺寸修改后下次启动浮窗时生效（窗口重建路径）。</p>
    </div>
  )
}
