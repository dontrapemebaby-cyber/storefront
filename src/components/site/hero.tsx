// src/components/site/hero.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrandSettings, HomeSettings } from '@/types/storefront';

const POINTS = ['Báo giá trong 2 giờ làm việc', 'Sản phẩm có giá sẵn: trả QR là in', 'Kiểm file miễn phí trước khi in'];

export function Hero({ hero, brand }: { hero: HomeSettings['hero']; brand: BrandSettings }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Nền lưới nhẹ, gợi khung bình bài của bản in. Không có nội dung nên ẩn khỏi trình đọc màn hình. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--sf-fg)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--sf-fg)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="container-content relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div className="space-y-7">
          <p className="eyebrow">{brand.name}</p>

          <h1 className="text-[32px] font-bold leading-[1.1] sm:text-[42px] lg:text-[52px]">{hero.title}</h1>

          <p className="max-w-xl text-base leading-relaxed text-muted lg:text-[17px]">{hero.description}</p>

          <ul className="space-y-2.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-ink">
                <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button asChild size="lg">
              <Link href={hero.ctaUrl}>
                {hero.ctaText}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={hero.ctaSecondaryUrl}>
                <Upload className="h-4 w-4" aria-hidden />
                {hero.ctaSecondaryText}
              </Link>
            </Button>
          </div>
        </div>

        <div className="trim-marks relative aspect-[4/3] w-full overflow-hidden rounded-token-lg border border-line bg-surface lg:aspect-square">
          {hero.imageUrl && (
            <Image
              src={hero.imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}
