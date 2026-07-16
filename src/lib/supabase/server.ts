import 'server-only';
// src/lib/supabase/server.ts
// Supabase client phía server, dùng anon key + RLS.
//
// Website khách hàng KHÔNG có SUPABASE_SERVICE_ROLE_KEY và không cần. Dữ liệu
// công khai (sản phẩm đã publish, cấu hình giao diện) đọc bằng anon key và được
// RLS lọc sẵn; phần ghi đi qua RPC có secret hoặc qua public API của dashboard.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnv } from '@/lib/env';

const SUPABASE_FETCH_TIMEOUT_MS = 5_000;

/** Tránh build hoặc request treo lâu khi Supabase tạm thời không truy cập được. */
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  return fetch(input, { ...init, signal });
}

/** Client cho Server Component / Route Handler, có đọc phiên đăng nhập admin. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Được gọi từ Server Component — middleware đã lo việc làm mới phiên.
        }
      },
    },
  });
}

/** Client không phiên, cho dữ liệu công khai. Tránh dính cache theo cookie. */
export function createSupabaseAnonClient() {
  const { url, anonKey } = supabaseEnv();
  return createServerClient(url, anonKey, {
    global: { fetch: fetchWithTimeout },
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
