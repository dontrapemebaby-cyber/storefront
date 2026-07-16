// src/components/ui/price-summary.tsx
import { formatVnd } from '@/lib/utils';
import type { PriceBreakdown } from '@/types/storefront';
import { cn } from '@/lib/utils';

interface PriceSummaryProps {
  breakdown: PriceBreakdown | null;
  /** Trạng thái đang tính lại giá sau khi khách đổi lựa chọn. */
  loading?: boolean;
  /** Thông báo thay cho giá, ví dụ khi thiếu thông số. */
  message?: string;
  className?: string;
}

export function PriceSummary({ breakdown, loading, message, className }: PriceSummaryProps) {
  return (
    <div className={cn('rounded-token-lg border border-line bg-surface p-4', className)} aria-live="polite">
      {loading && (
        <div className="space-y-2.5" aria-label="Đang tính giá">
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="skeleton h-6 w-1/2 rounded" />
        </div>
      )}

      {!loading && message && <p className="text-sm text-muted">{message}</p>}

      {!loading && !message && breakdown && (
        <>
          {breakdown.lines.length > 0 && (
            <dl className="space-y-2 border-b border-line pb-3">
              {breakdown.lines.map((line, i) => (
                <div key={i} className="flex items-start justify-between gap-4 text-[13px]">
                  <dt className="text-muted">{line.label}</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-ink">
                    {line.amount === 0 ? '—' : formatVnd(line.amount)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex items-end justify-between gap-4 pt-3">
            <span className="text-sm font-medium text-muted">
              {breakdown.paymentKind === 'deposit' ? 'Cần đặt cọc' : 'Tổng tiền'}
            </span>
            <span className="font-heading text-2xl font-bold tabular-nums text-ink">
              {formatVnd(breakdown.paymentKind === 'deposit' ? breakdown.amountDue : breakdown.total)}
            </span>
          </div>

          {breakdown.paymentKind === 'deposit' && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Phần còn lại được báo sau khi nhân viên khảo sát và chốt phương án.
            </p>
          )}
        </>
      )}
    </div>
  );
}
