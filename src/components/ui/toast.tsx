'use client';
// src/components/ui/toast.tsx
// Bọc sonner để toàn site dùng cùng một kiểu và cùng token màu.
import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-body rounded-token border border-line bg-canvas text-ink shadow-token',
          title: 'text-sm font-semibold',
          description: 'text-[13px] text-muted',
          actionButton: 'bg-primary text-primary-fg rounded-token-sm',
          error: 'border-danger/30 bg-danger-soft',
          success: 'border-success/25 bg-success-soft',
        },
      }}
    />
  );
}

export { toast };
