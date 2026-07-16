'use client';
// src/components/admin/theme-form.tsx
// Sửa màu, chữ, bo góc. Có xem trước ngay tại chỗ.
//
// Xem trước là bắt buộc chứ không phải trang trí: không có nó, admin phải lưu →
// mở tab website → xem → quay lại sửa, mỗi vòng một lần. Nghĩa là màu xấu sẽ
// nằm trên website thật của khách trong lúc admin còn đang dò.
import * as React from 'react';
import { saveThemeAction } from '@/app/admin/actions';
import { useAdminForm } from '@/components/admin/use-admin-form';
import { AdminCard, ColorField, SaveBar } from '@/components/admin/form-bits';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { BUTTON_STYLE_OPTIONS, FONT_OPTIONS, RADIUS_OPTIONS, SHADOW_OPTIONS, hexToRgbChannels, readableOn } from '@/lib/theme';
import type { ButtonStyleChoice, FontChoice, RadiusChoice, ShadowChoice, ThemeSettings } from '@/types/storefront';

const RADIUS_PX: Record<RadiusChoice, string> = { none: '0px', sm: '4px', md: '10px', lg: '16px', xl: '24px' };

export function ThemeForm({ initial }: { initial: ThemeSettings }) {
  const form = useAdminForm(initial, saveThemeAction);
  const { value, set, fieldErrors } = form;

  return (
    <form onSubmit={form.submit} noValidate className="space-y-5">
      <AdminCard
        title="Màu sắc"
        description="Chữ trên nút tự đổi giữa đen và trắng theo độ sáng của màu nền, nên nút luôn đọc được."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Màu chủ đạo"
            hint="Nút chính, đường dẫn, điểm nhấn."
            value={value.primary}
            onChange={(v) => set('primary', v)}
            error={fieldErrors.primary}
          />
          <ColorField
            label="Màu nhấn"
            hint="Dùng tiết chế cho nhãn khuyến mãi."
            value={value.accent}
            onChange={(v) => set('accent', v)}
            error={fieldErrors.accent}
          />
          <ColorField
            label="Màu nền"
            value={value.background}
            onChange={(v) => set('background', v)}
            error={fieldErrors.background}
          />
          <ColorField
            label="Màu chữ"
            value={value.foreground}
            onChange={(v) => set('foreground', v)}
            error={fieldErrors.foreground}
          />
        </div>

        <ContrastWarning background={value.background} foreground={value.foreground} />
      </AdminCard>

      <AdminCard title="Phông chữ" description="Cả hai phông đều hỗ trợ đầy đủ dấu tiếng Việt.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phông tiêu đề" htmlFor="fontHeading">
            <Select id="fontHeading" value={value.fontHeading} onChange={(e) => set('fontHeading', e.target.value as FontChoice)}>
              {FONT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phông nội dung" htmlFor="fontBody">
            <Select id="fontBody" value={value.fontBody} onChange={(e) => set('fontBody', e.target.value as FontChoice)}>
              {FONT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Hình khối">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bo góc" htmlFor="radius">
            <Select id="radius" value={value.radius} onChange={(e) => set('radius', e.target.value as RadiusChoice)}>
              {RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Đổ bóng" htmlFor="shadow">
            <Select id="shadow" value={value.shadow} onChange={(e) => set('shadow', e.target.value as ShadowChoice)}>
              {SHADOW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kiểu nút" htmlFor="buttonStyle">
            <Select
              id="buttonStyle"
              value={value.buttonStyle}
              onChange={(e) => set('buttonStyle', e.target.value as ButtonStyleChoice)}
            >
              {BUTTON_STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Xem trước" description="Đúng những màu và hình khối này sẽ lên website khi bạn bấm lưu.">
        <ThemePreview theme={value} />
      </AdminCard>

      <SaveBar dirty={form.dirty} saving={form.saving} saved={form.saved} error={form.error} onReset={form.reset} />
    </form>
  );
}

/**
 * Cảnh báo khi chữ và nền quá sát nhau về độ sáng.
 * Không chặn lưu — admin có thể đang cố tình. Chỉ nói cho biết, vì đây là lỗi
 * rất khó tự thấy trên màn hình tốt, nhưng ngoài nắng thì không đọc nổi.
 */
function ContrastWarning({ background, foreground }: { background: string; foreground: string }) {
  const ratio = React.useMemo(() => contrastRatio(background, foreground), [background, foreground]);
  if (ratio === null || ratio >= 4.5) return null;

  return (
    <p className="rounded-token border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-ink/80">
      Chữ và nền hơi khó đọc (độ tương phản {ratio.toFixed(1)}:1, nên từ 4.5:1 trở lên). Người lớn tuổi hoặc khách xem
      ngoài trời sẽ vất vả.
    </p>
  );
}

function luminance(hex: string): number | null {
  const channels = hexToRgbChannels(hex);
  if (!channels) return null;
  const [r, g, b] = channels.split(' ').map(Number) as [number, number, number];
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function ThemePreview({ theme }: { theme: ThemeSettings }) {
  const bg = hexToRgbChannels(theme.background);
  const fg = hexToRgbChannels(theme.foreground);
  const primary = hexToRgbChannels(theme.primary);
  const accent = hexToRgbChannels(theme.accent);

  // Màu chưa hợp lệ thì không vẽ xem trước — dựng bằng màu hỏng sẽ làm admin
  // tưởng website thật đang trông như vậy.
  if (!bg || !fg || !primary || !accent) {
    return <p className="text-[13px] text-muted">Nhập đủ bốn mã màu hợp lệ để xem trước.</p>;
  }

  const radius = RADIUS_PX[theme.radius] ?? '10px';
  const buttonRadius = theme.buttonStyle === 'pill' ? '999px' : radius;
  const outline = theme.buttonStyle === 'outline';

  return (
    <div
      style={{
        background: `rgb(${bg})`,
        color: `rgb(${fg})`,
        borderRadius: radius,
        fontFamily: theme.fontBody === 'manrope' ? 'var(--font-manrope)' : 'var(--font-be-vietnam-pro)',
      }}
      className="border border-line p-6"
    >
      <p
        style={{
          fontFamily: theme.fontHeading === 'manrope' ? 'var(--font-manrope)' : 'var(--font-be-vietnam-pro)',
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        In tem nhãn lấy ngay trong ngày
      </p>
      <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, opacity: 0.65 }}>
        Chọn thông số là thấy giá. Gửi file, chuyển khoản, xong.
      </p>

      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: buttonRadius,
            background: outline ? 'transparent' : `rgb(${primary})`,
            color: outline ? `rgb(${primary})` : `rgb(${readableOn(theme.primary)})`,
            border: outline ? `1.5px solid rgb(${primary})` : '1.5px solid transparent',
          }}
        >
          Đặt in ngay
        </span>
        <span
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: buttonRadius,
            border: `1.5px solid rgb(${fg} / 0.2)`,
          }}
        >
          Xem bảng giá
        </span>
        <span
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 999,
            background: `rgb(${accent})`,
            color: `rgb(${readableOn(theme.accent)})`,
            alignSelf: 'center',
          }}
        >
          Giảm 10%
        </span>
      </div>
    </div>
  );
}
