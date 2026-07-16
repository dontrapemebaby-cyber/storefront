// src/app/dich-vu/page.tsx
// Trang dịch vụ: gom sản phẩm theo loại dịch vụ (in ấn / thi công / thiết kế).
// Dữ liệu lấy từ chính catalog nên không có nội dung nào phải bảo trì riêng ở đây.
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedProducts } from '@/lib/data/products';
import { SERVICE_TYPES } from '@/lib/constants';
import { ProductCard } from '@/components/site/product-card';
import { Section, SectionHeading } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Dịch vụ',
  description: 'In ấn, thi công lắp đặt và thiết kế — xem từng nhóm dịch vụ của nhà in.',
  alternates: { canonical: '/dich-vu' },
};

const SERVICE_INTRO: Record<string, string> = {
  in_an: 'Đơn hàng in trên giấy, decal và vật liệu tấm. Phần lớn có bảng giá sẵn, chọn thông số là thấy tổng tiền.',
  thi_cong: 'Biển hiệu, backdrop, trang trí mặt bằng. Cần khảo sát thực tế nên báo giá riêng theo từng công trình.',
  thiet_ke: 'Chưa có file thì bắt đầu từ đây. Chúng tôi dựng mẫu và gửi bạn duyệt trước khi in.',
};

export default async function ServicesPage() {
  const products = await getPublishedProducts();

  const groups = SERVICE_TYPES.map((service) => ({
    ...service,
    items: products.filter((p) => p.serviceType === service.value),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <div className="container-content py-12 lg:pt-16">
        <header className="mx-auto max-w-3xl space-y-3">
          <p className="eyebrow">Dịch vụ</p>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">Nhà in làm được những gì</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Từ tem nhãn vài trăm cái tới biển hiệu cả mặt tiền. Không chắc mình cần gì? Gọi cho chúng tôi, mô tả việc bạn
            đang làm — tư vấn không mất phí.
          </p>
        </header>
      </div>

      {groups.length ? (
        groups.map((group, index) => (
          <Section key={group.value} muted={index % 2 === 1} id={group.value}>
            <SectionHeading
              eyebrow={`Nhóm ${index + 1}`}
              title={group.label}
              description={SERVICE_INTRO[group.value]}
              action={
                <Button asChild variant="outline">
                  <Link href={`/san-pham?dich-vu=${group.value}`}>Xem tất cả</Link>
                </Button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Section>
        ))
      ) : (
        <div className="container-content pb-16">
          <EmptyState
            title="Danh sách dịch vụ đang được cập nhật"
            description="Vui lòng gọi cho nhà in để được tư vấn trực tiếp."
            action={
              <Button asChild>
                <Link href="/lien-he">Liên hệ</Link>
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}
