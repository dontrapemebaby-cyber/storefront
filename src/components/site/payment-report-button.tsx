'use client';
// src/components/site/payment-report-button.tsx
// Nút "Tôi đã chuyển khoản".
//
// Đây là lời báo của khách, KHÔNG phải xác nhận đã nhận tiền. Nút chỉ báo cho
// nhân viên biết cần mở sao kê ra đối soát. Chữ trên nút phải nói đúng điều đó —
// hứa "đã thanh toán thành công" trong khi tiền chưa vào là lừa khách.
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/states';

export function PaymentReportButton({
  code,
  token,
  alreadyReported,
}: {
  code: string;
  token: string;
  alreadyReported: boolean;
}) {
  const router = useRouter();
  const [reported, setReported] = React.useState(alreadyReported);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function report() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, token }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Không ghi nhận được. Vui lòng gọi cho nhà in.');
        return;
      }

      setReported(true);
      router.refresh();
    } catch {
      setError('Mất kết nối. Vui lòng thử lại hoặc gọi cho nhà in.');
    } finally {
      setLoading(false);
    }
  }

  if (reported) {
    return (
      <div className="flex gap-3 rounded-token-lg border border-primary/25 bg-primary/5 p-5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold text-ink">Đã ghi nhận báo chuyển khoản</p>
          <p className="text-[13px] leading-relaxed text-muted">
            Nhân viên đang đối soát sao kê. Khi xác nhận xong, trạng thái đơn sẽ đổi thành “Đã thanh toán” — bạn xem
            được ở trang tra cứu. Bạn không cần chuyển thêm lần nào.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={report} loading={loading} disabled={loading} size="lg" full>
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Tôi đã chuyển khoản
      </Button>
      {error && <InlineError>{error}</InlineError>}
    </div>
  );
}
