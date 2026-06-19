import { useKeyRecorder, type KeyCombo, formatKey } from '@/hooks/useKeyRecorder'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 豆包推荐 3 个浮窗 toggle 候选快捷键（macOS / Windows / Linux 通用，
// 因为 Space 不被任何 OS 占用为 modifier，且 3 个组合都不冲突常见系统快捷键）
const PRESETS: KeyCombo[] = [
  { modifiers: 4, code: 'Space' },              // Alt+Space
  { modifiers: 9, code: 'Space' },              // Shift+Meta+Space（macOS 默认）
  { modifiers: 5, code: 'Space' },              // Alt+Shift+Space
]

export function KeyRecorder({ value, onChange }: { value: KeyCombo; onChange: (v: KeyCombo) => void }) {
  const { state, start, cancel, display } = useKeyRecorder({ value, onChange })
  const recording = state === 'recording'
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'px-3 py-1 rounded-glass glass-l2 min-w-32 text-center text-sm font-mono',
            recording && 'ring-2 ring-primary-500'
          )}
        >
          {recording ? '请按键… (Esc 取消)' : display}
        </div>
        {recording ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={cancel}
            aria-label="close"
            title="关闭推荐"
          >
            ×
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={start}>录制</Button>
        )}
      </div>
      {recording && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-72 glass-l2 rounded-glass p-3 shadow-lg space-y-2">
          <p className="text-xs text-muted-foreground">
            按下键盘设置快捷键组合，或使用下方预设。
          </p>
          <div className="border-t border-border pt-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">推荐</p>
            {PRESETS.map((p) => (
              <button
                key={`${p.modifiers}-${p.code}`}
                onClick={() => {
                  onChange(p)
                  cancel()
                }}
                className="block w-full text-left text-sm font-mono px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                {formatKey(p)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}