# nhain-storefront

Website khách hàng của nhà in. Next.js 15 (App Router) + Supabase + Netlify.

Dashboard quản trị là một dự án riêng. Website này **không** thay thế dashboard: nó
đọc catalog, tính giá, nhận file và tạo yêu cầu in qua public API của dashboard.

---

## Kiến trúc: ai là nguồn sự thật

| Dữ liệu | Nguồn sự thật | Website làm gì |
|---|---|---|
| Yêu cầu in (RFQ) | `print_requests` trong dashboard | Tạo qua `POST /api/public/print-requests` |
| File khách gửi | `uploads` + Storage riêng | Xin signed URL, trình duyệt PUT thẳng lên Storage |
| Catalog sản phẩm | `storefront_products` | Chỉ đọc (anon + RLS) |
| Giao diện, thanh toán | `storefront_settings` | Đọc công khai, ghi bởi super_admin |
| Giá, số tiền, mã QR | `src/lib/pricing.ts` | **Tính lại ở server mỗi lần**, không tin trình duyệt |

### Hai bất biến không được phá

**1. Trình duyệt không bao giờ gửi giá.** Form chỉ gửi lựa chọn (`option key -> value`),
số lượng và kích thước. `/api/price` tính để hiển thị; `/api/orders` **tính lại từ đầu**
bằng chính `calculatePrice()` trước khi tạo yêu cầu và trước khi sinh QR. Sửa số trong
DevTools không đổi được số tiền phải trả.

**2. `DASHBOARD_API_KEY` chỉ ở server.** `src/lib/dashboard/client.ts` có `import 'server-only'`
nên lỡ import từ client component là build hỏng ngay, thay vì âm thầm gửi key ra trình duyệt.

### Luồng upload (3 bước)

```
Trình duyệt  → POST /api/uploads/init      → dashboard /api/public/uploads/init
             ← { uploadId, signedUrl }
Trình duyệt  → PUT signedUrl (thẳng vào Supabase Storage, KHÔNG qua server website)
Trình duyệt  → POST /api/uploads/complete  → dashboard /api/public/uploads/complete
                                             (dashboard tự kiểm object có thật,
                                              đúng dung lượng, đúng loại file)
```

### Chống bot

Token Turnstile chỉ dùng được **một lần**, nhưng một lượt gửi form gồm nhiều lượt gọi API
(init/complete từng file, rồi tạo yêu cầu). Nên: xác minh một lần ở `POST /api/session`,
đổi lấy cookie có ký HMAC (`src/lib/security/session.ts`, TTL 1 giờ). Khách chỉ giải captcha
một lần. Website **không** chuyển tiếp token Turnstile sang dashboard.

### Thanh toán

Không có cổng thanh toán tự động. Website sinh mã VietQR, khách tự chuyển khoản, bấm
"Tôi đã chuyển khoản" → đơn sang trạng thái `reported`. **Nhân viên đối soát sao kê và xác
nhận trong dashboard.** Website không biết tiền đã vào hay chưa, và giao diện nói thẳng
điều đó với khách.

`BANK_QR_MODE=emv` nên được ưu tiên: QR vẽ ngay trên server, số tài khoản và số tiền của
khách không đi qua máy chủ bên thứ ba. Chế độ `vietqr_image` tiện hơn (có logo ngân hàng)
nhưng dữ liệu đơn đi qua `img.vietqr.io`.

---

## Cài đặt

```bash
nvm use                 # Node 22.16+
pnpm install
cp .env.example .env.local
# điền các biến trong .env.local, xem chú thích trong file
pnpm dev
```

### Chuẩn bị Supabase

1. Chạy migration: `supabase/migrations/0008_storefront.sql` (chạy sau migration 0007 của dashboard).
2. Nạp dữ liệu mẫu: `supabase/seed/storefront_seed.sql`.
3. Đăng ký RPC secret trong **Supabase SQL Editor**. Dùng đúng giá trị đã đặt cho `STOREFRONT_RPC_SECRET` (tối thiểu 32 ký tự):

```sql
insert into storefront_secrets (name, secret_hash)
values (
  'storefront_rpc',
  encode(digest('<GIÁ_TRỊ_STOREFRONT_RPC_SECRET>', 'sha256'), 'hex')
)
on conflict (name) do update
set secret_hash = excluded.secret_hash, updated_at = now();
```

Không dùng `storefront_set_secret()` trực tiếp trong SQL Editor, vì hàm đó yêu cầu phiên đăng nhập `super_admin` của ứng dụng.

### Chuẩn bị dashboard

Tạo một api_client với scope `uploads:create` và `requests:create`, lấy key bỏ vào
`DASHBOARD_API_KEY`.

Lưu ý: `UPLOAD_MAX_SIZE_MB` của website phải **≤** giới hạn của dashboard. Đặt lớn hơn thì
khách chọn được file rồi mới bị dashboard từ chối ở bước cuối — trải nghiệm rất tệ.

---

## Kiểm tra

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## Cấu trúc

```
src/
  app/
    api/                    Route handlers — biên giới bảo mật
      _guard.ts             Kiểm phiên + rate limit, dùng chung
      session/              Đổi Turnstile -> cookie phiên
      uploads/init|complete Cầu nối upload
      price/                Tính giá để hiển thị
      orders/               ⭐ Tạo yêu cầu (tính lại giá ở đây)
      lookup/               Tra cứu (cần mã + SĐT)
      payments/report/      Khách báo đã chuyển khoản
    san-pham/               Danh sách + chi tiết
    gui-file-in/            Form gửi file
    thanh-toan/[code]/      Trang QR
    tra-cuu/                Tra cứu đơn
    admin/                  Khu quản trị (super_admin)
      actions.ts            ⭐ Server action — mỗi hàm tự kiểm quyền
  lib/
    pricing.ts              ⭐ NGUỒN SỰ THẬT về tiền
    dashboard/client.ts     ⭐ Cầu nối DUY NHẤT tới dashboard
    theme.ts                ThemeSettings -> CSS variables (đã lọc sạch)
    vietqr.ts               EMVCo + CRC-16
    admin/guard.ts          guardAdminPage() / guardAdminAction()
    data/product-types.ts   Đọc product_types của dashboard (không chép cứng)
  components/
    forms/order-form.tsx    Form đặt in dùng chung
    admin/                  Form quản trị
```

---

## Khu quản trị

Ở `/admin`, dùng chung tài khoản Supabase Auth với dashboard — website không tự
quản lý tài khoản. Thêm nhân viên, đổi mật khẩu, phân quyền: tất cả làm ở dashboard.

| Trang | Việc |
| --- | --- |
| `/admin` | Tổng quan + cảnh báo cấu hình còn dở |
| `/admin/dang-nhap` | Đăng nhập |
| `/admin/site-settings` | Thương hiệu, màu sắc/phông chữ (có xem trước), nội dung trang chủ |
| `/admin/payment-settings` | Tài khoản ngân hàng, cách sinh QR (có QR thử để quét kiểm tra) |
| `/admin/products` | Thêm/sửa/ẩn/xóa mềm sản phẩm |

**Ba lớp bảo vệ**, mỗi lớp một việc:

1. `src/middleware.ts` — chặn người chưa đăng nhập (chỉ để không chớp giao diện admin).
2. `guardAdminPage()` / `guardAdminAction()` — chặn người đã đăng nhập nhưng không phải
   super_admin. **Mỗi server action tự kiểm lại**, vì server action là endpoint HTTP thật,
   gọi thẳng được mà không qua trang nào.
3. **RLS** — lớp thật. Hai lớp trên hỏng thì CSDL vẫn từ chối ghi.

Vài điểm cố ý:

- **Cột `needs_quote`, `allow_instant_payment`, `requires_deposit` không có ô nhập** — chúng
  suy ra từ "kiểu giá" trong `saveProductAction`. Cho admin tự tick sẽ đẻ ra trạng thái vô
  nghĩa (vừa "cần báo giá" vừa "cho thanh toán ngay").
- **Loại sản phẩm đọc thẳng từ `product_types` của dashboard** (`src/lib/data/product-types.ts`),
  không chép cứng. Chép cứng thì dashboard đổi danh mục là website gửi lên mã đã chết.
- **Xóa sản phẩm là xóa mềm** (`deleted_at`). Xóa cứng sẽ làm hỏng trang thanh toán của các
  đơn cũ đang trỏ tới sản phẩm đó.
- **Giá trị theme được lọc hai lần** (zod ở `validation/admin.ts` + `themeToCssVariables()`)
  vì chúng được nhúng vào `<style>` của layout — sót một chuỗi là lỗ chèn CSS toàn site.
- **Bảng giá chi tiết** (cột `pricing`, `options`) vẫn phải sửa JSON trực tiếp trong Supabase.
  Chưa có trình sửa cho phần này.

Cấu hình ngân hàng có đường dự phòng qua biến môi trường (`bankEnvFallback()`): deploy đầu
tiên chạy được bằng env, lần lưu đầu tiên trong admin sẽ chuyển hẳn sang lưu ở CSDL.
Website vẫn chạy đầy đủ khi CSDL trống — `src/lib/data/defaults.ts` lo phần mặc định.

### Hạn chế đã biết

- **Ảnh sản phẩm trong `public/products/` là hình vẽ tạm.** Phải thay bằng ảnh chụp sản phẩm
  thật trước khi chạy thương mại.
- **Rate limit ở website nằm trong bộ nhớ tiến trình.** Netlify chạy nhiều instance nên
  hạn mức thực tế lỏng hơn con số cấu hình. Đây chỉ là lớp chặn thứ nhất; lớp thật nằm ở
  dashboard (đếm bằng PostgreSQL, dùng chung mọi instance). Website đã chuyển tiếp IP thật
  của khách để dashboard đếm đúng người.
- **Giá website tự tính được ghi vào ghi chú của RFQ** để nhân viên đối chiếu. Dashboard
  không có trường giá riêng cho việc này.

## Migration 0009 — tra cứu đơn và trang sửa sản phẩm

Nếu Supabase production đã chạy đến `0008_storefront.sql`, chạy tiếp:

```text
supabase/migrations/0009_lookup_and_product_editor.sql
```

Migration này chuẩn hóa số điện thoại khi tra cứu (`0...`, `84...`, `+84...`, `0084...`) để đơn cũ và mới đều tìm được. Sau khi chạy migration, deploy lại storefront.

Nếu API tra cứu trả `LOOKUP_CONFIG_ERROR`, kiểm tra `STOREFRONT_RPC_SECRET` trên Netlify và hash `storefront_rpc` trong bảng `storefront_secrets` phải được tạo từ cùng một chuỗi.
