import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('text-sm font-medium text-text-1', className)} {...props}>
      {children}
      {required && <span className="text-[var(--color-error)] ml-1">*</span>}
    </label>
  );
}
