import 'server-only';
// src/lib/security/rate-limit.ts
// Hạn mức tần suất ở tầng website — lớp phòng thủ THỨ NHẤT, không phải lớp cuối.
//
// GIỚI HẠN ĐÃ BIẾT: bộ đếm nằm trong bộ nhớ tiến trình. Netlify chạy nhiều
// instance nên hạn mức thực tế lỏng hơn con số cấu hình. Chấp nhận được vì lớp
// chặn thật sự nằm ở dashboard: nó đếm bằng PostgreSQL, dùng chung mọi instance
// (bảng rate_limits + hàm rate_limit_hit trong migration 0005), và website đã
// chuyển tiếp IP thật của khách để dashboard đếm đúng người.
//
// Mục đích của lớp này chỉ là chặn bớt lượt gọi rác trước khi tốn một vòng gọi
// mạng sang dashboard.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Dọn bộ nhớ định kỳ để Map không phình vô hạn ở instance sống lâu. */
function prune(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
