import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/tauri-bridge', () => ({
  settings: { get: vi.fn(), set: vi.fn(), reset: vi.fn() },
  events: { settingsChanged: vi.fn(() => Promise.resolve(() => {})) },
}))

import { useSettings } from './useSettings'
import { settings } from '@/lib/tauri-bridge'

const mockSettings = { version: 1, startup: { autostart: false } } as any

describe('useSettings', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('loads settings on mount', async () => {
    ;(settings.get as any).mockResolvedValue(mockSettings)
    const { result } = renderHook(() => useSettings())
    await act(async () => { await Promise.resolve() })
    expect(result.current.settings).toEqual(mockSettings)
  })

  it('debounces setField by 300ms', async () => {
    ;(settings.get as any).mockResolvedValue(mockSettings)
    ;(settings.set as any).mockResolvedValue(mockSettings)
    const { result } = renderHook(() => useSettings())
    await act(async () => { await Promise.resolve() })
    act(() => { result.current.setField('startup', { autostart: true }) })
    act(() => { result.current.setField('logging', { level: 'Debug', ringSize: 200, fileEnabled: true }) })
    expect(settings.set).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(settings.set).toHaveBeenCalledTimes(1)
  })

  it('on set error, status flips to error and reverts', async () => {
    ;(settings.get as any).mockResolvedValue(mockSettings)
    ;(settings.set as any).mockRejectedValueOnce(new Error('bad'))
    ;(settings.get as any).mockResolvedValueOnce(mockSettings)
    const { result } = renderHook(() => useSettings())
    await act(async () => { await Promise.resolve() })
    act(() => { result.current.setField('startup', { autostart: true }) })
    await act(async () => { vi.advanceTimersByTime(300); await Promise.resolve() })
    expect(result.current.status).toBe('error')
  })
})
