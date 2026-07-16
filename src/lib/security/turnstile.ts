import 'server-only';
// src/lib/security/turnstile.ts
// Xác minh Cloudflare Turnstile ở backend website.
//
// LƯU Ý VỀ KIẾN TRÚC: token Turnstile chỉ dùng được MỘT LẦN. Khách gửi một form
// nhưng có thể upload nhiều file (nhiều lượt gọi API), nên không thể dùng lại
// token cho từng lượt. Cách làm ở đây: xác minh token đúng một lần ở /api/session,
// rồi phát một session token có ký HMAC (xem session.ts) cho các lượt gọi sau.
// Vì vậy website KHÔNG chuyển tiếp token Turnstile sang dashboard.
import { turnstileEnv } from '@/lib/env';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  error?: string;
}

export function isTurnstileEnabled(): boolean {
  return turnstileEnv().required;
}

export async function verifyTurnstile(token: string | null | undefined, ip?: string | null): Promise<TurnstileResult> {
  const { secretKey } = turnstileEnv();

  // Chưa cấu hình Turnstile (thường là môi trường dev) -> bỏ qua bước này.
  if (!isTurnstileEnabled()) return { ok: true };

  if (!token) return { ok: false, error: 'Thiếu mã xác minh chống bot. Vui lòng tải lại trang.' };

  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (ip) body.set('remoteip', ip);

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success === true) return { ok: true };

    console.warn('[turnstile] xác minh thất bại:', data['error-codes']);
    return { ok: false, error: 'Xác minh chống bot không thành công. Vui lòng tải lại trang và thử lại.' };
  } catch (error) {
    // Không fail-open: nếu đã bật Turnstile mà không xác minh được thì từ chối.
    console.error('[turnstile] lỗi khi gọi siteverify:', error);
    return { ok: false, error: 'Không xác minh được chống bot. Vui lòng thử lại sau ít phút.' };
  }
}
