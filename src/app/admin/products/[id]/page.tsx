// src/app/admin/products/[id]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { guardAdminPage } from '@/lib/admin/guard';
import { getProductTypes } from '@/lib/data/product-types';
import { getAllProductsForAdmin } from '@/lib/data/products';
import { AdminShell } from '@/components/admin/admin-shell';
import { ProductForm, toFormValue } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sửa sản phẩm' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await guardAdminPage();

  const { id } = await params;

  const [products, productTypes] = await Promise.all([getAllProductsForAdmin(), getProductTypes()]);
  const product = products.find((p) => p.id === id);

  // Không tìm thấy: có thể id sai, cũng có thể sản phẩm vừa bị xóa mềm ở tab khác.
  if (!product) notFound();

  return (
    <AdminShell
      title={product.name}
      description={`${product.sku} · /san-pham/${product.slug}`}
      current="/admin/products"
      actions={
        <div className="flex gap-2">
          {product.isPublished && (
            <Button asChild variant="outline">
              <a href={`/san-pham/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Xem
              </a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Quay lại
            </Link>
          </Button>
        </div>
      }
    >
      <ProductForm initial={toFormValue(product)} productTypes={productTypes} isNew={false} />
    </AdminShell>
  );
}
