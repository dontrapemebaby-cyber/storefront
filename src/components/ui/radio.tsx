'use client';
// src/components/ui/radio.tsx
// Radio dạng thẻ bấm được cả khối — dễ bấm trên điện thoại hơn nhiều so với
// chấm tròn 16px. Dùng input radio thật nên bàn phím mũi tên vẫn chạy đúng.
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  /** Chú thích bên phải, thường là chênh lệch giá. */
  meta?: string;
  disabled?: boolean;
}

interface RadioCardGroupProps {
  name: string;
  value: string | undefined;
  options: RadioCardOption[];
  onChange: (value: string) => void;
  columns?: 1 | 2;
  invalid?: boolean;
}

export function RadioCardGroup({ name, value, options, onChange, columns = 1, invalid }: RadioCardGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2')}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const checked = value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'group relative flex cursor-pointer items-start gap-3 rounded-token border p-3.5 transition-all',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
              checked ? 'border-primary bg-primary/[0.04]' : 'border-line-strong hover:border-line-strong hover:bg-surface',
              option.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                checked ? 'border-primary' : 'border-line-strong group-hover:border-muted',
              )}
              style={{ height: '18px', width: '18px' }}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              {option.description && <span className="mt-0.5 block text-[13px] text-muted">{option.description}</span>}
            </span>

            {option.meta && <span className="shrink-0 text-[13px] font-medium text-muted">{option.meta}</span>}
          </label>
        );
      })}
    </div>
  );
}
