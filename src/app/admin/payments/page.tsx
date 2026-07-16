import type { Metadata } from 'next';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { guardAdminPage } from '@/lib/admin/guard';
import { getAdminPayments } from '@/lib/data/payments';
import { formatVnd } from '@/lib/utils';
import { AdminShell } from '@/components/admin/admin-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { setPaymentStatusAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Đối soát thanh toán' };

const LABEL = {
  awaiting: 'Chờ khách chuyển',
  reported: 'Khách báo đã chuyển',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
} as const;

export default async function AdminPaymentsPage() {
  await guardAdminPage();
  const payments = await getAdminPayments();

  return (
    <AdminShell
      title="Đối soát thanh toán"
      description="Khách bấm “Tôi đã chuyển khoản” chỉ tạo trạng thái chờ đối soát. Chỉ xác nhận sau khi bạn kiểm tra sao kê ngân hàng."
      current="/admin/payments"
    >
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="rounded-token-lg border border-line bg-surface p-8 text-center text-sm text-muted">
            Chưa có giao dịch cần đối soát.
          </div>
        ) : (
          payments.map((payment) => (
            <article key={payment.id} className="rounded-token-lg border border-line bg-canvas p-5 shadow-token">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-bold">{payment.requestCode}</h2>
                    <Badge
                      variant={
                        payment.paymentStatus === 'confirmed'
                          ? 'success'
                          : payment.paymentStatus === 'reported'
                            ? 'warning'
                            : payment.paymentStatus === 'cancelled'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {LABEL[payment.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink">{payment.productName}</p>
                  <p className="text-[13px] text-muted">
                    {payment.customerName} · {payment.customerPhone}
                  </p>
                  {payment.paymentReference ? (
                    <p className="text-[12px] text-muted-soft">Nội dung CK: {payment.paymentReference}</p>
                  ) : null}
                </div>
                <p className="font-heading text-xl font-bold text-primary tabular-nums">{formatVnd(payment.amountDue)}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <form action={setPaymentStatusAction}>
                  <input type="hidden" name="orderId" value={payment.id} />
                  <input type="hidden" name="status" value="confirmed" />
                  <Button type="submit" size="sm" disabled={payment.paymentStatus === 'confirmed'}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Xác nhận đã nhận tiền
                  </Button>
                </form>
                <form action={setPaymentStatusAction}>
                  <input type="hidden" name="orderId" value={payment.id} />
                  <input type="hidden" name="status" value="reported" />
                  <Button type="submit" size="sm" variant="outline" disabled={payment.paymentStatus === 'reported'}>
                    <Clock3 className="h-4 w-4" aria-hidden />
                    Chờ đối soát
                  </Button>
                </form>
                <form action={setPaymentStatusAction}>
                  <input type="hidden" name="orderId" value={payment.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <Button type="submit" size="sm" variant="ghost" disabled={payment.paymentStatus === 'cancelled'}>
                    <XCircle className="h-4 w-4" aria-hidden />
                    Hủy thanh toán
                  </Button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </AdminShell>
  );
}
