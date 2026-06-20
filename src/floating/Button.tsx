// src/floating/Button.tsx
import { twMerge } from 'tailwind-merge'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Size = 'icon-sm' | 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
}

const sizeClass: Record<Size, string> = {
  'icon-sm': 'h-6 w-6 rounded-md',
  sm: 'h-8 px-3 rounded-md text-sm',
  md: 'h-10 px-4 rounded-md text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'md', className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        data-no-expand  // 短路 FloatShell 的拖动/展开
        className={twMerge(
          // B 方案:ghost α=0.15 + hover α=0.55 + scale 0.96 active
          'inline-flex items-center justify-center gap-1.5',
          'bg-white/15 hover:bg-white/55',
          'text-ink-900 dark:text-ink-100',
          'transition-colors duration-200',
          'active:scale-[0.96]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          sizeClass[size],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'