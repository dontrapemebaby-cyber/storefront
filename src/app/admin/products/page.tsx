// src/app/admin/products/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { guardAdminPage } from '@/lib/admin/guard';
import { getAllProductsForAdmin } from '@/lib/data/products';
import { AdminShell } from '@/components/admin/admin-shell';
import { ProductTable } from '@/components/admin/product-table';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sản phẩm' };

export default async function AdminProductsPage() {
  await guardAdminPage();

  const products = await getAllProductsForAdmin();

  return (
    <AdminShell
      title="Sản phẩm"
      description="Sản phẩm đang ẩn vẫn nằm trong danh sách này nhưng khách không thấy."
      current="/admin/products"
      actions={
        <Button asChild>
          <Link href="/admin/products/moi">
            <Plus className="h-4 w-4" aria-hidden />
            Thêm sản phẩm
          </Link>
        </Button>
      }
    >
      <ProductTable products={products} />

      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        Bảng giá chi tiết (các mức số lượng, tùy chọn chất liệu, quy tắc kích thước) hiện phải sửa trực tiếp trong cột
        <code className="mx-1 rounded-token-sm bg-surface px-1.5 py-0.5 font-mono text-[12px]">pricing</code> và
        <code className="mx-1 rounded-token-sm bg-surface px-1.5 py-0.5 font-mono text-[12px]">options</code> của bảng
        <code className="mx-1 rounded-token-sm bg-surface px-1.5 py-0.5 font-mono text-[12px]">storefront_products</code>
        trong Supabase. Màn hình này lo phần còn lại.
      </p>
    </AdminShell>
  );
}
