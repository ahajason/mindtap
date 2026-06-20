// src/floating/hooks/useWindowPosition.test.ts
// 2026-06-20 bug 修复:floating 默认 position (0, 0) 被 macOS 菜单栏
// (~25px) 遮住,用户拖动只露 ~11px。useWindowPosition hook 已有
// 持久化逻辑但 App.tsx 没 import,且首次启动没设默认位置。
//
// 此测试断言:
// 1) 首次启动(无 localStorage saved)→ setPosition(100, 60) 避开菜单栏
// 2) 有 saved → setPosition(saved.x, saved.y) 恢复
// 3) onMoved 触发 → localStorage 持久化
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockSetPosition = vi.fn().mockResolvedValue(undefined)
const mockOnMoved = vi.fn().mockResolvedValue(() => {})

// 必须在 import useWindowPosition 之前 mock — vitest 的 vi.mock hoist
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setPosition: mockSetPosition,
    onMoved: mockOnMoved,
  }),
  // hook 构造 PhysicalPosition 实例 — mock 类保留 x/y 字段即可
  PhysicalPosition: class {
    constructor(public x: number, public y: number) {}
  },
}))

// 现在才 import — mock 已生效
import { useWindowPosition } from './useWindowPosition'

beforeEach(() => {
  localStorage.clear()
  mockSetPosition.mockClear()
  mockOnMoved.mockClear()
})

describe('useWindowPosition', () => {
  it('首次启动(无 localStorage saved)→ setPosition(100, 60) 避开 macOS 菜单栏', async () => {
    renderHook(() => useWindowPosition())
    await new Promise(r => setTimeout(r, 30))
    expect(mockSetPosition).toHaveBeenCalled()
    const pos = mockSetPosition.mock.calls[0]?.[0]
    expect(pos).toBeTruthy()
    expect(pos.x).toBe(100)
    expect(pos.y).toBe(60)  // 避开 macOS 顶栏 ~25px
  })

  it('有 localStorage saved → setPosition 恢复 saved 位置', async () => {
    localStorage.setItem('floating-position', JSON.stringify({ x: 500, y: 200 }))
    renderHook(() => useWindowPosition())
    await new Promise(r => setTimeout(r, 30))
    expect(mockSetPosition).toHaveBeenCalled()
    const pos = mockSetPosition.mock.calls[0]?.[0]
    expect(pos.x).toBe(500)
    expect(pos.y).toBe(200)
  })

  it('注册 onMoved 监听,位置变化时持久化到 localStorage', async () => {
    renderHook(() => useWindowPosition())
    await new Promise(r => setTimeout(r, 30))
    expect(mockOnMoved).toHaveBeenCalled()
    const handler = mockOnMoved.mock.calls[0]?.[0] as (e: any) => void
    expect(handler).toBeTruthy()
    handler({ payload: { x: 333, y: 444 } })
    expect(localStorage.getItem('floating-position')).toBe(JSON.stringify({ x: 333, y: 444 }))
  })
})