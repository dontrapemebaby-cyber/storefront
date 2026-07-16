import 'server-only';
// src/lib/data/orders.ts
// Bản chụp đơn của website: giá đã tính ở server, số tiền phải trả, nội dung
// chuyển khoản. Nguồn sự thật của YÊU CẦU vẫn là print_requests trong dashboard;
// bảng này chỉ giữ thứ dashboard không có.
//
// Mọi hàm ở đây gọi RPC kèm STOREFRONT_RPC_SECRET. anon không có quyền đọc/ghi
// trực tiếp bảng storefront_orders, nên kể cả khi anon key lộ ra (vốn dĩ nó công
// khai) cũng không ai đọc được đơn của người khác.
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { rpcSecret } from '@/lib/env';
import type { PriceBreakdown } from '@/types/storefront';

export interface RegisterOrderInput {
  requestCode: string;
  productId: string;
  productName: string;
  pricingType: string;
  options: Record<string, unknown>;
  breakdown: PriceBreakdown;
  amountTotal: number;
  amountDue: number;
  paymentKind: 'none' | 'full' | 'deposit';
  paymentReference: string | null;
  customerName: string;
  customerPhone: string;
  accessTokenHash: string;
}

export async function registerOrder(input: RegisterOrderInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAnonClient();

  const { error } = await supabase.rpc('storefront_register_order', {
    p_secret: rpcSecret(),
    p_request_code: input.requestCode,
    p_product_id: input.productId,
    p_product_name: input.productName,
    p_pricing_type: input.pricingType,
    p_options: input.options,
    p_breakdown: input.breakdown,
    p_amount_total: input.amountTotal,
    p_amount_due: input.amountDue,
    p_payment_kind: input.paymentKind,
    p_payment_ref: input.paymentReference,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_access_token_hash: input.accessTokenHash,
  });

  if (error) {
    // Yêu cầu đã tạo thành công ở dashboard rồi; ghi bản chụp hỏng thì khách vẫn
    // phải nhận được mã. Ghi log để nhân viên xử lý thủ công phần thanh toán.
    console.error('[orders] không ghi được bản chụp đơn:', input.requestCode, error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export interface OrderSnapshot {
  requestCode: string;
  productName: string;
  pricingType: string;
  amountTotal: number;
  amountDue: number;
  paymentKind: 'none' | 'full' | 'deposit';
  paymentReference: string | null;
  paymentStatus: 'awaiting' | 'reported' | 'confirmed' | 'cancelled';
  breakdown: PriceBreakdown | null;
  options: Record<string, string>;
  customerName: string;
  requestStatus: string;
  createdAt: string;
}

interface OrderRow {
  o_request_code: string;
  o_product_name: string;
  o_pricing_type: string;
  o_amount_total: string | number;
  o_amount_due: string | number;
  o_payment_kind: string;
  o_payment_ref: string | null;
  o_payment_status: string;
  o_breakdown: unknown;
  o_options: unknown;
  o_customer_name: string;
  o_status: string;
  o_created_at: string;
}

export async function getOrder(requestCode: string, accessToken: string): Promise<OrderSnapshot | null> {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('storefront_get_order', {
    p_secret: rpcSecret(),
    p_request_code: requestCode,
    p_access_token: accessToken,
  });

  if (error) {
    console.error('[orders] không đọc được đơn:', error);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as OrderRow | undefined;
  if (!row) return null;

  return {
    requestCode: row.o_request_code,
    productName: row.o_product_name,
    pricingType: row.o_pricing_type,
    amountTotal: Number(row.o_amount_total),
    amountDue: Number(row.o_amount_due),
    paymentKind: row.o_payment_kind as OrderSnapshot['paymentKind'],
    paymentReference: row.o_payment_ref,
    paymentStatus: row.o_payment_status as OrderSnapshot['paymentStatus'],
    breakdown: (row.o_breakdown ?? null) as PriceBreakdown | null,
    options: (row.o_options ?? {}) as Record<string, string>,
    customerName: row.o_customer_name,
    requestStatus: row.o_status,
    createdAt: row.o_created_at,
  };
}

export async function reportPayment(requestCode: string, accessToken: string): Promise<boolean> {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('storefront_report_payment', {
    p_secret: rpcSecret(),
    p_request_code: requestCode,
    p_access_token: accessToken,
  });

  if (error) {
    console.error('[orders] không ghi nhận báo chuyển khoản:', error);
    return false;
  }
  return data === true;
}

export interface LookupResult {
  code: string;
  status: string;
  productName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  amountDue: number;
  paymentKind: string;
  paymentStatus: string;
  quoteTotal: number | null;
  quoteValidUntil: string | null;
}

interface LookupRow {
  o_code: string;
  o_status: string;
  o_product_name: string;
  o_quantity: number;
  o_created_at: string;
  o_updated_at: string;
  o_amount_due: string | number;
  o_payment_kind: string;
  o_payment_status: string;
  o_quote_total: string | number | null;
  o_quote_valid_until: string | null;
}

/**
 * Tra cứu bằng mã yêu cầu + số điện thoại. Phải khớp CẢ HAI: chỉ mã thôi thì
 * người khác đoán được mã là xem được đơn của bạn.
 */
export async function lookupRequest(code: string, phone: string): Promise<LookupResult | null> {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('storefront_lookup_request', {
    p_secret: rpcSecret(),
    p_code: code,
    p_phone: phone,
  });

  if (error) {
    console.error('[orders] tra cứu thất bại:', error);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as LookupRow | undefined;
  if (!row) return null;

  return {
    code: row.o_code,
    status: row.o_status,
    productName: row.o_product_name,
    quantity: row.o_quantity,
    createdAt: row.o_created_at,
    updatedAt: row.o_updated_at,
    amountDue: Number(row.o_amount_due),
    paymentKind: row.o_payment_kind,
    paymentStatus: row.o_payment_status,
    quoteTotal: row.o_quote_total !== null && row.o_quote_total !== undefined ? Number(row.o_quote_total) : null,
    quoteValidUntil: row.o_quote_valid_until,
  };
}
