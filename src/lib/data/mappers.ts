// src/lib/data/mappers.ts
// Chuyển hàng từ CSDL (snake_case) sang kiểu dùng trong ứng dụng (camelCase).
// Tách riêng để trang và route handler không phải biết tên cột.
import type { FaqItem, PricingConfig, PricingType, Product, ProductOption } from '@/types/storefront';

export interface ProductRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  product_type_code: string;
  short_description: string | null;
  long_description: string | null;
  image_url: string | null;
  gallery: unknown;
  pricing_type: string;
  price_from: string | number | null;
  price_unit: string | null;
  pricing: unknown;
  options: unknown;
  lead_time: string | null;
  file_guide: string | null;
  faq: unknown;
  needs_quote: boolean;
  allow_instant_payment: boolean;
  requires_deposit: boolean;
  deposit_amount: string | number | null;
  category: string;
  service_type: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

function num(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const PRICING_TYPES: PricingType[] = ['FIXED_PRICE', 'QUOTE_REQUIRED', 'DEPOSIT_REQUIRED'];

export function mapProduct(row: ProductRow): Product {
  const pricingType = PRICING_TYPES.includes(row.pricing_type as PricingType)
    ? (row.pricing_type as PricingType)
    : 'QUOTE_REQUIRED';

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    productTypeCode: row.product_type_code,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    imageUrl: row.image_url,
    gallery: asArray<string>(row.gallery),
    pricingType,
    priceFrom: num(row.price_from),
    priceUnit: row.price_unit,
    pricing: (row.pricing ?? {}) as PricingConfig,
    options: asArray<ProductOption>(row.options),
    leadTime: row.lead_time,
    fileGuide: row.file_guide,
    faq: asArray<FaqItem>(row.faq),
    needsQuote: row.needs_quote,
    allowInstantPayment: row.allow_instant_payment,
    requiresDeposit: row.requires_deposit,
    depositAmount: num(row.deposit_amount),
    category: row.category,
    serviceType: row.service_type,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export const PRODUCT_COLUMNS =
  'id, slug, sku, name, product_type_code, short_description, long_description, image_url, gallery, ' +
  'pricing_type, price_from, price_unit, pricing, options, lead_time, file_guide, faq, needs_quote, ' +
  'allow_instant_payment, requires_deposit, deposit_amount, category, service_type, is_featured, ' +
  'is_published, sort_order, seo_title, seo_description';
