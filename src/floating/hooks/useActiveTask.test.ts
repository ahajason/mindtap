// src/floating/hooks/useActiveTask.test.ts
// R7 防御:Tauri 2 IPC runtime 在 Vite dev 模式下注入时序问题 —
// useEffect 挂时 invoke / listen 调用 window.__TAURI_INTERNALS__.invoke / .transformCallback
// 失败,React 默认错误处理让 App 整体 unmount = 浮窗「闪退」。
// hook 必须静默放弃,不抛;unhandled promise rejection 也要吞。

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// vi.hoisted 让 spy 在 vi.mock factory 顶层 hoist 时可用
const { recordGetActiveTaskMock, onFocusChangedMock } = vi.hoisted(() => {
  // R7 默认实现:模拟 Tauri runtime 就绪
  const recordGetActiveTaskMock = vi.fn().mockResolvedValue({
    id: 1,
    content: 'test task',
    status: 'active',
    duration_ms: 0,
    first_focused_at: null,
    focus_started_at: 1000,
    paused_at: null,
    focused_count: 1,
    due_at: null,
    created_at: 1000,
    updated_at: 1000,
    archived_at: null,
  } as any)
  // onFocusChanged 默认返 resolved unlisten
  const onFocusChangedMock = vi.fn().mockResolvedValue(() => {})
  return { recordGetActiveTaskMock, onFocusChangedMock }
})

vi.mock('../../lib/tauri-bridge', () => ({
  api: {
    recordGetActiveTask: recordGetActiveTaskMock,
  },
  events: {
    onFocusChanged: onFocusChangedMock,
  },
}))

// 导入在 mock 之后
// eslint-disable-next-line import/first
import { useActiveTask } from './useActiveTask'

describe('useActiveTask (R7 Tauri runtime 防御)', () => {
  beforeEach(() => {
    recordGetActiveTaskMock.mockReset()
    onFocusChangedMock.mockReset()
    // 默认:正常 mock
    recordGetActiveTaskMock.mockResolvedValue({
      id: 1,
      content: 'test task',
      status: 'active',
      duration_ms: 0,
      first_focused_at: null,
      focus_started_at: 1000,
      paused_at: null,
      focused_count: 1,
      due_at: null,
      created_at: 1000,
      updated_at: 1000,
      archived_at: null,
    } as any)
    onFocusChangedMock.mockResolvedValue(() => {})
  })

  it('正常:Tauri runtime 就绪时,加载 active task', async () => {
    const { result } = renderHook(() => useActiveTask())
    await waitFor(() => {
      expect(result.current).toBeTruthy()
    })
    expect(result.current?.id).toBe(1)
  })

  it('api.recordGetActiveTask 抛错时 hook 不挂 — 返 null', async () => {
    // 模拟 Tauri runtime 未就绪:__TAURI_INTERNALS__.invoke 不可用
    recordGetActiveTaskMock.mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'invoke')")
    )
    expect(() => renderHook(() => useActiveTask())).not.toThrow()
    await waitFor(() => {
      // 等 refresh 的 microtask 跑完
      expect(recordGetActiveTaskMock).toHaveBeenCalled()
    })
    // active 保持 null(没崩)
    const { result } = renderHook(() => useActiveTask())
    expect(result.current).toBeNull()
  })

  it('events.onFocusChanged 返 rejected promise 时 hook 不挂(不 unhandled reject)', async () => {
    // 模拟 listen() 失败:runtime 未就绪时 __TAURI_INTERNALS__.transformCallback 不可用
    onFocusChangedMock.mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'transformCallback')")
    )
    // 不期望 throw,也不应产生 unhandled promise rejection
    expect(() => renderHook(() => useActiveTask())).not.toThrow()
    // 让 microtask 跑完
    await new Promise((r) => setTimeout(r, 0))
    // unhandled rejection 计数应该 0(vitest 默认会收集 + 失败测试)
    // 这里用 spy 检测:不调 unlisten
    expect(onFocusChangedMock).toHaveBeenCalled()
  })

  it('Tauri 整体不可用(api + events 都抛)时 hook 不挂,返 null', async () => {
    recordGetActiveTaskMock.mockRejectedValue(new TypeError("Cannot read 'invoke'"))
    onFocusChangedMock.mockRejectedValue(new TypeError("Cannot read 'transformCallback'"))
    expect(() => renderHook(() => useActiveTask())).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
    // 重 render 验证仍 null
    const { result } = renderHook(() => useActiveTask())
    expect(result.current).toBeNull()
  })
})