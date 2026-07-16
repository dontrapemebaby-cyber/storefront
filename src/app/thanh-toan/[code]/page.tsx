// src/app/thanh-toan/[code]/page.tsx
// Trang thanh toán chuyển khoản.
//
// KHÔNG có cổng thanh toán tự động. Khách quét QR bằng app ngân hàng của họ, tự
// chuyển khoản, rồi bấm "Tôi đã chuyển khoản". Nhân viên đối soát sao kê và xác
// nhận trong dashboard. Website không giữ thẻ, không trừ tiền, không biết tiền
// đã vào hay chưa — nói thẳng điều đó với khách thay vì giả vờ tự động.
//
// Số tiền trên trang này lấy từ bản chụp đơn trong CSDL, do server tính lúc tạo
// yêu cầu. Trình duyệt không truyền số tiền vào đây được.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AlertTriangle, Building2, CheckCircle2, Info } from 'lucide-react';
import { getOrder } from '@/lib/data/orders';
import { getSiteSettings } from '@/lib/data/settings';
import { buildVietQrImageUrl, buildVietQrPayload } from '@/lib/vietqr';
import { formatVnd } from '@/lib/utils';
import { REQUEST_STATUS_LABEL } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyField } from '@/components/site/copy-field';
import { PaymentReportButton } from '@/components/site/payment-report-button';
import { ErrorState } from '@/components/ui/states';

// Trạng thái thanh toán đổi liên tục — không được cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thanh toán đơn in',
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ code }, { token }] = await Promise.all([params, searchParams]);
  const requestCode = decodeURIComponent(code).toUpperCase();

  if (!token) notFound();

  const order = await getOrder(requestCode, token);
  if (!order) notFound();

  const { brand, payment } = await getSiteSettings();

  // Đơn không cần trả tiền (chờ báo giá) thì không có gì để hiện ở đây.
  if (order.amountDue <= 0 || order.paymentKind === 'none') {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg">
          <ErrorState
            title="Đơn này chưa cần thanh toán"
            description="Yêu cầu của bạn đang chờ nhân viên báo giá. Chúng tôi sẽ liên hệ trước khi bạn cần trả bất cứ khoản nào."
            action={
              <Button asChild>
                <Link href={`/tra-cuu?ma=${encodeURIComponent(requestCode)}`}>Tra cứu đơn</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const configured = Boolean(payment.bankBin && payment.accountNumber);
  const reference = order.paymentReference ?? requestCode;

  // Chế độ 'emv': tự vẽ QR ngay trên server. Số tài khoản và số tiền của khách
  // không đi qua máy chủ bên thứ ba nào.
  let qrDataUrl: string | null = null;
  let qrImageUrl: string | null = null;

  if (configured) {
    const input = {
      bankBin: payment.bankBin,
      accountNumber: payment.accountNumber,
      amount: order.amountDue,
      description: reference,
    };

    if (payment.mode === 'emv') {
      try {
        qrDataUrl = await QRCode.toDataURL(buildVietQrPayload(input), {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 480,
          color: { dark: '#101114', light: '#FFFFFF' },
        });
      } catch (error) {
        console.error('[thanh-toan] không vẽ được QR:', error);
      }
    } else {
      qrImageUrl = buildVietQrImageUrl(input, payment.accountName);
    }
  }

  const isPaid = order.paymentStatus === 'confirmed';
  const isReported = order.paymentStatus === 'reported';

  return (
    <div className="container-content py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="eyebrow">Bước cuối</p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight sm:text-[34px]">
            {isPaid ? 'Đơn đã thanh toán' : 'Chuyển khoản để vào xưởng'}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {order.paymentKind === 'deposit'
              ? 'Đây là tiền đặt cọc giữ lịch sản xuất. Phần còn lại thanh toán khi nhận hàng.'
              : 'Yêu cầu của bạn đã được ghi nhận. Chuyển khoản xong là chúng tôi đưa vào sản xuất.'}
          </p>
        </header>

        {/* ---- Tóm tắt đơn ---------------------------------------------------- */}
        <div className="mb-6 space-y-4 rounded-token-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">Mã yêu cầu</p>
              <p className="font-heading text-lg font-bold">{order.requestCode}</p>
            </div>
            <Badge variant={isPaid ? 'success' : isReported ? 'warning' : 'primary'}>
              {REQUEST_STATUS_LABEL[order.requestStatus] ?? order.requestStatus}
            </Badge>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-sm font-medium text-ink">{order.productName}</p>

            {order.breakdown?.lines?.length ? (
              <dl className="mt-3 space-y-1.5">
                {order.breakdown.lines.map((line, i) => (
                  <div key={i} className="flex justify-between gap-4 text-[13px]">
                    <dt className="text-muted">{line.label}</dt>
                    <dd className="shrink-0 tabular-nums text-ink">{formatVnd(line.amount)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <span className="text-sm font-semibold text-ink">
                {order.paymentKind === 'deposit' ? 'Cần đặt cọc' : 'Tổng thanh toán'}
              </span>
              <span className="font-heading text-2xl font-bold text-primary tabular-nums">{formatVnd(order.amountDue)}</span>
            </div>
          </div>
        </div>

        {isPaid ? (
          <div className="flex gap-3 rounded-token-lg border border-success/30 bg-success-soft p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold text-success">Nhà in đã nhận được tiền</p>
              <p className="text-[13px] leading-relaxed text-ink/70">
                Đơn của bạn đang chờ vào xưởng. Bạn không cần chuyển thêm lần nào nữa.
              </p>
            </div>
          </div>
        ) : !configured ? (
          <div className="flex gap-3 rounded-token-lg border border-warning/30 bg-warning-soft p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div className="space-y-1">
              <p className="font-semibold text-warning">Chưa cấu hình tài khoản nhận tiền</p>
              <p className="text-[13px] leading-relaxed text-ink/70">
                Vui lòng gọi {brand.phone || 'cho nhà in'} để nhận thông tin chuyển khoản. Yêu cầu{' '}
                {order.requestCode} của bạn vẫn được giữ nguyên.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ---- Mã QR ------------------------------------------------------ */}
            <div className="rounded-token-lg border border-line bg-canvas p-5 lg:p-7">
              <div className="grid gap-7 sm:grid-cols-[auto_1fr] sm:items-start">
                <figure className="mx-auto space-y-2 text-center">
                  <div className="trim-marks inline-block rounded-token border border-line bg-white p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl ?? qrImageUrl ?? ''}
                      alt={`Mã QR chuyển khoản ${formatVnd(order.amountDue)} tới ${payment.accountName}`}
                      width={200}
                      height={200}
                      className="h-[200px] w-[200px] object-contain"
                    />
                  </div>
                  <figcaption className="text-[12px] text-muted-soft">Quét bằng app ngân hàng</figcaption>
                </figure>

                <div className="space-y-4">
                  <p className="flex gap-2 text-[13px] leading-relaxed text-muted">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Mã QR đã điền sẵn số tiền và nội dung. Nếu app không quét được, nhập tay theo thông tin bên dưới.
                  </p>

                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-soft" aria-hidden />
                      <span className="font-medium text-ink">{payment.bankName || 'Ngân hàng'}</span>
                      {payment.branch && <span className="text-muted">— {payment.branch}</span>}
                    </div>

                    <CopyField label="Số tài khoản" value={payment.accountNumber} />
                    <CopyField label="Chủ tài khoản" value={payment.accountName} />
                    <CopyField label="Số tiền" value={String(order.amountDue)} emphasis />
                    <CopyField
                      label="Nội dung chuyển khoản"
                      value={reference}
                      hint="Ghi đúng nội dung này để nhân viên đối soát được đơn của bạn."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Nói thật về việc đối soát ---------------------------------- */}
            <div className="mt-6 flex gap-3 rounded-token-lg border border-line bg-surface p-5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
              <p className="text-[13px] leading-relaxed text-muted">
                Website không tự nhận biết tiền đã vào. Sau khi chuyển khoản, bấm nút bên dưới để nhân viên kiểm tra sao
                kê và xác nhận. Thường mất 15–30 phút trong giờ làm việc.
              </p>
            </div>

            <div className="mt-5">
              <PaymentReportButton code={order.requestCode} token={token} alreadyReported={isReported} />
            </div>
          </>
        )}

        {payment.note && !isPaid && (
          <p className="mt-5 rounded-token border border-line bg-surface p-3.5 text-[13px] leading-relaxed text-muted">
            {payment.note}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href={`/tra-cuu?ma=${encodeURIComponent(order.requestCode)}`}>Tra cứu trạng thái đơn</Link>
          </Button>
          {brand.phone && (
            <Button asChild variant="ghost">
              <a href={`tel:${brand.phone}`}>Gọi {brand.phone}</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
