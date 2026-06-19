import { useCallback, useEffect, useState } from 'react'
import { diagnostics } from '@/lib/tauri-bridge'
import type { Diagnostics } from '@/settings/schema'

export function useDiagnostics() {
  const [data, setData] = useState<Diagnostics | null>(null)
  const refresh = useCallback(() => { diagnostics.get().then(setData).catch(() => setData(null)) }, [])
  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])
  return { data, refresh }
}
