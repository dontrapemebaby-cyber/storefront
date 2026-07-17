// src/components/site/footer.tsx

import Link from 'next/link';
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';

import { BrandLogo } from '@/components/site/brand-logo';
import type { BrandSettings } from '@/types/storefront';

const PRODUCT_LINKS = [
  { href: '/san-pham?nhom=tem-sticker', label: 'Tem & sticker' },
  { href: '/san-pham?nhom=decal', label: 'Decal' },
  { href: '/san-pham?nhom=in-kho-lon', label: 'In khổ lớn' },
  { href: '/san-pham?nhom=an-pham', label: 'Ấn phẩm' },
  { href: '/san-pham?nhom=bien-hieu', label: 'Biển hiệu' },
];

const SUPPORT_LINKS = [
  { href: '/gui-file-in', label: 'Gửi file in' },
  { href: '/tra-cuu', label: 'Tra cứu đơn' },
  { href: '/huong-dan-file-in', label: 'Hướng dẫn chuẩn bị file' },
  { href: '/quy-dinh-file-in', label: 'Quy định về file in' },
  { href: '/lien-he', label: 'Liên hệ' },
];

const POLICY_LINKS = [
  { href: '/chinh-sach-thanh-toan', label: 'Chính sách thanh toán' },
  { href: '/chinh-sach-giao-hang', label: 'Chính sách giao hàng' },
  { href: '/chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
  { href: '/gioi-thieu', label: 'Về chúng tôi' },
];

export function SiteFooter({ brand }: { brand: BrandSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-content py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            {/* Logo footer lớn hơn */}
            <Link
              href="/"
              aria-label={`Về trang chủ ${brand.name}`}
              className="inline-flex rounded-token-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <BrandLogo
                src={brand.logoUrl}
                alt={brand.name}
                className="h-28 w-28 object-contain"
              />
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {brand.description}
            </p>

            <ul className="space-y-2.5 text-sm">
              {brand.address && (
                <li className="flex gap-2.5">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft"
                    aria-hidden
                  />
                  <span className="text-muted">{brand.address}</span>
                </li>
              )}

              {brand.workingHours && (
                <li className="flex gap-2.5">
                  <Clock
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft"
                    aria-hidden
                  />
                  <span className="text-muted">{brand.workingHours}</span>
                </li>
              )}

              {brand.phone && (
                <li className="flex gap-2.5">
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft"
                    aria-hidden
                  />

                  <a
                    href={`tel:${brand.phone}`}
                    className="font-medium text-ink hover:text-primary"
                  >
                    {brand.phone}
                  </a>
                </li>
              )}

              {brand.email && (
                <li className="flex gap-2.5">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft"
                    aria-hidden
                  />

                  <a
                    href={`mailto:${brand.email}`}
                    className="text-muted hover:text-primary"
                  >
                    {brand.email}
                  </a>
                </li>
              )}
            </ul>

            {(brand.facebook || brand.instagram || brand.zalo) && (
              <div className="flex gap-2 pt-1">
                {brand.facebook && (
                  <a
                    href={brand.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="rounded-token-sm border border-line p-2 text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" aria-hidden />
                  </a>
                )}

                {brand.instagram && (
                  <a
                    href={brand.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="rounded-token-sm border border-line p-2 text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" aria-hidden />
                  </a>
                )}

                {brand.zalo && (
                  <a
                    href={`https://zalo.me/${brand.zalo.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Zalo"
                    className="rounded-token-sm border border-line p-2 text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            )}
          </div>

          <FooterColumn title="Sản phẩm" links={PRODUCT_LINKS} />

          <FooterColumn title="Hỗ trợ" links={SUPPORT_LINKS} />

          <FooterColumn title="Chính sách" links={POLICY_LINKS} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}. Bảo lưu mọi quyền.
          </p>

          <p>{brand.slogan}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: {
    href: string;
    label: string;
  }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3.5 font-heading text-sm font-semibold text-ink">
        {title}
      </h2>

      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
