// src/app/api/payments/report/route.ts
// Khách bấm "Tôi đã chuyển khoản".
//
// Đây CHỈ là lời báo của khách, không phải xác nhận đã nhận tiền. Nó chuyển đơn
// sang trạng thái 'reported' để nhân viên biết cần đối soát sao kê. Tiền vào hay
// chưa do nhân viên xác nhận trong dashboard — website không có cách nào tự biết.
// Vì vậy route này an toàn khi gọi nhầm: xấu nhất là nhân viên kiểm tra một đơn
// chưa có tiền.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { reportPayment } from '@/lib/data/orders';
import { getRequestContext } from '@/lib/security/request-context';
import { allow } from '@/lib/security/rate-limit';
import { readJson } from '@/app/api/_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  code: z.string().trim().regex(/^[A-Za-z]{3}-\d{6}-\d{5}$/, 'Mã yêu cầu không hợp lệ.'),
  token: z.string().min(32).max(256),
});

export async function POST(req: Request) {
  const { clientIp } = getRequestContext(req);
  if (!allow(`report:${clientIp ?? 'unknown'}`, 15, 60_000)) {
    return NextResponse.json({ error: 'Vui lòng đợi một chút rồi thử lại.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Mã yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const ok = await reportPayment(parsed.data.code.toUpperCase(), parsed.data.token);
  if (!ok) {
    return NextResponse.json({ error: 'Không ghi nhận được. Vui lòng gọi cho nhà in để báo chuyển khoản.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
