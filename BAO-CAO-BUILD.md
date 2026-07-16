# Báo cáo kiểm tra `nhain-storefront`

## Kết quả

- `pnpm install --frozen-lockfile`: Đạt.
- `pnpm typecheck`: Đạt.
- `pnpm lint`: Đạt.
- `pnpm build`: Đạt, tạo đầy đủ `BUILD_ID` và danh sách route.
- Kiểm tra HTTP cơ bản: trang chủ và trang sản phẩm trả HTTP 200 với cấu hình thử.

## Những lỗi của ZIP Claude đã được sửa

- Bổ sung `pnpm-lock.yaml`.
- Sửa lỗi TypeScript trong dữ liệu sản phẩm.
- Sửa cấu hình ESLint/Tailwind.
- Loại bỏ phụ thuộc tải Google Font trong lúc build.
- Sửa tên RPC secret thành `storefront_rpc` thống nhất.
- Bảo vệ trang thanh toán bằng access token riêng, không chỉ dùng mã RFQ có thể đoán.
- Bổ sung trang `/admin/payments` để đối soát chuyển khoản thủ công.
- Bổ sung lịch sử và RPC cập nhật trạng thái thanh toán.
- Bổ sung quyền SELECT tường minh cho nhân viên đọc `storefront_orders`.
- Sửa hướng dẫn ghi hash RPC secret trong Supabase SQL Editor.

## Cảnh báo còn lại

Build có cảnh báo Supabase JS sử dụng `process.version` trong Edge Middleware. Đây là cảnh báo không chặn build; middleware vẫn được tạo. Cần kiểm tra lại sau khi deploy Netlify, nhưng không phải lỗi biên dịch.

Source chưa có test suite tự động bằng Vitest/Playwright. Vì vậy trước khi nhận khách thật phải chạy checklist production trong `HUONG-DAN-TRIEN-KHAI.md`.

Không thể chạy integration test với Supabase thật vì không có URL/key thật. Không gửi secret hoặc Service Role Key cho người khác; hãy test bằng dữ liệu giả trên project của bạn.
