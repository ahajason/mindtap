// src/floating/Segmented.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Segmented } from './Segmented'

describe('Segmented', () => {
  it('渲染 2 选项 ⏱ / ＋', () => {
    render(<Segmented value="timer" onChange={() => {}} />)
    expect(screen.getByText('⏱')).toBeTruthy()
    expect(screen.getByText('＋')).toBeTruthy()
  })

  it('点击 form 触发 onChange("form")', () => {
    const onChange = vi.fn()
    render(<Segmented value="timer" onChange={onChange} />)
    fireEvent.click(screen.getByText('＋'))
    expect(onChange).toHaveBeenCalledWith('form')
  })

  it('mutex:同时只有 1 个 active', () => {
    const { container } = render(<Segmented value="form" onChange={() => {}} />)
    const active = container.querySelectorAll('[data-active="true"]')
    expect(active.length).toBe(1)
    expect(active[0].textContent).toMatch(/＋/)
  })
})