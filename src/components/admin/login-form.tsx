'use client';
// src/components/admin/login-form.tsx
// Đăng nhập bằng Supabase Auth, dùng chung tài khoản với dashboard.
//
// Không tự dựng hệ thống tài khoản riêng: thêm nhân viên, đổi mật khẩu, phân
// quyền đều làm ở dashboard. Website chỉ đọc phiên và hỏi is_super_admin().
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InlineError } from '@/components/ui/states';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Không phân biệt "sai email" với "sai mật khẩu" — như vậy là tự nói cho
        // người lạ biết email nào có thật trong hệ thống.
        setError('Email hoặc mật khẩu không đúng.');
        return;
      }

      // Chỉ nhận đường dẫn nội bộ. Thiếu bước này thì ?next=https://kẻ-xấu.com
      // biến trang đăng nhập thành bàn đạp chuyển hướng.
      const next = params.get('next');
      const target = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

      router.replace(target);
      router.refresh();
    } catch {
      setError('Không kết nối được. Kiểm tra mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-token-lg border border-line bg-canvas p-6">
      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>

      {error && <InlineError>{error}</InlineError>}

      <Button type="submit" full size="lg" loading={loading} disabled={loading}>
        <LogIn className="h-4 w-4" aria-hidden />
        Đăng nhập
      </Button>

      <p className="text-center text-[12px] leading-relaxed text-muted">
        Quên mật khẩu? Nhờ quản trị viên dashboard đặt lại giúp.
      </p>
    </form>
  );
}
