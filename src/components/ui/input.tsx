import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55',
  {
    variants: {
      size: {
        sm: 'h-9',
        md: 'h-10 px-4',
      },
      error: {
        true: 'border-[var(--color-error)]',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>['size']>;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ size, error: !!error }), className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';