// src/floating/FoldedBar.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FoldedBar } from './FoldedBar'

describe('FoldedBar', () => {
  it('渲染 5 元素顺序:状态点 → 标题 → 时间 → ⏸ → ＋', () => {
    const { container } = render(
      <FoldedBar
        status="active" title="写 spec" durationMs={65000}
        onTogglePause={() => {}} onOpenForm={() => {}}
      />
    )
    const firstChild = container.firstChild as HTMLElement
    // child[0] = StatusDot — 用 aria-label 验证 active
    expect(firstChild.children[0].getAttribute('aria-label')).toBe('status-active')
    expect(firstChild.children[1].textContent).toMatch(/写 spec/)
    expect(firstChild.children[2].textContent).toMatch(/01:05/)
    expect(firstChild.children[3].textContent).toMatch(/⏸/)
    expect(firstChild.children[4].textContent).toMatch(/＋/)
  })

  it('paused 状态显示 ▶ 而非 ⏸', () => {
    render(
      <FoldedBar
        status="paused" title="x" durationMs={0}
        onTogglePause={() => {}} onOpenForm={() => {}}
      />
    )
    expect(screen.getByText('▶')).toBeTruthy()
  })
})