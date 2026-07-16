// src/components/site/announcement-bar.tsx
// Dải thông báo trên cùng. Admin bật/tắt và sửa nội dung trong /admin/site-settings.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomeSettings } from '@/types/storefront';

interface AnnouncementBarProps {
  announcement: HomeSettings['announcement'];
}

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const hasLink = Boolean(announcement.linkUrl && announcement.linkText);

  return (
    <div className="bg-accent text-accent-fg">
      <div className="container-content flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-[13px] font-medium">
        <span>{announcement.text}</span>
        {hasLink && (
          <Link
            href={announcement.linkUrl}
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
          >
            {announcement.linkText}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
