import 'server-only';
// src/lib/security/request-context.ts
// Trích IP và user-agent thật của khách để chuyển tiếp sang dashboard.
//
// Nếu không chuyển tiếp, dashboard sẽ thấy mọi khách đến từ cùng một IP (IP của
// server website) và rate limit theo IP sẽ khóa nhầm toàn bộ khách khi một người
// gửi nhiều. Cách đọc header khớp với getClientIp() của dashboard.

export interface RequestContext {
  clientIp: string | null;
  userAgent: string | null;
}

export function getRequestContext(req: Request): RequestContext {
  const xff = req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for');
  const clientIp = xff ? (xff.split(',')[0] ?? '').trim() || null : req.headers.get('x-real-ip');

  return {
    clientIp: clientIp || null,
    userAgent: req.headers.get('user-agent'),
  };
}
