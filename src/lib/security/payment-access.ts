import 'server-only';
// Token truy cập trang thanh toán. Mã RFQ có thứ tự và có thể đoán, vì vậy
// không được dùng một mình để mở thông tin đơn. Token được ký HMAC bằng secret
// phía server, không lưu bản thô trong CSDL.
import { createHash, createHmac } from 'node:crypto';
import { sessionSecret } from '@/lib/env';

export function issuePaymentAccessToken(requestCode: string): string {
  return createHmac('sha256', sessionSecret())
    .update(`payment:${requestCode.toUpperCase()}`)
    .digest('base64url');
}

export function hashPaymentAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
