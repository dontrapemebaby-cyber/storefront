// src/app/admin/dang-nhap/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          {/* Dấu bế quanh tiêu đề — cùng ngôn ngữ hình ảnh với website. */}
          <p className="trim-marks mx-auto mb-4 inline-block px-4 py-1.5 font-heading text-sm font-bold text-primary">
            QUẢN TRỊ
          </p>
          <h1 className="font-heading text-2xl font-bold">Đăng nhập</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Dùng tài khoản nhân viên của dashboard. Khu này chỉ dành cho super admin.
          </p>
        </header>

        <Suspense fallback={<Skeleton className="h-64 w-full rounded-token-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
