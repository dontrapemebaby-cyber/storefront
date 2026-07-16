// src/app/api/uploads/complete/route.ts
// Báo dashboard rằng file đã nằm trên Storage (bước 3).
//
// Dashboard tự mở object ra kiểm: có thật không, đúng dung lượng đã khai báo
// không, đúng loại file không. Vì vậy trình duyệt không thể khai một đằng tải
// một nẻo. Chỉ file được đánh 'active' mới gắn được vào yêu cầu in.
import { NextResponse } from 'next/server';
import { uploadCompleteSchema } from '@/lib/validation/order';
import { completeUpload, DashboardError } from '@/lib/dashboard/client';
import { guardPublicRoute, readJson } from '@/app/api/_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = await guardPublicRoute(req, { bucket: 'upload-complete', limit: 40, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  const parsed = uploadCompleteSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Thiếu mã file cần xác nhận.' }, { status: 400 });
  }

  try {
    const result = await completeUpload(parsed.data.uploadId, guard.context);
    return NextResponse.json({ uploadId: result.uploadId, status: result.status });
  } catch (error) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status === 401 ? 500 : error.status });
    }
    console.error('[api/uploads/complete] lỗi ngoài dự kiến:', error);
    return NextResponse.json({ error: 'Không xác minh được file vừa tải. Vui lòng thử lại.' }, { status: 500 });
  }
}
