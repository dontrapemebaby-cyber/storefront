// src/app/layout.tsx
// Khung chung của website.
//
// Màu, font, bo góc do admin chọn trong /admin/site-settings. Chúng được nạp ở
// đây thành CSS variables (đã lọc sạch trong lib/theme.ts) nên đổi giao diện
// không cần build lại — nhưng admin cũng không chèn được CSS hay JS tùy ý.
import type * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { themeToCssVariables } from '@/lib/theme';
import { appUrl } from '@/lib/env';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { AnnouncementBar } from '@/components/site/announcement-bar';
import { FloatingContact } from '@/components/site/floating-contact';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

// Không truy vấn Supabase trong lúc build; dữ liệu được đọc khi có request thật.
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSiteSettings();

  return {
    metadataBase: new URL(appUrl()),
    title: {
      default: `${brand.name} — ${brand.slogan}`,
      template: `%s | ${brand.name}`,
    },
    description: brand.description,
    ...(brand.faviconUrl ? { icons: { icon: brand.faviconUrl } } : {}),
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      siteName: brand.name,
      title: `${brand.name} — ${brand.slogan}`,
      description: brand.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="vi">
      <head>
        {/* Nạp trước phần <style> để trang không chớp màu mặc định rồi mới đổi. */}
        <style dangerouslySetInnerHTML={{ __html: themeToCssVariables(settings.theme) }} />
      </head>
      <body className="min-h-screen bg-canvas font-body text-ink antialiased">
        {/* Bỏ qua thanh điều hướng — người dùng bàn phím bấm Tab lần đầu sẽ thấy. */}
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-token focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-fg"
        >
          Bỏ qua, tới nội dung chính
        </a>

        {settings.home.announcement.enabled && settings.home.announcement.text ? (
          <AnnouncementBar announcement={settings.home.announcement} />
        ) : null}

        <SiteHeader brand={settings.brand} />

        <main id="noi-dung">{children}</main>

        <SiteFooter brand={settings.brand} />
        <FloatingContact brand={settings.brand} />
        <Toaster />
      </body>
    </html>
  );
}
