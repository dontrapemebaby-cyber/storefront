'use client';
// src/components/site/product-browser.tsx
// Tìm kiếm và lọc sản phẩm.
//
// Lọc ở phía trình duyệt: catalog chỉ vài chục sản phẩm, tải một lần rồi lọc
// tức thì nhẹ hơn và mượt hơn nhiều so với gọi lại server mỗi lần gõ phím.
// Bộ lọc được ghi vào URL nên khách gửi link cho nhau vẫn ra đúng kết quả.
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { Drawer, DrawerContent } from '@/components/ui/modal';
import { ProductCard } from '@/components/site/product-card';
import { CATEGORIES, SERVICE_TYPES } from '@/lib/constants';
import { deaccent } from '@/lib/utils';
import type { Product } from '@/types/storefront';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Sắp xếp: Mặc định' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'name', label: 'Tên A → Z' },
];

interface Filters {
  q: string;
  category: string;
  service: string;
  pricing: string;
  sort: SortKey;
}

const EMPTY: Filters = { q: '', category: '', service: '', pricing: '', sort: 'default' };

export function ProductBrowser({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const [filters, setFilters] = React.useState<Filters>(() => ({
    q: params.get('tim') ?? '',
    category: params.get('nhom') ?? '',
    service: params.get('dich-vu') ?? '',
    pricing: params.get('gia') ?? '',
    sort: (params.get('sap-xep') as SortKey) ?? 'default',
  }));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Đồng bộ bộ lọc lên URL. replace chứ không push để nút Back không phải bấm
  // hàng chục lần mới thoát khỏi trang.
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (filters.q) next.set('tim', filters.q);
    if (filters.category) next.set('nhom', filters.category);
    if (filters.service) next.set('dich-vu', filters.service);
    if (filters.pricing) next.set('gia', filters.pricing);
    if (filters.sort !== 'default') next.set('sap-xep', filters.sort);

    const query = next.toString();
    router.replace(query ? `/san-pham?${query}` : '/san-pham', { scroll: false });
  }, [filters, router]);

  const results = React.useMemo(() => {
    const needle = deaccent(filters.q.trim());

    const filtered = products.filter((product) => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.service && product.serviceType !== filters.service) return false;

      if (filters.pricing === 'online' && !(product.pricingType === 'FIXED_PRICE' && product.allowInstantPayment)) return false;
      if (filters.pricing === 'bao-gia' && product.pricingType === 'FIXED_PRICE') return false;

      if (needle) {
        const haystack = deaccent(`${product.name} ${product.shortDescription ?? ''} ${product.sku}`);
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    // Sản phẩm báo giá không có priceFrom — đẩy xuống cuối thay vì coi như giá 0.
    const price = (p: Product) => p.priceFrom ?? Number.POSITIVE_INFINITY;

    switch (filters.sort) {
      case 'price-asc':
        return [...filtered].sort((a, b) => price(a) - price(b));
      case 'price-desc':
        return [...filtered].sort((a, b) => (b.priceFrom ?? -1) - (a.priceFrom ?? -1));
      case 'name':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      default:
        return filtered;
    }
  }, [products, filters]);

  const activeCount = [filters.category, filters.service, filters.pricing].filter(Boolean).length;
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((prev) => ({ ...prev, [key]: value }));

  const filterControls = (
    <div className="space-y-4">
      <Select
        aria-label="Nhóm sản phẩm"
        value={filters.category}
        onChange={(e) => set('category', e.target.value)}
      >
        <option value="">Tất cả nhóm</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>

      <Select aria-label="Loại dịch vụ" value={filters.service} onChange={(e) => set('service', e.target.value)}>
        <option value="">Tất cả dịch vụ</option>
        {SERVICE_TYPES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      <Select aria-label="Cách tính giá" value={filters.pricing} onChange={(e) => set('pricing', e.target.value)}>
        <option value="">Mọi hình thức</option>
        <option value="online">Có giá sẵn, trả online</option>
        <option value="bao-gia">Cần báo giá / khảo sát</option>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" aria-hidden />
          <Input
            type="search"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Tìm tem, decal, biển hiệu…"
            aria-label="Tìm sản phẩm"
            className="pl-10"
          />
        </div>

        {/* Màn hình rộng: bộ lọc hiện luôn. Màn hình hẹp: gom vào drawer. */}
        <div className="hidden gap-3 lg:flex">
          <Select aria-label="Nhóm sản phẩm" value={filters.category} onChange={(e) => set('category', e.target.value)} className="w-auto">
            <option value="">Tất cả nhóm</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>

          <Select aria-label="Cách tính giá" value={filters.pricing} onChange={(e) => set('pricing', e.target.value)} className="w-auto">
            <option value="">Mọi hình thức</option>
            <option value="online">Có giá sẵn</option>
            <option value="bao-gia">Cần báo giá</option>
          </Select>

          <Select aria-label="Sắp xếp" value={filters.sort} onChange={(e) => set('sort', e.target.value as SortKey)} className="w-auto">
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <Button variant="outline" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Bộ lọc
          {activeCount > 0 && <Badge variant="primary">{activeCount}</Badge>}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          {results.length} sản phẩm
        </p>
        {(activeCount > 0 || filters.q) && (
          <Button variant="link" size="sm" onClick={() => setFilters(EMPTY)}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {results.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không có sản phẩm nào khớp"
          description="Thử bỏ bớt bộ lọc, hoặc gửi yêu cầu để nhân viên tư vấn trực tiếp."
          action={
            <Button variant="outline" onClick={() => setFilters(EMPTY)}>
              Xóa bộ lọc
            </Button>
          }
        />
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent title="Bộ lọc">
          {filterControls}

          <div className="mt-4">
            <Select aria-label="Sắp xếp" value={filters.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="outline" full onClick={() => setFilters(EMPTY)}>
              Xóa hết
            </Button>
            <Button full onClick={() => setDrawerOpen(false)}>
              Xem {results.length} sản phẩm
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
