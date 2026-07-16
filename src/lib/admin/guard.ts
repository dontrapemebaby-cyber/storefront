import 'server-only';
// src/lib/admin/guard.ts
// Cổng quyền cho khu quản trị.
//
// Ba lớp bảo vệ, mỗi lớp làm một việc khác nhau:
//   1. middleware  — chỉ chặn người chưa đăng nhập, để không chớp giao diện admin.
//   2. hàm ở đây   — chặn người đã đăng nhập nhưng KHÔNG phải super_admin.
//   3. RLS         — lớp cuối. Kể cả hai lớp trên hỏng, CSDL vẫn từ chối ghi.
//
// Lớp 3 mới là lớp thật. Hai lớp trên chỉ để khách nhận thông báo tử tế thay vì
// một lỗi CSDL khó hiểu.
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/data/settings';

/**
 * Gọi ở ĐẦU mọi trang/action trong /admin.
 * Không phải super_admin thì đá về trang từ chối, không render gì thêm.
 */
export async function guardAdminPage(): Promise<{ userId: string }> {
  const result = await requireSuperAdmin();
  if (!result.ok) redirect('/admin/khong-du-quyen');
  return { userId: result.userId };
}

/**
 * Bản dùng cho server action: trả về lỗi thay vì redirect, để form hiện được
 * thông báo tại chỗ.
 */
export async function guardAdminAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await requireSuperAdmin();
  if (!result.ok) {
    return { ok: false, error: 'Tài khoản của bạn không có quyền thực hiện việc này.' };
  }
  return { ok: true };
}
