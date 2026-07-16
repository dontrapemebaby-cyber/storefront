// src/lib/pricing.ts
// Máy tính giá. Đây là NGUỒN SỰ THẬT DUY NHẤT về tiền.
//
// Quy tắc: trình duyệt chỉ gửi lên lựa chọn (option key -> value) và số lượng.
// KHÔNG BAO GIỜ gửi giá. Trang sản phẩm gọi /api/price để hiển thị, còn
// /api/orders tính lại từ đầu bằng chính hàm này trước khi tạo yêu cầu và trước
// khi sinh mã QR. Trình duyệt không có cách nào tác động vào con số cuối cùng.
//
// File này thuần logic (không chạm DB, không đọc env) để tính giống hệt nhau ở
// mọi nơi và dễ kiểm chứng.

import type { PriceBreakdown, PriceLine, Product, SizeUnit } from '@/types/storefront';
import { formatVnd } from '@/lib/utils';

export interface PriceInput {
  /** Lựa chọn của khách: { material: 'couche_300', pack: '100' }. */
  selections: Record<string, string>;
  /** Số lượng khách nhập. Bỏ qua nếu combo đã ấn định số lượng. */
  quantity: number;
  /** Kích thước khách nhập, luôn quy về cm trước khi gọi. */
  widthCm?: number;
  heightCm?: number;
}

export type PriceError =
  | { ok: false; code: 'missing_option'; message: string }
  | { ok: false; code: 'invalid_option'; message: string }
  | { ok: false; code: 'invalid_quantity'; message: string }
  | { ok: false; code: 'missing_size'; message: string }
  | { ok: false; code: 'size_out_of_range'; message: string }
  | { ok: false; code: 'not_priceable'; message: string };

export type PriceResult = { ok: true; breakdown: PriceBreakdown; quantity: number; widthCm?: number; heightCm?: number } | PriceError;

const CM_PER_UNIT: Record<SizeUnit, number> = { cm: 1, mm: 0.1, m: 100, inch: 2.54, px: 0 };

/** Quy đổi số đo về cm. px không phải đơn vị vật lý nên không dùng để tính giá. */
export function toCm(value: number, unit: SizeUnit): number | null {
  const factor = CM_PER_UNIT[unit];
  if (!factor) return null;
  return value * factor;
}

function round(amount: number, roundTo: number | undefined): number {
  const step = roundTo && roundTo > 0 ? roundTo : 1;
  return Math.ceil(amount / step) * step;
}

/**
 * Tính giá cho một sản phẩm. Trả về lỗi tiếng Việt thay vì ném exception, để
 * route handler chuyển thẳng thông báo cho khách.
 */
export function calculatePrice(product: Product, input: PriceInput): PriceResult {
  if (product.pricingType === 'QUOTE_REQUIRED') {
    return {
      ok: true,
      quantity: Math.max(1, Math.floor(input.quantity || 1)),
      widthCm: input.widthCm,
      heightCm: input.heightCm,
      breakdown: { lines: [], total: 0, quantity: Math.max(1, Math.floor(input.quantity || 1)), amountDue: 0, paymentKind: 'none' },
    };
  }

  if (product.pricingType === 'DEPOSIT_REQUIRED') {
    const deposit = product.depositAmount ?? 0;
    if (deposit <= 0) {
      return { ok: false, code: 'not_priceable', message: 'Sản phẩm chưa cấu hình số tiền đặt cọc.' };
    }
    const qty = Math.max(1, Math.floor(input.quantity || 1));
    return {
      ok: true,
      quantity: qty,
      widthCm: input.widthCm,
      heightCm: input.heightCm,
      breakdown: {
        lines: [{ label: 'Đặt cọc giữ lịch sản xuất', amount: deposit }],
        total: 0,
        quantity: qty,
        amountDue: deposit,
        paymentKind: 'deposit',
      },
    };
  }

  // ---- Từ đây là FIXED_PRICE -------------------------------------------------
  const cfg = product.pricing ?? {};
  const mode = cfg.mode ?? 'per_item';
  const lines: PriceLine[] = [];

  let unitAdd = 0;
  let unitMultiplier = 1;
  let flatAdd = 0;
  let packTotal: number | null = null;
  let quantity = Math.floor(input.quantity || 1);
  let widthCm = input.widthCm;
  let heightCm = input.heightCm;

  // 1. Duyệt các tùy chọn theo đúng cấu hình sản phẩm. Chỉ chấp nhận value nằm
  //    trong danh sách — không tin bất cứ chuỗi nào từ trình duyệt.
  for (const option of product.options) {
    const chosen = input.selections[option.key];

    if (!chosen) {
      if (option.required) {
        return { ok: false, code: 'missing_option', message: `Vui lòng chọn ${option.label.toLowerCase()}.` };
      }
      continue;
    }

    const value = option.values.find((v) => v.value === chosen);
    if (!value) {
      return { ok: false, code: 'invalid_option', message: `Lựa chọn cho ${option.label.toLowerCase()} không hợp lệ.` };
    }

    if (typeof value.quantity === 'number') quantity = value.quantity;
    if (typeof value.width === 'number') widthCm = value.width;
    if (typeof value.height === 'number') heightCm = value.height;

    if (typeof value.flatPrice === 'number') packTotal = value.flatPrice;
    if (typeof value.priceDelta === 'number') unitAdd += value.priceDelta;
    if (typeof value.priceMultiplier === 'number') unitMultiplier *= value.priceMultiplier;
    if (typeof value.priceFlat === 'number' && value.priceFlat !== 0) {
      flatAdd += value.priceFlat;
      lines.push({ label: `${option.label}: ${value.label}`, amount: value.priceFlat });
    }
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, code: 'invalid_quantity', message: 'Số lượng phải lớn hơn 0.' };
  }

  // 2. Tính phần chính.
  let subtotal: number;

  if (mode === 'per_pack') {
    if (packTotal === null) {
      return { ok: false, code: 'missing_option', message: 'Vui lòng chọn số lượng.' };
    }
    subtotal = packTotal * unitMultiplier;
    lines.unshift({ label: `Combo ${quantity.toLocaleString('vi-VN')} sản phẩm`, amount: subtotal });
  } else if (mode === 'per_area') {
    if (!widthCm || !heightCm || widthCm <= 0 || heightCm <= 0) {
      return { ok: false, code: 'missing_size', message: 'Vui lòng nhập chiều rộng và chiều cao.' };
    }
    const rule = cfg.size;
    if (rule) {
      if (rule.minWidthCm && widthCm < rule.minWidthCm) {
        return { ok: false, code: 'size_out_of_range', message: `Chiều rộng tối thiểu là ${rule.minWidthCm}cm.` };
      }
      if (rule.maxWidthCm && widthCm > rule.maxWidthCm) {
        return { ok: false, code: 'size_out_of_range', message: `Chiều rộng tối đa là ${rule.maxWidthCm}cm.` };
      }
      if (rule.minHeightCm && heightCm < rule.minHeightCm) {
        return { ok: false, code: 'size_out_of_range', message: `Chiều cao tối thiểu là ${rule.minHeightCm}cm.` };
      }
      if (rule.maxHeightCm && heightCm > rule.maxHeightCm) {
        return { ok: false, code: 'size_out_of_range', message: `Chiều cao tối đa là ${rule.maxHeightCm}cm.` };
      }
    }

    const rawArea = (widthCm * heightCm) / 10_000;
    const area = Math.max(rawArea, cfg.minAreaM2 ?? 0);
    const unitPrice = (unitPriceFor(cfg, quantity) + unitAdd) * unitMultiplier;
    subtotal = unitPrice * area * quantity;

    const areaText = `${area.toFixed(2).replace('.', ',')}m²`;
    lines.unshift({
      label: `${formatVnd(unitPrice)}/m² × ${areaText}${quantity > 1 ? ` × ${quantity} tấm` : ''}`,
      amount: subtotal,
    });
    if (rawArea < (cfg.minAreaM2 ?? 0)) {
      lines.push({ label: `Đã tính theo diện tích tối thiểu ${cfg.minAreaM2}m²`, amount: 0 });
    }
  } else {
    const unitPrice = (unitPriceFor(cfg, quantity) + unitAdd) * unitMultiplier;
    subtotal = unitPrice * quantity;
    lines.unshift({ label: `${formatVnd(unitPrice)} × ${quantity}`, amount: subtotal });
  }

  let total = subtotal + flatAdd;

  // 3. Mức thu tối thiểu.
  const minCharge = cfg.minCharge ?? 0;
  if (total < minCharge) {
    lines.push({ label: `Áp dụng mức tối thiểu ${formatVnd(minCharge)}`, amount: minCharge - total });
    total = minCharge;
  }

  total = round(total, cfg.roundTo);

  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, code: 'not_priceable', message: 'Không tính được giá cho lựa chọn này. Vui lòng gửi yêu cầu báo giá.' };
  }

  return {
    ok: true,
    quantity,
    widthCm,
    heightCm,
    breakdown: {
      lines,
      total,
      quantity,
      amountDue: product.allowInstantPayment ? total : 0,
      paymentKind: product.allowInstantPayment ? 'full' : 'none',
    },
  };
}

/** Đơn giá theo bậc số lượng. Bậc có minQty lớn nhất mà <= số lượng sẽ thắng. */
function unitPriceFor(cfg: { base?: number; tiers?: { minQty: number; price: number }[] }, quantity: number): number {
  const base = cfg.base ?? 0;
  if (!cfg.tiers?.length) return base;

  const applicable = cfg.tiers
    .filter((t) => quantity >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];

  return applicable ? applicable.price : base;
}

/** Nhãn hiển thị giá trên card sản phẩm. */
export function priceLabel(product: Product): string {
  if (product.pricingType === 'QUOTE_REQUIRED') return 'Liên hệ báo giá';
  if (product.pricingType === 'DEPOSIT_REQUIRED') {
    return product.depositAmount ? `Cọc ${formatVnd(product.depositAmount)}` : 'Liên hệ báo giá';
  }
  if (product.priceFrom) {
    return `Từ ${formatVnd(product.priceFrom)}${product.priceUnit ? ` / ${product.priceUnit}` : ''}`;
  }
  return 'Liên hệ báo giá';
}
