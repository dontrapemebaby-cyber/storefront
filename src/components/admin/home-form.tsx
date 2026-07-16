'use client';
// src/components/admin/home-form.tsx
// Sửa nội dung trang chủ và bật/tắt từng khối.
//
// Mỗi khối tự ẩn khi tắt hoặc khi không còn mục nào (xem home-sections.tsx), nên
// admin xóa hết mục là khối biến mất chứ không để lại tiêu đề trơ trọi.
import * as React from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { saveHomeAction } from '@/app/admin/actions';
import { useAdminForm } from '@/components/admin/use-admin-form';
import { SaveBar } from '@/components/admin/form-bits';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { HomeSettings } from '@/types/storefront';

export function HomeForm({ initial }: { initial: HomeSettings }) {
  const form = useAdminForm(initial, saveHomeAction);
  const { value, setValue, set } = form;

  /** Sửa một trường bên trong một khối. */
  function patch<K extends keyof HomeSettings>(section: K, changes: Partial<HomeSettings[K]>) {
    setValue((prev) => ({ ...prev, [section]: { ...prev[section], ...changes } }));
  }

  return (
    <form onSubmit={form.submit} noValidate className="space-y-3">
      <Block
        title="Thanh thông báo"
        hint="Dải chữ mỏng trên cùng. Dùng cho khuyến mãi hoặc lịch nghỉ lễ."
        enabled={value.announcement.enabled}
        onToggle={(enabled) => patch('announcement', { enabled })}
      >
        <Field label="Nội dung" htmlFor="ann-text">
          <Input id="ann-text" value={value.announcement.text} onChange={(e) => patch('announcement', { text: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chữ trên link" htmlFor="ann-link-text">
            <Input id="ann-link-text" value={value.announcement.linkText} onChange={(e) => patch('announcement', { linkText: e.target.value })} />
          </Field>
          <Field label="Đường dẫn" htmlFor="ann-link-url">
            <Input id="ann-link-url" value={value.announcement.linkUrl} onChange={(e) => patch('announcement', { linkUrl: e.target.value })} placeholder="/san-pham" />
          </Field>
        </div>
      </Block>

      <Block
        title="Khối đầu trang"
        hint="Thứ khách nhìn thấy đầu tiên."
        enabled={value.hero.enabled}
        onToggle={(enabled) => patch('hero', { enabled })}
      >
        <Field label="Tiêu đề" htmlFor="hero-title">
          <Input id="hero-title" value={value.hero.title} onChange={(e) => patch('hero', { title: e.target.value })} />
        </Field>
        <Field label="Mô tả" htmlFor="hero-desc">
          <Textarea id="hero-desc" rows={3} value={value.hero.description} onChange={(e) => patch('hero', { description: e.target.value })} />
        </Field>
        <Field label="Ảnh (URL)" htmlFor="hero-img" hint="Ảnh xưởng in thật luôn tốt hơn hình minh họa.">
          <Input id="hero-img" value={value.hero.imageUrl} onChange={(e) => patch('hero', { imageUrl: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nút chính — chữ" htmlFor="hero-cta">
            <Input id="hero-cta" value={value.hero.ctaText} onChange={(e) => patch('hero', { ctaText: e.target.value })} />
          </Field>
          <Field label="Nút chính — đường dẫn" htmlFor="hero-cta-url">
            <Input id="hero-cta-url" value={value.hero.ctaUrl} onChange={(e) => patch('hero', { ctaUrl: e.target.value })} />
          </Field>
          <Field label="Nút phụ — chữ" htmlFor="hero-cta2">
            <Input id="hero-cta2" value={value.hero.ctaSecondaryText} onChange={(e) => patch('hero', { ctaSecondaryText: e.target.value })} />
          </Field>
          <Field label="Nút phụ — đường dẫn" htmlFor="hero-cta2-url">
            <Input id="hero-cta2-url" value={value.hero.ctaSecondaryUrl} onChange={(e) => patch('hero', { ctaSecondaryUrl: e.target.value })} />
          </Field>
        </div>
      </Block>

      <Block
        title="Nhóm sản phẩm"
        hint="Lưới các nhóm để khách bấm vào. Nội dung lấy tự động từ catalog."
        enabled={value.categories.enabled}
        onToggle={(enabled) => set('categories', { enabled })}
      />

      <Block
        title="Sản phẩm nổi bật"
        hint="Hiện các sản phẩm được đánh dấu nổi bật trong mục Sản phẩm."
        enabled={value.popular.enabled}
        onToggle={(enabled) => patch('popular', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="popular-title">
          <Input id="popular-title" value={value.popular.title} onChange={(e) => patch('popular', { title: e.target.value })} />
        </Field>
      </Block>

      <Block
        title="Quy trình"
        hint="Các bước từ lúc gửi file tới lúc nhận hàng."
        enabled={value.process.enabled}
        onToggle={(enabled) => patch('process', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="process-title">
          <Input id="process-title" value={value.process.title} onChange={(e) => patch('process', { title: e.target.value })} />
        </Field>
        <Repeater
          label="Các bước"
          items={value.process.steps}
          max={8}
          onChange={(steps) => patch('process', { steps })}
          empty={{ title: '', description: '' }}
          render={(item, update) => (
            <>
              <Input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Tên bước" />
              <Textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Mô tả ngắn" />
            </>
          )}
        />
      </Block>

      <Block
        title="Lý do chọn nhà in"
        enabled={value.benefits.enabled}
        onToggle={(enabled) => patch('benefits', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="benefits-title">
          <Input id="benefits-title" value={value.benefits.title} onChange={(e) => patch('benefits', { title: e.target.value })} />
        </Field>
        <Repeater
          label="Các mục"
          items={value.benefits.items}
          max={8}
          onChange={(items) => patch('benefits', { items })}
          empty={{ title: '', description: '' }}
          render={(item, update) => (
            <>
              <Input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Tiêu đề" />
              <Textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Mô tả" />
            </>
          )}
        />
      </Block>

      <Block
        title="Dịch vụ tại xưởng"
        enabled={value.shopServices.enabled}
        onToggle={(enabled) => patch('shopServices', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="shop-title">
          <Input id="shop-title" value={value.shopServices.title} onChange={(e) => patch('shopServices', { title: e.target.value })} />
        </Field>
        <Field label="Mô tả" htmlFor="shop-desc">
          <Textarea id="shop-desc" rows={2} value={value.shopServices.description} onChange={(e) => patch('shopServices', { description: e.target.value })} />
        </Field>
      </Block>

      <Block title="Combo khuyến mãi" enabled={value.combo.enabled} onToggle={(enabled) => patch('combo', { enabled })}>
        <Field label="Tiêu đề khối" htmlFor="combo-title">
          <Input id="combo-title" value={value.combo.title} onChange={(e) => patch('combo', { title: e.target.value })} />
        </Field>
        <Field label="Mô tả" htmlFor="combo-desc">
          <Textarea id="combo-desc" rows={2} value={value.combo.description} onChange={(e) => patch('combo', { description: e.target.value })} />
        </Field>
        <Repeater
          label="Các combo"
          items={value.combo.items}
          max={8}
          onChange={(items) => patch('combo', { items })}
          empty={{ title: '', description: '', price: '' }}
          render={(item, update) => (
            <>
              <Input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Tên combo" />
              <Textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Gồm những gì" />
              <Input value={item.price} onChange={(e) => update({ ...item, price: e.target.value })} placeholder="Giá hiển thị, ví dụ: từ 500.000đ" />
            </>
          )}
        />
      </Block>

      <Block
        title="Ảnh sản phẩm đã in"
        hint="Lấy ảnh từ chính các sản phẩm trong catalog."
        enabled={value.gallery.enabled}
        onToggle={(enabled) => patch('gallery', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="gallery-title">
          <Input id="gallery-title" value={value.gallery.title} onChange={(e) => patch('gallery', { title: e.target.value })} />
        </Field>
      </Block>

      <Block
        title="Khách nói gì"
        hint="Chỉ đăng nhận xét có thật và đã xin phép khách."
        enabled={value.testimonials.enabled}
        onToggle={(enabled) => patch('testimonials', { enabled })}
      >
        <Field label="Tiêu đề khối" htmlFor="testi-title">
          <Input id="testi-title" value={value.testimonials.title} onChange={(e) => patch('testimonials', { title: e.target.value })} />
        </Field>
        <Repeater
          label="Nhận xét"
          items={value.testimonials.items}
          max={12}
          onChange={(items) => patch('testimonials', { items })}
          empty={{ name: '', role: '', content: '' }}
          render={(item, update) => (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Tên khách" />
                <Input value={item.role} onChange={(e) => update({ ...item, role: e.target.value })} placeholder="Cửa hàng / vai trò" />
              </div>
              <Textarea rows={3} value={item.content} onChange={(e) => update({ ...item, content: e.target.value })} placeholder="Nội dung nhận xét" />
            </>
          )}
        />
      </Block>

      <Block title="Câu hỏi thường gặp" enabled={value.faq.enabled} onToggle={(enabled) => patch('faq', { enabled })}>
        <Field label="Tiêu đề khối" htmlFor="faq-title">
          <Input id="faq-title" value={value.faq.title} onChange={(e) => patch('faq', { title: e.target.value })} />
        </Field>
        <Repeater
          label="Câu hỏi"
          items={value.faq.items}
          max={20}
          onChange={(items) => patch('faq', { items })}
          empty={{ q: '', a: '' }}
          render={(item, update) => (
            <>
              <Input value={item.q} onChange={(e) => update({ ...item, q: e.target.value })} placeholder="Câu hỏi" />
              <Textarea rows={3} value={item.a} onChange={(e) => update({ ...item, a: e.target.value })} placeholder="Câu trả lời" />
            </>
          )}
        />
      </Block>

      <Block title="Kêu gọi cuối trang" enabled={value.finalCta.enabled} onToggle={(enabled) => patch('finalCta', { enabled })}>
        <Field label="Tiêu đề" htmlFor="cta-title">
          <Input id="cta-title" value={value.finalCta.title} onChange={(e) => patch('finalCta', { title: e.target.value })} />
        </Field>
        <Field label="Mô tả" htmlFor="cta-desc">
          <Textarea id="cta-desc" rows={2} value={value.finalCta.description} onChange={(e) => patch('finalCta', { description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chữ trên nút" htmlFor="cta-text">
            <Input id="cta-text" value={value.finalCta.ctaText} onChange={(e) => patch('finalCta', { ctaText: e.target.value })} />
          </Field>
          <Field label="Đường dẫn" htmlFor="cta-url">
            <Input id="cta-url" value={value.finalCta.ctaUrl} onChange={(e) => patch('finalCta', { ctaUrl: e.target.value })} />
          </Field>
        </div>
      </Block>

      <SaveBar dirty={form.dirty} saving={form.saving} saved={form.saved} error={form.error} onReset={form.reset} />
    </form>
  );
}

/** Một khối trang chủ: gập/mở được, có công tắc bật/tắt. */
function Block({
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="rounded-token-lg border border-line bg-canvas">
      <div className="flex items-center gap-3 p-4">
        {children ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            <span className="min-w-0">
              <span className="block font-heading text-sm font-semibold">{title}</span>
              {hint && <span className="block text-[12px] text-muted">{hint}</span>}
            </span>
          </button>
        ) : (
          <span className="min-w-0 flex-1 pl-6">
            <span className="block font-heading text-sm font-semibold">{title}</span>
            {hint && <span className="block text-[12px] text-muted">{hint}</span>}
          </span>
        )}

        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Hiện khối ${title}`} />
      </div>

      {children && open && <div className="space-y-4 border-t border-line p-4">{children}</div>}
    </section>
  );
}

/** Danh sách sửa được: thêm, xóa, sửa từng mục. */
function Repeater<T>({
  label,
  items,
  max,
  empty,
  onChange,
  render,
}: {
  label: string;
  items: T[];
  max: number;
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[13px] font-medium text-ink">
        {label} <span className="text-muted-soft">({items.length}/{max})</span>
      </p>

      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-token border border-line bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-soft">#{index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label={`Xóa mục ${index + 1}`}
              className="rounded-token-sm p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {render(item, (next) => onChange(items.map((it, i) => (i === index ? next : it))))}
        </div>
      ))}

      {items.length < max && (
        <Button type="button" variant="subtle" size="sm" onClick={() => onChange([...items, structuredClone(empty)])}>
          <Plus className="h-4 w-4" aria-hidden />
          Thêm mục
        </Button>
      )}
    </div>
  );
}
