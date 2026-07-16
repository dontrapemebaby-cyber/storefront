// src/components/ui/progress.tsx
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0–100. */
  value: number;
  label?: string;
  tone?: 'primary' | 'success' | 'danger';
  className?: string;
}

export function ProgressBar({ value, label, tone = 'primary', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Tiến độ tải lên'}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-200 ease-out',
          tone === 'primary' && 'bg-primary',
          tone === 'success' && 'bg-success',
          tone === 'danger' && 'bg-danger',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
