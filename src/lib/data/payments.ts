import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AdminPaymentRow {
  id: string;
  requestCode: string;
  productName: string;
  amountDue: number;
  paymentKind: 'none' | 'full' | 'deposit';
  paymentStatus: 'awaiting' | 'reported' | 'confirmed' | 'cancelled';
  paymentReference: string | null;
  customerName: string;
  customerPhone: string;
  reportedAt: string | null;
  verifiedAt: string | null;
  updatedAt: string;
}

interface PaymentDbRow {
  id: string;
  request_code: string;
  product_name: string;
  amount_due: string | number;
  payment_kind: AdminPaymentRow['paymentKind'];
  payment_status: AdminPaymentRow['paymentStatus'];
  payment_reference: string | null;
  customer_name: string;
  customer_phone: string;
  reported_at: string | null;
  verified_at: string | null;
  updated_at: string;
}

export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('storefront_orders')
    .select('id, request_code, product_name, amount_due, payment_kind, payment_status, payment_reference, customer_name, customer_phone, reported_at, verified_at, updated_at')
    .neq('payment_kind', 'none')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[payments] không đọc được danh sách:', error);
    return [];
  }

  return ((data ?? []) as unknown as PaymentDbRow[]).map((row) => ({
    id: row.id,
    requestCode: row.request_code,
    productName: row.product_name,
    amountDue: Number(row.amount_due),
    paymentKind: row.payment_kind,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    reportedAt: row.reported_at,
    verifiedAt: row.verified_at,
    updatedAt: row.updated_at,
  }));
}
