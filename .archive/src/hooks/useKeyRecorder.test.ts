import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyRecorder } from './useKeyRecorder'

describe('useKeyRecorder', () => {
  beforeEach(() => { vi.useFakeTimers() })

  it('starts in idle', () => {
    const { result } = renderHook(() => useKeyRecorder({ value: { modifiers: 0, code: '' }, onChange: vi.fn() }))
    expect(result.current.state).toBe('idle')
  })

  it('transitions to recording on start', () => {
    const { result } = renderHook(() => useKeyRecorder({ value: { modifiers: 0, code: '' }, onChange: vi.fn() }))
    act(() => { result.current.start() })
    expect(result.current.state).toBe('recording')
  })

  it('captures keydown with modifier and calls onChange', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useKeyRecorder({ value: { modifiers: 0, code: '' }, onChange }))
    act(() => { result.current.start() })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', shiftKey: true, metaKey: true, ctrlKey: false, altKey: false, bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith({ modifiers: 9, code: 'Space' })
  })

  it('rejects keydown without modifier', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useKeyRecorder({ value: { modifiers: 0, code: '' }, onChange }))
    act(() => { result.current.start() })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a', bubbles: true }))
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.state).toBe('recording')
  })

  it('cancels on Esc', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useKeyRecorder({ value: { modifiers: 0, code: '' }, onChange }))
    act(() => { result.current.start() })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    // state is 'cancel' immediately after Esc; the setTimeout fires it back to 'idle'
    act(() => { vi.runAllTimers() })
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })
})
