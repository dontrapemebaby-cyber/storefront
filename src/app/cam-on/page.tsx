// src/app/cam-on/page.tsx
// Trang cảm ơn cho yêu cầu KHÔNG cần trả tiền ngay (chờ báo giá).
//
// Việc quan trọng nhất ở đây là làm mã yêu cầu thật nổi bật và copy được: đó là
// thứ duy nhất khách cần giữ để tra cứu sau này.
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Phone, Search } from 'lucide-react';
import { getSiteSettings } from '@/lib/data/settings';
import { Button } from '@/components/ui/button';
import { CopyField } from '@/components/site/copy-field';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Đã nhận yêu cầu',
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ ma?: string }> }) {
  const { ma } = await searchParams;
  const { brand } = await getSiteSettings();
  const code = (ma ?? '').trim().toUpperCase();

  return (
    <div className="container-content py-16 lg:py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
          <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
        </div>

        <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">Đã nhận yêu cầu của bạn</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Nhân viên sẽ kiểm tra file và liên hệ trong 2 giờ làm việc. Bạn không cần làm gì thêm lúc này.
        </p>

        {code && (
          <div className="mt-8 text-left">
            <CopyField label="Mã yêu cầu của bạn" value={code} hint="Lưu lại mã này để tra cứu trạng thái đơn." />
          </div>
        )}

        <div className="mt-8 space-y-3 rounded-token-lg border border-line bg-surface p-5 text-left">
          <h2 className="font-heading text-sm font-semibold">Tiếp theo là gì?</h2>
          <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted">
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              Chúng tôi mở file, kiểm tra xem có in được không.
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              Nhân viên gọi hoặc nhắn Zalo để chốt giá và thời gian trả hàng.
            </li>
            <li className="flex gap-2.5">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              Bạn tra cứu trạng thái bất cứ lúc nào bằng mã yêu cầu và số điện thoại.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {code && (
            <Button asChild>
              <Link href={`/tra-cuu?ma=${encodeURIComponent(code)}`}>
                <Search className="h-4 w-4" aria-hidden />
                Tra cứu đơn này
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/san-pham">Xem sản phẩm khác</Link>
          </Button>
        </div>

        {brand.phone && (
          <p className="mt-8 text-[13px] text-muted">
            Cần gấp?{' '}
            <a href={`tel:${brand.phone}`} className="font-semibold text-primary hover:underline">
              Gọi {brand.phone}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
