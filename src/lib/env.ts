import 'server-only';
// src/lib/env.ts
// Đọc biến môi trường ở phía server. Fail nhanh và nói rõ thiếu biến nào, thay
// vì để lỗi mơ hồ lúc chạy. Không có secret nào trong file này.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Thiếu biến môi trường ${name}. Xem .env.example và cấu hình trên Netlify.`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

/** Cấu hình gọi public API của dashboard. API key CHỈ tồn tại ở server. */
export function dashboardEnv() {
  return {
    apiUrl: required('DASHBOARD_API_URL').replace(/\/+$/, ''),
    apiKey: required('DASHBOARD_API_KEY'),
  };
}

export function supabaseEnv() {
  return {
    url: required('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

/** Bí mật để backend website gọi RPC storefront_* (không ra trình duyệt). */
export function rpcSecret(): string {
  return required('STOREFRONT_RPC_SECRET');
}

export function turnstileEnv() {
  return {
    siteKey: optional('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
    secretKey: optional('TURNSTILE_SECRET_KEY'),
    get required() {
      return optional('NEXT_PUBLIC_TURNSTILE_SITE_KEY') !== '' && optional('TURNSTILE_SECRET_KEY') !== '';
    },
  };
}

/** Khóa ký session chống bot. Bắt buộc ở production. */
export function sessionSecret(): string {
  const value = optional('SESSION_SECRET');
  if (value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Thiếu SESSION_SECRET (tối thiểu 32 ký tự) ở môi trường production.');
  }
  return 'dev-only-session-secret-do-not-use-in-production';
}

export function appUrl(): string {
  return optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/+$/, '');
}

/** Giá trị dự phòng cho cấu hình ngân hàng khi admin chưa nhập trong CSDL. */
export function bankEnvFallback() {
  return {
    mode: (optional('BANK_QR_MODE', 'vietqr_image') === 'emv' ? 'emv' : 'vietqr_image') as 'emv' | 'vietqr_image',
    bankBin: optional('BANK_BIN'),
    accountNumber: optional('BANK_ACCOUNT_NUMBER'),
    accountName: optional('BANK_ACCOUNT_NAME'),
    bankName: optional('BANK_NAME'),
    branch: optional('BANK_BRANCH'),
    prefix: optional('PAYMENT_PREFIX', 'NHAIN'),
  };
}

export function signedUrlExpiresSeconds(): number {
  const n = Number(optional('SIGNED_URL_EXPIRES_SECONDS', '300'));
  return Number.isFinite(n) && n > 0 ? n : 300;
}

/** Dung lượng tối đa mỗi file. Phải <= giới hạn của dashboard (UPLOAD_MAX_SIZE_MB). */
export function maxUploadBytes(): number {
  const mb = Number(optional('UPLOAD_MAX_SIZE_MB', '25'));
  return (Number.isFinite(mb) && mb > 0 ? mb : 25) * 1_048_576;
}
