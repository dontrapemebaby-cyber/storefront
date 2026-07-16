'use client';
// src/components/ui/select.tsx
// Select dựa trên phần tử <select> gốc: hỗ trợ bàn phím sẵn, và trên điện thoại
// mở đúng bánh xe chọn quen thuộc của hệ điều hành.
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-11 w-full appearance-none rounded-token border bg-canvas pl-3.5 pr-10 text-sm text-ink transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-canvas',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted',
          invalid ? 'border-danger focus:ring-danger' : 'border-line-strong',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
});
