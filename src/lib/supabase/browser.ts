'use client';
// src/lib/supabase/browser.ts
// Chỉ dùng cho màn hình đăng nhập admin. Anon key vốn công khai; RLS mới là lớp
// kiểm soát. Không có secret nào ở đây.
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
