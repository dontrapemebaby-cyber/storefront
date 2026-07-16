// src/components/site/home-sections.tsx
// Các section của trang chủ. Mỗi section nhận đúng phần cấu hình của nó và tự
// ẩn khi admin tắt — nên trang chủ luôn dựng được kể cả khi tắt gần hết.
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  MessageSquare,
  Printer,
  Truck,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/site/section';
import { ProductCard } from '@/components/site/product-card';
import { CATEGORIES } from '@/lib/constants';
import type { HomeSettings, Product } from '@/types/storefront';

const CATEGORY_ICON: Record<string, typeof Printer> = {
  'tem-sticker': BadgeCheck,
  decal: FileCheck2,
  'in-kho-lon': Printer,
  'an-pham': ClipboardCheck,
  'bien-hieu': Truck,
  khac: MessageSquare,
};

/** Nhóm sản phẩm — lối vào nhanh cho khách chưa biết mình cần gì. */
export function CategoriesSection({ products }: { products: Product[] }) {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  const available = CATEGORIES.filter((c) => (counts.get(c.value) ?? 0) > 0);
  if (!available.length) return null;

  return (
    <Section>
      <SectionHeading
        eyebrow="Danh mục"
        title="Bạn cần in gì hôm nay?"
        description="Chọn nhóm sản phẩm để xem giá và thời gian trả hàng."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {available.map((category) => {
          const Icon = CATEGORY_ICON[category.value] ?? Printer;
          return (
            <Link
              key={category.value}
              href={`/san-pham?nhom=${category.value}`}
              className="group flex flex-col items-center gap-3 rounded-token-lg border border-line bg-canvas p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-token"
            >
              <span className="rounded-token bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[13px] font-semibold leading-snug text-ink">{category.label}</span>
              <span className="text-[11px] text-muted-soft">{counts.get(category.value)} sản phẩm</span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

export function PopularSection({ section, products }: { section: HomeSettings['popular']; products: Product[] }) {
  if (!products.length) return null;

  return (
    <Section muted>
      <SectionHeading
        eyebrow="Bán chạy"
        title={section.title}
        action={
          <Button asChild variant="outline">
            <Link href="/san-pham">
              Xem tất cả
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}

const DEFAULT_STEPS = [
  { title: 'Chọn sản phẩm và nhập thông số', description: 'Kích thước, chất liệu, số lượng. Giá hiện ngay nếu sản phẩm có bảng giá sẵn.' },
  { title: 'Gửi file thiết kế', description: 'Kéo thả file PDF, PNG, JPG, SVG hoặc ZIP. Chưa có file thì để trống, chúng tôi hỗ trợ thiết kế.' },
  { title: 'Nhận mã yêu cầu', description: 'Mã dạng RFQ-202607-00001. Dùng mã này tra cứu trạng thái bất cứ lúc nào.' },
  { title: 'Thanh toán hoặc chờ báo giá', description: 'Sản phẩm có giá sẵn: quét QR là vào xưởng. Sản phẩm cần khảo sát: nhân viên gọi lại trong 2 giờ làm việc.' },
];

export function ProcessSection({ section }: { section: HomeSettings['process'] }) {
  const steps = section.steps.length ? section.steps : DEFAULT_STEPS;

  return (
    <Section>
      <SectionHeading eyebrow="Quy trình" title={section.title} />

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            {/* Đường nối giữa các bước, chỉ hiện trên màn hình rộng. */}
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute left-[38px] top-4 hidden h-px w-[calc(100%-24px)] bg-line lg:block" />
            )}

            <div className="relative flex flex-col gap-3">
              <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-fg ring-4 ring-canvas">
                {index + 1}
              </span>
              <h3 className="font-heading text-[15px] font-semibold leading-snug">{step.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const DEFAULT_BENEFITS = [
  { title: 'Kiểm file trước khi in', description: 'Thiếu tràn lề, chữ chưa convert, ảnh vỡ — chúng tôi báo trước, không in bừa rồi bắt khách chịu.' },
  { title: 'Giá minh bạch', description: 'Sản phẩm có giá sẵn hiện đủ cách tính. Không có phí phát sinh sau khi chốt.' },
  { title: 'Trả hàng đúng hẹn', description: 'Đơn nhận trước 10h sáng, phần lớn trả trong ngày.' },
  { title: 'Hỗ trợ thiết kế', description: 'Chưa có file vẫn đặt được. Mô tả ý tưởng, chúng tôi dựng mẫu.' },
];

export function BenefitsSection({ section }: { section: HomeSettings['benefits'] }) {
  const items = section.items.length ? section.items : DEFAULT_BENEFITS;

  return (
    <Section muted>
      <SectionHeading eyebrow="Cam kết" title={section.title} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="trim-marks rounded-token-lg border border-line bg-canvas p-5">
            <h3 className="mb-2 font-heading text-[15px] font-semibold">{item.title}</h3>
            <p className="text-[13px] leading-relaxed text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ShopServicesSection({ section, products }: { section: HomeSettings['shopServices']; products: Product[] }) {
  const shopProducts = products.filter((p) => p.serviceType === 'thi_cong' || p.category === 'bien-hieu').slice(0, 3);
  if (!shopProducts.length) return null;

  return (
    <Section>
      <SectionHeading eyebrow="Cho cửa hàng" title={section.title} description={section.description} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shopProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}

export function ComboSection({ section }: { section: HomeSettings['combo'] }) {
  if (!section.items.length) return null;

  return (
    <Section muted>
      <SectionHeading eyebrow="Tiết kiệm hơn" title={section.title} description={section.description} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => (
          <div key={item.title} className="flex flex-col gap-3 rounded-token-lg border border-line bg-canvas p-6">
            <h3 className="font-heading text-lg font-bold">{item.title}</h3>
            <p className="flex-1 text-[13px] leading-relaxed text-muted">{item.description}</p>
            <p className="font-heading text-xl font-bold text-primary">{item.price}</p>
            <Button asChild variant="outline" full>
              <Link href="/lien-he">Hỏi combo này</Link>
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function GallerySection({ section, products }: { section: HomeSettings['gallery']; products: Product[] }) {
  const images = products.filter((p) => p.imageUrl).slice(0, 8);
  if (images.length < 4) return null;

  return (
    <Section>
      <SectionHeading eyebrow="Thành phẩm" title={section.title} align="center" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((product) => (
          <Link
            key={product.id}
            href={`/san-pham/${product.slug}`}
            className="group relative aspect-square overflow-hidden rounded-token border border-line bg-surface"
          >
            <Image
              src={product.imageUrl!}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-3 pt-8 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {product.name}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function TestimonialsSection({ section }: { section: HomeSettings['testimonials'] }) {
  if (!section.items.length) return null;

  return (
    <Section muted>
      <SectionHeading eyebrow="Khách hàng" title={section.title} align="center" />

      <div className="grid gap-4 lg:grid-cols-3">
        {section.items.map((item) => (
          <figure key={item.name} className="flex flex-col gap-4 rounded-token-lg border border-line bg-canvas p-6">
            <blockquote className="flex-1 text-[15px] leading-relaxed text-ink">“{item.content}”</blockquote>
            <figcaption className="text-[13px]">
              <span className="font-semibold text-ink">{item.name}</span>
              {item.role && <span className="text-muted"> — {item.role}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

/** FAQ dùng <details> để mở rộng được ngay cả khi JavaScript chưa tải. */
export function FaqSection({ section }: { section: HomeSettings['faq'] }) {
  if (!section.items.length) return null;

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Hỏi đáp" title={section.title} align="center" />

        <div className="divide-y divide-line rounded-token-lg border border-line">
          {section.items.map((item) => (
            <details key={item.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-ink marker:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-xl leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function FinalCtaSection({ section }: { section: HomeSettings['finalCta'] }) {
  return (
    <Section>
      <div className="trim-marks relative overflow-hidden rounded-token-lg bg-ink px-6 py-14 text-center sm:px-12 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgb(var(--sf-primary)) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgb(var(--sf-accent)) 0%, transparent 45%)',
          }}
        />

        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="text-[28px] font-bold leading-tight text-canvas sm:text-[36px]">{section.title}</h2>
          <p className="text-[15px] leading-relaxed text-canvas/70">{section.description}</p>
          <div className="flex justify-center pt-2">
            <Button asChild size="lg">
              <Link href={section.ctaUrl}>
                <Upload className="h-4 w-4" aria-hidden />
                {section.ctaText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
