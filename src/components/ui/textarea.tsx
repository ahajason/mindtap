import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'glass-l1 rounded-[var(--radius-input)] text-sm text-text-1 placeholder:text-text-3 p-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55 resize-none',
  {
    variants: {
      size: {
        sm: 'min-h-12',
        md: 'min-h-20 p-4',
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

type TextareaSize = NonNullable<VariantProps<typeof textareaVariants>['size']>;

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ size, error: !!error }), className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
