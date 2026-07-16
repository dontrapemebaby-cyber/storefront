// src/app/api/orders/route.ts
// Tạo yêu cầu in. Đây là route quan trọng nhất của website.
//
// Thứ tự các bước, cố ý như vậy:
//   1. Kiểm phiên chống bot + hạn mức.
//   2. Kiểm dữ liệu bằng Zod (khớp đúng ràng buộc của dashboard).
//   3. Đọc sản phẩm từ CSDL và TÍNH LẠI GIÁ TỪ ĐẦU. Trình duyệt không gửi giá
//      và nếu có gửi cũng bị bỏ qua — mọi con số đều sinh ra ở đây.
//   4. Gọi dashboard tạo RFQ (kèm Idempotency-Key).
//   5. Ghi bản chụp đơn để dựng trang thanh toán và tra cứu.
//
// Bước 4 trước bước 5 là có chủ đích: dashboard là nguồn sự thật. Nếu bước 5 hỏng
// thì khách vẫn có mã yêu cầu hợp lệ và nhân viên vẫn thấy đơn — chỉ mất phần QR
// tự động, xử lý tay được. Nếu làm ngược lại, bản chụp có thể trỏ tới một RFQ
// không tồn tại.
import { NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation/order';
import { getProductBySlug } from '@/lib/data/products';
import { getSiteSettings } from '@/lib/data/settings';
import { calculatePrice, toCm } from '@/lib/pricing';
import { createPrintRequest, DashboardError, type PrintRequestPayload } from '@/lib/dashboard/client';
import { registerOrder } from '@/lib/data/orders';
import { buildPaymentReference } from '@/lib/vietqr';
import { hashPaymentAccessToken, issuePaymentAccessToken } from '@/lib/security/payment-access';
import { guardPublicRoute, readJson } from '@/app/api/_guard';
import type { Product } from '@/types/storefront';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Bỏ chuỗi rỗng: dashboard coi '' là giá trị, còn ta muốn là "không nhập". */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Quy đổi đơn vị hay sinh ra số lẻ dài (100mm -> 10.000000000000002cm). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Đổi lựa chọn từ khóa máy sang chữ người đọc được.
 * Nhân viên nhìn đơn trong dashboard thấy "Chất liệu: Decal sữa" chứ không phải
 * "material: decal_sua".
 */
function describeSelections(product: Product, selections: Record<string, string>): string[] {
  const lines: string[] = [];
  for (const option of product.options) {
    const chosen = selections[option.key];
    if (!chosen) continue;
    const value = option.values.find((v) => v.value === chosen);
    if (value) lines.push(`${option.label}: ${value.label}`);
  }
  return lines;
}

/** Lấy nhãn của một nhóm tùy chọn theo key, để đổ vào đúng cột của dashboard. */
function labelFor(product: Product, selections: Record<string, string>, key: string): string | undefined {
  const option = product.options.find((o) => o.key === key);
  if (!option) return undefined;
  const chosen = selections[key];
  if (!chosen) return undefined;
  return option.values.find((v) => v.value === chosen)?.label;
}

export async function POST(req: Request) {
  const guard = await guardPublicRoute(req, { bucket: 'orders', limit: 10, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  const parsed = createOrderSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? 'Thông tin chưa hợp lệ.', field: issue?.path.join('.') },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const product = await getProductBySlug(input.productSlug);
  if (!product) {
    return NextResponse.json({ error: 'Sản phẩm không còn nhận đặt. Vui lòng chọn sản phẩm khác.' }, { status: 404 });
  }

  // --- Tính lại giá ở server --------------------------------------------------
  const unit = input.request.unit;
  const widthCm = input.request.width !== undefined ? toCm(input.request.width, unit) : undefined;
  const heightCm = input.request.height !== undefined ? toCm(input.request.height, unit) : undefined;

  const priced = calculatePrice(product, {
    selections: input.selections,
    quantity: input.request.quantity,
    widthCm: widthCm ?? undefined,
    heightCm: heightCm ?? undefined,
  });

  if (!priced.ok) {
    return NextResponse.json({ error: priced.message }, { status: 400 });
  }

  // --- Dựng payload cho dashboard ---------------------------------------------
  const selectionLines = describeSelections(product, input.selections);
  const noteParts = [
    `Sản phẩm trên website: ${product.name}`,
    ...selectionLines,
    clean(input.request.customerNote) ? `Ghi chú của khách: ${input.request.customerNote!.trim()}` : null,
  ].filter((v): v is string => v !== null);

  if (priced.breakdown.total > 0) {
    noteParts.push(`Giá website tự tính: ${priced.breakdown.total.toLocaleString('vi-VN')}đ (nhân viên vui lòng đối chiếu).`);
  }

  // Kích thước gửi sang dashboard LUÔN quy về cm, lấy từ kết quả tính giá chứ
  // không lấy lại từ trình duyệt. Lý do: một lựa chọn có thể tự ấn định kích
  // thước (khổ A4 -> 21 × 29,7cm), và calculatePrice() là chỗ duy nhất biết
  // điều đó. Gửi kèm unit: 'cm' để nhân viên đọc đúng con số.
  const material = labelFor(product, input.selections, 'material') ?? clean(input.request.material);
  const finishing = labelFor(product, input.selections, 'finishing') ?? clean(input.request.finishing);

  const payload: PrintRequestPayload = {
    customer: {
      fullName: input.customer.fullName,
      phone: input.customer.phone,
      ...(clean(input.customer.zalo) ? { zalo: clean(input.customer.zalo)! } : {}),
      ...(clean(input.customer.email) ? { email: clean(input.customer.email)! } : {}),
      ...(clean(input.customer.companyName) ? { companyName: clean(input.customer.companyName)! } : {}),
    },
    request: {
      productTypeCode: product.productTypeCode,
      unit: 'cm',
      // Số lượng cũng lấy từ kết quả tính giá: combo "100 tem" tự ấn định 100.
      quantity: priced.quantity,
      ...(priced.widthCm !== undefined ? { width: round2(priced.widthCm) } : {}),
      ...(priced.heightCm !== undefined ? { height: round2(priced.heightCm) } : {}),
      ...(material ? { material } : {}),
      ...(finishing ? { finishing } : {}),
      ...(clean(input.request.neededDate) ? { neededDate: clean(input.request.neededDate)! } : {}),
      ...(clean(input.request.deliveryAddress) ? { deliveryAddress: clean(input.request.deliveryAddress)! } : {}),
      ...(clean(input.request.installationAddress) ? { installationAddress: clean(input.request.installationAddress)! } : {}),
      ...(input.request.budget !== undefined ? { budget: input.request.budget } : {}),
      ...(input.request.preferredContactMethod ? { preferredContactMethod: input.request.preferredContactMethod } : {}),
      customerNote: noteParts.join('\n').slice(0, 2000),
    },
    ...(input.uploadIds.length ? { uploads: input.uploadIds.map((uploadId) => ({ uploadId })) } : {}),
    source: 'website',
  };

  // --- Gọi dashboard ----------------------------------------------------------
  let requestCode: string;
  try {
    const created = await createPrintRequest(payload, {
      ...guard.context,
      idempotencyKey: input.idempotencyKey,
    });
    requestCode = created.requestCode;
  } catch (error) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 500 ? 502 : error.status });
    }
    console.error('[api/orders] không tạo được yêu cầu:', error);
    return NextResponse.json({ error: 'Không gửi được yêu cầu. Vui lòng thử lại sau ít phút.' }, { status: 500 });
  }

  // --- Ghi bản chụp -----------------------------------------------------------
  const settings = await getSiteSettings();
  const amountDue = priced.breakdown.amountDue;
  const paymentReference = amountDue > 0 ? buildPaymentReference(settings.payment.prefix, requestCode) : null;
  const paymentAccessToken = issuePaymentAccessToken(requestCode);

  const snapshot = await registerOrder({
    requestCode,
    productId: product.id,
    productName: product.name,
    pricingType: product.pricingType,
    options: input.selections,
    breakdown: priced.breakdown,
    amountTotal: priced.breakdown.total,
    amountDue,
    paymentKind: priced.breakdown.paymentKind,
    paymentReference,
    customerName: input.customer.fullName,
    customerPhone: input.customer.phone,
    accessTokenHash: hashPaymentAccessToken(paymentAccessToken),
  });

  // Yêu cầu đã vào dashboard rồi. Bản chụp hỏng thì mất trang QR, nhưng KHÔNG
  // được giấu mã của khách — nhân viên sẽ gọi lại và xử lý phần tiền bằng tay.
  const canPay = amountDue > 0 && snapshot.ok;

  return NextResponse.json({
    success: true,
    requestCode,
    amountDue: canPay ? amountDue : 0,
    paymentKind: canPay ? priced.breakdown.paymentKind : 'none',
    redirectTo: canPay
      ? `/thanh-toan/${requestCode}?token=${encodeURIComponent(paymentAccessToken)}`
      : `/cam-on?ma=${encodeURIComponent(requestCode)}`,
  });
}
