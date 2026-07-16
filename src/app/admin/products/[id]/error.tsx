'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductEditError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-16">
      <div className="w-full rounded-token-lg border border-line bg-canvas p-6 text-center shadow-token-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="font-heading text-xl font-bold text-ink">Chưa tải được dữ liệu sản phẩm</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Có thể kết nối dữ liệu vừa bị gián đoạn. Bạn hãy thử tải lại; các sản phẩm khác không bị ảnh hưởng.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Thử lại
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">Về danh sách sản phẩm</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
