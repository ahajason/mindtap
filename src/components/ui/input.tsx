import type { InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 cursor-text transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white/55 disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-text',
  {
    variants: {
      size: { sm: 'h-9', md: 'h-10 px-4' },
      error: { true: 'border-[var(--color-error)]', false: '' },
    },
    defaultVariants: { size: 'md', error: false },
  }
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>['size']>;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
}

export function Input({ className, size, error, ...props }: InputProps) {
  return (
    <input className={cn(inputVariants({ size, error: !!error }), className)} {...props} />
  );
}
