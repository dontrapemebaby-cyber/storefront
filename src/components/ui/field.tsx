'use client';
// src/components/ui/field.tsx
// Bọc chung cho một ô nhập: nhãn, mô tả, thông báo lỗi. Nối id/aria-describedby
// để trình đọc màn hình đọc đúng lỗi của đúng ô.
import * as React from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-label="bắt buộc">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-[13px] leading-relaxed text-muted">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
