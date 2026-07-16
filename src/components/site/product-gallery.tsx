'use client';
// src/components/site/product-gallery.tsx
// Ảnh sản phẩm + ảnh nhỏ chọn nhanh.
import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = React.useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-token-lg border border-line bg-surface text-sm text-muted-soft">
        Chưa có ảnh sản phẩm
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div className="space-y-3">
      <div className="trim-marks relative aspect-[4/3] overflow-hidden rounded-token-lg border border-line bg-surface">
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2" role="group" aria-label="Ảnh khác của sản phẩm">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-token border transition-colors sm:h-20 sm:w-20',
                index === active ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-line-strong',
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
