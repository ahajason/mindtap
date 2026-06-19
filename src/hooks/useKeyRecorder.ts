import { useCallback, useEffect, useState } from 'react'

export interface KeyCombo { modifiers: number; code: string }
export type RecorderState = 'idle' | 'recording' | 'saving' | 'cancel'

const MOD_ORDER = ['Meta', 'Control', 'Alt', 'Shift']  // display order
const MOD_BITS: Record<string, number> = { Shift: 1, Control: 2, Alt: 4, Meta: 8 }

function isModifierOnly(code: string) {
  return ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(code)
}

function formatKey(c: KeyCombo) {
  const mods = MOD_ORDER.filter(m => c.modifiers & MOD_BITS[m]).join('+')
  return mods ? `${mods}+${c.code}` : c.code
}

export function useKeyRecorder({ value, onChange }: { value: KeyCombo; onChange: (v: KeyCombo) => void }) {
  const [state, setState] = useState<RecorderState>('idle')
  const [draft, setDraft] = useState<KeyCombo | null>(null)

  const start = useCallback(() => { setState('recording'); setDraft(null) }, [])
  const cancel = useCallback(() => { setState('cancel'); setDraft(null); setTimeout(() => setState('idle'), 0) }, [])

  useEffect(() => {
    if (state !== 'recording') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); cancel(); return }
      if (isModifierOnly(e.code)) return
      // require at least one modifier
      const mods = (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0) | (e.metaKey ? 8 : 0)
      if (mods === 0) return
      e.preventDefault()
      const next: KeyCombo = { modifiers: mods, code: e.code }
      setDraft(next); setState('saving')
      try { onChange(next) } finally { setTimeout(() => setState('idle'), 0) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, onChange, cancel])

  return { state, start, cancel, draft, display: formatKey(draft ?? value) }
}
