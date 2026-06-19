import { useEffect, useState, useRef } from 'react'
import { diagnostics } from '@/lib/tauri-bridge'
import type { LogEntry } from '@/settings/schema'
import { cn } from '@/lib/utils'

const LEVEL_COLOR: Record<string, string> = {
  error: 'text-red-500', warn: 'text-amber-500', info: 'text-blue-500', debug: 'text-gray-400', trace: 'text-gray-500',
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const next = await diagnostics.recentLogs()
        if (alive) setLogs(next)
      } catch { /* silent */ }
    }
    tick()
    const id = window.setInterval(tick, 3000)
    return () => { alive = false; window.clearInterval(id) }
  }, [])
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])
  return (
    <div ref={ref} className="glass-l2 rounded-glass p-2 h-48 overflow-auto font-mono text-xs">
      {logs.length === 0 && <div className="text-muted-foreground">暂无日志</div>}
      {logs.map((e, i) => (
        <div key={i} className="flex gap-2 hover:bg-white/5 px-1">
          <span className="text-muted-foreground shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
          <span className={cn('shrink-0 uppercase w-12', LEVEL_COLOR[e.level] ?? 'text-gray-400')}>{e.level}</span>
          <span className="break-all">{e.message}</span>
        </div>
      ))}
    </div>
  )
}
