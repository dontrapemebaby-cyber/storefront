// src/app/admin/products/moi/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { guardAdminPage } from '@/lib/admin/guard';
import { getProductTypes } from '@/lib/data/product-types';
import { AdminShell } from '@/components/admin/admin-shell';
import { EMPTY_PRODUCT, ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thêm sản phẩm' };

export default async function NewProductPage() {
  await guardAdminPage();

  const productTypes = await getProductTypes();

  return (
    <AdminShell
      title="Thêm sản phẩm"
      description="Sản phẩm mới mặc định đang ẩn. Điền xong, thêm ảnh và bảng giá rồi hãy bật hiện."
      current="/admin/products"
      actions={
        <Button asChild variant="ghost">
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Link>
        </Button>
      }
    >
      <ProductForm initial={EMPTY_PRODUCT} productTypes={productTypes} isNew />
    </AdminShell>
  );
}
