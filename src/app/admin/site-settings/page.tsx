// src/app/admin/site-settings/page.tsx
// Ba nhóm cấu hình tách thành ba tab, mỗi tab lưu riêng.
//
// Tab điều hướng bằng query param chứ không bằng state: mỗi tab là một form
// riêng, nên chuyển tab sẽ tải lại và bỏ thay đổi chưa lưu ở tab cũ. Đổi lại,
// mỗi lần lưu chỉ ghi đúng một khóa cấu hình — lưu màu không thể vô tình ghi đè
// nội dung trang chủ.
import type { Metadata } from 'next';
import Link from 'next/link';
import { guardAdminPage } from '@/lib/admin/guard';
import { getSiteSettings } from '@/lib/data/settings';
import { AdminShell } from '@/components/admin/admin-shell';
import { BrandForm } from '@/components/admin/brand-form';
import { ThemeForm } from '@/components/admin/theme-form';
import { HomeForm } from '@/components/admin/home-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Giao diện & nội dung' };

const TABS = [
  { key: 'brand', label: 'Thông tin nhà in' },
  { key: 'theme', label: 'Màu sắc & phông chữ' },
  { key: 'home', label: 'Trang chủ' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default async function SiteSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await guardAdminPage();

  const { tab } = await searchParams;
  const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : 'brand';

  const settings = await getSiteSettings();

  return (
    <AdminShell
      title="Giao diện & nội dung"
      description="Thay đổi có hiệu lực ngay sau khi lưu."
      current="/admin/site-settings"
    >
      <nav className="mb-6 flex gap-1.5 overflow-x-auto border-b border-line" aria-label="Nhóm cấu hình">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/site-settings?tab=${t.key}`}
            aria-current={active === t.key ? 'page' : undefined}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active === t.key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* key={active} buộc React dựng lại form khi đổi tab, tránh dùng lại state cũ. */}
      {active === 'brand' && <BrandForm key="brand" initial={settings.brand} />}
      {active === 'theme' && <ThemeForm key="theme" initial={settings.theme} />}
      {active === 'home' && <HomeForm key="home" initial={settings.home} />}
    </AdminShell>
  );
}
