// src/app/api/session/route.ts
// Đổi token Turnstile lấy một phiên chống bot có ký HMAC.
//
// Token Turnstile chỉ dùng được MỘT LẦN, trong khi một lượt gửi form gồm nhiều
// lượt gọi API (init + complete cho từng file, rồi tạo yêu cầu). Vì vậy xác minh
// đúng một lần ở đây rồi phát cookie cho các lượt sau — khách chỉ giải captcha
// một lần và mọi lượt gọi sau vẫn được kiểm soát.
import { NextResponse } from 'next/server';
import { sessionSchema } from '@/lib/validation/order';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { issueSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/security/session';
import { getRequestContext } from '@/lib/security/request-context';
import { allow } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { clientIp } = getRequestContext(req);

  // Chặn việc dùng route này để dò key Turnstile hàng loạt.
  if (!allow(`session:${clientIp ?? 'unknown'}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Bạn thao tác hơi nhanh. Vui lòng đợi một phút rồi thử lại.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu xác minh không hợp lệ.' }, { status: 400 });
  }

  const result = await verifyTurnstile(parsed.data.turnstileToken, clientIp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, issueSessionToken(), SESSION_COOKIE_OPTIONS);
  return response;
}
