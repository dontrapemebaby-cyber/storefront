// src/app/admin/layout.tsx
// Khung khu quản trị.
//
// Cố ý KHÔNG gọi guardAdminPage() ở đây: layout của Next chạy cho cả trang đăng
// nhập và trang từ chối quyền, nên chặn ở layout sẽ tạo vòng lặp chuyển hướng.
// Mỗi trang tự gọi guard của mình.
import type * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Quản trị website', template: '%s · Quản trị' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
