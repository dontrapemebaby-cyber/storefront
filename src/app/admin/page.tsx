// src/app/admin/page.tsx
import type * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Package, Palette, Wallet } from 'lucide-react';
import { guardAdminPage } from '@/lib/admin/guard';
import { getSiteSettings } from '@/lib/data/settings';
import { getAllProductsForAdmin } from '@/lib/data/products';
import { AdminShell } from '@/components/admin/admin-shell';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tổng quan' };

export default async function AdminHomePage() {
  await guardAdminPage();

  const [settings, products] = await Promise.all([getSiteSettings(), getAllProductsForAdmin()]);

  const published = products.filter((p) => p.isPublished);
  const paymentReady = Boolean(settings.payment.bankBin && settings.payment.accountNumber && settings.payment.accountName);
  const fixedPriceCount = published.filter((p) => p.pricingType === 'FIXED_PRICE').length;

  return (
    <AdminShell
      title="Tổng quan"
      description="Tình trạng website khách hàng."
      current="/admin"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Sản phẩm đang hiện" value={String(published.length)} hint={`${products.length} sản phẩm tổng cộng`} />
        <Stat label="Có bảng giá sẵn" value={String(fixedPriceCount)} hint="Khách thấy giá và trả tiền ngay" />
        <Stat label="Cần báo giá" value={String(published.length - fixedPriceCount)} hint="Nhân viên gọi lại chốt giá" />
      </div>

      {/* Cảnh báo cấu hình dở dang — thứ dễ quên nhất và hỏng nặng nhất. */}
      {!paymentReady && (
        <div className="mb-6 flex gap-3 rounded-token-lg border border-warning/30 bg-warning-soft p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div className="space-y-1.5">
            <p className="font-semibold text-warning">Chưa cấu hình tài khoản nhận tiền</p>
            <p className="text-[13px] leading-relaxed text-ink/70">
              Khách đặt sản phẩm có giá sẵn sẽ không thấy mã QR, chỉ thấy lời nhắn gọi cho nhà in. Yêu cầu của họ vẫn được
              ghi nhận bình thường.
            </p>
            <Link href="/admin/payment-settings" className="inline-flex items-center gap-1 text-[13px] font-semibold text-warning hover:underline">
              Cấu hình ngay
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {published.length === 0 && (
        <div className="mb-6 flex gap-3 rounded-token-lg border border-warning/30 bg-warning-soft p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div className="space-y-1.5">
            <p className="font-semibold text-warning">Chưa có sản phẩm nào hiển thị</p>
            <p className="text-[13px] leading-relaxed text-ink/70">
              Trang sản phẩm đang trống. Nạp dữ liệu mẫu bằng file <code>supabase/seed/storefront_seed.sql</code>, hoặc
              tự thêm sản phẩm.
            </p>
          </div>
        </div>
      )}

      {paymentReady && published.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-token-lg border border-success/25 bg-success-soft p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="font-semibold text-success">Website đang chạy đầy đủ</p>
            <p className="text-[13px] leading-relaxed text-ink/70">
              Khách xem được sản phẩm, gửi file và thanh toán. Nhớ đối soát sao kê cho các đơn ở trạng thái “đã báo
              chuyển khoản” trong dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <NavCard
          href="/admin/site-settings"
          icon={<Palette className="h-5 w-5" aria-hidden />}
          title="Giao diện & nội dung"
          description="Đổi tên nhà in, màu sắc, chữ trên trang chủ."
        />
        <NavCard
          href="/admin/products"
          icon={<Package className="h-5 w-5" aria-hidden />}
          title="Sản phẩm"
          description="Thêm, sửa, ẩn/hiện sản phẩm."
        />
        <NavCard
          href="/admin/payment-settings"
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          title="Thanh toán"
          description="Số tài khoản và cách sinh mã QR."
        />
      </div>

      <div className="mt-6 rounded-token-lg border border-line bg-canvas p-5">
        <h2 className="font-heading text-base font-bold">Những việc website KHÔNG làm</h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
          <li>
            <Badge variant="outline">Đơn hàng</Badge> Yêu cầu in, báo giá và trạng thái đơn nằm ở dashboard. Website chỉ
            tạo yêu cầu rồi để dashboard xử lý.
          </li>
          <li>
            <Badge variant="outline">Thanh toán</Badge> Không có cổng thanh toán tự động. Khách bấm “đã chuyển khoản” chỉ
            là <em>lời báo</em> — phải mở sao kê đối soát rồi xác nhận trong dashboard.
          </li>
          <li>
            <Badge variant="outline">Tài khoản</Badge> Thêm nhân viên và phân quyền làm ở dashboard. Website dùng chung
            tài khoản đó.
          </li>
        </ul>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-token-lg border border-line bg-canvas p-5">
      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-muted">{hint}</p>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-token-lg border border-line bg-canvas p-5 transition-colors hover:border-primary"
    >
      <span className="inline-flex rounded-token bg-primary/10 p-2.5 text-primary">{icon}</span>
      <p className="mt-3 font-heading text-sm font-bold group-hover:text-primary">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
    </Link>
  );
}
