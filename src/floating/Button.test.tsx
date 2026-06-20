// src/floating/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('渲染 children', () => {
    render(<Button>click</Button>)
    expect(screen.getByText('click')).toBeTruthy()
  })

  it('hover 时背景透明度提升', () => {
    const { container } = render(<Button data-testid="b">x</Button>)
    const btn = container.querySelector('[data-testid="b"]') as HTMLElement
    expect(btn.className).toMatch(/bg-white\/15/)
    fireEvent.mouseEnter(btn)
    expect(btn.className).toMatch(/hover:bg-white\/55/)
  })

  it('mousedown 时 scale 0.96 active 态', () => {
    const { container } = render(<Button>x</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toMatch(/active:scale-\[0\.96\]/)
  })

  it('click 触发 onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>x</Button>)
    fireEvent.click(screen.getByText('x'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('size=icon-sm 给 22×22 + r6', () => {
    const { container } = render(<Button size="icon-sm">x</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toMatch(/size-icon-sm|h-6.*w-6|rounded-md/)
  })
})