// src/floating/StatusDot.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it('active=绿色 #5BCBA0 + 呼吸动画', () => {
    const { container } = render(<StatusDot status="active" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-active/)
    expect(dot.className).toMatch(/animate-pulse-v6/)
  })

  it('paused=橙色 #F5A623 + 呼吸动画', () => {
    const { container } = render(<StatusDot status="paused" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-paused/)
    expect(dot.className).toMatch(/animate-pulse-v6/)
  })

  it('done=灰色 #98A2B3 + 无动画', () => {
    const { container } = render(<StatusDot status="done" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-done/)
    expect(dot.className).not.toMatch(/animate-pulse/)
  })
})