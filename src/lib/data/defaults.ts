// src/lib/data/defaults.ts
// Giá trị mặc định cho cấu hình website.
//
// Website phải dựng được ngay cả khi CSDL chưa có bản ghi cấu hình nào (lần
// deploy đầu, hoặc admin xóa nhầm). Mọi giá trị đọc từ CSDL đều được trộn lên
// trên bộ mặc định này, nên thiếu một trường sẽ không làm vỡ trang.
import type { BrandSettings, HomeSettings, PaymentSettings, ThemeSettings } from '@/types/storefront';

export const DEFAULT_BRAND: BrandSettings = {
  name: 'Nhà In Trẻ',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.png',
  slogan: 'Có file thì tải lên, chưa có file thì chúng tôi hỗ trợ thiết kế.',
  description: 'Nhà in tại Hà Nội cho quán, cửa hàng và thương hiệu nhỏ.',
  phone: '',
  zalo: '',
  email: '',
  address: '',
  workingHours: '8:00 – 18:00, Thứ Hai – Thứ Bảy',
  facebook: '',
  tiktok: '',
  instagram: '',
};

export const DEFAULT_THEME: ThemeSettings = {
  primary: '#0057FF',
  accent: '#EC008C',
  background: '#FFFFFF',
  foreground: '#101114',
  fontHeading: 'be-vietnam-pro',
  fontBody: 'be-vietnam-pro',
  radius: 'md',
  shadow: 'soft',
  buttonStyle: 'solid',
};

export const DEFAULT_HOME: HomeSettings = {
  announcement: { enabled: false, text: '', linkUrl: '', linkText: '' },
  hero: {
    enabled: true,
    title: 'Có file thì tải lên, chưa có file thì chúng tôi hỗ trợ thiết kế.',
    description: 'Chọn sản phẩm, nhập thông số, gửi file. Sản phẩm có giá sẵn thì thanh toán ngay bằng QR.',
    imageUrl: '/hero.svg',
    ctaText: 'Chọn sản phẩm in',
    ctaUrl: '/san-pham',
    ctaSecondaryText: 'Tải file để báo giá',
    ctaSecondaryUrl: '/gui-file-in',
  },
  categories: { enabled: true },
  popular: { enabled: true, title: 'Khách đặt nhiều nhất' },
  process: { enabled: true, title: 'Đặt in mất bao lâu', steps: [] },
  benefits: { enabled: true, title: 'Vì sao khách quay lại', items: [] },
  shopServices: { enabled: true, title: 'Dành cho quán và cửa hàng', description: '' },
  combo: { enabled: true, title: 'Combo khai trương', description: '', items: [] },
  gallery: { enabled: true, title: 'Mẫu thành phẩm' },
  testimonials: { enabled: true, title: 'Khách nói gì', items: [] },
  faq: { enabled: true, title: 'Câu hỏi thường gặp', items: [] },
  finalCta: {
    enabled: true,
    title: 'Gửi file, nhận giá, xong.',
    description: 'Tải file lên và chúng tôi trả lời trong 2 giờ làm việc.',
    ctaText: 'Gửi file in',
    ctaUrl: '/gui-file-in',
  },
};

export const DEFAULT_PAYMENT: PaymentSettings = {
  mode: 'vietqr_image',
  bankBin: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  branch: '',
  prefix: 'NHAIN',
  note: '',
};

/** Trộn nông: giá trị từ CSDL đè lên mặc định, thiếu trường thì giữ mặc định. */
export function mergeSettings<T extends object>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaults;
  const result = { ...defaults } as Record<string, unknown>;
  for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    const current = result[key];
    if (current && typeof current === 'object' && !Array.isArray(current) && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { ...(current as object), ...(value as object) };
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
