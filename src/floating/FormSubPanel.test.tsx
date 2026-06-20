// src/floating/FormSubPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FormSubPanel } from './FormSubPanel'

describe('FormSubPanel', () => {
  it('渲染 type chips + textarea + 主 CTA "保存(⌘S)"', () => {
    render(<FormSubPanel onSubmit={() => {}} />)
    expect(screen.getByText('task')).toBeTruthy()
    expect(screen.getByText('idea')).toBeTruthy()
    expect(screen.getByText('check_in')).toBeTruthy()
    expect(screen.getByText(/保存.*⌘S/)).toBeTruthy()
  })

  it('不带 "开始 N 分钟专注" CTA', () => {
    render(<FormSubPanel onSubmit={() => {}} />)
    expect(screen.queryByText(/开始.*分钟/)).toBeNull()
  })

  it('点击保存触发 onSubmit(kind, content)', () => {
    const onSubmit = vi.fn()
    render(<FormSubPanel onSubmit={onSubmit} />)
    const ta = screen.getByRole('textbox')
    fireEvent.change(ta, { target: { value: 'hello' } })
    fireEvent.click(screen.getByText(/保存/))
    expect(onSubmit).toHaveBeenCalledWith('task', 'hello')
  })

  it('切换 type chip 改变默认 kind', () => {
    const onSubmit = vi.fn()
    render(<FormSubPanel onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('idea'))
    fireEvent.click(screen.getByText(/保存/))
    expect(onSubmit).toHaveBeenCalledWith('idea', '')
  })
})