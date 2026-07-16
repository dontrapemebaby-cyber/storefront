import 'server-only';
// src/lib/data/settings.ts
// Đọc/ghi cấu hình website. Đọc bằng anon key (RLS cho phép đọc công khai),
// ghi bằng phiên đăng nhập của super_admin (RLS chặn mọi vai trò khác).
import { cache } from 'react';
import { createSupabaseAnonClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { bankEnvFallback } from '@/lib/env';
import {
  DEFAULT_BRAND, DEFAULT_HOME, DEFAULT_PAYMENT, DEFAULT_THEME, mergeSettings,
} from '@/lib/data/defaults';
import type { BrandSettings, HomeSettings, PaymentSettings, SiteSettings, ThemeSettings } from '@/types/storefront';

interface SettingRow {
  key: string;
  value: unknown;
}

/**
 * Đọc toàn bộ cấu hình. Bọc trong cache() nên nhiều component trong cùng một
 * lần render chỉ tốn đúng một truy vấn.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let rows: SettingRow[] = [];

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.from('storefront_settings').select('key, value');
    if (error) throw error;
    rows = data ?? [];
  } catch (error) {
    // Website vẫn phải hiển thị được khi CSDL trục trặc — dùng bộ mặc định.
    console.error('[settings] không đọc được storefront_settings:', error);
  }

  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  return {
    brand: mergeSettings<BrandSettings>(DEFAULT_BRAND, byKey.get('brand')),
    theme: mergeSettings<ThemeSettings>(DEFAULT_THEME, byKey.get('theme')),
    home: mergeSettings<HomeSettings>(DEFAULT_HOME, byKey.get('home')),
    payment: resolvePayment(mergeSettings<PaymentSettings>(DEFAULT_PAYMENT, byKey.get('payment'))),
  };
});

/**
 * Cấu hình ngân hàng: giá trị admin nhập trong CSDL được ưu tiên; trường nào bỏ
 * trống thì lấy từ biến môi trường. Nhờ vậy deploy đầu tiên đã chạy được bằng
 * env, còn về sau admin đổi số tài khoản mà không cần deploy lại.
 */
function resolvePayment(stored: PaymentSettings): PaymentSettings {
  const env = bankEnvFallback();
  return {
    mode: stored.mode || env.mode,
    bankBin: stored.bankBin || env.bankBin,
    bankName: stored.bankName || env.bankName,
    accountNumber: stored.accountNumber || env.accountNumber,
    accountName: stored.accountName || env.accountName,
    branch: stored.branch || env.branch,
    prefix: stored.prefix || env.prefix,
    note: stored.note,
  };
}

/** Ghi một khóa cấu hình. RLS đảm bảo chỉ super_admin thực hiện được. */
export async function saveSetting(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'Phiên đăng nhập đã hết hạn.' };

  const { error } = await supabase
    .from('storefront_settings')
    .upsert({ key, value, updated_by: auth.user.id }, { onConflict: 'key' });

  if (error) {
    console.error('[settings] lưu thất bại:', error);
    return { ok: false, error: 'Không lưu được cấu hình. Tài khoản của bạn có thể không đủ quyền.' };
  }
  return { ok: true };
}

/** Kiểm tra quyền super_admin bằng hàm có sẵn của dashboard (0002_rls.sql). */
export async function requireSuperAdmin(): Promise<{ ok: true; userId: string } | { ok: false }> {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false };

  const { data, error } = await supabase.rpc('is_super_admin');
  if (error || data !== true) return { ok: false };

  return { ok: true, userId: auth.user.id };
}
