'use client';
// src/app/error.tsx
// Lưới an toàn khi một trang ném lỗi.
//
// Cố ý KHÔNG hiện chi tiết lỗi cho khách: nội dung lỗi có thể lộ cấu trúc hệ
// thống, và khách cũng không làm gì được với nó. Chi tiết đi vào console của
// server; khách nhận đường thoát rõ ràng.
import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('[app] lỗi không bắt được:', error);
  }, [error]);

  return (
    <div className="container-content py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-7 w-7 text-danger" aria-hidden />
        </div>

        <h1 className="text-[26px] font-bold leading-tight">Trang này đang gặp trục trặc</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Lỗi nằm ở phía chúng tôi, không phải do bạn làm sai. Thử tải lại xem sao.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button onClick={reset}>Thử lại</Button>
          <Button asChild variant="outline">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>

        {error.digest && <p className="mt-8 text-[12px] text-muted-soft">Mã lỗi: {error.digest}</p>}
      </div>
    </div>
  );
}
