// src/lib/theme.ts
// Biến ThemeSettings thành CSS variables. Đây là chỗ DUY NHẤT định nghĩa màu,
// bo góc và shadow — component chỉ dùng token qua Tailwind, không hard-code màu.
//
// Admin chỉ chọn được giá trị hợp lệ: màu phải là mã hex, còn bo góc/shadow/kiểu
// nút là danh sách đóng. Admin KHÔNG nhập được CSS hay JavaScript tùy ý.
import type { RadiusChoice, ShadowChoice, ThemeSettings } from '@/types/storefront';
import { DEFAULT_THEME } from '@/lib/data/defaults';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

/** '#0057FF' -> '0 87 255'. Trả về null nếu chuỗi không phải hex hợp lệ. */
export function hexToRgbChannels(hex: string): string | null {
  const value = hex.trim();
  if (!isHexColor(value)) return null;

  let body = value.slice(1);
  if (body.length === 3) body = body.split('').map((c) => c + c).join('');

  const r = parseInt(body.slice(0, 2), 16);
  const g = parseInt(body.slice(2, 4), 16);
  const b = parseInt(body.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Chọn màu chữ trên nền màu: đen hay trắng, theo độ sáng cảm nhận.
 * Nếu admin đổi màu chủ đạo sang vàng chanh, chữ trên nút tự thành đen thay vì
 * trắng-trên-vàng không đọc nổi.
 */
export function readableOn(hex: string): string {
  const channels = hexToRgbChannels(hex);
  if (!channels) return '255 255 255';

  const [r, g, b] = channels.split(' ').map(Number) as [number, number, number];
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.45 ? '16 17 20' : '255 255 255';
}

const RADIUS_PX: Record<RadiusChoice, string> = {
  none: '0px',
  sm: '4px',
  md: '10px',
  lg: '16px',
  xl: '24px',
};

const SHADOW_CSS: Record<ShadowChoice, string> = {
  none: 'none',
  soft: '0 1px 2px rgb(16 17 20 / 0.04), 0 4px 16px rgb(16 17 20 / 0.06)',
  medium: '0 2px 4px rgb(16 17 20 / 0.06), 0 8px 24px rgb(16 17 20 / 0.10)',
  strong: '0 4px 8px rgb(16 17 20 / 0.08), 0 16px 40px rgb(16 17 20 / 0.16)',
};

const FONT_VAR: Record<string, string> = {
  'be-vietnam-pro': 'var(--font-be-vietnam-pro)',
  manrope: 'var(--font-manrope)',
};

/** Lọc mọi giá trị về danh sách hợp lệ trước khi đưa vào CSS. */
function safe<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Sinh khối CSS variables để nhúng vào <style> ở layout.
 * Mọi giá trị đều đã được kiểm tra, nên không thể chèn CSS lạ qua cấu hình.
 */
export function themeToCssVariables(theme: ThemeSettings): string {
  const primary = hexToRgbChannels(theme.primary) ?? hexToRgbChannels(DEFAULT_THEME.primary)!;
  const accent = hexToRgbChannels(theme.accent) ?? hexToRgbChannels(DEFAULT_THEME.accent)!;
  const background = hexToRgbChannels(theme.background) ?? hexToRgbChannels(DEFAULT_THEME.background)!;
  const foreground = hexToRgbChannels(theme.foreground) ?? hexToRgbChannels(DEFAULT_THEME.foreground)!;

  const radius = RADIUS_PX[safe(theme.radius, ['none', 'sm', 'md', 'lg', 'xl'] as const, 'md')];
  const shadow = SHADOW_CSS[safe(theme.shadow, ['none', 'soft', 'medium', 'strong'] as const, 'soft')];

  const fontHeading = FONT_VAR[safe(theme.fontHeading, ['be-vietnam-pro', 'manrope'] as const, 'be-vietnam-pro')];
  const fontBody = FONT_VAR[safe(theme.fontBody, ['be-vietnam-pro', 'manrope'] as const, 'be-vietnam-pro')];

  return `:root{
--sf-primary:${primary};
--sf-primary-fg:${readableOn(theme.primary)};
--sf-accent:${accent};
--sf-accent-fg:${readableOn(theme.accent)};
--sf-bg:${background};
--sf-fg:${foreground};
--sf-radius:${radius};
--sf-shadow:${shadow};
--sf-font-heading:${fontHeading}, system-ui, sans-serif;
--sf-font-body:${fontBody}, system-ui, sans-serif;
}`;
}

export const RADIUS_OPTIONS: { value: RadiusChoice; label: string }[] = [
  { value: 'none', label: 'Vuông góc' },
  { value: 'sm', label: 'Bo nhẹ' },
  { value: 'md', label: 'Bo vừa' },
  { value: 'lg', label: 'Bo nhiều' },
  { value: 'xl', label: 'Bo rất tròn' },
];

export const SHADOW_OPTIONS: { value: ShadowChoice; label: string }[] = [
  { value: 'none', label: 'Không đổ bóng' },
  { value: 'soft', label: 'Bóng nhẹ' },
  { value: 'medium', label: 'Bóng vừa' },
  { value: 'strong', label: 'Bóng đậm' },
];

export const FONT_OPTIONS = [
  { value: 'be-vietnam-pro', label: 'Be Vietnam Pro' },
  { value: 'manrope', label: 'Manrope' },
] as const;

export const BUTTON_STYLE_OPTIONS = [
  { value: 'solid', label: 'Nút đặc' },
  { value: 'outline', label: 'Nút viền' },
  { value: 'pill', label: 'Nút bo tròn' },
] as const;
