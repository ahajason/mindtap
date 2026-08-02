import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-[var(--radius-card)] transition-all duration-base ease-[var(--ease-out)]',
  {
    variants: {
      tier: { l1: 'glass-l1', l2: 'glass-l2', l3: 'glass-l3' },
      padding: {
        none: '',
        sm: 'p-[var(--spacing-3)]',
        md: 'p-[var(--spacing-4)]',
        lg: 'p-[var(--spacing-6)]',
      },
    },
    defaultVariants: { tier: 'l1', padding: 'md' },
  }
);

type CardTier = NonNullable<VariantProps<typeof cardVariants>['tier']>;
type CardPadding = NonNullable<VariantProps<typeof cardVariants>['padding']>;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tier?: CardTier;
  padding?: CardPadding;
}

export function Card({ className, tier, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tier, padding }), className)} {...props} />;
}
