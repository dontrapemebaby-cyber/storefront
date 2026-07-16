import 'server-only';
// src/app/api/_guard.ts
// Cổng chung cho các route công khai: kiểm phiên chống bot + hạn mức tần suất.
//
// Tách ra một chỗ để mọi route dùng đúng một logic. Route nào quên gọi guard là
// nhìn thấy ngay khi đọc code, thay vì phải dò từng file xem đã kiểm chưa.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/security/session';
import { getRequestContext, type RequestContext } from '@/lib/security/request-context';
import { allow } from '@/lib/security/rate-limit';

export interface GuardOptions {
  /** Số lượt tối đa trong cửa sổ, tính theo IP. */
  limit: number;
  windowMs: number;
  /** Tên để tách bộ đếm giữa các route. */
  bucket: string;
}

export type GuardResult =
  | { ok: true; context: RequestContext }
  | { ok: false; response: NextResponse };

/**
 * Kiểm tra một lượt gọi từ trình duyệt trước khi đụng tới dashboard.
 * Thứ tự cố ý: rate limit trước (rẻ), rồi mới tới phiên.
 */
export async function guardPublicRoute(req: Request, options: GuardOptions): Promise<GuardResult> {
  const context = getRequestContext(req);

  if (!allow(`${options.bucket}:${context.clientIp ?? 'unknown'}`, options.limit, options.windowMs)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Bạn gửi hơi nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một chút rồi thử lại.' },
        { status: 429 },
      ),
    };
  }

  const store = await cookies();
  if (!verifySessionToken(store.get(SESSION_COOKIE)?.value)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang và thử lại.' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, context };
}

/** Đọc JSON an toàn — thân rỗng hoặc hỏng không được làm sập route. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
