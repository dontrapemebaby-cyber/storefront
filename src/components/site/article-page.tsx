// src/components/site/article-page.tsx
// Khung chung cho các trang nội dung dạng văn bản (chính sách, hướng dẫn).
// Gom về một chỗ để mọi trang có cùng bề rộng dòng chữ và cùng cách xuống dòng.
import type * as React from 'react';
import Link from 'next/link';

interface ArticlePageProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Ngày cập nhật, hiện ở cuối trang. Chính sách cần cho biết còn mới không. */
  updatedAt?: string;
  children: React.ReactNode;
}

export function ArticlePage({ eyebrow, title, description, updatedAt, children }: ArticlePageProps) {
  return (
    <div className="container-content py-12 lg:py-16">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10 space-y-3 border-b border-line pb-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">{title}</h1>
          {description && <p className="text-[15px] leading-relaxed text-muted">{description}</p>}
        </header>

        <div className="space-y-10">{children}</div>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13px] text-muted">
          {updatedAt ? <p>Cập nhật lần cuối: {updatedAt}</p> : <span />}
          <Link href="/lien-he" className="font-medium text-primary hover:underline">
            Còn thắc mắc? Liên hệ nhà in
          </Link>
        </footer>
      </article>
    </div>
  );
}

/** Một mục trong trang nội dung. h2 để cấu trúc tiêu đề đúng thứ bậc. */
export function ArticleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      <div className="prose-vn">{children}</div>
    </section>
  );
}
