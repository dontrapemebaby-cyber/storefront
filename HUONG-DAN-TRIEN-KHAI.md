# HƯỚNG DẪN TRIỂN KHAI `nhain-storefront`

Tài liệu này dành cho website khách hàng mới. Website này là một dự án riêng, không ghi đè repository dashboard hiện tại.

## 1. Kết quả kiểm tra source

Bản đã hiệu chỉnh được kiểm tra với:

- Node.js `22.16.0`
- pnpm `10.12.4`
- Next.js `15.5.20`
- React `19.1.1`

Các lệnh đã đạt:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
```

Build có một cảnh báo không chặn deploy từ Supabase trong Edge Middleware. Build vẫn tạo đầy đủ route và `BUILD_ID`.

## 2. Kiến trúc dễ hiểu

```text
Khách hàng
   ↓
Website storefront mới
   ↓ gọi bằng API key phía server
Dashboard hiện tại
   ↓
Supabase chung của dashboard
```

- Dashboard vẫn là nơi nhận yêu cầu in và file.
- Website mới chỉ giới thiệu sản phẩm, nhận file, tính giá các gói cố định và hiển thị QR.
- `DASHBOARD_API_KEY` không được đưa ra trình duyệt.
- File khách vẫn nằm trong Storage private do dashboard quản lý.

## 3. Tạo repository GitHub mới

Không chép website này đè vào repository dashboard.

1. Tạo repository mới tên `nhain-storefront`.
2. Giải nén ZIP đã hiệu chỉnh.
3. Trong GitHub Desktop chọn `File → Add local repository` hoặc clone repository mới.
4. Chép toàn bộ nội dung website vào thư mục repository mới.
5. Không chép các mục:

```text
.env
.env.local
node_modules
.next
.DS_Store
package-lock.json
```

6. Repository phải có:

```text
src/
supabase/
public/
package.json
pnpm-lock.yaml
netlify.toml
.nvmrc
.env.example
```

7. Commit:

```text
Initial customer storefront
```

8. Push origin.

## 4. Chuẩn bị dashboard API client

Trong dashboard hiện tại:

1. Đăng nhập bằng `super_admin`.
2. Vào `Cài đặt → API Clients`.
3. Tạo client tên `Website chính`.
4. Chọn hai scope:

```text
uploads:create
requests:create
```

5. Copy API key ngay khi hệ thống hiện lần đầu.
6. Lưu key vào trình quản lý mật khẩu hoặc ghi tạm ở nơi an toàn.
7. Không đưa key lên GitHub.

Key này sẽ được đặt vào biến Netlify `DASHBOARD_API_KEY` của website mới.

## 5. Chạy migration website trên Supabase

Điều kiện: Supabase dashboard đã chạy migration đến `0007`.

### 5.1 Chạy migration `0008`

1. Mở:

```text
supabase/migrations/0008_storefront.sql
```

2. Copy toàn bộ nội dung.
3. Vào Supabase → SQL Editor → New query.
4. Dán và bấm `Run`.
5. Chờ `Success. No rows returned`.

Chỉ chạy file này nếu bạn chưa từng chạy migration storefront `0008` trước đó.

### 5.2 Nạp dữ liệu sản phẩm mẫu

1. Mở:

```text
supabase/seed/storefront_seed.sql
```

2. Copy toàn bộ.
3. Dán vào query mới.
4. Bấm `Run`.

Nếu lỗi khóa ngoại `product_type_code`, kiểm tra bảng `product_types` của dashboard có đủ mã tương ứng hay chưa. Không tự xóa khóa ngoại để né lỗi.

## 6. Tạo hai secret riêng biệt

Mở Terminal trên Mac và chạy hai lần:

```bash
openssl rand -base64 48
```

Bạn sẽ có hai chuỗi khác nhau:

- Chuỗi thứ nhất: `STOREFRONT_RPC_SECRET`
- Chuỗi thứ hai: `SESSION_SECRET`

Không dùng cùng một chuỗi cho cả hai biến.

### 6.1 Ghi hash của RPC secret vào Supabase

Trong Supabase SQL Editor, thay phần trong dấu `<...>` bằng chuỗi thứ nhất:

```sql
insert into storefront_secrets (name, secret_hash)
values (
  'storefront_rpc',
  encode(digest('<GIÁ_TRỊ_STOREFRONT_RPC_SECRET>', 'sha256'), 'hex')
)
on conflict (name) do update
set secret_hash = excluded.secret_hash, updated_at = now();
```

Bấm `Run`.

Giá trị thô trong Netlify và giá trị được dùng trong câu SQL phải giống hệt từng ký tự.

Không dùng câu:

```sql
select storefront_set_secret(...)
```

trực tiếp trong SQL Editor, vì SQL Editor không có phiên `auth.uid()` của tài khoản `super_admin` trong ứng dụng.

## 7. Tạo website mới trên Netlify

1. Vào Netlify.
2. Chọn `Add new site → Import an existing project`.
3. Chọn GitHub.
4. Chọn repository `nhain-storefront`.
5. Build command:

```text
pnpm run build
```

6. Publish directory:

```text
.next
```

Netlify cũng sẽ đọc các giá trị này từ `netlify.toml`.

## 8. Biến môi trường Netlify

Vào:

```text
Site configuration → Environment variables
```

Tạo các biến sau.

### 8.1 Bắt buộc

```env
NEXT_PUBLIC_APP_URL=https://TEN-SITE-MOI.netlify.app
DASHBOARD_API_URL=https://TEN-DASHBOARD-HIEN-TAI.netlify.app
DASHBOARD_API_KEY=API_KEY_TAO_TU_DASHBOARD

NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY_CUA_SUPABASE

STOREFRONT_RPC_SECRET=CHUOI_THU_NHAT
SESSION_SECRET=CHUOI_THU_HAI

SIGNED_URL_EXPIRES_SECONDS=300
UPLOAD_MAX_SIZE_MB=25
```

`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` dùng chung project Supabase với dashboard.

### 8.2 QR ngân hàng

Có thể cấu hình bằng biến môi trường trước, rồi sửa trong trang quản trị sau:

```env
BANK_QR_MODE=vietqr_image
BANK_BIN=
BANK_ACCOUNT_NUMBER=
BANK_ACCOUNT_NAME=
BANK_NAME=
BANK_BRANCH=
PAYMENT_PREFIX=NHAIN
```

- `BANK_BIN`: mã BIN của ngân hàng.
- `BANK_ACCOUNT_NUMBER`: số tài khoản nhận tiền.
- `BANK_ACCOUNT_NAME`: tên chủ tài khoản, nên viết in hoa không dấu.
- `PAYMENT_PREFIX`: tiền tố ngắn, không dấu.

### 8.3 Turnstile

Khi test nội bộ ban đầu có thể để trống:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Trước khi chạy quảng cáo hoặc mở form rộng rãi, nên tạo Cloudflare Turnstile và điền đủ cả hai biến.

## 9. Deploy lần đầu

Sau khi thêm biến môi trường:

1. Vào `Deploys`.
2. Chọn `Trigger deploy`.
3. Chọn `Clear cache and deploy site`.

Log đúng sẽ có:

```text
Detected pnpm-lock.yaml
pnpm install
pnpm run build
Compiled successfully
```

Không được thấy Netlify dùng `npm install`.

## 10. Đăng nhập quản trị website

Website dùng chung Supabase Auth và bảng quyền của dashboard.

1. Mở:

```text
https://TEN-SITE/admin/dang-nhap
```

2. Đăng nhập bằng tài khoản `super_admin` đang dùng cho dashboard.
3. Cấu hình lần lượt:

```text
/admin/site-settings
/admin/payment-settings
/admin/products
/admin/payments
```

### `/admin/payment-settings`

Nhập thông tin tài khoản ngân hàng rồi quét thử QR bằng ứng dụng ngân hàng. Không chuyển tiền ở bước quét thử.

### `/admin/payments`

Khách bấm “Tôi đã chuyển khoản” chỉ tạo trạng thái chờ đối soát. Bạn phải kiểm tra sao kê, rồi mới bấm “Xác nhận đã nhận tiền”.

## 11. Những bài test bắt buộc trước khi nhận khách thật

### 11.1 Test sản phẩm cần báo giá

1. Mở một sản phẩm `QUOTE_REQUIRED`.
2. Điền họ tên và số điện thoại.
3. Upload PNG hoặc PDF.
4. Gửi yêu cầu.
5. Website phải hiện mã `RFQ-...`.
6. Dashboard phải nhận yêu cầu và file.
7. File tải từ dashboard phải đúng file đã gửi.

### 11.2 Test sản phẩm giá cố định

1. Chọn tem hoặc sticker có giá cố định.
2. Chọn gói số lượng.
3. Upload file.
4. Gửi đơn.
5. Website phải chuyển tới URL dạng:

```text
/thanh-toan/RFQ-...?token=...
```

6. Trang phải hiển thị đúng:
   - số tiền;
   - số tài khoản;
   - nội dung chuyển khoản;
   - mã QR.
7. Thay hoặc xóa `token` trên URL phải nhận trang không tồn tại.

### 11.3 Test đối soát

1. Trên trang thanh toán bấm `Tôi đã chuyển khoản`.
2. Mở `/admin/payments`.
3. Đơn phải hiện `Khách báo đã chuyển`.
4. Chỉ bấm xác nhận sau khi đối chiếu sao kê.
5. Tải lại trang thanh toán: trạng thái phải chuyển thành `Đã xác nhận`.

### 11.4 Test tra cứu

1. Mở `/tra-cuu`.
2. Nhập mã RFQ và đúng số điện thoại.
3. Phải xem được trạng thái tổng quát.
4. Nhập sai số điện thoại phải không xem được.

### 11.5 Test mobile

Kiểm tra trên điện thoại:

- trang chủ;
- danh sách sản phẩm;
- upload file;
- progress upload;
- QR không bị cắt;
- nút copy số tài khoản/nội dung;
- form không bị bàn phím che.

## 12. Những điểm chưa nên coi là hoàn thiện thương mại

1. Ảnh trong `public/products` là placeholder SVG, cần thay bằng ảnh sản phẩm thật.
2. Chưa có webhook ngân hàng để tự xác nhận tiền; nhân viên phải đối soát thủ công.
3. Chưa có bộ test tự động đầy đủ cho Supabase thật. Phải test production bằng dữ liệu giả trước.
4. Rate limit của storefront là lớp nhẹ; dashboard mới là lớp giới hạn chính.
5. Không được đưa `DASHBOARD_API_KEY`, `STOREFRONT_RPC_SECRET` hoặc `SESSION_SECRET` lên GitHub.

## 13. Rollback khi deploy lỗi

- Không xóa site dashboard.
- Không sửa lại migration 0001–0007.
- Trên Netlify storefront, vào `Deploys`, chọn deploy trước đó và chọn `Publish deploy`.
- Nếu migration 0008 chạy thành công nhưng storefront lỗi, cứ giữ các bảng mới; chúng không thay thế bảng dashboard cũ.

