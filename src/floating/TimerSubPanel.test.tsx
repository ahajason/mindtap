// src/floating/TimerSubPanel.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerSubPanel } from './TimerSubPanel'

const noopAggregate = { totalMs: 0, segmentCount: 0 }

describe('TimerSubPanel', () => {
  it('active:渲染 [⏸ 暂停, ⏹ 完成] 按钮对', () => {
    render(
      <TimerSubPanel
        status="active"
        durationMs={0}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('⏸')).toBeTruthy()
    expect(screen.getByText('⏹')).toBeTruthy()
    expect(screen.queryByText('▶')).toBeNull()
    expect(screen.queryByText('↶')).toBeNull()
  })

  it('paused:渲染 [▶ 继续, ⏹ 完成] 按钮对', () => {
    render(
      <TimerSubPanel
        status="paused"
        durationMs={5000}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('▶')).toBeTruthy()
    expect(screen.getByText('⏹')).toBeTruthy()
    expect(screen.queryByText('⏸')).toBeNull()
  })

  it('done:渲染单按钮 [↶ 撤销]', () => {
    render(
      <TimerSubPanel
        status="done"
        durationMs={5000}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('↶')).toBeTruthy()
    expect(screen.queryByText('⏸')).toBeNull()
    expect(screen.queryByText('⏹')).toBeNull()
  })

  it('副标题显示 "今日累计 X:XX:XX · N 段"', () => {
    render(
      <TimerSubPanel
        status="active"
        durationMs={0}
        aggregate={{ totalMs: 8142000, segmentCount: 3 }}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText(/今日累计.*2:15:42.*3 段/)).toBeTruthy()
  })
})