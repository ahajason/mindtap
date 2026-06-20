// src/floating/hooks/useWindowPosition.test.ts
// F3' 浮窗位置兜底:Tauri 默认把 webview 放 (0, 0),macOS 菜单栏遮顶部 ~25px。
// V1.5 era 没修,V3 时代用户报告"屏幕上不出现浮窗" → 必须保证首次启动
// 主动 setPosition 到避菜单栏的安全位置 (100, 60)。

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// vi.hoisted 让 mock 实例在 vi.mock factory 顶层 hoist 时可用
// R7:getCurrentWindow 也用 vi.fn 包装,R7 测试可以 vi.mocked().mockImplementation()
// 模拟 Tauri runtime 未就绪(抛错 / 返 undefined / 缺方法)。
const { setPositionMock, onMovedCallbacks, availableMonitorsMock, getCurrentWindowMock } = vi.hoisted(() => {
  const setPositionMock = vi.fn().mockResolvedValue(undefined)
  const onMovedCallbacks: Array<(e: { payload: { x: number; y: number } }) => void> = []
  // P1 clamp:启动 + onMoved 时拿 monitor 列表,检查位置是否在任意屏内
  const availableMonitorsMock = vi.fn().mockResolvedValue([
    { name: 'primary', position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 }, scaleFactor: 1 },
  ])
  // R7:默认实现 — 返正常 window 对象;测试可 mockImplementation 覆盖抛错/返 undefined
  const getCurrentWindowMock = vi.fn(() => ({
    setPosition: setPositionMock,
    onMoved: (cb: (e: { payload: { x: number; y: number } }) => void) => {
      onMovedCallbacks.push(cb)
      return Promise.resolve(() => {})  // unlisten fn
    },
  }))
  return { setPositionMock, onMovedCallbacks, availableMonitorsMock, getCurrentWindowMock }
})

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: getCurrentWindowMock,
  availableMonitors: availableMonitorsMock,
  PhysicalPosition: class PhysicalPosition {
    constructor(public x: number, public y: number) {}
  },
}))

// 导入在 mock 之后
// eslint-disable-next-line import/first
import { useWindowPosition } from './useWindowPosition'

const KEY = 'floating-position'

describe('useWindowPosition (F3 位置兜底)', () => {
  beforeEach(() => {
    setPositionMock.mockClear()
    onMovedCallbacks.length = 0
    availableMonitorsMock.mockClear()
    availableMonitorsMock.mockResolvedValue([
      { name: 'primary', position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 }, scaleFactor: 1 },
    ])
    // 重置 getCurrentWindowMock 到默认实现(R7 测试可能改过它)
    getCurrentWindowMock.mockReset()
    getCurrentWindowMock.mockImplementation(() => ({
      setPosition: setPositionMock,
      onMoved: (cb: (e: { payload: { x: number; y: number } }) => void) => {
        onMovedCallbacks.push(cb)
        return Promise.resolve(() => {})
      },
    }))
    localStorage.clear()
  })

  it('首次启动无 saved 时 setPosition(100, 60)(避 macOS 菜单栏)', () => {
    renderHook(() => useWindowPosition())
    expect(setPositionMock).toHaveBeenCalledTimes(1)
    const arg = setPositionMock.mock.calls[0][0]
    expect(arg).toBeInstanceOf(Object)
    expect((arg as any).x).toBe(100)
    expect((arg as any).y).toBe(60)
  })

  it('有 localStorage saved 时 setPosition(saved.x, saved.y) 恢复用户拖动位置', async () => {
    localStorage.setItem(KEY, JSON.stringify({ x: 250, y: 380 }))
    renderHook(() => useWindowPosition())
    // 启动校验走 availableMonitors().then(...) 异步链,setPosition 在 microtask 后才调
    await new Promise((r) => setTimeout(r, 0))
    expect(setPositionMock).toHaveBeenCalledTimes(1)
    const arg = setPositionMock.mock.calls[0][0]
    expect((arg as any).x).toBe(250)
    expect((arg as any).y).toBe(380)
  })

  it('onMoved 触发时持久化新位置到 localStorage', async () => {
    renderHook(() => useWindowPosition())
    // 等启动 setPosition 异步链 flush,再触发 onMoved
    await new Promise((r) => setTimeout(r, 0))
    expect(onMovedCallbacks.length).toBe(1)
    onMovedCallbacks[0]({ payload: { x: 400, y: 200 } })
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ x: 400, y: 200 }))
  })

  it('localStorage 含非法 JSON 时 setPosition 仍按默认 (100, 60) 兜底', () => {
    localStorage.setItem(KEY, 'not json')
    renderHook(() => useWindowPosition())
    expect(setPositionMock).toHaveBeenCalledTimes(1)
    const arg = setPositionMock.mock.calls[0][0]
    expect((arg as any).x).toBe(100)
    expect((arg as any).y).toBe(60)
  })

  // P1 clamp 屏外(借鉴 TaskIsland IslandPanelController.swift:472-483 + 528)
  // 用户拖浮窗到屏幕外 / 拔副屏导致原位置悬空 → 自动拽回默认,持久化默认位置。
  // Tauri 没有「拖动中」事件,只在停止时触发 onMoved —— 退而求其次:停止时校验。
  it('onMoved payload 在屏幕外时,拽回默认 (100, 60) + 持久化默认', async () => {
    renderHook(() => useWindowPosition())
    // 启动时已 setPosition(DEFAULT) 1 次,清掉计数只关注 onMoved 触发的逻辑
    setPositionMock.mockClear()
    onMovedCallbacks[0]({ payload: { x: 5000, y: 5000 } })  // 屏外
    // 异步处理:onMoved 回调 async,等 microtask flush
    await new Promise((r) => setTimeout(r, 0))
    expect(setPositionMock).toHaveBeenCalledTimes(1)
    const arg = setPositionMock.mock.calls[0][0]
    expect((arg as any).x).toBe(100)
    expect((arg as any).y).toBe(60)
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ x: 100, y: 60 }))
  })

  it('启动时 saved 位置在屏幕外,删 saved + setPosition(DEFAULT)', async () => {
    localStorage.setItem(KEY, JSON.stringify({ x: 5000, y: 5000 }))  // 屏外
    renderHook(() => useWindowPosition())
    // 启动校验走 availableMonitors().then(...) 异步链
    await new Promise((r) => setTimeout(r, 0))
    expect(setPositionMock).toHaveBeenCalledTimes(1)
    const arg = setPositionMock.mock.calls[0][0]
    expect((arg as any).x).toBe(100)
    expect((arg as any).y).toBe(60)
    expect(localStorage.getItem(KEY)).toBeNull()  // 失效 saved 被清,下次启动走默认分支
  })
})

// R7 防御:Tauri 2 IPC runtime 在 Vite dev 模式下注入时序问题 —
// useEffect 挂时 getCurrentWindow 抛错 / 返 undefined,React 默认错误
// 处理会让 App 整体 unmount,浮窗 = "闪退"。hook 必须静默放弃,不抛。
describe('useWindowPosition (R7 Tauri runtime 防御)', () => {
  // 独立 beforeEach:F3 describe 的 beforeEach 只覆盖 F3 测试,R7 测试
  // 也需要清 setPositionMock 计数 + 重置 getCurrentWindowMock。
  beforeEach(() => {
    setPositionMock.mockClear()
    getCurrentWindowMock.mockReset()
    getCurrentWindowMock.mockImplementation(() => ({
      setPosition: setPositionMock,
      onMoved: (cb: (e: { payload: { x: number; y: number } }) => void) => {
        onMovedCallbacks.push(cb)
        return Promise.resolve(() => {})
      },
    }))
    localStorage.clear()
  })

  it('getCurrentWindow 抛错时 hook 不挂(React mount 成功)', () => {
    // 重写 mock:让 getCurrentWindow 抛错(模拟 runtime 未就绪)
    getCurrentWindowMock.mockImplementation(() => {
      throw new Error('Tauri runtime not ready')
    })
    // 不期望 throw — React 才能继续 mount
    expect(() => renderHook(() => useWindowPosition())).not.toThrow()
    // 抛错路径下不应再调 setPosition
    expect(setPositionMock).not.toHaveBeenCalled()
  })

  it('getCurrentWindow 返 undefined 时 hook 不挂', () => {
    getCurrentWindowMock.mockReturnValue(undefined as never)
    expect(() => renderHook(() => useWindowPosition())).not.toThrow()
    expect(setPositionMock).not.toHaveBeenCalled()
  })

  it('getCurrentWindow 返对象但缺 onMoved 时,onMoved 注册静默失败(不挂)', async () => {
    // 模拟 Tauri runtime 部分就绪:window 有 setPosition 但 onMoved 缺失
    getCurrentWindowMock.mockReturnValue({
      setPosition: setPositionMock,
      // onMoved 故意缺失
    } as never)
    expect(() => renderHook(() => useWindowPosition())).not.toThrow()
  })
})
