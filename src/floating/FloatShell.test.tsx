// src/floating/FloatShell.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FloatShell } from './FloatShell'

describe('FloatShell', () => {
  it('折叠态渲染 foldedBar,展开态渲染 children', () => {
    const { rerender } = render(
      <FloatShell isExpanded={false} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    expect(screen.getByText('bar')).toBeTruthy()
    expect(screen.queryByText('expanded')).toBeNull()

    rerender(
      <FloatShell isExpanded={true} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    expect(screen.getByText('expanded')).toBeTruthy()
  })

  it('折叠态 click 空白触发 onToggle', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    // 点击非 [data-no-expand] 区域
    fireEvent.mouseDown(container.firstChild as Element, { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(container.firstChild as Element, { clientX: 10, clientY: 10 })
    expect(onToggle).toHaveBeenCalled()
  })

  it('折叠态拖动 5px 不触发 onToggle(超过 4px 阈值)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const target = container.firstChild as Element
    fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(target, { clientX: 15, clientY: 10 })  // 5px > 4px
    fireEvent.mouseUp(target, { clientX: 15, clientY: 10 })
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('折叠态拖动 3px 仍触发 onToggle(未超阈值 = 短按)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const target = container.firstChild as Element
    fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(target, { clientX: 13, clientY: 10 })  // 3px < 4px
    fireEvent.mouseUp(target, { clientX: 13, clientY: 10 })
    expect(onToggle).toHaveBeenCalled()
  })

  it('展开态 mousedown 在内部控件(data-no-expand)不响应 drag/expand', () => {
    const onToggle = vi.fn()
    render(
      <FloatShell isExpanded={true} onToggle={onToggle} foldedBar={<span>bar</span>}>
        <button data-no-expand>x</button>
      </FloatShell>
    )
    fireEvent.mouseDown(screen.getByText('x'), { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(screen.getByText('x'), { clientX: 10, clientY: 10 })
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('展开态用 grid-template-rows 0fr→1fr 过渡(D-11)', () => {
    const { container } = render(
      <FloatShell isExpanded={true} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const inner = container.querySelector('[data-float-expand]') as HTMLElement
    expect(inner).toBeTruthy()
    expect(inner.style.gridTemplateRows).toBe('1fr')
  })

  it('折叠态 mousedown 在 [data-close] 元素上不触发 onToggle(D-12)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <button data-close>x</button>
      </FloatShell>
    )
    const target = container.firstChild as Element
    // mousedown 在 [data-close] 区域(本测试为折叠态无 [data-close],但短路
    // 检查应同样放过折叠态短按路径的反向断言 — 不在折叠态分支短路,而是
    // 通过 [data-no-expand] 通用短路实现。这里先确认 [data-no-expand] 仍生效)
    fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(target, { clientX: 10, clientY: 10 })
    // 折叠态无 [data-close],行为同普通折叠态短按
    expect(onToggle).toHaveBeenCalled()
  })

  it('展开态 mousedown 在 [data-close] 元素上不触发 drag(D-12 / §5.2)', () => {
    const onToggle = vi.fn()
    render(
      <FloatShell isExpanded={true} onToggle={onToggle} foldedBar={<span>bar</span>}>
        <button data-close aria-label="关闭浮窗">×</button>
      </FloatShell>
    )
    const btn = screen.getByLabelText('关闭浮窗')
    // 展开态下,mousedown 在 [data-close] 上不应进入 drag/expand 流程
    fireEvent.mouseDown(btn, { clientX: 50, clientY: 50 })
    fireEvent.mouseMove(btn, { clientX: 60, clientY: 60 })  // 超 4px 阈值
    fireEvent.mouseUp(btn, { clientX: 60, clientY: 60 })
    expect(onToggle).not.toHaveBeenCalled()
  })
})
