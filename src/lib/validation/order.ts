// src/lib/validation/order.ts
// Schema Zod cho form khách hàng.
//
// QUAN TRỌNG: các ràng buộc ở đây được chép đúng theo
// dashboard/src/lib/validation/public-request.ts. Nếu nới lỏng ở đây, dashboard
// vẫn từ chối và khách nhận lỗi khó hiểu ở bước cuối. Giữ hai bên khớp nhau để
// khách thấy lỗi ngay tại ô nhập.
//
// Không có giá trong bất kỳ schema nào — giá do server tự tính (xem lib/pricing.ts).
import { z } from 'zod';

/**
 * Chuẩn hóa số điện thoại Việt Nam về 0xxxxxxxxx.
 * Sao đúng logic normalizeVnPhone() của dashboard để hai bên ra cùng một chuỗi,
 * nhờ đó khách nhập '+84 90 123 4567' hay '090.123.4567' đều tra cứu được.
 */
export function normalizeVnPhone(input: string): string {
  let s = (input ?? '').replace(/[\s.\-()]/g, '').trim();
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('0084')) s = '0' + s.slice(4);
  else if (s.startsWith('84') && s.length === 11) s = '0' + s.slice(2);
  return s;
}

export const vnPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số điện thoại.')
  .transform(normalizeVnPhone)
  .refine((v) => /^0\d{9}$/.test(v), 'Số điện thoại chưa đúng. Ví dụ đúng: 0901234567.');

export const customerSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(200, 'Họ tên quá dài.'),
  phone: vnPhoneSchema,
  zalo: z.string().trim().max(50, 'Số Zalo quá dài.').optional().or(z.literal('')),
  email: z.string().trim().email('Email chưa đúng định dạng.').optional().or(z.literal('')),
  companyName: z.string().trim().max(200, 'Tên công ty quá dài.').optional().or(z.literal('')),
});

export const sizeUnitSchema = z.enum(['cm', 'mm', 'm', 'inch', 'px']);
export const contactMethodSchema = z.enum(['call', 'zalo', 'email', 'message']);

/** Thông số kỹ thuật. Khớp requestDetailSchema của dashboard. */
export const requestDetailSchema = z.object({
  width: z.number().positive('Chiều rộng phải lớn hơn 0.').optional(),
  height: z.number().positive('Chiều cao phải lớn hơn 0.').optional(),
  unit: sizeUnitSchema.default('cm'),
  quantity: z.number().int('Số lượng phải là số nguyên.').positive('Số lượng phải lớn hơn 0.').default(1),
  material: z.string().trim().max(200).optional().or(z.literal('')),
  finishing: z.string().trim().max(200).optional().or(z.literal('')),
  neededDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng định dạng.')
    .optional()
    .or(z.literal('')),
  deliveryAddress: z.string().trim().max(500, 'Địa chỉ quá dài.').optional().or(z.literal('')),
  installationAddress: z.string().trim().max(500, 'Địa chỉ quá dài.').optional().or(z.literal('')),
  budget: z.number().nonnegative('Ngân sách không hợp lệ.').optional(),
  preferredContactMethod: contactMethodSchema.optional(),
  customerNote: z.string().trim().max(2000, 'Ghi chú quá dài (tối đa 2000 ký tự).').optional().or(z.literal('')),
});

export const consentSchema = z.object({
  rightsConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần xác nhận quyền sử dụng nội dung trong file.' }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần đồng ý với chính sách bảo mật.' }),
  }),
});

/** Payload từ trình duyệt gửi lên /api/orders. */
export const createOrderSchema = z.object({
  productSlug: z.string().trim().min(1, 'Vui lòng chọn sản phẩm.'),
  /** Lựa chọn: { material: 'couche_300' }. Server tự tra giá theo key/value. */
  selections: z.record(z.string().max(100), z.string().max(100)).default({}),
  customer: customerSchema,
  request: requestDetailSchema,
  uploadIds: z.array(z.string().trim().min(1).max(100)).max(20, 'Tối đa 20 file mỗi yêu cầu.').default([]),
  consent: consentSchema,
  /** Khách bấm hai lần vẫn chỉ tạo một yêu cầu. Trình duyệt sinh và giữ nguyên. */
  idempotencyKey: z.string().trim().uuid('Khóa chống trùng không hợp lệ.'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Payload cho /api/price — chỉ để hiển thị, không tạo gì cả. */
export const priceQuerySchema = z.object({
  productSlug: z.string().trim().min(1),
  selections: z.record(z.string().max(100), z.string().max(100)).default({}),
  quantity: z.number().int().positive().max(1_000_000).default(1),
  width: z.number().positive().max(100_000).optional(),
  height: z.number().positive().max(100_000).optional(),
  unit: sizeUnitSchema.default('cm'),
});

export const uploadInitSchema = z.object({
  filename: z.string().trim().min(1, 'Thiếu tên file.').max(255, 'Tên file quá dài.'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'application/pdf', 'image/svg+xml', 'application/zip'], {
    errorMap: () => ({ message: 'Định dạng file không được hỗ trợ. Chỉ nhận PNG, JPG, PDF, SVG, ZIP.' }),
  }),
  sizeBytes: z.number().int().positive('Dung lượng file không hợp lệ.'),
});

export const uploadCompleteSchema = z.object({
  uploadId: z.string().trim().min(1).max(100),
});

export const lookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã yêu cầu.')
    .max(50)
    .regex(/^[A-Za-z]{3}-\d{6}-\d{5}$/, 'Mã yêu cầu có dạng RFQ-202607-00001.'),
  phone: vnPhoneSchema,
});

export const sessionSchema = z.object({
  turnstileToken: z.string().trim().max(4000).optional(),
});
