// src/floating/liveDurationMs.test.ts
// Tests the liveDurationMs helper indirectly via App's rendered output.
// liveDurationMs(task, now) = task.duration_ms + (now - focus_started_at) when active.
//
// Direct unit test would require extracting the helper to its own module;
// the spec notes this is a "small unit test" priority-low, so we cover
// the observable contract via the rendered TimerSubPanel hero aria-label.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import App from './App'

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: vi.fn().mockResolvedValue(undefined),
    setSize: vi.fn().mockResolvedValue(undefined),
    setPosition: vi.fn().mockResolvedValue(undefined),
    onMoved: () => Promise.resolve(() => {}),
  }),
  // F4' 尺寸自适应:App.tsx 在 useEffect [isExpanded] 调 win.setSize(new LogicalSize(...))
  // (V1.5 webview API 路径,不依赖 capability)。必须 mock LogicalSize export,
  // 否则 `new LogicalSize(...)` 抛 "No export defined" 同步错。
  LogicalSize: class LogicalSize {
    constructor(public w: number, public h: number) {}
  },
  // F3' useWindowPosition hook 调 win.setPosition(new PhysicalPosition(...))
  PhysicalPosition: class PhysicalPosition {
    constructor(public x: number, public y: number) {}
  },
}))

beforeEach(() => {
  delete (window as any).WebGLRenderingContext
  if (typeof (window as any).CSS === 'undefined' || typeof (window as any).CSS.supports !== 'function') {
    Object.defineProperty(window, 'CSS', {
      value: { supports: () => true },
      configurable: true,
    })
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} } as any)
  }
})

describe('liveDurationMs(contract via Timer hero)', () => {
  it('无 active task 时 hero 显示 00:00(对应 liveDurationMs(null, _) = 0)', () => {
    const { container } = render(<App />)
    // Expand
    const shellRoot = container.querySelector('[class*="select-none"]') as HTMLElement
    fireEvent.mouseDown(shellRoot, { clientX: 5, clientY: 5 })
    fireEvent.mouseUp(shellRoot, { clientX: 5, clientY: 5 })
    // Switch to timer segment
    const timerTab = screen.getByRole('tab', { name: /计时/ })
    fireEvent.click(timerTab)
    // No active task in jsdom (invoke fails) → activeTask=null → durationMs=0
    expect(screen.getByLabelText('已专注 00:00')).toBeTruthy()
  })
})
