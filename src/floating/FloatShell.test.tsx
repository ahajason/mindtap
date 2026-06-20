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
})
