// src/components/admin/admin-shell.tsx
// Khung chung cho các trang quản trị đã qua cổng quyền: điều hướng + tiêu đề.
import type * as React from 'react';
import Link from 'next/link';
import { ExternalLink, LayoutGrid, Package, Palette, BadgeDollarSign, Wallet, type LucideIcon } from 'lucide-react';
import { LogoutButton } from '@/components/admin/logout-button';

// Kiểu ghi rõ ràng vì chỉ mục đầu có `exact` còn các mục sau thì không — để
// TypeScript tự suy sẽ ra kiểu union lắt nhắt khi đọc `item.exact`.
const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutGrid, exact: true },
  { href: '/admin/site-settings', label: 'Giao diện & nội dung', icon: Palette },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/payment-settings', label: 'Cấu hình QR', icon: Wallet },
  { href: '/admin/payments', label: 'Đối soát tiền', icon: BadgeDollarSign },
];

interface AdminShellProps {
  title: string;
  description?: string;
  /** Đường dẫn hiện tại, để tô đậm mục đang mở. */
  current: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, description, current, actions, children }: AdminShellProps) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 lg:px-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-8 space-y-6">
          <div>
            <p className="font-heading text-sm font-bold">Quản trị website</p>
            <p className="text-[12px] text-muted">Chỉ super admin</p>
          </div>

          <nav className="space-y-0.5">
            {NAV.map((item) => {
              const active = item.exact ? current === item.href : current.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-token px-3 py-2 text-[13px] font-medium transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-0.5 border-t border-line pt-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-token px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              Xem website
            </a>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold">{title}</h1>
            {description && <p className="text-[13px] leading-relaxed text-muted">{description}</p>}
          </div>
          {actions}
        </header>

        {/* Điều hướng cho màn hình nhỏ. */}
        <nav className="mb-6 flex gap-1.5 overflow-x-auto lg:hidden">
          {NAV.map((item) => {
            const active = item.exact ? current === item.href : current.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 rounded-token border px-3 py-1.5 text-[13px] font-medium ${
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-line text-muted'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </main>
    </div>
  );
}
