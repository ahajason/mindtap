// src/floating/GlassSurface.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GlassSurface } from './GlassSurface'

describe('GlassSurface', () => {
  it('默认 variant=L1 渲染 L1 类', () => {
    const { container } = render(<GlassSurface>x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-L1/)
    expect(div.className).toMatch(/backdrop-blur-glass/)
  })

  it('variant=L3 渲染 L3 类', () => {
    const { container } = render(<GlassSurface variant="L3">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-L3/)
  })

  it('variant=fb 走 fallback 实色', () => {
    const { container } = render(<GlassSurface variant="fb">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-fb/)
  })

  it('variant=legacy 走老平台配方', () => {
    const { container } = render(<GlassSurface variant="legacy">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-legacy/)
    expect(div.className).toMatch(/backdrop-blur-glass-legacy/)
  })

  it('className 透传且与 variant 合并无冲突', () => {
    const { container } = render(<GlassSurface className="custom-mine">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/custom-mine/)
    expect(div.className).toMatch(/bg-glass-L1/)
  })
})