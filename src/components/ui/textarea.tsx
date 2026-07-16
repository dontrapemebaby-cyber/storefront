'use client';
// src/components/ui/textarea.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-y rounded-token border bg-canvas px-3.5 py-2.5 text-sm leading-relaxed text-ink transition-colors',
        'placeholder:text-muted-soft',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted',
        invalid ? 'border-danger focus:ring-danger' : 'border-line-strong',
        className,
      )}
      {...props}
    />
  );
});
