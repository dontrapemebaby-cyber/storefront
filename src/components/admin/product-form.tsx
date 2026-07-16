'use client';
// src/components/admin/product-form.tsx
// Thêm / sửa một sản phẩm.
//
// Không có ô cho needs_quote, allow_instant_payment, requires_deposit: ba cột đó
// suy ra từ "kiểu giá" ở server action. Cho admin tự tick sẽ sinh ra những trạng
// thái vô nghĩa như vừa "cần báo giá" vừa "cho thanh toán ngay".
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { saveProductAction } from '@/app/admin/actions';
import { useAdminForm } from '@/components/admin/use-admin-form';
import { AdminCard, SaveBar } from '@/components/admin/form-bits';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SwitchField } from '@/components/ui/switch';
import { RadioCardGroup } from '@/components/ui/radio';
import { toast } from '@/components/ui/toast';
import { CATEGORIES, SERVICE_TYPES } from '@/lib/constants';
import { formatVnd } from '@/lib/utils';
import type { ProductType } from '@/lib/data/product-types';
import type { PricingType, Product } from '@/types/storefront';

export interface ProductFormValue {
  id?: string;
  slug: string;
  sku: string;
  name: string;
  productTypeCode: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  pricingType: PricingType;
  priceFrom: number | null;
  priceUnit: string;
  leadTime: string;
  category: string;
  serviceType: string;
  depositAmount: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

const PRICING_OPTIONS = [
  {
    value: 'FIXED_PRICE',
    label: 'Có bảng giá sẵn',
    description: 'Khách chọn thông số là thấy tổng tiền, trả ngay bằng QR.',
  },
  {
    value: 'QUOTE_REQUIRED',
    label: 'Cần báo giá',
    description: 'Khách gửi yêu cầu, nhân viên gọi lại chốt giá. Không hiện QR.',
  },
  {
    value: 'DEPOSIT_REQUIRED',
    label: 'Đặt cọc trước',
    description: 'Khách trả tiền cọc để giữ lịch, phần còn lại chốt sau khi khảo sát.',
  },
];

export function ProductForm({
  initial,
  productTypes,
  isNew,
}: {
  initial: ProductFormValue;
  productTypes: ProductType[];
  isNew: boolean;
}) {
  const router = useRouter();
  const form = useAdminForm(initial, saveProductAction);
  const { value, set, fieldErrors } = form;

  // Sau khi tạo mới thì rời khỏi form: ở lại sẽ khiến bấm Lưu lần nữa tạo thêm
  // một bản trùng, vì form vẫn chưa có id.
  const savedRef = React.useRef(false);
  React.useEffect(() => {
    if (form.saved && isNew && !savedRef.current) {
      savedRef.current = true;
      toast.success(`Đã tạo “${value.name}”`);
      router.push('/admin/products');
      router.refresh();
    }
  }, [form.saved, isNew, router, value.name]);

  const selectedType = productTypes.find((t) => t.code === value.productTypeCode);

  return (
    <form onSubmit={form.submit} noValidate className="space-y-5">
      <AdminCard title="Thông tin cơ bản">
        <Field label="Tên sản phẩm" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(fieldErrors.name)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Đường dẫn"
            htmlFor="slug"
            required
            hint={`Website: /san-pham/${value.slug || '…'}`}
            error={fieldErrors.slug}
          >
            <Input
              id="slug"
              value={value.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              invalid={Boolean(fieldErrors.slug)}
              className="font-mono"
              spellCheck={false}
            />
          </Field>

          <Field label="Mã SKU" htmlFor="sku" required error={fieldErrors.sku}>
            <Input id="sku" value={value.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} invalid={Boolean(fieldErrors.sku)} className="font-mono" />
          </Field>
        </div>

        {!isNew && value.slug !== initial.slug && (
          <p className="flex gap-2 rounded-token border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-ink/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            Đổi đường dẫn sẽ làm hỏng mọi link cũ tới sản phẩm này — link đã gửi cho khách, đã đăng Facebook, và cả thứ
            hạng trên Google.
          </p>
        )}

        <Field
          label="Loại sản phẩm của dashboard"
          htmlFor="productTypeCode"
          required
          hint="Quyết định yêu cầu rơi vào nhóm nào trong dashboard. Danh sách đọc thẳng từ dashboard."
          error={fieldErrors.productTypeCode}
        >
          <Select
            id="productTypeCode"
            value={value.productTypeCode}
            onChange={(e) => set('productTypeCode', e.target.value)}
            invalid={Boolean(fieldErrors.productTypeCode)}
          >
            <option value="">— Chọn loại —</option>
            {productTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.nameVi} ({t.code})
              </option>
            ))}
          </Select>
        </Field>

        {selectedType?.needsSurvey && value.pricingType === 'FIXED_PRICE' && (
          <p className="flex gap-2 rounded-token border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-ink/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            Dashboard đánh dấu loại “{selectedType.nameVi}” là cần khảo sát tại chỗ, nhưng bạn đang đặt giá sẵn. Khách sẽ
            trả tiền trước khi có ai xem mặt bằng — thường là nhầm.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nhóm sản phẩm" htmlFor="category" required error={fieldErrors.category}>
            <Select id="category" value={value.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Loại dịch vụ" htmlFor="serviceType" required error={fieldErrors.serviceType}>
            <Select id="serviceType" value={value.serviceType} onChange={(e) => set('serviceType', e.target.value)}>
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Mô tả">
        <Field
          label="Mô tả ngắn"
          htmlFor="shortDescription"
          hint="Một câu, hiện trên thẻ sản phẩm ở trang danh sách."
          error={fieldErrors.shortDescription}
        >
          <Textarea id="shortDescription" rows={2} value={value.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </Field>

        <Field
          label="Mô tả chi tiết"
          htmlFor="longDescription"
          hint="Cách nhau một dòng trống để tách đoạn."
          error={fieldErrors.longDescription}
        >
          <Textarea id="longDescription" rows={6} value={value.longDescription} onChange={(e) => set('longDescription', e.target.value)} />
        </Field>

        <Field label="Ảnh (URL)" htmlFor="imageUrl" error={fieldErrors.imageUrl}>
          <Input id="imageUrl" value={value.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="/products/ten-san-pham.svg" />
        </Field>

        <Field label="Thời gian trả hàng" htmlFor="leadTime" hint="Ví dụ: 1–2 ngày làm việc." error={fieldErrors.leadTime}>
          <Input id="leadTime" value={value.leadTime} onChange={(e) => set('leadTime', e.target.value)} />
        </Field>
      </AdminCard>

      <AdminCard title="Giá">
        {/* Không đặt htmlFor: RadioCardGroup là một nhóm nút chọn, không có một
            ô nhập nào để nhãn trỏ tới. */}
        <Field label="Kiểu giá" required>
          <RadioCardGroup
            name="pricingType"
            value={value.pricingType}
            options={PRICING_OPTIONS}
            onChange={(v) => set('pricingType', v as PricingType)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Giá từ"
            htmlFor="priceFrom"
            hint="Chỉ để hiển thị trên thẻ sản phẩm. Tiền khách trả do bảng giá tính."
            error={fieldErrors.priceFrom}
          >
            <Input
              id="priceFrom"
              type="number"
              min={0}
              step={1000}
              value={value.priceFrom ?? ''}
              onChange={(e) => set('priceFrom', e.target.value === '' ? null : Number(e.target.value))}
            />
          </Field>

          <Field label="Đơn vị giá" htmlFor="priceUnit" hint="Ví dụ: /cái, /m², /bộ." error={fieldErrors.priceUnit}>
            <Input id="priceUnit" value={value.priceUnit} onChange={(e) => set('priceUnit', e.target.value)} />
          </Field>
        </div>

        {value.pricingType === 'DEPOSIT_REQUIRED' && (
          <Field
            label="Số tiền cọc"
            htmlFor="depositAmount"
            required
            hint={value.depositAmount ? `Khách sẽ thấy mã QR ${formatVnd(value.depositAmount)}.` : undefined}
            error={fieldErrors.depositAmount}
          >
            <Input
              id="depositAmount"
              type="number"
              min={0}
              step={50000}
              value={value.depositAmount ?? ''}
              onChange={(e) => set('depositAmount', e.target.value === '' ? null : Number(e.target.value))}
              invalid={Boolean(fieldErrors.depositAmount)}
            />
          </Field>
        )}
      </AdminCard>

      <AdminCard title="Hiển thị">
        <SwitchField
          id="isPublished"
          label="Hiện trên website"
          description="Tắt thì chỉ khu quản trị thấy. Link cũ của khách sẽ ra trang 404."
          checked={value.isPublished}
          onCheckedChange={(v) => set('isPublished', v)}
        />
        <SwitchField
          id="isFeatured"
          label="Đưa lên trang chủ"
          description="Hiện ở khối sản phẩm nổi bật."
          checked={value.isFeatured}
          onCheckedChange={(v) => set('isFeatured', v)}
        />

        <Field label="Thứ tự sắp xếp" htmlFor="sortOrder" hint="Số nhỏ hiện trước." error={fieldErrors.sortOrder}>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={value.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
          />
        </Field>
      </AdminCard>

      <AdminCard title="SEO" description="Bỏ trống thì website tự dùng tên và mô tả ngắn ở trên.">
        <Field label="Tiêu đề SEO" htmlFor="seoTitle" error={fieldErrors.seoTitle}>
          <Input id="seoTitle" value={value.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
        </Field>
        <Field label="Mô tả SEO" htmlFor="seoDescription" error={fieldErrors.seoDescription}>
          <Textarea id="seoDescription" rows={2} value={value.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
        </Field>
      </AdminCard>

      <SaveBar dirty={form.dirty} saving={form.saving} saved={form.saved} error={form.error} onReset={form.reset} />
    </form>
  );
}

/** Product (từ CSDL) -> giá trị cho form. Form dùng chuỗi rỗng thay cho null. */
export function toFormValue(product: Product): ProductFormValue {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    productTypeCode: product.productTypeCode,
    shortDescription: product.shortDescription ?? '',
    longDescription: product.longDescription ?? '',
    imageUrl: product.imageUrl ?? '',
    pricingType: product.pricingType,
    priceFrom: product.priceFrom,
    priceUnit: product.priceUnit ?? '',
    leadTime: product.leadTime ?? '',
    category: product.category,
    serviceType: product.serviceType,
    depositAmount: product.depositAmount,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    sortOrder: product.sortOrder,
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
  };
}

export const EMPTY_PRODUCT: ProductFormValue = {
  slug: '',
  sku: '',
  name: '',
  productTypeCode: '',
  shortDescription: '',
  longDescription: '',
  imageUrl: '',
  pricingType: 'QUOTE_REQUIRED',
  priceFrom: null,
  priceUnit: '',
  leadTime: '',
  category: 'tem-sticker',
  serviceType: 'in_an',
  depositAmount: null,
  isFeatured: false,
  // Mặc định ẩn: sản phẩm mới tạo thường còn thiếu ảnh và bảng giá. Hiện ngay là
  // khách đặt được một thứ chưa xong.
  isPublished: false,
  sortOrder: 100,
  seoTitle: '',
  seoDescription: '',
};
