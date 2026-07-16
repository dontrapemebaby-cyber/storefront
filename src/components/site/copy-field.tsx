'use client';
// src/components/site/copy-field.tsx
// Ô hiển thị giá trị quan trọng (mã yêu cầu, số tài khoản, nội dung chuyển khoản)
// kèm nút copy.
//
// Khách chuyển khoản trên điện thoại phải nhảy qua lại giữa app ngân hàng và
// trình duyệt. Gõ tay số tài khoản là nguồn sai sót lớn nhất, nên chỗ nào cần
// nhập chính xác đều phải copy được bằng một lần chạm.
import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyFieldProps {
  label: string;
  value: string;
  hint?: string;
  /** Chữ to hơn cho những giá trị cần đọc rõ, như số tiền. */
  emphasis?: boolean;
}

export function CopyField({ label, value, hint, emphasis }: CopyFieldProps) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Trình duyệt cũ hoặc không có quyền clipboard — dùng cách cũ.
      const area = document.createElement('textarea');
      area.value = value;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-soft">{label}</p>

      <div className="flex items-stretch gap-2">
        <p
          className={cn(
            'flex-1 select-all break-all rounded-token border border-line bg-surface px-3.5 py-2.5 font-heading font-bold text-ink',
            emphasis ? 'text-xl' : 'text-[15px]',
          )}
        >
          {value}
        </p>

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? `Đã copy ${label}` : `Copy ${label}`}
          className="flex shrink-0 items-center gap-1.5 rounded-token border border-line-strong px-3 text-[13px] font-semibold text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          <span className="hidden sm:inline">{copied ? 'Đã copy' : 'Copy'}</span>
        </button>
      </div>

      {/* aria-live để trình đọc màn hình báo đã copy xong. */}
      <span className="sr-only" aria-live="polite">
        {copied ? `Đã copy ${label}` : ''}
      </span>

      {hint && <p className="text-[12px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}
