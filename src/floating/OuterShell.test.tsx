// src/floating/OuterShell.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OuterShell } from './OuterShell'

describe('OuterShell', () => {
  it('渲染 children', () => {
    render(<OuterShell isExpanded={false}><span data-testid="child">x</span></OuterShell>)
    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('WebGL 不可用时降级为 div', () => {
    const original = (window as any).WebGLRenderingContext
    delete (window as any).WebGLRenderingContext
    try {
      const { container } = render(<OuterShell isExpanded={false}>x</OuterShell>)
      // 不应包 LiquidGlass,应直接是 div
      expect(container.firstChild?.nodeName).toBe('DIV')
    } finally {
      ;(window as any).WebGLRenderingContext = original
    }
  })
})
