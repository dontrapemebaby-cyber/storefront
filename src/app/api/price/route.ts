// src/app/api/price/route.ts
// Tính giá để HIỂN THỊ trên trang sản phẩm. Không tạo gì, không lưu gì.
//
// Route này không phải nơi quyết định tiền: /api/orders tính lại từ đầu bằng
// chính calculatePrice() trước khi tạo yêu cầu và sinh QR. Ở đây chỉ để khách
// thấy con số ngay khi đổi lựa chọn.
//
// Không cần phiên chống bot: dữ liệu trả về đã công khai trên trang sản phẩm,
// chặn ở đây chỉ làm khách xem giá bị phiền. Vẫn giữ rate limit cho lành.
import { NextResponse } from 'next/server';
import { priceQuerySchema } from '@/lib/validation/order';
import { getProductBySlug } from '@/lib/data/products';
import { calculatePrice, toCm } from '@/lib/pricing';
import { getRequestContext } from '@/lib/security/request-context';
import { allow } from '@/lib/security/rate-limit';
import { readJson } from '@/app/api/_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { clientIp } = getRequestContext(req);
  if (!allow(`price:${clientIp ?? 'unknown'}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Bạn thao tác hơi nhanh. Vui lòng đợi một chút.' }, { status: 429 });
  }

  const parsed = priceQuerySchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const { productSlug, selections, quantity, width, height, unit } = parsed.data;

  const product = await getProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  }

  // px không phải đơn vị vật lý nên không tính được giá theo diện tích.
  const widthCm = width !== undefined ? toCm(width, unit) : undefined;
  const heightCm = height !== undefined ? toCm(height, unit) : undefined;
  if (widthCm === null || heightCm === null) {
    return NextResponse.json({ error: 'Vui lòng chọn đơn vị đo là cm, mm, m hoặc inch.' }, { status: 400 });
  }

  const result = calculatePrice(product, {
    selections,
    quantity,
    widthCm: widthCm ?? undefined,
    heightCm: heightCm ?? undefined,
  });

  if (!result.ok) {
    // Không phải lỗi hệ thống — khách chỉ chưa nhập đủ. Trả 200 kèm thông báo
    // để trang sản phẩm hiện gợi ý ngay dưới ô giá thay vì báo đỏ.
    return NextResponse.json({ ok: false, message: result.message });
  }

  return NextResponse.json({ ok: true, breakdown: result.breakdown });
}
