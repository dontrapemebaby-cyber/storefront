'use client';
// src/components/admin/product-table.tsx
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Eye, EyeOff, Pencil, Search, Trash2 } from 'lucide-react';
import { deleteProductAction, toggleProductPublishAction } from '@/app/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalContent } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { formatVnd, deaccent } from '@/lib/utils';
import type { Product } from '@/types/storefront';

const PRICING_LABEL: Record<string, string> = {
  FIXED_PRICE: 'Giá sẵn',
  QUOTE_REQUIRED: 'Báo giá',
  DEPOSIT_REQUIRED: 'Đặt cọc',
};

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState<Product | null>(null);

  const filtered = React.useMemo(() => {
    const q = deaccent(query.trim().toLowerCase());
    if (!q) return products;
    return products.filter(
      (p) => deaccent(p.name.toLowerCase()).includes(q) || p.sku.toLowerCase().includes(q) || p.slug.includes(q),
    );
  }, [products, query]);

  async function togglePublish(product: Product) {
    setPending(product.id);
    const result = await toggleProductPublishAction(product.id, !product.isPublished);
    setPending(null);

    if (!result.ok) {
      toast.error(result.error ?? 'Không đổi được trạng thái.');
      return;
    }
    toast.success(product.isPublished ? `Đã ẩn “${product.name}”` : `Đã hiện “${product.name}”`);
    router.refresh();
  }

  async function remove(product: Product) {
    setPending(product.id);
    const result = await deleteProductAction(product.id);
    setPending(null);
    setConfirming(null);

    if (!result.ok) {
      toast.error(result.error ?? 'Không xóa được.');
      return;
    }
    toast.success(`Đã xóa “${product.name}”`);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, SKU hoặc đường dẫn…"
          aria-label="Tìm sản phẩm"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-token-lg border border-line bg-canvas p-10 text-center">
          <p className="text-sm text-muted">
            {query ? `Không có sản phẩm nào khớp với “${query}”.` : 'Chưa có sản phẩm nào.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-token-lg border border-line bg-canvas">
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Danh sách sản phẩm trên website</caption>
            <thead className="border-b border-line bg-surface">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium text-muted">Sản phẩm</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium text-muted sm:table-cell">Kiểu giá</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium text-muted lg:table-cell">Giá từ</th>
                <th scope="col" className="px-4 py-2.5 font-medium text-muted">Trạng thái</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium text-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="text-[12px] text-muted-soft">
                      {product.sku} · /{product.slug}
                      {product.isFeatured && <span className="ml-1.5 text-accent">★ nổi bật</span>}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge variant="outline">{PRICING_LABEL[product.pricingType] ?? product.pricingType}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums text-muted lg:table-cell">
                    {product.priceFrom ? formatVnd(product.priceFrom) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isPublished ? 'success' : 'neutral'}>
                      {product.isPublished ? 'Đang hiện' : 'Đang ẩn'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton
                        label={product.isPublished ? `Ẩn ${product.name}` : `Hiện ${product.name}`}
                        onClick={() => togglePublish(product)}
                        disabled={pending === product.id}
                      >
                        {product.isPublished ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      </IconButton>

                      {product.isPublished && (
                        <a
                          href={`/san-pham/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Xem ${product.name} trên website`}
                          className="rounded-token-sm p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      )}

                      <Link
                        href={`/admin/products/${product.id}`}
                        aria-label={`Sửa ${product.name}`}
                        className="rounded-token-sm p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>

                      <IconButton
                        label={`Xóa ${product.name}`}
                        onClick={() => setConfirming(product)}
                        disabled={pending === product.id}
                        danger
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Xác nhận trước khi xóa: đây là thao tác duy nhất ở đây khách nhìn thấy hậu quả ngay. */}
      {confirming && (
        <Modal open onOpenChange={(open) => !open && setConfirming(null)}>
          <ModalContent
            title={`Xóa “${confirming.name}”?`}
            description="Sản phẩm sẽ biến mất khỏi website. Các đơn cũ của khách vẫn giữ nguyên và vẫn tra cứu được — đây là xóa mềm, dữ liệu không mất."
          >
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
                Hủy
              </Button>
              <Button type="button" variant="danger" loading={pending === confirming.id} onClick={() => remove(confirming)}>
                Xóa sản phẩm
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-token-sm p-2 text-muted transition-colors disabled:opacity-40 ${
        danger ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-surface hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
