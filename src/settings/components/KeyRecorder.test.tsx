import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KeyRecorder } from './KeyRecorder'

describe('KeyRecorder', () => {
  it('shows current combo and 录制 button when idle', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    expect(screen.getByText(/Meta/)).toBeInTheDocument()
    expect(screen.getByText('录制')).toBeInTheDocument()
  })

  it('clicking 录制 enters recording state with × close button', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('录制'))
    expect(screen.getByText(/请按键/)).toBeInTheDocument()
    expect(screen.getByLabelText('close')).toBeInTheDocument()
  })

  it('recording state shows 3 preset shortcut recommendations (豆包模式)', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('录制'))
    // 3 个豆包推荐：Alt+Space / Meta+Shift+Space（formatKey 按 MOD_ORDER 输出）/ Alt+Shift+Space
    expect(screen.getByText(/Alt\s*\+\s*Space/)).toBeInTheDocument()
    expect(screen.getByText(/Meta\s*\+\s*Shift\s*\+\s*Space/)).toBeInTheDocument()
    expect(screen.getByText(/Alt\s*\+\s*Shift\s*\+\s*Space/)).toBeInTheDocument()
    expect(screen.getByText(/推荐/)).toBeInTheDocument()
  })

  it('clicking preset calls onChange with that combo + cancels recording', () => {
    const onChange = vi.fn()
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={onChange} />)
    fireEvent.click(screen.getByText('录制'))
    fireEvent.click(screen.getByText(/Alt\s*\+\s*Shift\s*\+\s*Space/))
    // Alt(4) | Shift(1) = 5
    expect(onChange).toHaveBeenCalledWith({ modifiers: 5, code: 'Space' })
    // 推荐 popover 消失，回到 idle 显示 录制按钮
    expect(screen.queryByText(/推荐/)).not.toBeInTheDocument()
    expect(screen.getByText('录制')).toBeInTheDocument()
  })

  it('× close button cancels recording + hides popover', () => {
    render(<KeyRecorder value={{ modifiers: 9, code: 'Space' }} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('录制'))
    expect(screen.getByText(/推荐/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('close'))
    expect(screen.queryByText(/推荐/)).not.toBeInTheDocument()
    expect(screen.getByText('录制')).toBeInTheDocument()
  })
})