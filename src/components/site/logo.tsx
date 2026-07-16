// src/components/site/logo.tsx
// Logo mặc định khi admin chưa tải logo riêng lên.
//
// Hình dựa trên dấu căn màu (registration mark) — ký hiệu thợ in dùng để canh
// bốn bản màu chồng khít nhau. Cùng ngôn ngữ với motif trim-marks ở các section
// khác, nên website nhìn ra là của nhà in chứ không phải template chung chung.
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 148 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('text-ink', className)} role="img" aria-label="Nhà In Trẻ">
      {/* Dấu căn màu: vòng tròn + thập tự vượt ra ngoài vòng. */}
      <g>
        <circle cx="18" cy="18" r="10.5" stroke="currentColor" strokeWidth="1.6" opacity="0.28" />
        <circle cx="18" cy="18" r="5" fill="rgb(var(--sf-primary))" />
        <path d="M18 2.5V10.5M18 25.5V33.5M2.5 18H10.5M25.5 18H33.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Chấm lệch màu phụ — gợi ý bản in chồng chưa khít, đúng chất nhà in. */}
        <circle cx="21" cy="15" r="5" fill="rgb(var(--sf-accent))" opacity="0.85" style={{ mixBlendMode: 'multiply' }} />
      </g>

      <text
        x="42"
        y="24"
        fill="currentColor"
        fontFamily="var(--sf-font-heading)"
        fontSize="17"
        fontWeight="700"
        letterSpacing="-0.4"
      >
        Nhà In Trẻ
      </text>
    </svg>
  );
}
