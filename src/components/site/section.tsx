// src/components/site/section.tsx
// Khung chung cho các section trang chủ: khoảng cách và tiêu đề đồng nhất, để
// mỗi section không tự đặt padding một kiểu.
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  /** Nền xám nhạt để tách khỏi section liền kề. */
  muted?: boolean;
  id?: string;
}

export function Section({ children, className, muted, id }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 lg:py-24', muted && 'bg-surface', className)}>
      <div className="container-content">{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  /** Cấp tiêu đề. Trang chủ chỉ có một h1 (hero), nên section dùng h2. */
  as?: 'h2' | 'h3';
}

export function SectionHeading({ eyebrow, title, description, align = 'left', action, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
      )}
    >
      <div className={cn('space-y-2.5', align === 'center' && 'max-w-2xl')}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className="text-[26px] font-bold leading-[1.15] sm:text-[32px] lg:text-[38px]">{title}</Tag>
        {description && <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
