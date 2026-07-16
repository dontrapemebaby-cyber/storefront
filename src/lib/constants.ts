// src/lib/constants.ts
// Hằng số dùng chung cho cả server và client.

/** Đúng danh sách MIME mà dashboard chấp nhận (uploadInitSchema). Không thêm bớt. */
export const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'image/svg+xml',
  'application/zip',
] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

/** Đuôi file hiển thị cho khách. */
export const ACCEPT_ATTRIBUTE = '.png,.jpg,.jpeg,.pdf,.svg,.zip';

/** Windows đôi khi báo MIME khác cho cùng một định dạng. */
const MIME_ALIASES: Record<string, AllowedMime> = {
  'image/jpg': 'image/jpeg',
  'application/x-zip-compressed': 'application/zip',
  'application/x-zip': 'application/zip',
};

const MIME_BY_EXT: Record<string, AllowedMime> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
  svg: 'image/svg+xml',
  zip: 'application/zip',
};

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Suy ra MIME chuẩn từ File. Trình duyệt đôi khi trả chuỗi rỗng (hay gặp với
 * .zip và .svg), nên phải suy từ đuôi file. Trả về null nếu không hỗ trợ.
 */
export function resolveMime(fileType: string, fileName: string): AllowedMime | null {
  const raw = (fileType.split(';')[0] ?? '').trim().toLowerCase();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (isAllowedMime(aliased)) return aliased;

  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? null;
}

export const MAX_FILES = 10;

export const CATEGORIES = [
  { value: 'tem-sticker', label: 'Tem & sticker' },
  { value: 'decal', label: 'Decal' },
  { value: 'in-kho-lon', label: 'In khổ lớn' },
  { value: 'an-pham', label: 'Ấn phẩm' },
  { value: 'bien-hieu', label: 'Biển hiệu' },
  { value: 'khac', label: 'Khác' },
] as const;

export const SERVICE_TYPES = [
  { value: 'in_an', label: 'In ấn' },
  { value: 'thi_cong', label: 'Thi công' },
  { value: 'thiet_ke', label: 'Thiết kế' },
] as const;

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? 'Khác';
}

export function serviceTypeLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

/** Nhãn tiếng Việt cho request_status của dashboard (enum trong 0001_init.sql). */
export const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: 'Đã nhận yêu cầu',
  checking_file: 'Đang kiểm tra file',
  need_more_information: 'Cần thêm thông tin',
  need_new_file: 'Cần gửi lại file',
  contacting_customer: 'Đang liên hệ với bạn',
  quote_preparing: 'Đang lên báo giá',
  quote_sent: 'Đã gửi báo giá',
  customer_considering: 'Chờ bạn phản hồi',
  customer_accepted: 'Bạn đã đồng ý báo giá',
  customer_rejected: 'Đã từ chối báo giá',
  waiting_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  converted_to_production: 'Đang sản xuất',
  cancelled: 'Đã hủy',
};

/** Mô tả bước tiếp theo, để khách biết cần làm gì. */
export const REQUEST_STATUS_HINT: Record<string, string> = {
  new: 'Chúng tôi sẽ mở file và kiểm tra trong giờ làm việc.',
  checking_file: 'Nhân viên đang xem file của bạn có in được không.',
  need_more_information: 'Chúng tôi sẽ gọi để hỏi thêm một vài thông tin.',
  need_new_file: 'File hiện tại chưa in được. Nhân viên sẽ liên hệ hướng dẫn bạn gửi lại.',
  contacting_customer: 'Nhân viên đang gọi hoặc nhắn Zalo cho bạn.',
  quote_preparing: 'Chúng tôi đang tính giá cho yêu cầu này.',
  quote_sent: 'Báo giá đã gửi. Kiểm tra Zalo hoặc email của bạn.',
  customer_considering: 'Chúng tôi đang chờ bạn quyết định.',
  customer_accepted: 'Đã ghi nhận. Đơn sẽ chuyển sang sản xuất.',
  customer_rejected: 'Yêu cầu đã đóng. Bạn có thể gửi yêu cầu mới bất cứ lúc nào.',
  waiting_payment: 'Quét mã QR để thanh toán, đơn sẽ vào xưởng ngay sau đó.',
  paid: 'Đã nhận tiền. Đơn đang chờ vào xưởng.',
  converted_to_production: 'Đơn đang in. Chúng tôi báo bạn khi xong.',
  cancelled: 'Yêu cầu này đã hủy.',
};

export type StatusTone = 'neutral' | 'progress' | 'action' | 'success' | 'danger';

export const REQUEST_STATUS_TONE: Record<string, StatusTone> = {
  new: 'neutral',
  checking_file: 'progress',
  need_more_information: 'action',
  need_new_file: 'action',
  contacting_customer: 'progress',
  quote_preparing: 'progress',
  quote_sent: 'action',
  customer_considering: 'action',
  customer_accepted: 'success',
  customer_rejected: 'danger',
  waiting_payment: 'action',
  paid: 'success',
  converted_to_production: 'progress',
  cancelled: 'danger',
};
