// src/app/san-pham/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPublishedProducts } from '@/lib/data/products';
import { ProductBrowser } from '@/components/site/product-browser';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Sản phẩm in',
  description: 'Tem nhãn, sticker, decal, in khổ lớn, ấn phẩm và biển hiệu. Xem giá và đặt in trực tuyến.',
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="container-content py-12 lg:py-16">
      <header className="mb-10 space-y-3">
        <p className="eyebrow">Bảng giá</p>
        <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">Sản phẩm in</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
          Sản phẩm có bảng giá sẵn thì chọn thông số là thấy tổng tiền và thanh toán được ngay. Sản phẩm cần khảo sát
          thì gửi yêu cầu, nhân viên gọi lại trong 2 giờ làm việc.
        </p>
      </header>

      {products.length ? (
        // useSearchParams() bắt buộc phải nằm trong Suspense khi build tĩnh.
        <Suspense fallback={<ProductGridSkeleton count={6} />}>
          <ProductBrowser products={products} />
        </Suspense>
      ) : (
        <EmptyState
          title="Danh sách sản phẩm đang được cập nhật"
          description="Vui lòng gọi cho nhà in để được báo giá trực tiếp."
        />
      )}
    </div>
  );
}
