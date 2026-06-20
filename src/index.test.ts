// src/index.test.ts
// D-10 玻璃配方契约:src/index.css @theme 块的关键值必须与 spec 对齐
// v3.1 配方:α=0.22 (L1) / 0.30 (L3) / 0.72 (fb) / 0.28 (legacy) / blur 24 / saturate 140% / brightness 104%
// 这些值由 `npm run build` 编译 + Playwright 视觉回归双层验证
// 此处做契约级断言(防止 spec 漂移不被发现)
import { describe, it, expect } from 'vitest'
import indexCss from './index.css?raw'

describe('src/index.css · D-10 玻璃配方契约', () => {
  // 4 个 variant 的 α
  it('L1 variant: oklch α=0.22 (清透基线)', () => {
    expect(indexCss).toMatch(/--color-glass-L1:\s*oklch\([^)]*\/\s*0\.22\s*\)/)
  })
  it('L3 variant: oklch α=0.30 (内层加深)', () => {
    expect(indexCss).toMatch(/--color-glass-L3:\s*oklch\([^)]*\/\s*0\.30\s*\)/)
  })
  it('fb variant: oklch α=0.72 (Windows fallback / D-01 B-2)', () => {
    expect(indexCss).toMatch(/--color-glass-fb:\s*oklch\([^)]*\/\s*0\.72\s*\)/)
  })
  it('legacy variant: oklch α=0.28 (旧版兼容)', () => {
    expect(indexCss).toMatch(/--color-glass-legacy:\s*oklch\([^)]*\/\s*0\.28\s*\)/)
  })

  // backdrop utilities(D-10 v3.1)
  it('backdrop-blur: 24px(展开态主玻璃)', () => {
    expect(indexCss).toMatch(/--backdrop-blur-glass:\s*24px/)
  })
  it('backdrop-blur legacy: 16px(向下兼容)', () => {
    expect(indexCss).toMatch(/--backdrop-blur-glass-legacy:\s*16px/)
  })
  it('backdrop-saturate: 140%(v3.1 推清透)', () => {
    expect(indexCss).toMatch(/--backdrop-saturate-glass:\s*140%/)
  })
  it('backdrop-brightness: 104%(v3.1 提亮补偿)', () => {
    expect(indexCss).toMatch(/--backdrop-brightness-glass:\s*104%/)
  })

  // StatusDot 3 态呼吸 v6 颜色(D-09)
  it('StatusDot 3 态颜色契约(active 绿 / paused 橙 / done 灰)', () => {
    expect(indexCss).toMatch(/--color-status-active:\s*#5BCBA0/i)
    expect(indexCss).toMatch(/--color-status-paused:\s*#F5A623/i)
    expect(indexCss).toMatch(/--color-status-done:\s*#98A2B3/i)
  })

  // 圆角
  it('圆角契约: --radius-glass-sm 16px / lg 20px', () => {
    expect(indexCss).toMatch(/--radius-glass-sm:\s*16px/)
    expect(indexCss).toMatch(/--radius-glass-lg:\s*20px/)
  })
})
