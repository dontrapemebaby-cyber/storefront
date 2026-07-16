// src/app/sitemap.ts
// Sitemap sinh từ catalog thật, nên thêm sản phẩm mới là tự có trong sitemap.
//
// Không liệt kê /thanh-toan, /cam-on và /tra-cuu: đó là trang riêng của từng
// khách, không có nội dung để lập chỉ mục.
import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/env';
import { getPublishedProducts } from '@/lib/data/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/san-pham', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/dich-vu', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/gui-file-in', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/huong-dan-file-in', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/gioi-thieu', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/lien-he', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/quy-dinh-file-in', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/chinh-sach-thanh-toan', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/chinh-sach-giao-hang', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/chinh-sach-bao-mat', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const now = new Date();
  const products = await getPublishedProducts();

  return [
    ...STATIC_PATHS.map((entry) => ({
      url: `${base}${entry.path}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...products.map((product) => ({
      url: `${base}/san-pham/${product.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
