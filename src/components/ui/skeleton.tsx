// src/components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-token', className)} />;
}

/** Khung chờ cho lưới sản phẩm, giữ đúng bố cục để trang không nhảy. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải sản phẩm">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-token-lg border border-line p-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
