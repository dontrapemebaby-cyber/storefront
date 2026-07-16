'use client';
// src/components/site/header.tsx
// Thanh điều hướng. Trên điện thoại thu về nút menu mở drawer bên phải.
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/modal';
import { BrandLogo } from '@/components/site/brand-logo';
import { cn } from '@/lib/utils';
import type { BrandSettings } from '@/types/storefront';

const NAV = [
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/dich-vu', label: 'Dịch vụ' },
  { href: '/huong-dan-file-in', label: 'Hướng dẫn file' },
  { href: '/tra-cuu', label: 'Tra cứu đơn' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/lien-he', label: 'Liên hệ' },
];

export function SiteHeader({ brand }: { brand: BrandSettings }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Đóng drawer khi chuyển trang, nếu không nó nằm đè lên trang mới.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="container-content flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-token-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <BrandLogo src={brand.logoUrl} alt={brand.name} className="h-10 w-10 rounded-full lg:h-11 lg:w-11" priority />
          <span className="sr-only">{brand.name}</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-token-sm px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    isActive(item.href) ? 'text-primary' : 'text-muted hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {brand.phone && (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href={`tel:${brand.phone}`}>
                <Phone className="h-4 w-4" aria-hidden />
                {brand.phone}
              </a>
            </Button>
          )}

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/gui-file-in">
              <Upload className="h-4 w-4" aria-hidden />
              Gửi file in
            </Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent title={brand.name}>
          <nav aria-label="Điều hướng trên điện thoại">
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'block rounded-token px-4 py-3.5 text-[15px] font-medium transition-colors',
                      isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-5 space-y-2 border-t border-line pt-5">
            <Button asChild full size="lg">
              <Link href="/gui-file-in">
                <Upload className="h-4 w-4" aria-hidden />
                Gửi file in
              </Link>
            </Button>
            {brand.phone && (
              <Button asChild full variant="outline" size="lg">
                <a href={`tel:${brand.phone}`}>
                  <Phone className="h-4 w-4" aria-hidden />
                  Gọi {brand.phone}
                </a>
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}
