// src/components/site/product-card.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { priceLabel } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/storefront';

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const canPayOnline = product.pricingType === 'FIXED_PRICE' && product.allowInstantPayment;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-token-lg border border-line bg-canvas transition-all',
        'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-token',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-soft">Chưa có ảnh</div>
        )}

        {canPayOnline && (
          <div className="absolute left-3 top-3">
            <Badge variant="success">
              <CreditCard className="mr-1 h-3 w-3" aria-hidden />
              Đặt & trả online
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-[15px] font-semibold leading-snug text-ink">
          {/* Phủ link ra cả thẻ để bấm chỗ nào cũng vào được, nhưng vẫn là link thật. */}
          <Link href={`/san-pham/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
            <ArrowUpRight
              className="ml-0.5 inline h-3.5 w-3.5 -translate-y-px opacity-0 transition-opacity group-hover:opacity-60"
              aria-hidden
            />
          </Link>
        </h3>

        {product.shortDescription && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{product.shortDescription}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p
            className={cn(
              'font-heading text-[15px] font-bold',
              product.pricingType === 'FIXED_PRICE' ? 'text-primary' : 'text-ink',
            )}
          >
            {priceLabel(product)}
          </p>

          {product.leadTime && (
            <span className="flex items-center gap-1 text-[12px] text-muted-soft">
              <Clock className="h-3 w-3" aria-hidden />
              {product.leadTime}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
