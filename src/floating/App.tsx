// src/floating/App.tsx
import { useEffect, useState, useCallback } from 'react'
import { useActiveTask } from './hooks/useActiveTask'
import { useTick } from './hooks/useTick'
import { api, type Task } from '@/lib/tauri-bridge'
import { OuterShell } from './OuterShell'
import { FloatShell } from './FloatShell'
import { GlassSurface } from './GlassSurface'
import { Segmented, type SegmentedValue } from './Segmented'
import { FormSubPanel } from './FormSubPanel'
import { TimerSubPanel, type TimerStatus } from './TimerSubPanel'
import { FoldedBar } from './FoldedBar'
import type { RecordKind as PanelRecordKind } from './FormSubPanel'

type Variant = 'L1' | 'L3' | 'fb' | 'legacy'

function detectLegacy(): Variant {
  if (typeof navigator === 'undefined') return 'L1'
  if (/Mac OS X 10_15/.test(navigator.userAgent)) return 'legacy'
  if (!CSS.supports('backdrop-filter', 'blur(24px)')) return 'fb'
  return 'L1'
}

function liveDurationMs(task: Task | null, now: number): number {
  if (!task) return 0
  return (
    task.duration_ms +
    (task.status === 'active' && task.focus_started_at
      ? now - task.focus_started_at
      : 0)
  )
}

function statusOf(task: Task | null): TimerStatus {
  if (!task) return 'active'
  if (task.status === 'active' || task.status === 'paused' || task.status === 'done') {
    return task.status
  }
  return 'active'
}

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [segment, setSegment] = useState<SegmentedValue>('form')  // D-07 Form-first
  const [variant, setVariant] = useState<Variant>('L1')
  const [aggregate, setAggregate] = useState({ totalMs: 0, segmentCount: 0 })

  useEffect(() => setVariant(isExpanded ? 'L3' : detectLegacy()), [isExpanded])

  // D-06 副标题
  useEffect(() => {
    if (!isExpanded || segment !== 'timer') return
    let cancelled = false
    api.taskAggregateToday()
      .then((a) => {
        if (!cancelled) setAggregate({ totalMs: a.total_ms, segmentCount: a.segment_count })
      })
      .catch(() => { /* 降级显示 0:00:00 */ })
    return () => { cancelled = true }
  }, [isExpanded, segment])

  // 项目既有 hook:useActiveTask 返回 Task | null
  const activeTask = useActiveTask()
  const now = useTick()

  const handleFormSubmit = useCallback((kind: PanelRecordKind, content: string) => {
    if (!content.trim()) return
    if (kind === 'task') {
      // 项目既有 API:taskCreate 替代 plan 里的 recordCreate
      api
        .taskCreate(content)
        .catch(console.error)
    } else if (kind === 'idea') {
      api.ideaCreate(content).catch(console.error)
    } else {
      api.checkInCreate(content).catch(console.error)
    }
  }, [])

  const status: TimerStatus = statusOf(activeTask)
  const durationMs = liveDurationMs(activeTask, now)

  // 注意:FormSubPanel onSubmit 签名是 (kind: RecordKind, content: string) —
  // RecordKind 在 FormSubPanel 中定义为 'task' | 'idea' | 'check_in'。
  // 此处用 PanelRecordKind 作为 Panel 接口契约,实际 IPC 按 kind 分发到
  // taskCreate / ideaCreate / checkInCreate(项目既有 API,plan 里的
  // api.recordCreate 并不存在,本 plan 注释:若命名不一致,按实际改)。

  return (
    <OuterShell isExpanded={isExpanded}>
      <FloatShell
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((v) => !v)}
        foldedBar={
          <FoldedBar
            status={status}
            title={activeTask?.content ?? '无 Focus'}
            durationMs={durationMs}
            onTogglePause={() => {
              if (!activeTask) return
              if (activeTask.status === 'active') {
                api.taskPause(activeTask.id).catch(console.error)
              } else if (activeTask.status === 'paused') {
                api.taskResume(activeTask.id).catch(console.error)
              }
            }}
            onOpenForm={() => { setIsExpanded(true); setSegment('form') }}
          />
        }
      >
        <GlassSurface variant={variant}>
          <div className="flex flex-col gap-2 p-2">
            <Segmented value={segment} onChange={setSegment} />
            {segment === 'form' && (
              <FormSubPanel
                activeTaskContent={activeTask?.content}
                onSubmit={handleFormSubmit}
              />
            )}
            {segment === 'timer' && (
              <TimerSubPanel
                status={status}
                durationMs={durationMs}
                aggregate={aggregate}
                onPause={() => activeTask && api.taskPause(activeTask.id).catch(console.error)}
                onResume={() => activeTask && api.taskResume(activeTask.id).catch(console.error)}
                onComplete={() => activeTask && api.taskComplete(activeTask.id).catch(console.error)}
                onUndo={() => activeTask && api.taskUndo(activeTask.id).catch(console.error)}
              />
            )}
          </div>
        </GlassSurface>
      </FloatShell>
    </OuterShell>
  )
}
