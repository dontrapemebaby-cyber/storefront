'use client';
// src/components/ui/modal.tsx
// Modal (desktop) và Drawer / Bottom Sheet (mobile) dùng chung Radix Dialog nên
// bẫy focus, phím Esc và khóa cuộn nền đều có sẵn và đúng chuẩn.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

function Overlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in data-[state=closed]:direction-reverse',
        className,
      )}
      {...props}
    />
  );
}

interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
  /** 'center' = modal giữa màn hình. 'bottom' = bottom sheet trượt từ dưới lên. */
  placement?: 'center' | 'bottom';
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(function ModalContent({ className, children, title, description, placement = 'center', ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 bg-canvas shadow-token focus:outline-none',
          placement === 'center'
            ? 'left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-token-lg data-[state=open]:animate-fade-up'
            : 'inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-token-lg data-[state=open]:animate-slide-up',
          className,
        )}
        {...props}
      >
        {placement === 'bottom' && (
          <div className="sticky top-0 flex justify-center bg-canvas pt-2.5" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-line-strong" />
          </div>
        )}

        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="space-y-1">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold text-ink">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-mr-1 -mt-1 rounded-token-sm p-2 text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>

        <div className="px-5 pb-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/** Drawer trượt từ cạnh phải — dùng cho menu và bộ lọc trên màn hình hẹp. */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string }
>(function DrawerContent({ className, children, title, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-canvas shadow-token focus:outline-none',
          'data-[state=open]:animate-fade-in',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <DialogPrimitive.Title className="font-heading text-base font-semibold text-ink">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="rounded-token-sm p-2 text-muted transition-colors hover:bg-surface-strong hover:text-ink"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
