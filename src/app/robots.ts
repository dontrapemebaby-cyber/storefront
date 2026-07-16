// src/app/robots.ts
import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Trang riêng của từng khách và các route nội bộ — không có gì để lập chỉ mục.
      disallow: ['/api/', '/admin/', '/thanh-toan/', '/cam-on'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
