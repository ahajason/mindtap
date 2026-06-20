// src/floating/App.tsx
import { useEffect, useState, useCallback } from 'react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { useActiveTask } from './hooks/useActiveTask'
import { useTick } from './hooks/useTick'
import { useWindowPosition } from './hooks/useWindowPosition'
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

// F4' 尺寸自适应:复用 V1.5 webview API 路径。走 getCurrentWindow().setSize + LogicalSize
// (webview 核心 API,不依赖 capability),不走 invoke('floating_set_height')。
// 折叠态 webview 默认 320×36(tauri.conf.json 固定),不需 reset。
// 展开态内容自适应由 GlassSurface variant + grid-template-rows CSS 控制(V3 决策),
// 无需手动测 scrollHeight。
const EXPAND_W = 360
const EXPAND_H = 280

// 缓存窗口实例(getCurrentWindow 每次返回新对象,避免 effect deps 不稳定)
// 浏览器 dev 无 Tauri runtime → getCurrentWindow 同步抛错 → 加 try/catch 兜底,
// 让浮窗在 vite dev 也能 mount(测试用);IPC setSize 在 vite dev 下静默 no-op。
let cachedWin: ReturnType<typeof getCurrentWindow> | null | undefined
function getWin() {
  if (cachedWin !== undefined) return cachedWin
  try {
    cachedWin = getCurrentWindow()
  } catch {
    cachedWin = null
  }
  return cachedWin
}

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

  // F4' 尺寸自适应:展开时 webview 立即撑大 360×280(V1.5 路径)
  useEffect(() => {
    if (!isExpanded) return
    const win = getWin()
    if (!win) return  // 浏览器 dev:无 Tauri runtime
    win.setSize(new LogicalSize(EXPAND_W, EXPAND_H))
      .catch((e: unknown) => console.error('[floating] setSize on expand failed:', e))
  }, [isExpanded])

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

  // F3' 浮窗位置兜底:首次启动主动 setPosition(100, 60) 避 macOS 菜单栏,后续
  // 用户拖动通过 onMoved 自动持久化(localStorage)。
  useWindowPosition()

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

  // D-12 / §5.2:展开态右上角 × 关闭浮窗
  const handleClose = useCallback(async () => {
    try {
      await getCurrentWindow().close()
    } catch (e) {
      // 非 Tauri 环境(jsdom 测试)静默忽略
      console.warn('[floating] close failed', e)
    }
  }, [])

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
          <div className="relative flex flex-col gap-2 p-2">
            {/* D-12 / §5.2:展开态右上角关闭按钮 */}
            <button
              data-close
              aria-label="关闭浮窗"
              onClick={handleClose}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/15 hover:bg-white/55 text-ink-900 transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span aria-hidden>×</span>
            </button>
            <Segmented value={segment} onChange={setSegment} />
            {/* D-13 / §5.3:始终挂载两个 sub-panel,用 CSS 切显隐,避免表单状态丢失 */}
            <div data-segment="form" className={segment === 'form' ? '' : 'hidden'}>
              <FormSubPanel
                activeTaskContent={activeTask?.content}
                onSubmit={handleFormSubmit}
              />
            </div>
            <div data-segment="timer" className={segment === 'timer' ? '' : 'hidden'}>
              <TimerSubPanel
                status={status}
                durationMs={durationMs}
                aggregate={aggregate}
                onPause={() => activeTask && api.taskPause(activeTask.id).catch(console.error)}
                onResume={() => activeTask && api.taskResume(activeTask.id).catch(console.error)}
                onComplete={() => activeTask && api.taskComplete(activeTask.id).catch(console.error)}
                onUndo={() => activeTask && api.taskUndo(activeTask.id).catch(console.error)}
              />
            </div>
          </div>
        </GlassSurface>
      </FloatShell>
    </OuterShell>
  )
}
