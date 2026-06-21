import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-[var(--radius-card)] transition-all duration-base ease-[var(--ease-out)]',
  {
    variants: {
      tier: {
        l1: 'glass-l1',
        l2: 'glass-l2',
        l3: 'glass-l3',
      },
      padding: {
        none: '',
        sm: 'p-[var(--spacing-3)]',
        md: 'p-[var(--spacing-4)]',
        lg: 'p-[var(--spacing-6)]',
      },
    },
    defaultVariants: {
      tier: 'l1',
      padding: 'md',
    },
  }
);

type CardTier = NonNullable<VariantProps<typeof cardVariants>['tier']>;
type CardPadding = NonNullable<VariantProps<typeof cardVariants>['padding']>;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tier?: CardTier;
  padding?: CardPadding;
}

/**
 * Card — 玻璃容器组件
 *
 * V0.1.2 新增 padding prop,默认 md=16px(spacing-4)
 * - 解决 P1-spacing/03 Card 内部 padding 不一致问题
 * - spec: 1-design/01-glass-layer-rules.md §三 嵌套规则 + Apple HIG Container
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, tier, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ tier, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';