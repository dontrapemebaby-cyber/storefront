// src/components/ui/states.tsx
// Trạng thái rỗng và trạng thái lỗi.
//
// Nguyên tắc viết: nói chuyện gì đã xảy ra và làm gì tiếp theo. Không xin lỗi,
// không nói mơ hồ kiểu "Đã có lỗi xảy ra".
import * as React from 'react';
import { AlertTriangle, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, className, icon }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-token-lg border border-dashed border-line-strong px-6 py-14 text-center', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-strong text-muted">
        {icon ?? <SearchX className="h-5 w-5" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className="font-heading text-base font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-token-lg border border-danger/25 bg-danger-soft px-6 py-12 text-center', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-base font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Dải báo lỗi gọn, đặt ngay trong form. */
export function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-token border border-danger/25 bg-danger-soft p-3.5 text-[13px] leading-relaxed text-danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
