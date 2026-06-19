import { useCallback, useEffect, useRef, useState } from 'react'
import { events, settings } from '@/lib/tauri-bridge'
import { log } from '@/lib/log'
import type { Settings } from '@/settings/schema'

export type SetStatus = 'idle' | 'saving' | 'error'

export function useSettings() {
  const [data, setData] = useState<Settings | null>(null)
  const [status, setStatus] = useState<SetStatus>('idle')
  const pending = useRef<Partial<Settings> | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    settings.get().then(setData).catch(e => { log.error('settings_get failed', e); setStatus('error') })
    const un = events.settingsChanged<Settings>(s => setData(s))
    return () => { un.then(u => u()) }
  }, [])

  const flush = useCallback(async () => {
    if (!pending.current) return
    const next = pending.current
    pending.current = null
    setStatus('saving')
    try {
      const merged = { ...(data ?? {} as Settings), ...next } as Settings
      const saved = await settings.set(merged)
      setData(saved); setStatus('idle')
    } catch (e) {
      log.error('settings_set failed', e); setStatus('error')
      settings.get().then(setData).catch(() => {})
    }
  }, [data])

  const setField = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setData(prev => prev ? { ...prev, [key]: value } : prev)
    pending.current = { ...(pending.current ?? {}), [key]: value }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { flush() }, 300)
  }, [flush])

  const setSettings = useCallback((next: Settings) => {
    setData(next); pending.current = next
    if (timer.current) window.clearTimeout(timer.current)
    flush()
  }, [flush])

  const reset = useCallback(async () => {
    setStatus('saving')
    try { const r = await settings.reset(); setData(r); setStatus('idle') }
    catch (e) { log.error('settings_reset failed', e); setStatus('error') }
  }, [])

  return { settings: data, setField, setSettings, reset, status }
}
