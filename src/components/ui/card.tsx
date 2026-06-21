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
    },
    defaultVariants: {
      tier: 'l1',
    },
  }
);

type CardTier = NonNullable<VariantProps<typeof cardVariants>['tier']>;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tier?: CardTier;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, tier, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ tier }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
