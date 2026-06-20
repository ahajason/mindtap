// src/floating/SharedHeader.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SharedHeader } from './SharedHeader'

describe('SharedHeader', () => {
  it('有 active task 时显示 📄 + 任务名 + 当前 Focus', () => {
    render(<SharedHeader activeTaskContent="写浮窗 spec" />)
    expect(screen.getByText('📄')).toBeTruthy()
    expect(screen.getByText('写浮窗 spec')).toBeTruthy()
    expect(screen.getByText('当前 Focus')).toBeTruthy()
  })

  it('无 active task 时退化为中性 ✚ + 新记录', () => {
    render(<SharedHeader />)
    expect(screen.getByText('✚')).toBeTruthy()
    expect(screen.getByText('新记录')).toBeTruthy()
  })
})