// src/app/api/lookup/route.ts
// Tra cứu trạng thái yêu cầu bằng mã + số điện thoại.
//
// Bắt buộc khớp CẢ HAI. Mã có dạng RFQ-202607-00001 nên rất dễ đoán; chỉ cần mã
// thôi là ai cũng xem được đơn người khác. Số điện thoại là thứ chỉ chủ đơn biết.
//
// Hạn mức ở đây chặt hơn các route khác vì đây là bề mặt duy nhất có thể dùng để
// dò đơn hàng. Việc so khớp nằm trong RPC (SECURITY DEFINER), không phải ở đây —
// anon không đọc trực tiếp được bảng nào.
import { NextResponse } from 'next/server';
import { lookupSchema } from '@/lib/validation/order';
import { lookupRequest, LookupRequestError } from '@/lib/data/orders';
import { getRequestContext } from '@/lib/security/request-context';
import { allow } from '@/lib/security/rate-limit';
import { readJson } from '@/app/api/_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { clientIp } = getRequestContext(req);
  if (!allow(`lookup:${clientIp ?? 'unknown'}`, 12, 60_000)) {
    return NextResponse.json(
      { error: 'Bạn đã tra cứu nhiều lần. Vui lòng đợi một phút rồi thử lại.' },
      { status: 429 },
    );
  }

  const parsed = lookupSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const result = await lookupRequest(parsed.data.code.toUpperCase(), parsed.data.phone);

    if (!result) {
      // Không nói rõ "sai mã" hay "sai số điện thoại" — nói rõ là chỉ điểm cho
      // người dò tìm biết họ đã đoán đúng một nửa.
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu khớp với mã và số điện thoại này. Vui lòng kiểm tra lại.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof LookupRequestError) {
      return NextResponse.json(
        {
          error:
            error.kind === 'configuration'
              ? 'Hệ thống tra cứu chưa được đồng bộ cấu hình. Nhà in đang xử lý, vui lòng thử lại sau.'
              : 'Hệ thống tra cứu đang tạm gián đoạn. Vui lòng thử lại sau.',
          code: error.kind === 'configuration' ? 'LOOKUP_CONFIG_ERROR' : 'LOOKUP_DATABASE_ERROR',
        },
        { status: 503 },
      );
    }

    console.error('[lookup] lỗi không xác định:', error);
    return NextResponse.json(
      { error: 'Hệ thống tra cứu đang tạm gián đoạn. Vui lòng thử lại sau.' },
      { status: 503 },
    );
  }
}
