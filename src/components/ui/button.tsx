import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-base ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-primary to-primary-hover text-white shadow-[0_4px_12px_var(--color-primary-glow)] hover:from-primary-hover hover:to-primary-active hover:shadow-[0_6px_16px_var(--color-primary-glow)] active:scale-[0.97]',
        secondary:
          'glass-l1 text-text-1 hover:bg-white/55',
        ghost:
          'bg-transparent text-text-2 hover:glass-l1',
        icon:
          'glass-l1 rounded-[var(--radius-button)] text-text-1 hover:bg-white/55',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-[var(--radius-button)]',
        md: 'h-10 px-4 text-sm rounded-[var(--radius-button)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
