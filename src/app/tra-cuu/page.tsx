// src/app/tra-cuu/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { LookupForm } from '@/components/site/lookup-form';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tra cứu đơn in',
  description: 'Nhập mã yêu cầu và số điện thoại để xem trạng thái đơn in của bạn.',
  alternates: { canonical: '/tra-cuu' },
};

export default async function LookupPage() {
  const { brand } = await getSiteSettings();

  return (
    <div className="container-content py-12 lg:py-16">
      <div className="mx-auto max-w-xl">
        <header className="mb-8 space-y-3">
          <p className="eyebrow">Theo dõi</p>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">Tra cứu đơn in</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Nhập mã yêu cầu và số điện thoại bạn đã dùng khi đặt. Cần cả hai để không ai xem được đơn của bạn.
          </p>
        </header>

        <Suspense fallback={<Skeleton className="h-80 w-full rounded-token-lg" />}>
          <LookupForm />
        </Suspense>

        <p className="mt-8 text-center text-[13px] leading-relaxed text-muted">
          Mất mã yêu cầu?{' '}
          {brand.phone ? (
            <>
              Gọi{' '}
              <a href={`tel:${brand.phone}`} className="font-semibold text-primary hover:underline">
                {brand.phone}
              </a>{' '}
              và đọc số điện thoại đã đặt, nhân viên tìm giúp bạn.
            </>
          ) : (
            'Liên hệ nhà in và đọc số điện thoại đã đặt, nhân viên tìm giúp bạn.'
          )}
        </p>
      </div>
    </div>
  );
}
