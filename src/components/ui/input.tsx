'use client';
// src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-token border bg-canvas px-3.5 text-sm text-ink transition-colors',
        'placeholder:text-muted-soft',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted',
        invalid ? 'border-danger focus:ring-danger' : 'border-line-strong hover:border-line-strong',
        className,
      )}
      {...props}
    />
  );
});
