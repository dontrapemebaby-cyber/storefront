'use client';
// src/components/ui/checkbox.tsx
import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-[5px] border-2 border-line-strong transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg',
        'aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/** Checkbox kèm nhãn dài — dùng cho các ô xác nhận điều khoản. */
export function CheckboxField({ id, checked, onCheckedChange, error, disabled, children }: CheckboxFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5"
        />
        <label htmlFor={id} className="cursor-pointer text-[13px] leading-relaxed text-muted">
          {children}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="pl-8 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
