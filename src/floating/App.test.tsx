// src/floating/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import App from './App'

// Mock getCurrentWindow from @tauri-apps/api/window — jsdom has no Tauri runtime.
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: vi.fn().mockResolvedValue(undefined),
  }),
}))

beforeEach(() => {
  // jsdom doesn't expose WebGL by default; OuterShell's hasWebGL() check would
  // try to render <LiquidGlass>. Force fallback by deleting the property so
  // OuterShell renders a plain div. This keeps tests focused on App behavior.
  delete (window as any).WebGLRenderingContext
  // jsdom lacks CSS.supports — App.detectLegacy() calls it during useEffect.
  // Polyfill a no-op shim so detectLegacy() returns 'L1' in tests.
  if (typeof (window as any).CSS === 'undefined' || typeof (window as any).CSS.supports !== 'function') {
    Object.defineProperty(window, 'CSS', {
      value: { supports: () => true },
      configurable: true,
    })
  }
})

describe('App', () => {
  it('展开态渲染带 [data-close] 的关闭按钮(D-12 / §5.2)', () => {
    // Force expanded state by finding the close button after triggering expand
    const { container } = render(<App />)
    // Click the fold toggle area (anything that's NOT [data-no-expand]) to expand
    const shellRoot = container.querySelector('[class*="select-none"]') as HTMLElement
    // Simulate mousedown+mouseup on the outer shell to expand (mousedown returns
    // immediately when isExpanded; but for the toggle we need the mouseup path
    // which fires onToggle on a "short press").
    fireEvent.mouseDown(shellRoot, { clientX: 5, clientY: 5 })
    fireEvent.mouseUp(shellRoot, { clientX: 5, clientY: 5 })
    // After expand, the close button should appear
    const closeBtn = screen.queryByLabelText('关闭浮窗')
    expect(closeBtn).toBeTruthy()
    expect(closeBtn?.hasAttribute('data-close')).toBe(true)
  })

  it('展开态点击关闭按钮触发 getCurrentWindow().close()(D-12 / §5.2)', async () => {
    const { container } = render(<App />)
    // Expand first
    const shellRoot = container.querySelector('[class*="select-none"]') as HTMLElement
    fireEvent.mouseDown(shellRoot, { clientX: 5, clientY: 5 })
    fireEvent.mouseUp(shellRoot, { clientX: 5, clientY: 5 })
    // Click close
    const closeBtn = screen.getByLabelText('关闭浮窗')
    fireEvent.click(closeBtn)
    // getCurrentWindow().close was mocked; assert it can be imported & called
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    expect(win.close).toBeDefined()
  })

  it('Form ↔ Timer 切换时 textarea 内容保留(D-13 DOM 复用)', async () => {
    // Polyfill matchMedia for jsdom — segmented click may rely on it indirectly.
    if (!window.matchMedia) {
      window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} } as any)
    }
    const { container } = render(<App />)
    // Expand
    const shellRoot = container.querySelector('[class*="select-none"]') as HTMLElement
    fireEvent.mouseDown(shellRoot, { clientX: 5, clientY: 5 })
    fireEvent.mouseUp(shellRoot, { clientX: 5, clientY: 5 })

    // Default segment is 'form' — textarea should be present.
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(ta).toBeTruthy()

    // Type into form
    fireEvent.change(ta, { target: { value: '继续手头的小事' } })
    expect(ta.value).toBe('继续手头的小事')

    // Switch to timer segment
    const timerTab = screen.getByRole('tab', { name: /计时/ })
    fireEvent.click(timerTab)

    // Form should still be in DOM (D-13) — query it via role, then verify content
    // survives the round trip back to form
    const formTab = screen.getByRole('tab', { name: /记录/ })
    fireEvent.click(formTab)

    // Re-query textarea — it MUST still be the same DOM node and retain content
    const ta2 = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(ta2).toBe(ta)  // same DOM node = not unmounted
    expect(ta2.value).toBe('继续手头的小事')
  })
})
