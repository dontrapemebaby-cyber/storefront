'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const LOCAL_LOGO = '/logo.png';

interface BrandLogoProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Logo thương hiệu có fallback về file local trong /public.
 * Nếu URL do admin nhập bị sai, hết hạn hoặc bị chặn, logo local vẫn hiện.
 */
export function BrandLogo({ src, alt, className, priority = false }: BrandLogoProps) {
  const initialSrc = src?.trim() || LOCAL_LOGO;
  const [currentSrc, setCurrentSrc] = React.useState(initialSrc);

  React.useEffect(() => {
    setCurrentSrc(src?.trim() || LOCAL_LOGO);
  }, [src]);

  return (
    // Dùng thẻ img để có thể fallback khi URL ngoài bị lỗi mà không phụ thuộc
    // danh sách remotePatterns của next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={140}
      height={140}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => {
        if (currentSrc !== LOCAL_LOGO) setCurrentSrc(LOCAL_LOGO);
      }}
      className={cn('block shrink-0 object-contain', className)}
    />
  );
}
