import 'server-only';
// src/lib/security/session.ts
// Session ngắn hạn có ký HMAC, phát ra sau khi Turnstile xác minh thành công.
//
// VÌ SAO CẦN: token Turnstile chỉ dùng được một lần, trong khi một lượt gửi form
// gồm nhiều lượt gọi API (init từng file, complete từng file, rồi tạo yêu cầu).
// Xác minh một lần rồi cấp session cho cả phiên là cách duy nhất vừa đúng vừa
// không làm khách phải giải captcha nhiều lần.
//
// Session KHÔNG phải thứ nhận dạng khách. Nó chỉ chứng minh "phiên này đã qua
// kiểm tra chống bot", nên không có dữ liệu cá nhân bên trong.
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { sessionSecret } from '@/lib/env';

const TTL_MS = 60 * 60 * 1000; // 1 giờ — đủ để khách điền form và upload file.
export const SESSION_COOKIE = 'sf_verify';

interface SessionPayload {
  jti: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac('sha256', sessionSecret()).update(data).digest('base64url');
}

/** Tạo session token: <payload base64url>.<chữ ký>. */
export function issueSessionToken(): string {
  const payload: SessionPayload = { jti: randomUUID(), exp: Date.now() + TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

/** Kiểm tra chữ ký và hạn dùng. So sánh chữ ký theo thời gian hằng số. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: TTL_MS / 1000,
} as const;
