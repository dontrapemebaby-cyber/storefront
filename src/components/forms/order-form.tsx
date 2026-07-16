'use client';
// src/components/forms/order-form.tsx
// Form đặt in / gửi yêu cầu báo giá. Dùng chung cho trang sản phẩm (đã khóa sẵn
// sản phẩm) và trang /gui-file-in (khách tự chọn).
//
// NGUYÊN TẮC VỀ TIỀN: form này KHÔNG BAO GIỜ gửi giá lên server. Nó chỉ gửi
// lựa chọn (key -> value), số lượng và kích thước. Giá hiển thị lấy từ /api/price
// và chỉ để khách xem; /api/orders tính lại từ đầu trước khi tạo yêu cầu. Sửa
// con số trong DevTools không thay đổi được số tiền phải trả.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { RadioCardGroup } from '@/components/ui/radio';
import { CheckboxField } from '@/components/ui/checkbox';
import { PriceSummary } from '@/components/ui/price-summary';
import { InlineError } from '@/components/ui/states';
import { toast } from '@/components/ui/toast';
import { FileUpload } from '@/components/forms/file-upload';
import { useUploads } from '@/components/forms/use-uploads';
import { TurnstileWidget, useAntiBotSession } from '@/components/forms/turnstile';
import { normalizeVnPhone } from '@/lib/validation/order';
import { formatVnd } from '@/lib/utils';
import type { ContactMethod, OptionValue, PriceBreakdown, Product, SizeUnit } from '@/types/storefront';

interface OrderFormProps {
  products: Product[];
  /** Khóa cứng vào một sản phẩm (trang chi tiết). */
  lockedSlug?: string;
  turnstileSiteKey?: string;
  maxBytes: number;
}

const CONTACT_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: 'call', label: 'Gọi điện' },
  { value: 'zalo', label: 'Nhắn Zalo' },
  { value: 'email', label: 'Email' },
  { value: 'message', label: 'Nhắn tin' },
];

const UNIT_OPTIONS: { value: SizeUnit; label: string }[] = [
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'm', label: 'm' },
  { value: 'inch', label: 'inch' },
];

type Errors = Record<string, string>;

/**
 * Chú thích giá bên phải mỗi lựa chọn. Chỉ hiện MỘT con số — combo có giá trọn
 * gói thì hiện giá gói, còn lại hiện phần chênh so với giá gốc. Hiện cả hai chỉ
 * làm khách không biết đâu là số phải trả.
 */
function optionMeta(value: OptionValue): string | null {
  if (typeof value.flatPrice === 'number') return formatVnd(value.flatPrice);
  if (typeof value.priceFlat === 'number' && value.priceFlat !== 0) {
    return `${value.priceFlat > 0 ? '+' : ''}${formatVnd(value.priceFlat)}`;
  }
  if (typeof value.priceDelta === 'number' && value.priceDelta !== 0) {
    return `${value.priceDelta > 0 ? '+' : ''}${formatVnd(value.priceDelta)}/cái`;
  }
  return null;
}

export function OrderForm({ products, lockedSlug, turnstileSiteKey, maxBytes }: OrderFormProps) {
  const router = useRouter();

  const [slug, setSlug] = React.useState(lockedSlug ?? products[0]?.slug ?? '');
  const product = React.useMemo(() => products.find((p) => p.slug === slug), [products, slug]);

  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const [quantity, setQuantity] = React.useState('1');
  const [width, setWidth] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [unit, setUnit] = React.useState<SizeUnit>('cm');

  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [zalo, setZalo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [contactMethod, setContactMethod] = React.useState<ContactMethod>('call');
  const [neededDate, setNeededDate] = React.useState('');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [note, setNote] = React.useState('');

  const [rightsConfirmed, setRightsConfirmed] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);

  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [breakdown, setBreakdown] = React.useState<PriceBreakdown | null>(null);
  const [priceMessage, setPriceMessage] = React.useState<string | undefined>();
  const [priceLoading, setPriceLoading] = React.useState(false);

  const { ensureSession, setToken, reset: resetSession } = useAntiBotSession(turnstileSiteKey);
  const uploads = useUploads({ maxBytes, ensureSession });

  /**
   * Khóa chống trùng. Sinh MỘT LẦN cho mỗi lượt gửi và giữ nguyên khi thử lại,
   * nhờ đó bấm hai lần hoặc mạng chập chờn vẫn chỉ ra một yêu cầu duy nhất.
   * Chỉ đổi sau khi gửi thành công.
   */
  const idempotencyKeyRef = React.useRef<string>('');
  if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();

  // Đổi sản phẩm thì mọi lựa chọn của sản phẩm cũ không còn nghĩa gì.
  React.useEffect(() => {
    if (!product) return;
    const defaults: Record<string, string> = {};
    for (const option of product.options) {
      const first = option.values[0];
      if (option.required && first) defaults[option.key] = first.value;
    }
    setSelections(defaults);
    setQuantity('1');
    setWidth('');
    setHeight('');
    setBreakdown(null);
    setPriceMessage(undefined);
  }, [product]);

  // --- Giá trực tiếp ----------------------------------------------------------
  // Hoãn 350ms: khách kéo số lượng hoặc gõ kích thước sẽ không bắn hàng chục lượt gọi.
  React.useEffect(() => {
    if (!product || product.pricingType === 'QUOTE_REQUIRED') {
      setBreakdown(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/price', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            productSlug: product.slug,
            selections,
            quantity: Number(quantity) || 1,
            ...(width ? { width: Number(width) } : {}),
            ...(height ? { height: Number(height) } : {}),
            unit,
          }),
          signal: controller.signal,
        });

        const body = (await res.json()) as { ok?: boolean; breakdown?: PriceBreakdown; message?: string; error?: string };

        if (body.ok && body.breakdown) {
          setBreakdown(body.breakdown);
          setPriceMessage(undefined);
        } else {
          setBreakdown(null);
          setPriceMessage(body.message ?? body.error);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setBreakdown(null);
          setPriceMessage('Chưa tính được giá. Bạn vẫn gửi yêu cầu được, nhân viên sẽ báo giá lại.');
        }
      } finally {
        setPriceLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [product, selections, quantity, width, height, unit]);

  // --- Kiểm tra trước khi gửi -------------------------------------------------
  function validate(): boolean {
    const next: Errors = {};

    if (!product) next.product = 'Vui lòng chọn sản phẩm.';
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ tên.';

    const normalizedPhone = normalizeVnPhone(phone);
    if (!phone.trim()) next.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^0\d{9}$/.test(normalizedPhone)) next.phone = 'Số điện thoại chưa đúng. Ví dụ đúng: 0901234567.';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email chưa đúng định dạng.';

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) next.quantity = 'Số lượng phải là số nguyên lớn hơn 0.';

    if (product) {
      for (const option of product.options) {
        if (option.required && !selections[option.key]) {
          next[`option-${option.key}`] = `Vui lòng chọn ${option.label.toLowerCase()}.`;
        }
      }
      if (product.pricing.mode === 'per_area' && (!width || !height)) {
        next.size = 'Vui lòng nhập chiều rộng và chiều cao.';
      }
    }

    if (!rightsConfirmed) next.rightsConfirmed = 'Bạn cần xác nhận quyền sử dụng nội dung trong file.';
    if (!privacyAccepted) next.privacyAccepted = 'Bạn cần đồng ý với chính sách bảo mật.';

    setErrors(next);

    // Cuộn tới ô lỗi đầu tiên — form dài, khách không tự tìm được lỗi ở đâu.
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!validate() || !product) return;

    if (uploads.isUploading) {
      setFormError('File đang tải lên. Vui lòng đợi tải xong rồi gửi.');
      return;
    }

    setSubmitting(true);
    try {
      await ensureSession();

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          selections,
          customer: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            zalo: zalo.trim(),
            email: email.trim(),
            companyName: companyName.trim(),
          },
          request: {
            quantity: Number(quantity) || 1,
            unit,
            ...(width ? { width: Number(width) } : {}),
            ...(height ? { height: Number(height) } : {}),
            ...(neededDate ? { neededDate } : {}),
            deliveryAddress: deliveryAddress.trim(),
            preferredContactMethod: contactMethod,
            customerNote: note.trim(),
          },
          uploadIds: uploads.readyUploadIds,
          consent: { rightsConfirmed, privacyAccepted },
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const body = (await res.json()) as { error?: string; redirectTo?: string; requestCode?: string };

      if (!res.ok || !body.redirectTo) {
        setFormError(body.error ?? 'Không gửi được yêu cầu. Vui lòng thử lại.');
        // Phiên hết hạn -> cho lượt sau xác minh lại từ đầu.
        if (res.status === 403) resetSession();
        return;
      }

      toast.success(`Đã nhận yêu cầu ${body.requestCode}`);
      // Gửi xong rồi: lượt sau là một yêu cầu khác, cần khóa mới.
      idempotencyKeyRef.current = crypto.randomUUID();
      router.push(body.redirectTo);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  const showSize = product?.pricing.mode === 'per_area' || product?.pricingType !== 'FIXED_PRICE';
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* ---- Sản phẩm --------------------------------------------------------- */}
      {!lockedSlug && (
        <fieldset className="space-y-4">
          <legend className="mb-3 font-heading text-lg font-semibold">1. Bạn cần in gì?</legend>

          <Field label="Sản phẩm" htmlFor="product" required error={errors.product}>
            <Select id="product" value={slug} onChange={(e) => setSlug(e.target.value)}>
              <option value="">— Chọn sản phẩm —</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          {product?.shortDescription && (
            <p className="flex gap-2 rounded-token border border-line bg-surface p-3 text-[13px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {product.shortDescription}
            </p>
          )}
        </fieldset>
      )}

      {/* ---- Thông số --------------------------------------------------------- */}
      {product && (
        <fieldset className="space-y-5">
          <legend className="mb-3 font-heading text-lg font-semibold">
            {lockedSlug ? '1. Chọn thông số' : '2. Thông số'}
          </legend>

          {product.options.map((option) => (
            <div key={option.key} id={`option-${option.key}`}>
              <Field label={option.label} required={option.required} error={errors[`option-${option.key}`]}>
                {option.type === 'select' ? (
                  <Select
                    value={selections[option.key] ?? ''}
                    onChange={(e) => setSelections((prev) => ({ ...prev, [option.key]: e.target.value }))}
                    aria-label={option.label}
                  >
                    <option value="">— Chọn —</option>
                    {option.values.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <RadioCardGroup
                    name={option.key}
                    value={selections[option.key]}
                    columns={option.values.length > 3 ? 2 : 1}
                    invalid={Boolean(errors[`option-${option.key}`])}
                    onChange={(value) => setSelections((prev) => ({ ...prev, [option.key]: value }))}
                    options={option.values.map((v) => ({
                      value: v.value,
                      label: v.label,
                      ...(optionMeta(v) ? { meta: optionMeta(v)! } : {}),
                    }))}
                  />
                )}
              </Field>
            </div>
          ))}

          {showSize && (
            <div id="size">
              <Field
                label="Kích thước thành phẩm"
                error={errors.size}
                hint={product.pricing.mode === 'per_area' ? 'Nhập kích thước để tính giá theo mét vuông.' : 'Nếu chưa biết chính xác, cứ để trống — nhân viên sẽ hỏi lại.'}
              >
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Rộng"
                    aria-label="Chiều rộng"
                  />
                  <span className="self-center text-muted-soft" aria-hidden>
                    ×
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Cao"
                    aria-label="Chiều cao"
                  />
                  <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as SizeUnit)}
                    aria-label="Đơn vị đo"
                    className="w-24 shrink-0"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </Field>
            </div>
          )}

          {/* Combo tự ấn định số lượng — hỏi lại chỉ làm khách bối rối. */}
          {product.pricing.mode !== 'per_pack' && (
            <div id="quantity">
              <Field label="Số lượng" htmlFor="quantity-input" required error={errors.quantity}>
                <Input
                  id="quantity-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="max-w-[160px]"
                />
              </Field>
            </div>
          )}

          {product.pricingType !== 'QUOTE_REQUIRED' && (
            <PriceSummary breakdown={breakdown} loading={priceLoading} message={priceMessage} />
          )}

          {product.pricingType === 'QUOTE_REQUIRED' && (
            <p className="flex gap-2 rounded-token border border-line bg-surface p-3 text-[13px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              Sản phẩm này cần khảo sát hoặc tính riêng theo yêu cầu, nên chưa có giá tự động. Gửi yêu cầu xong bạn nhận
              mã tra cứu ngay, nhân viên báo giá trong 2 giờ làm việc.
            </p>
          )}
        </fieldset>
      )}

      {/* ---- File ------------------------------------------------------------- */}
      <fieldset className="space-y-3">
        <legend className="mb-1 font-heading text-lg font-semibold">{lockedSlug ? '2. Gửi file' : '3. Gửi file'}</legend>
        <p className="text-[13px] leading-relaxed text-muted">
          Chưa có file cũng gửi yêu cầu được — mô tả ý tưởng ở ô ghi chú, chúng tôi hỗ trợ thiết kế.{' '}
          <Link href="/huong-dan-file-in" className="font-medium text-primary hover:underline">
            Xem hướng dẫn chuẩn bị file
          </Link>
          .
        </p>

        <FileUpload
          items={uploads.items}
          maxBytes={maxBytes}
          onAdd={uploads.addFiles}
          onCancel={uploads.cancel}
          onRetry={uploads.retry}
          onRemove={uploads.remove}
          disabled={submitting}
        />
      </fieldset>

      {/* ---- Liên hệ ---------------------------------------------------------- */}
      <fieldset className="space-y-5">
        <legend className="mb-1 font-heading text-lg font-semibold">
          {lockedSlug ? '3. Thông tin liên hệ' : '4. Thông tin liên hệ'}
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="fullName">
            <Field label="Họ và tên" htmlFor="fullName-input" required error={errors.fullName}>
              <Input
                id="fullName-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Nguyễn Văn A"
              />
            </Field>
          </div>

          <div id="phone">
            <Field label="Số điện thoại" htmlFor="phone-input" required error={errors.phone} hint="Dùng để tra cứu đơn sau này.">
              <Input
                id="phone-input"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="0901234567"
              />
            </Field>
          </div>

          <Field label="Số Zalo" htmlFor="zalo-input" hint="Để trống nếu trùng số điện thoại.">
            <Input id="zalo-input" value={zalo} onChange={(e) => setZalo(e.target.value)} placeholder="0901234567" />
          </Field>

          <div id="email">
            <Field label="Email" htmlFor="email-input" error={errors.email}>
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="ban@congty.vn"
              />
            </Field>
          </div>

          <Field label="Tên công ty / cửa hàng" htmlFor="company-input">
            <Input
              id="company-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="organization"
            />
          </Field>

          <Field label="Cần hàng trước ngày" htmlFor="date-input">
            <Input id="date-input" type="date" min={today} value={neededDate} onChange={(e) => setNeededDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Bạn muốn được liên hệ bằng cách nào?">
          <RadioCardGroup
            name="contactMethod"
            value={contactMethod}
            columns={2}
            onChange={(value) => setContactMethod(value as ContactMethod)}
            options={CONTACT_OPTIONS}
          />
        </Field>

        <Field label="Địa chỉ giao hàng" htmlFor="address-input" hint="Để trống nếu bạn tự tới lấy tại xưởng.">
          <Input
            id="address-input"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            autoComplete="street-address"
          />
        </Field>

        <Field label="Ghi chú" htmlFor="note-input" hint="Mô tả ý tưởng, yêu cầu riêng, hoặc nói rõ bạn cần hỗ trợ thiết kế.">
          <Textarea id="note-input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
        </Field>
      </fieldset>

      {/* ---- Xác nhận --------------------------------------------------------- */}
      <fieldset className="space-y-3">
        <legend className="sr-only">Xác nhận</legend>

        <div id="rightsConfirmed">
          <CheckboxField id="rights" checked={rightsConfirmed} onCheckedChange={setRightsConfirmed} error={errors.rightsConfirmed}>
            Tôi xác nhận có quyền sử dụng nội dung, hình ảnh và thương hiệu trong file đã gửi.{' '}
            <Link href="/quy-dinh-file-in" className="font-medium text-primary hover:underline">
              Xem quy định
            </Link>
          </CheckboxField>
        </div>

        <div id="privacyAccepted">
          <CheckboxField id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} error={errors.privacyAccepted}>
            Tôi đồng ý để nhà in lưu và dùng thông tin này nhằm xử lý yêu cầu, theo{' '}
            <Link href="/chinh-sach-bao-mat" className="font-medium text-primary hover:underline">
              chính sách bảo mật
            </Link>
            .
          </CheckboxField>
        </div>
      </fieldset>

      <TurnstileWidget siteKey={turnstileSiteKey} onToken={setToken} />

      {formError && <InlineError>{formError}</InlineError>}

      <div className="space-y-3">
        <Button type="submit" size="lg" full loading={submitting} disabled={submitting || uploads.isUploading}>
          {breakdown && breakdown.amountDue > 0
            ? `Gửi yêu cầu và thanh toán ${formatVnd(breakdown.amountDue)}`
            : 'Gửi yêu cầu'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>

        <p className="text-center text-[12px] leading-relaxed text-muted-soft">
          Gửi xong bạn nhận ngay mã yêu cầu để tra cứu. Chúng tôi không tự trừ tiền — bạn chủ động chuyển khoản sau khi
          xem mã QR.
        </p>
      </div>
    </form>
  );
}
