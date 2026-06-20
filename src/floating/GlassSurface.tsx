// src/floating/GlassSurface.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import type { HTMLAttributes, ReactNode } from 'react'

const glass = cva(
  [
    'rounded-glass-sm',
    'backdrop-blur-glass',
    'backdrop-saturate-glass',
    'backdrop-brightness-glass',
    'border',
  ],
  {
    variants: {
      variant: {
        L1: 'bg-glass-L1 border-glass-border-L1',
        L3: 'bg-glass-L3 border-glass-border-L3 rounded-glass-lg',
        fb: 'bg-glass-fb border-glass-border-fb',
        legacy: 'bg-glass-legacy backdrop-blur-glass-legacy backdrop-saturate-glass-legacy',
      },
    },
    defaultVariants: { variant: 'L1' },
  }
)

type GlassVariant = 'L1' | 'L3' | 'fb' | 'legacy'

interface GlassSurfaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof glass> {
  children?: ReactNode
}

export function GlassSurface({ variant, className, children, ...rest }: GlassSurfaceProps) {
  return (
    <div className={twMerge(glass({ variant: variant as GlassVariant }), className)} {...rest}>
      {children}
    </div>
  )
}