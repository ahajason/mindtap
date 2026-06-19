import { useCallback, useEffect, useState } from 'react'
import { accessibility } from '@/lib/tauri-bridge'

export function useAccessibility() {
  const [status, setStatus] = useState<boolean | null>(null)
  const refresh = useCallback(() => { accessibility.status().then(setStatus).catch(() => setStatus(null)) }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 5000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { window.clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [refresh])

  return { status, request: accessibility.requestPrompt, openSettings: accessibility.openSettings, refresh }
}
