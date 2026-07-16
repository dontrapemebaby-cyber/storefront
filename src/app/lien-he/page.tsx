// src/app/lien-he/page.tsx
// Trang liên hệ.
//
// Cố ý KHÔNG có form liên hệ chung. Khách cần báo giá thì /gui-file-in đã có form
// đầy đủ và tạo được yêu cầu có mã tra cứu. Thêm một form "gửi tin nhắn" nữa chỉ
// tạo ra kênh thứ hai không ai theo dõi, và tin của khách rơi vào khoảng không.
import type * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, MapPin, MessageCircle, Phone, Upload } from 'lucide-react';
import { getSiteSettings } from '@/lib/data/settings';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Gọi, nhắn Zalo hoặc tới trực tiếp xưởng in.',
  alternates: { canonical: '/lien-he' },
};

export default async function ContactPage() {
  const { brand } = await getSiteSettings();
  const zaloNumber = brand.zalo.replace(/\D/g, '') || brand.phone.replace(/\D/g, '');

  return (
    <div className="container-content py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 space-y-3">
          <p className="eyebrow">Liên hệ</p>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">Nói chuyện với nhà in</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Cần báo giá thì gửi file là nhanh nhất — bạn có mã tra cứu ngay. Cần hỏi trước thì gọi hoặc nhắn Zalo.
          </p>
        </header>

        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {brand.phone && (
            <ContactCard
              icon={<Phone className="h-5 w-5" aria-hidden />}
              label="Gọi điện"
              value={brand.phone}
              href={`tel:${brand.phone}`}
              hint="Nhanh nhất trong giờ làm việc."
            />
          )}
          {zaloNumber && (
            <ContactCard
              icon={<MessageCircle className="h-5 w-5" aria-hidden />}
              label="Zalo"
              value={brand.zalo || brand.phone}
              href={`https://zalo.me/${zaloNumber}`}
              hint="Gửi ảnh mẫu, hỏi nhanh."
              external
            />
          )}
          {brand.email && (
            <ContactCard
              icon={<Mail className="h-5 w-5" aria-hidden />}
              label="Email"
              value={brand.email}
              href={`mailto:${brand.email}`}
              hint="Dành cho đơn công ty, hóa đơn VAT."
            />
          )}
          {brand.address && (
            <ContactCard
              icon={<MapPin className="h-5 w-5" aria-hidden />}
              label="Tới xưởng"
              value={brand.address}
              hint="Xem file trực tiếp, lấy hàng tại chỗ."
            />
          )}
        </div>

        {brand.workingHours && (
          <div className="mb-10 flex items-center gap-3 rounded-token-lg border border-line bg-surface p-5">
            <Clock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Giờ làm việc</p>
              <p className="text-[13px] text-muted">{brand.workingHours}</p>
            </div>
          </div>
        )}

        <div className="trim-marks rounded-token-lg border border-line bg-canvas p-6 text-center lg:p-10">
          <h2 className="font-heading text-xl font-bold">Cần báo giá?</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">
            Gửi file qua form là cách nhanh nhất. Bạn nhận mã yêu cầu ngay và tra cứu được bất cứ lúc nào — không phải
            chờ ai đọc tin nhắn.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/gui-file-in">
                <Upload className="h-4 w-4" aria-hidden />
                Gửi file để báo giá
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/san-pham">Xem bảng giá sẵn</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
  hint,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  hint: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="rounded-token bg-primary/10 p-2.5 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium uppercase tracking-wide text-muted-soft">{label}</span>
        <span className="block break-words font-heading text-[15px] font-semibold text-ink">{value}</span>
        <span className="mt-0.5 block text-[12px] text-muted">{hint}</span>
      </span>
    </>
  );

  const className =
    'flex items-start gap-3.5 rounded-token-lg border border-line bg-canvas p-5 transition-colors hover:border-primary';

  if (!href) return <div className={className}>{body}</div>;

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </a>
  );
}
