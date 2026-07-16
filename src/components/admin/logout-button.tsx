'use client';
// src/components/admin/logout-button.tsx
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // refresh() để server component đọc lại phiên đã bị xóa, tránh trường hợp
    // quay lại trang admin vẫn thấy nội dung cũ trong cache của router.
    router.refresh();
    router.replace('/admin/dang-nhap');
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="flex w-full items-center gap-2.5 rounded-token px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-canvas hover:text-danger disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {loading ? 'Đang thoát…' : 'Đăng xuất'}
    </button>
  );
}
