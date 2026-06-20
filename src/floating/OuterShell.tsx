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
  if (!hasWebGL()) {
    // 降级:无折射,纯 div
    return <div style={{ borderRadius: 16, overflow: 'hidden' }}>{children}</div>
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
