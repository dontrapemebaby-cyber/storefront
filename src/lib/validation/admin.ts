// src/lib/validation/admin.ts
// Kiểm tra dữ liệu admin nhập trước khi ghi vào CSDL.
//
// Vì sao cần chặt tay dù admin là người nhà: giá trị theme được nhúng thẳng vào
// khối <style> của layout. Một chuỗi không được lọc ở đây là một lỗ chèn CSS trên
// TOÀN BỘ website khách hàng. `themeToCssVariables()` cũng lọc lần nữa — hai lớp,
// vì cái giá của việc sót là quá đắt.
import { z } from 'zod';
import { isHexColor } from '@/lib/theme';

const hexColor = z
  .string()
  .trim()
  .refine(isHexColor, { message: 'Màu phải là mã hex, ví dụ #0057FF.' });

/** Cắt bớt chuỗi dài để một ô nhập không thể làm phình trang. */
const text = (max: number) => z.string().trim().max(max);

export const brandSchema = z.object({
  name: z.string().trim().min(1, 'Chưa nhập tên nhà in.').max(80),
  logoUrl: text(500),
  faviconUrl: text(500),
  slogan: text(160),
  description: text(500),
  phone: text(20),
  zalo: text(20),
  email: z.union([z.string().trim().email('Email không hợp lệ.'), z.literal('')]),
  address: text(200),
  workingHours: text(120),
  facebook: text(300),
  tiktok: text(300),
  instagram: text(300),
});

export const themeSchema = z.object({
  primary: hexColor,
  accent: hexColor,
  background: hexColor,
  foreground: hexColor,
  fontHeading: z.enum(['be-vietnam-pro', 'manrope']),
  fontBody: z.enum(['be-vietnam-pro', 'manrope']),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
  shadow: z.enum(['none', 'soft', 'medium', 'strong']),
  buttonStyle: z.enum(['solid', 'outline', 'pill']),
});

const section = { enabled: z.boolean() };

export const homeSchema = z.object({
  announcement: z.object({ ...section, text: text(200), linkUrl: text(300), linkText: text(60) }),
  hero: z.object({
    ...section,
    title: text(120),
    description: text(400),
    imageUrl: text(500),
    ctaText: text(40),
    ctaUrl: text(300),
    ctaSecondaryText: text(40),
    ctaSecondaryUrl: text(300),
  }),
  categories: z.object(section),
  popular: z.object({ ...section, title: text(120) }),
  process: z.object({
    ...section,
    title: text(120),
    steps: z.array(z.object({ title: text(80), description: text(300) })).max(8),
  }),
  benefits: z.object({
    ...section,
    title: text(120),
    items: z.array(z.object({ title: text(80), description: text(300) })).max(8),
  }),
  shopServices: z.object({ ...section, title: text(120), description: text(400) }),
  combo: z.object({
    ...section,
    title: text(120),
    description: text(400),
    items: z.array(z.object({ title: text(80), description: text(300), price: text(40) })).max(8),
  }),
  gallery: z.object({ ...section, title: text(120) }),
  testimonials: z.object({
    ...section,
    title: text(120),
    items: z.array(z.object({ name: text(60), role: text(80), content: text(500) })).max(12),
  }),
  faq: z.object({
    ...section,
    title: text(120),
    items: z.array(z.object({ q: text(200), a: text(1000) })).max(20),
  }),
  finalCta: z.object({ ...section, title: text(120), description: text(400), ctaText: text(40), ctaUrl: text(300) }),
});

export const paymentSchema = z.object({
  mode: z.enum(['vietqr_image', 'emv']),
  // BIN ngân hàng theo chuẩn NAPAS là 6 chữ số.
  bankBin: z.union([z.string().trim().regex(/^\d{6}$/, 'Mã BIN phải gồm đúng 6 chữ số.'), z.literal('')]),
  bankName: text(80),
  accountNumber: z.union([
    z.string().trim().regex(/^\d{6,20}$/, 'Số tài khoản chỉ gồm chữ số, dài 6–20 ký tự.'),
    z.literal(''),
  ]),
  // VietQR yêu cầu tên chủ tài khoản không dấu, in hoa.
  accountName: text(80),
  branch: text(80),
  // Tiền tố đi vào nội dung chuyển khoản — giới hạn ký tự để không phá chuỗi QR.
  prefix: z.union([
    z.string().trim().regex(/^[A-Za-z0-9]{0,10}$/, 'Tiền tố chỉ gồm chữ và số, tối đa 10 ký tự.'),
    z.literal(''),
  ]),
  note: text(500),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.')
    .min(2)
    .max(80),
  sku: z.string().trim().min(1, 'Chưa nhập mã SKU.').max(40),
  name: z.string().trim().min(1, 'Chưa nhập tên sản phẩm.').max(120),
  productTypeCode: z.string().trim().min(1, 'Chưa chọn loại sản phẩm của dashboard.').max(40),
  shortDescription: text(300),
  longDescription: text(4000),
  imageUrl: text(500),
  pricingType: z.enum(['FIXED_PRICE', 'QUOTE_REQUIRED', 'DEPOSIT_REQUIRED']),
  priceFrom: z.number().int().min(0).nullable(),
  priceUnit: text(40),
  leadTime: text(80),
  category: z.string().trim().min(1).max(40),
  serviceType: z.string().trim().min(1).max(40),
  depositAmount: z.number().int().min(0).nullable(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  seoTitle: text(120),
  seoDescription: text(300),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
export type HomeInput = z.infer<typeof homeSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ProductInput = z.infer<typeof productSchema>;
