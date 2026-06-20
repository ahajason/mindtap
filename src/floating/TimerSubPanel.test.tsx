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

  // D-14 / §6.4 spec: Timer hero 必须 56px(font-bold + tabular-nums + tracking-[-0.02em])
  // 注:jsdom 不解析 Tailwind 任意值 class,getComputedStyle 在 vitest 不可靠
  // 验证契约(className 包含 spec 类)+ 视觉回归(Playwright)双层覆盖
  it('D-14 hero 使用 56px 契约(className 含 spec 类)', () => {
    render(
      <TimerSubPanel
        status="active"
        durationMs={0}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    const hero = screen.getByLabelText('已专注 00:00')
    expect(hero).toBeTruthy()
    // 56px 契约
    expect(hero.className).toMatch(/text-\[56px\]/)
    // font-bold 契约
    expect(hero.className).toMatch(/font-bold/)
    // tabular-nums 契约
    expect(hero.className).toMatch(/tabular-nums/)
    // tracking-[-0.02em] 契约
    expect(hero.className).toMatch(/tracking-\[-0\.02em\]/)
    // leading-none 契约(hero 紧凑,不留行高空隙)
    expect(hero.className).toMatch(/leading-none/)
  })
})