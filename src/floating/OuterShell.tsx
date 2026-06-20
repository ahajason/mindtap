// src/floating/OuterShell.tsx
import LiquidGlass from 'liquid-glass-react'
import type { ReactNode } from 'react'

interface Props {
  isExpanded: boolean
  children: ReactNode
}

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  return 'WebGLRenderingContext' in window
}

export function OuterShell({ isExpanded, children }: Props) {
  // R2 防御:折叠态完全不用 LiquidGlass。
  // liquid-glass-react 在 WKWebView 折叠态有 3 个已知坑:
  //   1) 内部 WebGL canvas 默认 270x69 (dist/index.esm.js:209) absolute 定位,
  //      浮在 children 之上,在 WKWebView 折叠态小尺寸 (320x36) 渲染异常
  //   2) GlassContainer 是 inline-flex,折叠态 auto-size 在 0 高度的 root
  //      里变成 0x0,children 看不见
  //   3) WebGL shader 编译失败时仍显示透明 canvas,遮住 children 但不显示
  // 展开态才用 LiquidGlass(WebGL 折射效果在 360x280 才有视觉价值)。
  if (!isExpanded || !hasWebGL()) {
    return (
      <div
        data-outer-shell="fallback"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <LiquidGlass
      displacementScale={isExpanded ? 96 : 64}
      blurAmount={isExpanded ? 0.15 : 0.1}
      saturation={isExpanded ? 1.6 : 1.4}
      aberrationIntensity={isExpanded ? 4 : 3}
      elasticity={isExpanded ? 0.35 : 0.0}
      mode={isExpanded ? 'polar' : 'standard'}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {children}
    </LiquidGlass>
  )
}
