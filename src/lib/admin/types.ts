// src/lib/admin/types.ts
// Kiểu trả về của server action.
//
// Để riêng ở đây thay vì khai báo trong actions.ts: file 'use server' chỉ được
// export hàm async. Kiểu thì bị xóa lúc biên dịch nên thực tế vẫn chạy, nhưng
// tách ra thì client component import kiểu này mà không phải đụng vào module
// server action.
export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Lỗi theo từng trường, để form tô đỏ đúng ô. */
  fieldErrors?: Record<string, string>;
}
