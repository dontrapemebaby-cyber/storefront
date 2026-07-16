// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-content py-24 lg:py-32">
      <div className="mx-auto max-w-md text-center">
        {/* Dấu bế quanh số 404 — cắt trượt mất trang, đúng kiểu nhà in. */}
        <p className="trim-marks mx-auto mb-6 inline-block px-6 py-3 font-heading text-[64px] font-bold leading-none text-primary">
          404
        </p>

        <h1 className="text-[26px] font-bold leading-tight">Không tìm thấy trang này</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Có thể đường dẫn đã đổi, hoặc sản phẩm này không còn nhận đặt nữa.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button asChild>
            <Link href="/san-pham">Xem sản phẩm</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>

        <p className="mt-8 text-[13px] text-muted">
          Đang tìm đơn của mình?{' '}
          <Link href="/tra-cuu" className="font-semibold text-primary hover:underline">
            Tra cứu bằng mã yêu cầu
          </Link>
        </p>
      </div>
    </div>
  );
}
