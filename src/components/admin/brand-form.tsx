'use client';
// src/components/admin/brand-form.tsx
import { saveBrandAction } from '@/app/admin/actions';
import { useAdminForm } from '@/components/admin/use-admin-form';
import { AdminCard, SaveBar } from '@/components/admin/form-bits';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BrandSettings } from '@/types/storefront';

export function BrandForm({ initial }: { initial: BrandSettings }) {
  const form = useAdminForm(initial, saveBrandAction);
  const { value, set, fieldErrors } = form;

  return (
    <form onSubmit={form.submit} noValidate className="space-y-5">
      <AdminCard title="Thông tin nhà in" description="Hiện ở đầu trang, chân trang và trong kết quả tìm kiếm.">
        <Field label="Tên nhà in" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(fieldErrors.name)} />
        </Field>

        <Field label="Khẩu hiệu" htmlFor="slogan" hint="Một câu ngắn, hiện dưới tên nhà in." error={fieldErrors.slogan}>
          <Input id="slogan" value={value.slogan} onChange={(e) => set('slogan', e.target.value)} />
        </Field>

        <Field
          label="Mô tả"
          htmlFor="description"
          hint="Dùng cho thẻ mô tả khi chia sẻ link và cho Google."
          error={fieldErrors.description}
        >
          <Textarea id="description" rows={3} value={value.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo (URL)" htmlFor="logoUrl" hint="Bỏ trống thì dùng logo mặc định." error={fieldErrors.logoUrl}>
            <Input id="logoUrl" value={value.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="/logo.svg" />
          </Field>
          <Field label="Favicon (URL)" htmlFor="faviconUrl" error={fieldErrors.faviconUrl}>
            <Input id="faviconUrl" value={value.faviconUrl} onChange={(e) => set('faviconUrl', e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Liên hệ" description="Khách bấm vào là gọi hoặc nhắn được ngay. Bỏ trống thì ẩn khỏi website.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số điện thoại" htmlFor="phone" error={fieldErrors.phone}>
            <Input id="phone" type="tel" value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0901234567" />
          </Field>
          <Field label="Zalo" htmlFor="zalo" hint="Bỏ trống thì nút Zalo dùng số điện thoại ở trên." error={fieldErrors.zalo}>
            <Input id="zalo" type="tel" value={value.zalo} onChange={(e) => set('zalo', e.target.value)} />
          </Field>
        </div>

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input id="email" type="email" value={value.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(fieldErrors.email)} />
        </Field>

        <Field label="Địa chỉ" htmlFor="address" error={fieldErrors.address}>
          <Input id="address" value={value.address} onChange={(e) => set('address', e.target.value)} />
        </Field>

        <Field
          label="Giờ làm việc"
          htmlFor="workingHours"
          hint="Ví dụ: 8:00 – 18:00, Thứ 2 – Thứ 7."
          error={fieldErrors.workingHours}
        >
          <Input id="workingHours" value={value.workingHours} onChange={(e) => set('workingHours', e.target.value)} />
        </Field>
      </AdminCard>

      <AdminCard title="Mạng xã hội" description="Bỏ trống thì biểu tượng tương ứng không hiện ở chân trang.">
        <Field label="Facebook" htmlFor="facebook" error={fieldErrors.facebook}>
          <Input id="facebook" value={value.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/…" />
        </Field>
        <Field label="TikTok" htmlFor="tiktok" error={fieldErrors.tiktok}>
          <Input id="tiktok" value={value.tiktok} onChange={(e) => set('tiktok', e.target.value)} />
        </Field>
        <Field label="Instagram" htmlFor="instagram" error={fieldErrors.instagram}>
          <Input id="instagram" value={value.instagram} onChange={(e) => set('instagram', e.target.value)} />
        </Field>
      </AdminCard>

      <SaveBar dirty={form.dirty} saving={form.saving} saved={form.saved} error={form.error} onReset={form.reset} />
    </form>
  );
}
