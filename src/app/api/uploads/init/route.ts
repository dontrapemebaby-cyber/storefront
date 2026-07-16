// src/app/api/uploads/init/route.ts
// Xin signed upload URL cho một file.
//
// Đây là bước 1 trong ba bước. Trình duyệt gửi metadata (không gửi file), route
// này gọi dashboard kèm API key, rồi trả về signedUrl để trình duyệt PUT thẳng
// vào Supabase Storage. File KHÔNG đi qua server website — vừa nhanh hơn, vừa
// không tốn băng thông và thời gian chạy của Netlify Function.
//
// Route chỉ trả lại uploadId + signedUrl. Bucket/path/token của dashboard được
// giữ lại ở server vì trình duyệt không cần biết.
import { NextResponse } from 'next/server';
import { uploadInitSchema } from '@/lib/validation/order';
import { initUpload, DashboardError } from '@/lib/dashboard/client';
import { maxUploadBytes } from '@/lib/env';
import { formatBytes } from '@/lib/utils';
import { guardPublicRoute, readJson } from '@/app/api/_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = await guardPublicRoute(req, { bucket: 'upload-init', limit: 40, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  const parsed = uploadInitSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Thông tin file không hợp lệ.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Chặn sớm ở đây để khách biết ngay, thay vì tải xong mới bị dashboard từ chối.
  const limit = maxUploadBytes();
  if (parsed.data.sizeBytes > limit) {
    return NextResponse.json(
      { error: `File nặng ${formatBytes(parsed.data.sizeBytes)}, vượt giới hạn ${formatBytes(limit)}.` },
      { status: 400 },
    );
  }

  try {
    const result = await initUpload(parsed.data, guard.context);
    return NextResponse.json({ uploadId: result.uploadId, signedUrl: result.signedUrl, expiresAt: result.expiresAt });
  } catch (error) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status === 401 ? 500 : error.status });
    }
    console.error('[api/uploads/init] lỗi ngoài dự kiến:', error);
    return NextResponse.json({ error: 'Không chuẩn bị được lượt tải lên. Vui lòng thử lại.' }, { status: 500 });
  }
}
