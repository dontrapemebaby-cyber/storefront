// src/lib/vietqr.ts
// Sinh mã QR chuyển khoản theo chuẩn VietQR (EMVCo Merchant-Presented QR).
//
// Hai chế độ, chọn bằng BANK_QR_MODE hoặc trong /admin/payment-settings:
//   * 'emv'          — tự dựng chuỗi EMVCo rồi vẽ QR ngay trên server. Không phụ
//                      thuộc dịch vụ ngoài, không rò rỉ số tài khoản và số tiền
//                      của khách sang bên thứ ba. Đây là chế độ nên dùng.
//   * 'vietqr_image' — dùng ảnh dựng sẵn của img.vietqr.io. Tiện vì có logo ngân
//                      hàng, nhưng dữ liệu đơn đi qua máy chủ của họ.
//
// Chuỗi EMVCo gồm các trường TLV: <ID 2 số><độ dài 2 số><nội dung>.

export interface VietQrInput {
  /** Mã BIN ngân hàng 6 số, ví dụ 970436 = Vietcombank. */
  bankBin: string;
  accountNumber: string;
  /** Số tiền VND, số nguyên. */
  amount: number;
  /** Nội dung chuyển khoản. */
  description: string;
}

/** Nối một trường TLV. Độ dài luôn 2 chữ số theo chuẩn. */
function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

/**
 * CRC-16/CCITT-FALSE — chuẩn EMVCo bắt buộc.
 * Poly 0x1021, khởi tạo 0xFFFF, không đảo bit, không XOR đầu ra.
 */
export function crc16(input: string): string {
  let crc = 0xffff;

  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Nội dung chuyển khoản chỉ nên có A–Z, 0–9 và khoảng trắng: nhiều ngân hàng
 * cắt hoặc từ chối dấu tiếng Việt. Bỏ dấu và viết hoa để nhân viên đối soát dễ.
 */
export function sanitizeDescription(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);
}

/** Dựng chuỗi EMVCo hoàn chỉnh (đã gồm CRC ở cuối). */
export function buildVietQrPayload({ bankBin, accountNumber, amount, description }: VietQrInput): string {
  // Merchant Account Information cho VietQR (ID 38).
  const beneficiary = tlv('00', bankBin) + tlv('01', accountNumber);
  const merchantAccount = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');

  const parts = [
    tlv('00', '01'),                       // Payload format indicator
    tlv('01', '12'),                       // 12 = QR dùng một lần (có số tiền)
    tlv('38', merchantAccount),
    tlv('53', '704'),                      // Mã tiền tệ VND theo ISO 4217
    tlv('54', String(Math.round(amount))),
    tlv('58', 'VN'),                       // Mã quốc gia
    tlv('62', tlv('08', sanitizeDescription(description))),
  ].join('');

  // CRC được tính trên toàn bộ chuỗi đã gồm '6304'.
  const withCrcHeader = `${parts}6304`;
  return `${withCrcHeader}${crc16(withCrcHeader)}`;
}

/** URL ảnh QR của VietQR, cho chế độ 'vietqr_image'. */
export function buildVietQrImageUrl({ bankBin, accountNumber, amount, description }: VietQrInput, accountName: string): string {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: sanitizeDescription(description),
    accountName,
  });
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?${params.toString()}`;
}

/**
 * Nội dung chuyển khoản: tiền tố + mã yêu cầu. Nhân viên đối soát bằng chính mã
 * này nên không được đổi định dạng tùy tiện.
 */
export function buildPaymentReference(prefix: string, requestCode: string): string {
  return sanitizeDescription(`${prefix} ${requestCode}`);
}
