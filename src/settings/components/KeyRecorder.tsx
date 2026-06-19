import { useKeyRecorder, type KeyCombo } from '@/hooks/useKeyRecorder'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function KeyRecorder({ value, onChange }: { value: KeyCombo; onChange: (v: KeyCombo) => void }) {
  const { state, start, cancel, display } = useKeyRecorder({ value, onChange })
  const recording = state === 'recording'
  return (
    <div className="flex items-center gap-2">
      <div className={cn('px-3 py-1 rounded-glass glass-l2 min-w-32 text-center text-sm font-mono', recording && 'ring-2 ring-primary-500')}>
        {recording ? '请按键… (Esc 取消)' : display}
      </div>
      {recording
        ? <Button variant="ghost" size="sm" onClick={cancel}>取消</Button>
        : <Button variant="outline" size="sm" onClick={start}>录制</Button>}
    </div>
  )
}
