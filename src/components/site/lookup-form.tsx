'use client';
// src/components/site/lookup-form.tsx
// Tra cứu đơn bằng mã yêu cầu + số điện thoại.
//
// Bắt buộc cả hai vì mã có dạng RFQ-202607-00001 — đoán được. Số điện thoại là
// thứ chỉ chủ đơn biết. Server kiểm tra khớp, phía này chỉ dựng giao diện.
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { InlineError } from '@/components/ui/states';
import { REQUEST_STATUS_HINT, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, type StatusTone } from '@/lib/constants';
import { formatDateTime, formatVnd } from '@/lib/utils';

interface LookupResult {
  code: string;
  status: string;
  productName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  amountDue: number;
  paymentKind: string;
  paymentStatus: string;
  quoteTotal: number | null;
  quoteValidUntil: string | null;
}

const TONE_VARIANT: Record<StatusTone, 'neutral' | 'primary' | 'warning' | 'success' | 'danger'> = {
  neutral: 'neutral',
  progress: 'primary',
  action: 'warning',
  success: 'success',
  danger: 'danger',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  awaiting: 'Chờ thanh toán',
  reported: 'Bạn đã báo chuyển khoản, đang đối soát',
  confirmed: 'Đã nhận tiền',
  cancelled: 'Đã hủy',
};

export function LookupForm() {
  const params = useSearchParams();

  const [code, setCode] = React.useState(params.get('ma') ?? '');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<LookupResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), phone: phone.trim() }),
      });

      const body = (await res.json()) as { error?: string; code?: string; result?: LookupResult };
      if (!res.ok || !body.result) {
        setError(body.error ?? 'Không tra cứu được. Vui lòng thử lại.');
        return;
      }
      setResult(body.result);
    } catch {
      setError('Mất kết nối. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  }

  const tone = result ? REQUEST_STATUS_TONE[result.status] ?? 'neutral' : 'neutral';
  const canPay = result && result.amountDue > 0 && result.paymentStatus !== 'confirmed';

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-token-lg border border-line bg-canvas p-5 lg:p-7">
        <Field label="Mã yêu cầu" htmlFor="lookup-code" required hint="Mã có trong tin nhắn xác nhận, dạng RFQ-202607-00001.">
          <Input
            id="lookup-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="RFQ-202607-00001"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Field label="Số điện thoại đã dùng khi đặt" htmlFor="lookup-phone" required>
          <Input
            id="lookup-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            autoComplete="tel"
          />
        </Field>

        {error && <InlineError>{error}</InlineError>}

        <Button type="submit" size="lg" full loading={loading} disabled={loading}>
          <Search className="h-4 w-4" aria-hidden />
          Tra cứu
        </Button>
      </form>

      {result && (
        <div className="space-y-5 rounded-token-lg border border-line bg-canvas p-5 lg:p-7" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">Mã yêu cầu</p>
              <p className="font-heading text-lg font-bold">{result.code}</p>
            </div>
            <Badge variant={TONE_VARIANT[tone]}>{REQUEST_STATUS_LABEL[result.status] ?? result.status}</Badge>
          </div>

          <p className="text-[13px] leading-relaxed text-muted">
            {REQUEST_STATUS_HINT[result.status] ?? 'Nhân viên đang xử lý yêu cầu của bạn.'}
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Row label="Sản phẩm" value={result.productName} />
            <Row label="Số lượng" value={result.quantity.toLocaleString('vi-VN')} />
            <Row label="Ngày gửi" value={formatDateTime(result.createdAt)} />
            <Row label="Cập nhật gần nhất" value={formatDateTime(result.updatedAt)} />

            {result.quoteTotal !== null && (
              <Row label="Báo giá của nhà in" value={formatVnd(result.quoteTotal)} emphasis />
            )}
            {result.quoteValidUntil && <Row label="Báo giá có hiệu lực tới" value={formatDateTime(result.quoteValidUntil)} />}
            {result.amountDue > 0 && (
              <>
                <Row
                  label={result.paymentKind === 'deposit' ? 'Tiền cọc' : 'Số tiền cần trả'}
                  value={formatVnd(result.amountDue)}
                  emphasis
                />
                <Row label="Tình trạng thanh toán" value={PAYMENT_STATUS_LABEL[result.paymentStatus] ?? result.paymentStatus} />
              </>
            )}
          </dl>

          {canPay && (
            <Button asChild full size="lg">
              <Link href={`/thanh-toan/${encodeURIComponent(result.code)}`}>
                <CreditCard className="h-4 w-4" aria-hidden />
                Xem mã QR thanh toán
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">{label}</dt>
      <dd className={emphasis ? 'font-heading text-base font-bold text-primary' : 'text-[14px] text-ink'}>{value}</dd>
    </div>
  );
}
