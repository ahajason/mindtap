import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
vi.mock('@/lib/tauri-bridge', () => ({
  diagnostics: { get: vi.fn(), recentLogs: vi.fn() },
}))
import { useDiagnostics } from './useDiagnostics'
import { diagnostics } from '@/lib/tauri-bridge'

describe('useDiagnostics', () => {
  it('loads diagnostics on mount', async () => {
    const mock = {} as any
    ;(diagnostics.get as any).mockResolvedValue(mock)
    const { result } = renderHook(() => useDiagnostics())
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toEqual(mock)
  })
})
