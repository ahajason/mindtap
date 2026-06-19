import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
vi.mock('@/lib/tauri-bridge', () => ({
  accessibility: { status: vi.fn(), requestPrompt: vi.fn(), openSettings: vi.fn() },
}))
import { useAccessibility } from './useAccessibility'
import { accessibility } from '@/lib/tauri-bridge'

describe('useAccessibility', () => {
  it('polls status on interval', async () => {
    vi.useFakeTimers()
    ;(accessibility.status as any).mockResolvedValue(true)
    const { result } = renderHook(() => useAccessibility())
    await act(async () => { await Promise.resolve() })
    expect(result.current.status).toBe(true)
    ;(accessibility.status as any).mockResolvedValueOnce(false)
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve() })
    expect(result.current.status).toBe(false)
    vi.useRealTimers()
  })
})
