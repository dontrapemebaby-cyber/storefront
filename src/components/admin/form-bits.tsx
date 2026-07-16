'use client';
// src/components/admin/form-bits.tsx
// Mấy mảnh dùng lại trong các form quản trị.
import * as React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InlineError } from '@/components/ui/states';
import { isHexColor } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Nhóm các trường lại thành khối có tiêu đề. */
export function AdminCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-token-lg border border-line bg-canvas p-5 lg:p-6">
      <header className="mb-5">
        <h2 className="font-heading text-base font-bold">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * Thanh lưu dính đáy màn hình.
 *
 * Form cấu hình rất dài. Nút lưu nằm ở cuối trang nghĩa là admin sửa xong một ô
 * ở trên đầu phải cuộn hết trang mới lưu được — và hay quên, mất luôn thay đổi.
 */
export function SaveBar({
  dirty,
  saving,
  saved,
  error,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onReset: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-[13px]">
          {error ? (
            <InlineError>{error}</InlineError>
          ) : saved && !dirty ? (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <Check className="h-4 w-4" aria-hidden />
              Đã lưu
            </span>
          ) : dirty ? (
            <span className="text-muted">Có thay đổi chưa lưu.</span>
          ) : (
            <span className="text-muted-soft">Chưa có thay đổi nào.</span>
          )}
        </div>

        <div className="flex gap-2">
          {dirty && (
            <Button type="button" variant="ghost" onClick={onReset} disabled={saving}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Hoàn tác
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={saving || !dirty}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Ô chọn màu: bảng màu hệ điều hành + ô gõ mã hex.
 * Có cả hai vì bảng màu tiện để dò, còn ô hex là cách duy nhất dán đúng mã màu
 * thương hiệu.
 */
export function ColorField({
  label,
  hint,
  value,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = React.useId();
  const valid = isHexColor(value);

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} — bảng chọn màu`}
          value={valid ? normalizeHex(value) : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-token border border-line-strong bg-canvas p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          invalid={Boolean(error) || !valid}
          spellCheck={false}
          className={cn('font-mono uppercase')}
          placeholder="#0057FF"
        />
      </div>
    </Field>
  );
}

/** <input type="color"> chỉ nhận dạng 6 ký tự — '#FFF' sẽ bị nó bỏ qua. */
function normalizeHex(hex: string): string {
  const body = hex.trim().slice(1);
  if (body.length === 3) return '#' + body.split('').map((c) => c + c).join('');
  return hex.trim();
}
