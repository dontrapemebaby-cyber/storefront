'use client';
// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Trạng thái disabled và focus áp cho mọi biến thể, không để component nào quên.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-45 ' +
    'active:translate-y-px select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg shadow-token hover:brightness-110',
        accent: 'bg-accent text-accent-fg shadow-token hover:brightness-110',
        outline: 'border border-line-strong bg-canvas text-ink hover:border-primary hover:text-primary',
        ghost: 'text-ink hover:bg-surface-strong',
        subtle: 'bg-surface-strong text-ink hover:bg-line',
        danger: 'bg-danger text-white hover:brightness-110',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-token-sm px-3 text-[13px]',
        md: 'h-11 rounded-token px-5 text-sm',
        lg: 'h-13 rounded-token px-7 text-[15px] py-3.5',
        icon: 'h-11 w-11 rounded-token',
      },
      full: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, asChild = false, loading = false, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      // Khi đang tải, nút vẫn ở DOM nhưng không bấm được — tránh gửi trùng.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, full }), className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { buttonVariants };
