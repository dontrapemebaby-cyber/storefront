// src/app/admin/khong-du-quyen/page.tsx
// Trang cho người đã đăng nhập nhưng không phải super_admin.
//
// Tách khỏi trang đăng nhập vì đây là tình huống khác hẳn: đăng nhập lại không
// giúp được gì. Nói thẳng để nhân viên biết phải nhờ ai, thay vì bấm lại nhiều lần.
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/admin/logout-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Không đủ quyền' };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft">
          <ShieldAlert className="h-7 w-7 text-warning" aria-hidden />
        </div>

        <h1 className="font-heading text-2xl font-bold">Tài khoản không đủ quyền</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Bạn đã đăng nhập, nhưng khu quản trị website chỉ dành cho super admin. Đăng nhập lại bằng tài khoản này cũng
          không mở được — cần người có quyền super admin cấp thêm quyền cho bạn trong dashboard.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/">Về website</Link>
          </Button>
        </div>

        <div className="mx-auto mt-6 max-w-[200px]">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
