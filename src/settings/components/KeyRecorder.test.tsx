import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KeyRecorder } from './KeyRecorder'

describe('KeyRecorder', () => {
  it('shows current combo and 录制 button when idle', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    expect(screen.getByText(/Meta/)).toBeInTheDocument()
    expect(screen.getByText('录制')).toBeInTheDocument()
  })

  it('clicking 录制 enters recording state', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('录制'))
    expect(screen.getByText(/请按键/)).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })
})
