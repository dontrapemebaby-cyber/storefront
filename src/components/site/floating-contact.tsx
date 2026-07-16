'use client';
// src/components/site/floating-contact.tsx
// Nút gọi / Zalo nổi + nút lên đầu trang.
//
// Phần lớn khách của nhà in vào bằng điện thoại và muốn gọi hỏi giá ngay. Nút
// gọi luôn nằm trong tầm ngón cái, không phải cuộn tìm.
import * as React from 'react';
import { ArrowUp, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandSettings } from '@/types/storefront';

export function FloatingContact({ brand }: { brand: BrandSettings }) {
  const [showTop, setShowTop] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const zaloNumber = brand.zalo.replace(/\D/g, '') || brand.phone.replace(/\D/g, '');

  if (!brand.phone && !zaloNumber) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2.5 print:hidden">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
        className={cn(
          'rounded-full border border-line bg-canvas p-2.5 text-muted shadow-token transition-all',
          'hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ArrowUp className="h-4 w-4" aria-hidden />
      </button>

      {zaloNumber && (
        <a
          href={`https://zalo.me/${zaloNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nhắn Zalo cho nhà in"
          className="rounded-full bg-accent p-3.5 text-accent-fg shadow-token transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </a>
      )}

      {brand.phone && (
        <a
          href={`tel:${brand.phone}`}
          aria-label={`Gọi ${brand.phone}`}
          className="flex items-center gap-2 rounded-full bg-primary py-3.5 pl-3.5 pr-4 text-primary-fg shadow-token transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Phone className="h-5 w-5" aria-hidden />
          <span className="hidden text-sm font-semibold sm:inline">Gọi ngay</span>
        </a>
      )}
    </div>
  );
}
