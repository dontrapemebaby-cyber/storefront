'use client';
// src/components/admin/payment-form.tsx
// Cấu hình tài khoản nhận tiền.
//
// Đây là màn hình nguy hiểm nhất trong khu quản trị: sai một chữ số ở đây là
// tiền của khách chảy sang tài khoản người lạ, và không ai phát hiện cho tới khi
// khách phàn nàn. Vì vậy có xem trước mã QR ngay tại chỗ — admin quét thử bằng
// app ngân hàng của mình và thấy tên chủ tài khoản hiện lên TRƯỚC khi lưu.
import * as React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { savePaymentAction } from '@/app/admin/actions';
import { useAdminForm } from '@/components/admin/use-admin-form';
import { AdminCard, SaveBar } from '@/components/admin/form-bits';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { RadioCardGroup } from '@/components/ui/radio';
import { buildVietQrImageUrl, buildVietQrPayload } from '@/lib/vietqr';
import { deaccent, formatVnd } from '@/lib/utils';
import type { PaymentSettings } from '@/types/storefront';

/** BIN của các ngân hàng phổ biến ở Việt Nam, theo chuẩn NAPAS. */
const BANKS = [
  { bin: '970415', name: 'VietinBank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970429', name: 'SCB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970454', name: 'VietCapitalBank' },
  { bin: '963388', name: 'Timo' },
  { bin: '970400', name: 'SaigonBank' },
];

const MODE_OPTIONS = [
  {
    value: 'emv',
    label: 'Tự sinh mã QR',
    description: 'Website tự vẽ QR. Dữ liệu không đi qua bên thứ ba nào. Nên chọn cách này.',
  },
  {
    value: 'vietqr_image',
    label: 'Dùng ảnh của VietQR',
    description: 'QR có logo ngân hàng, nhìn quen mắt hơn. Đổi lại, số tài khoản và số tiền của từng đơn đi qua img.vietqr.io.',
  },
];

export function PaymentForm({ initial }: { initial: PaymentSettings }) {
  const form = useAdminForm(initial, savePaymentAction);
  const { value, set, setValue, fieldErrors } = form;

  const ready = Boolean(value.bankBin && value.accountNumber && value.accountName);

  return (
    <form onSubmit={form.submit} noValidate className="space-y-5">
      <AdminCard
        title="Tài khoản nhận tiền"
        description="Kiểm tra thật kỹ. Sai số tài khoản nghĩa là tiền của khách vào ví người khác."
      >
        <Field label="Ngân hàng" htmlFor="bank" required error={fieldErrors.bankBin}>
          <Select
            id="bank"
            value={value.bankBin}
            invalid={Boolean(fieldErrors.bankBin)}
            onChange={(e) => {
              const bin = e.target.value;
              const bank = BANKS.find((b) => b.bin === bin);
              // Đặt cả hai cùng lúc: tên ngân hàng phải luôn khớp với BIN, nếu
              // lệch thì khách đọc thấy một đằng mà QR trỏ một nẻo.
              setValue((prev) => ({ ...prev, bankBin: bin, bankName: bank?.name ?? prev.bankName }));
            }}
          >
            <option value="">— Chọn ngân hàng —</option>
            {BANKS.map((b) => (
              <option key={b.bin} value={b.bin}>{b.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Số tài khoản" htmlFor="accountNumber" required error={fieldErrors.accountNumber}>
          <Input
            id="accountNumber"
            value={value.accountNumber}
            onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, ''))}
            invalid={Boolean(fieldErrors.accountNumber)}
            inputMode="numeric"
            spellCheck={false}
            className="font-mono"
          />
        </Field>

        <Field
          label="Tên chủ tài khoản"
          htmlFor="accountName"
          required
          hint="Viết IN HOA, KHÔNG DẤU — đúng như ngân hàng đăng ký."
          error={fieldErrors.accountName}
        >
          <Input
            id="accountName"
            value={value.accountName}
            // Tự bỏ dấu và in hoa: gõ "Nguyễn Văn A" thành "NGUYEN VAN A".
            // Chuẩn VietQR không nhận dấu tiếng Việt.
            onChange={(e) => set('accountName', deaccent(e.target.value).toUpperCase())}
            invalid={Boolean(fieldErrors.accountName)}
            spellCheck={false}
          />
        </Field>

        <Field label="Chi nhánh" htmlFor="branch" hint="Không bắt buộc. Chỉ để hiển thị cho khách." error={fieldErrors.branch}>
          <Input id="branch" value={value.branch} onChange={(e) => set('branch', e.target.value)} />
        </Field>
      </AdminCard>

      <AdminCard title="Cách sinh mã QR">
        <RadioCardGroup
          name="mode"
          value={value.mode}
          options={MODE_OPTIONS}
          onChange={(v) => set('mode', v as PaymentSettings['mode'])}
        />
      </AdminCard>

      <AdminCard
        title="Nội dung chuyển khoản"
        description="Nhân viên dựa vào nội dung này để tìm giao dịch trong sao kê."
      >
        <Field
          label="Tiền tố"
          htmlFor="prefix"
          hint="Chữ và số, không dấu. Nội dung sẽ có dạng: TIENTO RFQ202607 00001."
          error={fieldErrors.prefix}
        >
          <Input
            id="prefix"
            value={value.prefix}
            onChange={(e) => set('prefix', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            invalid={Boolean(fieldErrors.prefix)}
            className="font-mono"
            placeholder="NHAIN"
          />
        </Field>

        <Field
          label="Ghi chú hiện cho khách"
          htmlFor="note"
          hint="Hiện ở cuối trang thanh toán. Bỏ trống thì không hiện gì."
          error={fieldErrors.note}
        >
          <Textarea id="note" rows={2} value={value.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </AdminCard>

      <AdminCard
        title="Thử mã QR"
        description="Quét bằng chính app ngân hàng của bạn và kiểm tra tên chủ tài khoản hiện lên có đúng không — làm việc này TRƯỚC khi lưu."
      >
        <QrPreview payment={value} ready={ready} />
      </AdminCard>

      <div className="flex gap-3 rounded-token-lg border border-line bg-surface p-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
        <p className="text-[13px] leading-relaxed text-muted">
          Website không tự biết tiền đã vào hay chưa. Khách bấm “Tôi đã chuyển khoản” chỉ là lời báo — nhân viên vẫn phải
          mở sao kê đối soát rồi xác nhận trong dashboard.
        </p>
      </div>

      <SaveBar dirty={form.dirty} saving={form.saving} saved={form.saved} error={form.error} onReset={form.reset} />
    </form>
  );
}

/** Vẽ QR thử với số tiền tượng trưng 10.000đ. */
function QrPreview({ payment, ready }: { payment: PaymentSettings; ready: boolean }) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  const amount = 10000;
  const description = `${payment.prefix ? payment.prefix + ' ' : ''}TEST`.trim();

  React.useEffect(() => {
    if (!ready || payment.mode !== 'emv') {
      setDataUrl(null);
      return;
    }

    let cancelled = false;
    setFailed(false);

    // Nạp thư viện qrcode động: nó khá nặng và chỉ màn hình này cần tới.
    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(
          buildVietQrPayload({
            bankBin: payment.bankBin,
            accountNumber: payment.accountNumber,
            amount,
            description,
          }),
          { errorCorrectionLevel: 'M', margin: 1, width: 400, color: { dark: '#101114', light: '#FFFFFF' } },
        ),
      )
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, payment.mode, payment.bankBin, payment.accountNumber, description]);

  if (!ready) {
    return (
      <div className="flex gap-3 rounded-token border border-warning/30 bg-warning-soft px-3.5 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p className="text-[13px] leading-relaxed text-ink/70">
          Điền đủ ngân hàng, số tài khoản và tên chủ tài khoản để xem thử mã QR. Khi chưa đủ, trang thanh toán của khách
          sẽ không hiện QR mà chỉ hiện lời nhắn gọi cho nhà in.
        </p>
      </div>
    );
  }

  const imageUrl =
    payment.mode === 'vietqr_image'
      ? buildVietQrImageUrl(
          { bankBin: payment.bankBin, accountNumber: payment.accountNumber, amount, description },
          payment.accountName,
        )
      : dataUrl;

  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="mx-auto rounded-token border border-line bg-white p-2.5">
        {failed ? (
          <div className="flex h-[168px] w-[168px] items-center justify-center px-3 text-center text-[12px] text-muted">
            Không vẽ được mã QR.
          </div>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Mã QR thử với số tiền 10.000đ" width={168} height={168} className="h-[168px] w-[168px] object-contain" />
        ) : (
          <div className="h-[168px] w-[168px] animate-pulse rounded-token-sm bg-surface" />
        )}
      </div>

      <dl className="space-y-2 text-[13px]">
        <Row label="Ngân hàng" value={payment.bankName || '—'} />
        <Row label="Số tài khoản" value={payment.accountNumber} mono />
        <Row label="Chủ tài khoản" value={payment.accountName} />
        <Row label="Số tiền thử" value={formatVnd(amount)} />
        <Row label="Nội dung" value={description} mono />
      </dl>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
