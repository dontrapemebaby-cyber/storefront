// src/app/san-pham/[slug]/page.tsx
import type * as React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, CreditCard, FileText, Phone, Ruler } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/data/products';
import { getSiteSettings } from '@/lib/data/settings';
import { maxUploadBytes, turnstileEnv } from '@/lib/env';
import { priceLabel } from '@/lib/pricing';
import { categoryLabel } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderForm } from '@/components/forms/order-form';
import { ProductGallery } from '@/components/site/product-gallery';
import { ProductCard } from '@/components/site/product-card';
import { Section, SectionHeading } from '@/components/site/section';

export const revalidate = 300;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Không tìm thấy sản phẩm' };

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription || undefined,
    alternates: { canonical: `/san-pham/${product.slug}` },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription || undefined,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product, 3), getSiteSettings()]);
  const canPayOnline = product.pricingType === 'FIXED_PRICE' && product.allowInstantPayment;

  return (
    <>
      <div className="container-content py-8 lg:py-12">
        <nav aria-label="Đường dẫn" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span aria-hidden>/</span>
          <Link href="/san-pham" className="hover:text-primary">
            Sản phẩm
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/san-pham?nhom=${product.category}`} className="hover:text-primary">
            {categoryLabel(product.category)}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          {/* ---- Cột trái: ảnh + mô tả ---------------------------------------- */}
          <div className="space-y-8">
            <ProductGallery
              name={product.name}
              images={[product.imageUrl, ...product.gallery].filter((v): v is string => Boolean(v))}
            />

            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{categoryLabel(product.category)}</Badge>
                {canPayOnline && (
                  <Badge variant="success">
                    <CreditCard className="h-3 w-3" aria-hidden />
                    Thanh toán online
                  </Badge>
                )}
                {product.pricingType === 'DEPOSIT_REQUIRED' && <Badge variant="warning">Đặt cọc trước</Badge>}
                {product.needsQuote && <Badge variant="outline">Cần khảo sát</Badge>}
              </div>

              {product.longDescription && (
                <div className="prose-vn">
                  {product.longDescription.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}

              <dl className="grid gap-3 rounded-token-lg border border-line bg-surface p-5 sm:grid-cols-2">
                {product.leadTime && (
                  <SpecRow icon={<Clock className="h-4 w-4" aria-hidden />} label="Thời gian trả hàng" value={product.leadTime} />
                )}
                <SpecRow icon={<Ruler className="h-4 w-4" aria-hidden />} label="Mã sản phẩm" value={product.sku} />
                {product.fileGuide && (
                  <div className="sm:col-span-2">
                    <SpecRow icon={<FileText className="h-4 w-4" aria-hidden />} label="Yêu cầu file" value={product.fileGuide} />
                  </div>
                )}
              </dl>

              {product.faq.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-heading text-lg font-semibold">Câu hỏi thường gặp</h2>
                  <div className="divide-y divide-line rounded-token-lg border border-line">
                    {product.faq.map((item) => (
                      <details key={item.q} className="group px-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-medium marker:hidden">
                          {item.q}
                          <span aria-hidden className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="pb-3.5 text-[13px] leading-relaxed text-muted">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---- Cột phải: đặt hàng ------------------------------------------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="trim-marks rounded-token-lg border border-line bg-canvas p-5 lg:p-7">
              <div className="mb-6 space-y-2 border-b border-line pb-5">
                <h1 className="text-[24px] font-bold leading-tight lg:text-[30px]">{product.name}</h1>
                {product.shortDescription && <p className="text-sm leading-relaxed text-muted">{product.shortDescription}</p>}
                <p className="pt-1 font-heading text-2xl font-bold text-primary">{priceLabel(product)}</p>
              </div>

              <OrderForm
                products={[product]}
                lockedSlug={product.slug}
                turnstileSiteKey={turnstileEnv().siteKey || undefined}
                maxBytes={maxUploadBytes()}
              />
            </div>

            {settings.brand.phone && (
              <p className="mt-4 text-center text-[13px] text-muted">
                Cần tư vấn trước khi đặt?{' '}
                <a href={`tel:${settings.brand.phone}`} className="font-semibold text-primary hover:underline">
                  Gọi {settings.brand.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <Section muted>
          <SectionHeading title="Khách thường xem thêm" as="h2" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </Section>
      )}

      {/* Thanh CTA dính đáy trên điện thoại — form nằm xa dưới, khách cần lối tắt. */}
      {settings.brand.phone && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-canvas/95 p-3 backdrop-blur lg:hidden">
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <a href={`tel:${settings.brand.phone}`}>
                <Phone className="h-4 w-4" aria-hidden />
                Gọi hỏi
              </a>
            </Button>
            <Button asChild className="flex-[2]">
              <Link href="#noi-dung">{canPayOnline ? 'Đặt in ngay' : 'Gửi yêu cầu báo giá'}</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-soft">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">{label}</dt>
        <dd className="text-[13px] leading-relaxed text-ink">{value}</dd>
      </div>
    </div>
  );
}
