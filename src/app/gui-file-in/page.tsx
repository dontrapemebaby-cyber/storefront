// src/app/gui-file-in/page.tsx
// Trang gửi file / yêu cầu báo giá. Khách tự chọn sản phẩm.
import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { getPublishedProducts } from '@/lib/data/products';
import { maxUploadBytes, turnstileEnv } from '@/lib/env';
import { OrderForm } from '@/components/forms/order-form';
import { EmptyState } from '@/components/ui/states';
import { formatBytes } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Gửi file in',
  description: 'Tải file thiết kế lên, nhận mã yêu cầu ngay và được báo giá trong 2 giờ làm việc.',
  alternates: { canonical: '/gui-file-in' },
};

const NOTES = [
  'File được lưu ở kho riêng, chỉ nhân viên nhà in mở được.',
  'Chưa có file vẫn gửi yêu cầu được — chúng tôi hỗ trợ thiết kế.',
];

export default async function SendFilePage() {
  const products = await getPublishedProducts();
  const limit = maxUploadBytes();

  return (
    <div className="container-content py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 space-y-3">
          <p className="eyebrow">Gửi yêu cầu</p>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">Gửi file in</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Điền thông số, tải file lên và gửi. Bạn nhận mã yêu cầu ngay để tra cứu bất cứ lúc nào.
          </p>

          <ul className="grid gap-2 pt-2 sm:grid-cols-3">
            {[`Nhận PNG, JPG, PDF, SVG, ZIP — mỗi file tối đa ${formatBytes(limit)}.`, ...NOTES].map((note) => (
              <li key={note} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {note}
              </li>
            ))}
          </ul>
        </header>

        {products.length ? (
          <div className="rounded-token-lg border border-line bg-canvas p-5 lg:p-8">
            <OrderForm products={products} turnstileSiteKey={turnstileEnv().siteKey || undefined} maxBytes={limit} />
          </div>
        ) : (
          <EmptyState
            title="Chưa nhận yêu cầu qua website"
            description="Danh sách sản phẩm đang được cập nhật. Vui lòng gọi cho nhà in để gửi file trực tiếp."
          />
        )}
      </div>
    </div>
  );
}
