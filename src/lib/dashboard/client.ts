import 'server-only';
// src/lib/dashboard/client.ts
// Cầu nối DUY NHẤT tới public API của dashboard.
//
// BẤT BIẾN QUAN TRỌNG: DASHBOARD_API_KEY chỉ tồn tại trong tiến trình server của
// website này. File có 'server-only' nên nếu ai đó lỡ import từ client component,
// build sẽ hỏng ngay thay vì âm thầm gửi key ra trình duyệt.
//
// Hợp đồng API bên dưới lấy nguyên từ source dashboard, không suy đoán:
//   * POST /api/public/uploads/init      — src/app/api/public/uploads/init/route.ts
//   * POST /api/public/uploads/complete  — src/app/api/public/uploads/complete/route.ts
//   * POST /api/public/print-requests    — src/app/api/public/print-requests/route.ts
// Scope cần có trên api_clients: uploads:create, requests:create.

import { dashboardEnv } from '@/lib/env';
import type { ContactMethod, SizeUnit } from '@/types/storefront';

/** Dashboard trả lỗi dạng { success: false, error: '<tiếng Việt>' }. */
interface DashboardErrorBody {
  success: false;
  error: string;
  details?: unknown;
}

export class DashboardError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}

interface CallOptions {
  path: string;
  body: unknown;
  /** IP thật của khách. Dashboard rate-limit theo IP nên phải chuyển tiếp,
   *  nếu không mọi khách sẽ dùng chung một hạn mức của server website. */
  clientIp?: string | null;
  userAgent?: string | null;
  idempotencyKey?: string | null;
}

async function callDashboard<T>({ path, body, clientIp, userAgent, idempotencyKey }: CallOptions): Promise<T> {
  const { apiUrl, apiKey } = dashboardEnv();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  };
  if (clientIp) headers['x-forwarded-for'] = clientIp;
  if (userAgent) headers['user-agent'] = userAgent;
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error(`[dashboard] ${path} không gọi được:`, error);
    throw new DashboardError('Không kết nối được tới hệ thống xử lý đơn. Vui lòng thử lại sau ít phút.', 503);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DashboardError('Hệ thống xử lý đơn trả về dữ liệu không đọc được.', 502);
  }

  if (!response.ok || (payload as { success?: boolean }).success !== true) {
    const error = payload as DashboardErrorBody;
    // Dashboard đã viết thông báo bằng tiếng Việt cho khách, dùng lại nguyên văn.
    const message = typeof error?.error === 'string' ? error.error : 'Hệ thống xử lý đơn từ chối yêu cầu.';

    // 401/403 là lỗi cấu hình của chúng ta (key sai / thiếu scope), không phải
    // lỗi của khách — ghi log rõ ràng nhưng không nói chi tiết ra ngoài.
    if (response.status === 401 || response.status === 403) {
      console.error(`[dashboard] ${path} từ chối xác thực: ${message}`);
      throw new DashboardError('Website chưa được cấp quyền gửi yêu cầu. Vui lòng liên hệ nhà in qua điện thoại.', 500);
    }

    throw new DashboardError(message, response.status, error?.details);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadInitResponse {
  success: true;
  uploadId: string;
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  expiresAt: string;
}

/**
 * Xin signed upload URL. Dashboard tự kiểm MIME + dung lượng và tự đặt lại tên
 * file bằng UUID, nên tên khách gửi chỉ để hiển thị.
 */
export function initUpload(
  input: { filename: string; mimeType: string; sizeBytes: number },
  context: { clientIp?: string | null; userAgent?: string | null },
): Promise<UploadInitResponse> {
  return callDashboard<UploadInitResponse>({
    path: '/api/public/uploads/init',
    body: input,
    ...context,
  });
}

export interface UploadCompleteResponse {
  success: true;
  uploadId: string;
  status: 'active';
  alreadyCompleted: boolean;
}

/**
 * Báo dashboard rằng file đã lên Storage. Dashboard sẽ tự kiểm tra object có
 * thật, đúng dung lượng và đúng loại file trước khi chuyển sang 'active'.
 * Idempotent — gọi lại không gây lỗi.
 */
export function completeUpload(
  uploadId: string,
  context: { clientIp?: string | null; userAgent?: string | null },
): Promise<UploadCompleteResponse> {
  return callDashboard<UploadCompleteResponse>({
    path: '/api/public/uploads/complete',
    body: { uploadId },
    ...context,
  });
}

// ---------------------------------------------------------------------------
// Yêu cầu in (RFQ)
// ---------------------------------------------------------------------------

export interface PrintRequestPayload {
  customer: {
    fullName: string;
    phone: string;
    zalo?: string;
    email?: string;
    companyName?: string;
  };
  request: {
    productTypeCode: string;
    width?: number;
    height?: number;
    unit: SizeUnit;
    quantity: number;
    material?: string;
    finishing?: string;
    neededDate?: string;
    deliveryAddress?: string;
    installationAddress?: string;
    budget?: number;
    preferredContactMethod?: ContactMethod;
    customerNote?: string;
  };
  uploads?: { uploadId: string }[];
  source: 'website';
}

export interface PrintRequestResponse {
  success: true;
  requestCode: string;
  status: string;
}

/**
 * Tạo yêu cầu in. idempotencyKey là bắt buộc: khách bấm hai lần hoặc mạng chập
 * chờn sẽ trả về đúng yêu cầu cũ thay vì tạo bản trùng (dashboard khóa theo
 * (api_client_id, idempotency_key) trong migration 0007).
 */
export function createPrintRequest(
  payload: PrintRequestPayload,
  context: { clientIp?: string | null; userAgent?: string | null; idempotencyKey: string },
): Promise<PrintRequestResponse> {
  return callDashboard<PrintRequestResponse>({
    path: '/api/public/print-requests',
    body: payload,
    ...context,
  });
}
