'use server';
// src/app/admin/actions.ts
// Server action cho khu quản trị.
//
// Mỗi action tự kiểm quyền. KHÔNG được tin rằng "trang đã kiểm rồi": server
// action là một endpoint HTTP thật, gọi thẳng được từ bên ngoài mà không cần đi
// qua trang nào cả.
import { revalidatePath } from 'next/cache';
import { guardAdminAction } from '@/lib/admin/guard';
import { saveSetting } from '@/lib/data/settings';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { brandSchema, homeSchema, paymentSchema, productSchema, themeSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/lib/admin/types';

/** Gom lỗi zod về dạng { tên_trường: thông báo }. */
function toFieldErrors(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join('.');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Cấu hình ảnh hưởng tới MỌI trang, và các trang công khai đang dùng ISR
 * (revalidate 300). Không quét lại cache thì admin lưu xong vẫn thấy giao diện
 * cũ tới 5 phút và sẽ tưởng là lưu hỏng.
 */
function revalidateSite() {
  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------

export async function saveBrandAction(input: unknown): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu chưa hợp lệ.', fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const result = await saveSetting('brand', parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateSite();
  return { ok: true };
}

export async function saveThemeAction(input: unknown): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu chưa hợp lệ.', fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const result = await saveSetting('theme', parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateSite();
  return { ok: true };
}

export async function saveHomeAction(input: unknown): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = homeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu chưa hợp lệ.', fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const result = await saveSetting('home', parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateSite();
  return { ok: true };
}

export async function savePaymentAction(input: unknown): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu chưa hợp lệ.', fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Chặn cấu hình dở dang: có BIN mà thiếu số tài khoản (hoặc ngược lại) sẽ sinh
  // ra mã QR quét được nhưng chuyển nhầm chỗ. Thà không hiện QR còn hơn.
  const { bankBin, accountNumber, accountName } = parsed.data;
  const filled = [bankBin, accountNumber, accountName].filter(Boolean).length;
  if (filled > 0 && filled < 3) {
    return {
      ok: false,
      error: 'Cần điền đủ mã BIN, số tài khoản và tên chủ tài khoản — hoặc để trống cả ba.',
    };
  }

  const result = await saveSetting('payment', parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateSite();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sản phẩm
// ---------------------------------------------------------------------------

export async function saveProductAction(input: unknown): Promise<ActionResult & { slug?: string }> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu chưa hợp lệ.', fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const data = parsed.data;

  // Sản phẩm cần cọc mà không ghi số tiền cọc thì khách bấm vào sẽ ra QR 0đ.
  if (data.pricingType === 'DEPOSIT_REQUIRED' && !data.depositAmount) {
    return { ok: false, error: 'Sản phẩm đặt cọc phải có số tiền cọc lớn hơn 0.', fieldErrors: { depositAmount: 'Chưa nhập tiền cọc.' } };
  }

  const supabase = await createSupabaseServerClient();

  // Các cột suy ra từ pricingType. Để chúng tự tính ở đây thay vì bắt admin tự
  // tick cho khớp — tick lệch nhau là sinh ra trạng thái vô nghĩa
  // (vừa "cần báo giá" vừa "cho thanh toán ngay").
  const row = {
    slug: data.slug,
    sku: data.sku,
    name: data.name,
    product_type_code: data.productTypeCode,
    short_description: data.shortDescription || null,
    long_description: data.longDescription || null,
    image_url: data.imageUrl || null,
    pricing_type: data.pricingType,
    price_from: data.priceFrom,
    price_unit: data.priceUnit || null,
    lead_time: data.leadTime || null,
    category: data.category,
    service_type: data.serviceType,
    needs_quote: data.pricingType !== 'FIXED_PRICE',
    allow_instant_payment: data.pricingType === 'FIXED_PRICE',
    requires_deposit: data.pricingType === 'DEPOSIT_REQUIRED',
    deposit_amount: data.pricingType === 'DEPOSIT_REQUIRED' ? data.depositAmount : null,
    is_featured: data.isFeatured,
    is_published: data.isPublished,
    sort_order: data.sortOrder,
    seo_title: data.seoTitle || null,
    seo_description: data.seoDescription || null,
  };

  const query = data.id
    ? supabase.from('storefront_products').update(row).eq('id', data.id)
    : supabase.from('storefront_products').insert(row);

  const { error } = await query;

  if (error) {
    console.error('[admin] lưu sản phẩm thất bại:', error);
    // 23505 = trùng khóa duy nhất. Nói rõ trùng ở đâu thay vì báo lỗi chung chung.
    if (error.code === '23505') {
      const field = error.message.includes('slug') ? 'slug' : 'sku';
      return {
        ok: false,
        error: field === 'slug' ? 'Đường dẫn này đã có sản phẩm khác dùng.' : 'Mã SKU này đã tồn tại.',
        fieldErrors: { [field]: 'Đã được dùng.' },
      };
    }
    return { ok: false, error: 'Không lưu được sản phẩm. Tài khoản của bạn có thể không đủ quyền.' };
  }

  revalidateSite();
  return { ok: true, slug: data.slug };
}

export async function toggleProductPublishAction(id: string, isPublished: boolean): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('storefront_products').update({ is_published: isPublished }).eq('id', id);

  if (error) {
    console.error('[admin] đổi trạng thái hiển thị thất bại:', error);
    return { ok: false, error: 'Không đổi được trạng thái.' };
  }

  revalidateSite();
  return { ok: true };
}

/**
 * Xóa mềm. Xóa cứng sẽ làm hỏng các bản chụp đơn cũ đang trỏ tới sản phẩm này —
 * khách mở lại trang thanh toán của đơn cũ sẽ thấy trang lỗi.
 */
export async function deleteProductAction(id: string): Promise<ActionResult> {
  const guard = await guardAdminAction();
  if (!guard.ok) return { ok: false, error: guard.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('storefront_products')
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq('id', id);

  if (error) {
    console.error('[admin] xóa sản phẩm thất bại:', error);
    return { ok: false, error: 'Không xóa được sản phẩm.' };
  }

  revalidateSite();
  return { ok: true };
}
