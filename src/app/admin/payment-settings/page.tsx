// src/app/admin/payment-settings/page.tsx
import type { Metadata } from 'next';
import { guardAdminPage } from '@/lib/admin/guard';
import { getSiteSettings } from '@/lib/data/settings';
import { AdminShell } from '@/components/admin/admin-shell';
import { PaymentForm } from '@/components/admin/payment-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thanh toán' };

export default async function PaymentSettingsPage() {
  await guardAdminPage();

  const { payment } = await getSiteSettings();

  return (
    <AdminShell
      title="Thanh toán"
      description="Tài khoản nhận tiền và cách sinh mã QR cho khách."
      current="/admin/payment-settings"
    >
      {/*
        getSiteSettings() đã trộn giá trị từ biến môi trường vào chỗ nào CSDL còn
        trống. Nên nếu deploy đầu tiên chỉ dùng env, form này vẫn hiện đúng số
        đang chạy — và lần lưu đầu tiên sẽ chuyển hẳn sang lưu trong CSDL.
      */}
      <PaymentForm initial={payment} />
    </AdminShell>
  );
}
