// src/app/page.tsx
// Trang chủ. Từng section bật/tắt được trong /admin/site-settings, nên thứ tự ở
// đây là thứ tự cố định còn việc hiện hay không do admin quyết.
import { getSiteSettings } from '@/lib/data/settings';
import { getFeaturedProducts, getPublishedProducts } from '@/lib/data/products';
import { Hero } from '@/components/site/hero';
import {
  BenefitsSection,
  CategoriesSection,
  ComboSection,
  FaqSection,
  FinalCtaSection,
  GallerySection,
  PopularSection,
  ProcessSection,
  ShopServicesSection,
  TestimonialsSection,
} from '@/components/site/home-sections';

export const dynamic = 'force-dynamic';

// Trang chủ đọc dữ liệu công khai, cache 5 phút để không truy vấn lại mỗi lượt xem.
export const revalidate = 300;

export default async function HomePage() {
  const [settings, products, featured] = await Promise.all([
    getSiteSettings(),
    getPublishedProducts(),
    getFeaturedProducts(6),
  ]);

  const { home, brand } = settings;

  return (
    <>
      {home.hero.enabled && <Hero hero={home.hero} brand={brand} />}
      {home.categories.enabled && <CategoriesSection products={products} />}
      {home.popular.enabled && <PopularSection section={home.popular} products={featured} />}
      {home.process.enabled && <ProcessSection section={home.process} />}
      {home.benefits.enabled && <BenefitsSection section={home.benefits} />}
      {home.shopServices.enabled && <ShopServicesSection section={home.shopServices} products={products} />}
      {home.combo.enabled && <ComboSection section={home.combo} />}
      {home.gallery.enabled && <GallerySection section={home.gallery} products={products} />}
      {home.testimonials.enabled && <TestimonialsSection section={home.testimonials} />}
      {home.faq.enabled && <FaqSection section={home.faq} />}
      {home.finalCta.enabled && <FinalCtaSection section={home.finalCta} />}
    </>
  );
}
