'use server';
import { revalidatePath } from 'next/cache';
import { guardAdminAction } from '@/lib/admin/guard';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function setPaymentStatusAction(formData: FormData): Promise<void> {
  const guard = await guardAdminAction();
  if (!guard.ok) throw new Error(guard.error);

  const orderId = String(formData.get('orderId') ?? '');
  const status = String(formData.get('status') ?? '');
  const note = String(formData.get('note') ?? '');
  if (!orderId || !['awaiting', 'reported', 'confirmed', 'cancelled'].includes(status)) {
    throw new Error('Dữ liệu thanh toán không hợp lệ.');
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('storefront_admin_set_payment_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: note || null,
  });
  if (error || data !== true) {
    console.error('[payments] cập nhật thất bại:', error);
    throw new Error('Không cập nhật được trạng thái thanh toán.');
  }

  revalidatePath('/admin/payments');
  revalidatePath('/thanh-toan/[code]', 'page');
}
