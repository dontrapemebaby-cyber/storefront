// src/types/storefront.ts
// Kiểu dữ liệu dùng chung cho website khách hàng. Không import 'server-only' —
// các kiểu này dùng cả ở server component lẫn client component.

export type PricingType = 'FIXED_PRICE' | 'QUOTE_REQUIRED' | 'DEPOSIT_REQUIRED';

/** Đơn vị đo gửi lên dashboard. Trùng khớp requestDetailSchema của dashboard. */
export type SizeUnit = 'cm' | 'mm' | 'm' | 'inch' | 'px';

/** Cách liên hệ. Trùng khớp enum contact_method của dashboard. */
export type ContactMethod = 'call' | 'zalo' | 'email' | 'message';

export interface OptionValue {
  value: string;
  label: string;
  /** Cộng thẳng vào đơn giá (trước khi nhân số lượng). */
  priceDelta?: number;
  /** Nhân vào đơn giá. */
  priceMultiplier?: number;
  /** Cộng một lần vào tổng (không nhân số lượng). */
  priceFlat?: number;
  /** Ấn định tổng tiền — dùng cho combo bán theo gói. */
  flatPrice?: number;
  /** Số lượng suy ra từ lựa chọn (combo 100 tem -> quantity 100). */
  quantity?: number;
  /** Kích thước suy ra từ lựa chọn (khổ A4 -> 21 × 29,7cm). */
  width?: number;
  height?: number;
}

export interface ProductOption {
  key: string;
  label: string;
  type: 'radio' | 'select' | 'checkbox';
  required?: boolean;
  values: OptionValue[];
}

export interface PricingTier {
  minQty: number;
  price: number;
}

export interface SizeRule {
  minWidthCm?: number;
  maxWidthCm?: number;
  minHeightCm?: number;
  maxHeightCm?: number;
}

export interface PricingConfig {
  mode?: 'per_item' | 'per_area' | 'per_pack';
  base?: number;
  minAreaM2?: number;
  minCharge?: number;
  roundTo?: number;
  tiers?: PricingTier[];
  size?: SizeRule;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  productTypeCode: string;
  shortDescription: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  gallery: string[];
  pricingType: PricingType;
  priceFrom: number | null;
  priceUnit: string | null;
  pricing: PricingConfig;
  options: ProductOption[];
  leadTime: string | null;
  fileGuide: string | null;
  faq: FaqItem[];
  needsQuote: boolean;
  allowInstantPayment: boolean;
  requiresDeposit: boolean;
  depositAmount: number | null;
  category: string;
  serviceType: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface BrandSettings {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  slogan: string;
  description: string;
  phone: string;
  zalo: string;
  email: string;
  address: string;
  workingHours: string;
  facebook: string;
  tiktok: string;
  instagram: string;
}

export type FontChoice = 'be-vietnam-pro' | 'manrope';
export type RadiusChoice = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type ShadowChoice = 'none' | 'soft' | 'medium' | 'strong';
export type ButtonStyleChoice = 'solid' | 'outline' | 'pill';

export interface ThemeSettings {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  fontHeading: FontChoice;
  fontBody: FontChoice;
  radius: RadiusChoice;
  shadow: ShadowChoice;
  buttonStyle: ButtonStyleChoice;
}

export interface HomeSection {
  enabled: boolean;
}

export interface HomeSettings {
  announcement: HomeSection & { text: string; linkUrl: string; linkText: string };
  hero: HomeSection & {
    title: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    ctaSecondaryText: string;
    ctaSecondaryUrl: string;
  };
  categories: HomeSection;
  popular: HomeSection & { title: string };
  process: HomeSection & { title: string; steps: { title: string; description: string }[] };
  benefits: HomeSection & { title: string; items: { title: string; description: string }[] };
  shopServices: HomeSection & { title: string; description: string };
  combo: HomeSection & { title: string; description: string; items: { title: string; description: string; price: string }[] };
  gallery: HomeSection & { title: string };
  testimonials: HomeSection & { title: string; items: { name: string; role: string; content: string }[] };
  faq: HomeSection & { title: string; items: FaqItem[] };
  finalCta: HomeSection & { title: string; description: string; ctaText: string; ctaUrl: string };
}

export interface PaymentSettings {
  /** vietqr_image = dùng ảnh QR của img.vietqr.io; emv = tự sinh chuỗi EMVCo. */
  mode: 'vietqr_image' | 'emv';
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  prefix: string;
  note: string;
}

export interface SiteSettings {
  brand: BrandSettings;
  theme: ThemeSettings;
  home: HomeSettings;
  payment: PaymentSettings;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  total: number;
  quantity: number;
  /** Số tiền khách phải trả ngay: toàn bộ, tiền cọc, hoặc 0 nếu chờ báo giá. */
  amountDue: number;
  paymentKind: 'none' | 'full' | 'deposit';
}
