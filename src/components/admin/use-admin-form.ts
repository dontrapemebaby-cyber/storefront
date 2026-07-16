'use client';
// src/components/admin/use-admin-form.ts
// Trạng thái dùng chung cho form quản trị: theo dõi thay đổi, gọi server action,
// nhận lỗi theo trường.
import * as React from 'react';
import type { ActionResult } from '@/lib/admin/types';

export function useAdminForm<T extends object>(
  initial: T,
  action: (input: unknown) => Promise<ActionResult>,
) {
  const [value, setValue] = React.useState<T>(initial);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Mốc so sánh giữ trong ref: prop `initial` là object mới sau mỗi lần render
  // của server component, dùng thẳng sẽ khiến form luôn tự cho là "có thay đổi".
  const baseline = React.useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(value) !== baseline.current;

  /** Sửa một trường ở tầng ngoài cùng. */
  function set<K extends keyof T>(key: K, next: T[K]) {
    setValue((prev) => ({ ...prev, [key]: next }));
    setSaved(false);
    // Xóa lỗi của đúng ô đang gõ: giữ lại chỉ làm admin tưởng vẫn còn sai.
    const name = String(key);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function reset() {
    setValue(JSON.parse(baseline.current) as T);
    setError(null);
    setFieldErrors({});
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await action(value);
      if (!result.ok) {
        setError(result.error ?? 'Không lưu được.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      // Lưu xong thì giá trị hiện tại thành mốc mới, nút Lưu trở lại mờ.
      baseline.current = JSON.stringify(value);
      setSaved(true);
    } catch {
      setError('Mất kết nối. Thay đổi của bạn chưa được lưu.');
    } finally {
      setSaving(false);
    }
  }

  return { value, setValue, set, dirty, saving, saved, error, fieldErrors, reset, submit };
}
